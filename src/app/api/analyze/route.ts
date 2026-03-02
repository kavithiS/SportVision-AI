import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import fs from "fs/promises";
import path from "path";

// Initialize Gemini AI client using stable v1 API (not deprecated v1beta).
// gemini-1.5-flash was removed from v1beta but is available on v1.
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

/**
 * Analyzes an image file using Google Gemini AI
 * Returns the detected sport, description, and confidence score
 */
export async function POST(req: Request) {
  try {
    console.log("/api/analyze called");

    // Validate API key
    if (!process.env.GEMINI_API_KEY) {
      console.error("GEMINI_API_KEY not configured");
      return NextResponse.json(
        { error: "AI service not configured" },
        { status: 500 }
      );
    }

    // Get the file path from request body
    const body = await req.json();
    const { filePath, fileName } = body;

    if (!filePath) {
      return NextResponse.json(
        { error: "Missing filePath in request" },
        { status: 400 }
      );
    }

    // Read the file from disk - sanitize incoming path so Windows leading
    // separators or absolute paths don't break path.join behavior.
    let sanitizedPath = String(filePath || "");
    if (path.isAbsolute(sanitizedPath)) {
      // convert absolute path to relative to project if it points inside cwd
      try {
        sanitizedPath = path.relative(process.cwd(), sanitizedPath);
      } catch {}
    }
    // remove any leading separators that would make path.join ignore cwd
    sanitizedPath = sanitizedPath.replace(/^[/\\]+/, "");
    const fullPath = path.join(process.cwd(), sanitizedPath);
    console.log(`Reading file: ${fullPath}`);
    const fileBuffer = await fs.readFile(fullPath);
    const base64Data = fileBuffer.toString("base64");

    // Determine MIME type from file extension — reject formats Gemini doesn't support
    const ext = path.extname(fileName || "").toLowerCase();
    const SUPPORTED_MIME: Record<string, string> = {
      ".jpg": "image/jpeg",
      ".jpeg": "image/jpeg",
      ".png": "image/png",
      ".gif": "image/gif",
      ".webp": "image/webp",
    };
    const UNSUPPORTED_EXTS = new Set([".avif", ".heic", ".heif", ".bmp", ".tiff", ".tif"]);

    if (UNSUPPORTED_EXTS.has(ext)) {
      return NextResponse.json(
        {
          error: "unsupported_format",
          message: `${ext} is not supported by Gemini Vision. Please upload JPEG, PNG, GIF, or WebP.`,
        },
        { status: 415 }
      );
    }

    const mimeType = SUPPORTED_MIME[ext] ?? "image/jpeg";

    console.log(`Analyzing image with MIME type: ${mimeType}`);

    // Model selection. Try environment override, then discover available models via REST API listModels.
    let model;
    const requestedModel = process.env.GEMINI_MODEL || "auto";
    
    console.log("Starting model selection...");
    
    // Try to discover available models via the REST API
    try {
      console.log("Discovering available models via REST API...");
      const listModelsUrl = `https://generativelanguage.googleapis.com/v1beta/models?key=${process.env.GEMINI_API_KEY}`;
      const response = await fetch(listModelsUrl);
      const data = await response.json();
      
      if (data.models && Array.isArray(data.models)) {
        console.log(`Found ${data.models.length} models via REST API`);
        
        // Log all available models
        data.models.forEach((m: any) => {
          console.log(`  - ${m.name} (displayName: ${m.displayName})`);
        });
        
        // Try to find a vision-capable model
        let candidateModel = null;
        
        // First try user's requested model
        if (requestedModel !== "auto") {
          candidateModel = data.models.find((m: any) => 
            m.name.includes(requestedModel) || m.name.endsWith(requestedModel)
          );
        }
        
        // Otherwise find first model that looks vision-capable
        if (!candidateModel) {
          candidateModel = data.models.find((m: any) => {
            const name = m.name.toLowerCase();
            return name.includes("vision") || name.includes("gemini") || name.includes("pro");
          });
        }
        
        // Use first available as fallback
        if (!candidateModel && data.models.length > 0) {
          candidateModel = data.models[0];
        }
        
        if (candidateModel) {
          const modelId = candidateModel.name.replace(/^models\//, "");
          console.log(`Selected model from REST API: ${modelId}`);
          model = genAI.getGenerativeModel({ model: modelId });
        }
      }
    } catch (discoverErr) {
      console.error("Failed to discover models via REST API:", discoverErr);
    }

    // If listModels() didn't work, try the environment override or a default
    if (!model) {
      const fallbackModel = requestedModel !== "auto" ? requestedModel : "gemini-pro";
      console.log(`Using fallback model (listModels unavailable): ${fallbackModel}`);
      model = genAI.getGenerativeModel({ model: fallbackModel });
    }

    // ── Engineered prompt (structured JSON output with few-shot examples) ──────
    const prompt = `You are an expert computer vision assistant specialised in identifying sports from photographs. Your ONLY job is to analyse the image provided and return a valid JSON object. Never add commentary, markdown, or explanation outside the JSON.

RESPONSE SCHEMA (return exactly this structure, nothing else):
{
  "sport": "<canonical sport name or 'Unknown'>",
  "description": "<1–2 sentence factual description of what is happening in the image>",
  "confidence": "<high | medium | low>",
  "details": "<supporting visual evidence: equipment, uniforms, venue, markings, etc.>"
}

RULES:
- "sport" must be a short canonical name (e.g. "Swimming", "Basketball", "Football", "Tennis", "Cycling", "Athletics", "Ice Hockey", "Volleyball", "Baseball", "Rugby"). If you cannot identify a sport, use "Unknown".
- "description" must not exceed 100 words. Be specific and factual.
- "confidence" is "high" when sport is unmistakable, "medium" when probable but uncertain, "low" when guessing.
- "details" lists 2–4 key visual cues (e.g. "starting blocks numbered 2–6", "olympic-branded swimming pool", "digital scoreboard").
- Return ONLY valid JSON. No markdown fences. No extra keys.

FEW-SHOT EXAMPLES (for format reference only — do NOT copy these for the actual image):

Example 1 (Swimming):
{"sport":"Swimming","description":"Competitive swimmers stand on numbered starting blocks at the edge of an Olympic-standard pool, preparing for a race start.","confidence":"high","details":"Starting blocks 2–6, multi-lane pool with lane ropes, Olympic ring banner in background"}

Example 2 (Basketball):
{"sport":"Basketball","description":"A player drives to the basket during a professional indoor game in front of a packed crowd.","confidence":"high","details":"NBA hardwood court, orange basketball, backboard and hoop, arena lighting and crowd"}

Example 3 (Unknown):
{"sport":"Unknown","description":"The image does not contain clearly identifiable sport-specific equipment, uniforms, or venue markings.","confidence":"low","details":"Insufficient visual evidence to determine sport"}

Now analyse the attached image and return the JSON object:`;

    // Helper: parse the retry delay (seconds) from a Gemini 429 error message.
    function parseRetryDelay(errMsg: string): number {
      const match = errMsg.match(/retry[^\d]*(\d+(?:\.\d+)?)s/i);
      return match ? Math.ceil(parseFloat(match[1])) : 0;
    }

    // Call Gemini API with optional one auto-retry on 429.
    const parts = [
      { inlineData: { data: base64Data, mimeType } },
      prompt,
    ];

    let responseText = "";
    try {
      let result;
      try {
        result = await model.generateContent(parts);
      } catch (firstErr: any) {
        const msg = String(firstErr?.message || firstErr);

        // Handle rate limit (429) with optional retry using server-provided delay
        const is429 = msg.includes("429") || msg.includes("Too Many Requests") || msg.includes("RESOURCE_EXHAUSTED");
        if (is429) {
          const delaySec = parseRetryDelay(msg);
          if (delaySec > 0 && delaySec <= 65) {
            console.warn(`Gemini 429 — retrying in ${delaySec}s...`);
            await new Promise((r) => setTimeout(r, delaySec * 1000));
            result = await model.generateContent(parts);
          } else {
            const waitMsg = delaySec > 0 ? ` Try again in ${delaySec} seconds.` : " Daily quota may be exhausted — try again tomorrow or upgrade your plan.";
            return NextResponse.json({
              success: false,
              analysis: {
                sport: "Unknown",
                description: `AI quota exceeded.${waitMsg}`,
                confidence: "low",
                details: "Rate limit hit on Gemini API free tier.",
              },
            });
          }
        }

        // Handle model not found on v1beta (404) — try to discover a compatible model
        const isModelNotFound = msg.toLowerCase().includes("not found for api version") || msg.toLowerCase().includes("is not found for api version") || msg.toLowerCase().includes("not found");
        if (isModelNotFound) {
          // Model discovery already happens above via REST API — if we're still
          // here it means the discovered model itself failed. Log and fall through.
          console.warn("Selected model not found — will fall back to error response");
        }

        // If still no result, rethrow to be handled below
        if (!result) throw firstErr;
      }

      responseText = result!.response.text();
      console.log(`Gemini response (first 300 chars): ${responseText.slice(0, 300)}`);
    } catch (apiErr: any) {
      const errMsg = apiErr?.message || String(apiErr);
      console.error("/api/analyze error calling Gemini:", errMsg);
      console.error("Full error:", JSON.stringify(apiErr, null, 2));
      responseText = JSON.stringify({
        sport: "Unknown",
        description: "AI analysis failed or unavailable",
        confidence: "low",
        details: String(errMsg),
      });
    }

    // Parse the JSON response from Gemini
    let analysisResult;
    try {
      // Extract JSON from the response (in case there's extra text)
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        analysisResult = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error("No JSON found in response");
      }
    } catch (parseErr) {
      console.error("Failed to parse Gemini response:", parseErr);
      // Fallback if parsing fails
      analysisResult = {
        sport: "Unknown",
        description: "Unable to analyze image",
        confidence: "low",
        error: String(parseErr),
      };
    }

    console.log(`Analysis result:`, analysisResult);

    return NextResponse.json({
      success: true,
      analysis: {
        sport: analysisResult.sport || "Unknown",
        description: analysisResult.description || "",
        confidence: analysisResult.confidence || "low",
        details: analysisResult.details || "",
      },
    });
  } catch (err) {
    console.error("/api/analyze error:", err);
    return NextResponse.json(
      {
        error: "Failed to analyze image",
        details: err instanceof Error ? err.message : String(err),
      },
      { status: 500 }
    );
  }
}
