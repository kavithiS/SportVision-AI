import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import fs from "fs/promises";
import path from "path";

// Initialize Gemini AI client
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

    // Read the file from disk
    const fullPath = path.join(process.cwd(), filePath);
    console.log(`Reading file: ${fullPath}`);
    const fileBuffer = await fs.readFile(fullPath);
    const base64Data = fileBuffer.toString("base64");

    // Determine MIME type from file extension
    const ext = path.extname(fileName || "").toLowerCase();
    let mimeType = "image/jpeg";
    if (ext === ".png") mimeType = "image/png";
    else if (ext === ".gif") mimeType = "image/gif";
    else if (ext === ".webp") mimeType = "image/webp";

    console.log(`Analyzing image with MIME type: ${mimeType}`);

    // Choose a model. Prefer an environment override or try to discover a suitable model.
    let model;
    const requestedModel = process.env.GEMINI_MODEL || "auto";
    if (requestedModel !== "auto") {
      model = genAI.getGenerativeModel({ model: requestedModel });
    } else {
      // Try to pick a suitable model from the API
      try {
        const list = await genAI.listModels();
        console.log("Available models:", list);
        // Find a model that likely supports generateContent / vision
        let candidate = null as any;
        if (Array.isArray(list)) {
          candidate = list.find((m: any) => {
            const name = m.name || m.id || "";
            const nm = String(name).toLowerCase();
            if (nm.includes("vision") || nm.includes("image") || nm.includes("gemini")) return true;
            return false;
          });
          if (!candidate) candidate = list[0];
        }
        const modelId = candidate?.name || candidate?.id || (list[0]?.name || list[0]?.id);
        if (!modelId) throw new Error("No available Gemini models");
        model = genAI.getGenerativeModel({ model: modelId });
        console.log(`Using model: ${modelId}`);
      } catch (e) {
        console.error("Failed to discover a Gemini model:", e);
        // If the SDK does not support listing models, instruct user to provide one.
        if (e instanceof TypeError && String(e.message).includes("listModels is not a function")) {
          return NextResponse.json({
            error: "Model discovery not supported by installed SDK. Please set GEMINI_MODEL env var to a valid model id that supports multimodal generateContent (see Google Generative AI docs).",
          }, { status: 500 });
        }
        return NextResponse.json({ error: "No suitable Gemini model found. Set GEMINI_MODEL env var." }, { status: 500 });
      }
    }

    // Create the prompt for sport analysis
    const prompt = `Analyze this image and identify:
1. The sport being played or depicted
2. A brief description (1-2 sentences)
3. Your confidence level (high, medium, low)

Please respond in JSON format:
{
  "sport": "name of the sport",
  "description": "brief description",
  "confidence": "high|medium|low",
  "details": "any additional relevant details"
}`;

    // Call Gemini API with the image
    const result = await model.generateContent([
      {
        inlineData: {
          data: base64Data,
          mimeType: mimeType,
        },
      },
      prompt,
    ]);

    const responseText = result.response.text();
    console.log(`Gemini response: ${responseText}`);

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
