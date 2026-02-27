import { NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";

const UPLOAD_DIR = path.join(process.cwd(), "uploads");

/**
 * Helper function to call the Gemini analysis API
 */
async function analyzeImageWithGemini(filePath: string, fileName: string) {
  try {
    const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";
    const analyzeRes = await fetch(`${baseUrl}/api/analyze`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ filePath, fileName }),
    });

    if (!analyzeRes.ok) {
      console.error(`Gemini analysis failed: ${analyzeRes.status}`);
      return null;
    }

    const analysisData = await analyzeRes.json();
    return analysisData.analysis || null;
  } catch (err) {
    console.error("Error calling Gemini analysis:", err);
    return null;
  }
}

export async function POST(req: Request) {
  try {
    console.log("/api/upload called");
    const contentType = req.headers.get("content-type") || "";
    if (!contentType.includes("multipart/form-data")) {
      return NextResponse.json({ error: "Expected multipart/form-data" }, { status: 400 });
    }

    const form = await req.formData();
    const entries = form.getAll("files") as File[];

    await fs.mkdir(UPLOAD_DIR, { recursive: true });

    const results: Array<Record<string, unknown>> = [];

    for (const f of entries) {
      if (!f || typeof (f as any).arrayBuffer !== "function") continue;
      const name = (f as File).name || "unknown";
      console.log(`receiving file: ${name}`);
      const size = (f as File).size || 0;
      const type = (f as File).type || "application/octet-stream";

      if (size > 50 * 1024 * 1024) {
        results.push({ name, status: "rejected", reason: "too_large" });
        continue;
      }
      if (!type.startsWith("image/") && !type.startsWith("video/")) {
        results.push({ name, status: "rejected", reason: "invalid_type" });
        continue;
      }

      const arrayBuffer = await (f as File).arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      const safeName = name.replace(/[^a-zA-Z0-9.-_]/g, "_");
      const timestamp = Date.now();
      const dest = path.join(UPLOAD_DIR, `${timestamp}-${safeName}`);
      await fs.writeFile(dest, buffer);

      const relativePath = dest.replace(process.cwd(), "");
      console.log(`saved -> ${dest}`);

      // Call Gemini AI to analyze the image
      let analysis = null;
      if (type.startsWith("image/")) {
        console.log(`Analyzing image: ${name}`);
        analysis = await analyzeImageWithGemini(relativePath, name);
        if (analysis) {
          console.log(`Analysis complete for ${name}:`, analysis);
        }
      }

      results.push({
        name,
        size,
        type,
        status: "saved",
        path: relativePath,
        timestamp,
        analysis: analysis || undefined, // Include analysis if available
      });
    }

    console.log("/api/upload result:", results);
    return NextResponse.json({ success: true, files: results });
  } catch (err) {
    console.error("/api/upload error:", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
