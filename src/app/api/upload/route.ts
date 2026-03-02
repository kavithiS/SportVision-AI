import { NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

const UPLOAD_DIR = path.join(process.cwd(), "public/uploads");

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
      try {
        const body = await analyzeRes.text();
        console.error("analyze response body:", body);
      } catch {}
      // Return a fallback analysis so the client shows a consistent structure
      return {
        sport: "Unknown",
        description: "AI analysis unavailable",
        confidence: "low",
        details: "Analysis service returned an error",
      };
    }

    const analysisData = await analyzeRes.json();
    return analysisData.analysis || {
      sport: "Unknown",
      description: "AI analysis unavailable",
      confidence: "low",
      details: "No analysis returned",
    };
  } catch (err) {
    console.error("Error calling Gemini analysis:", err);
    // Graceful fallback so uploads always succeed even when Gemini is down
    return {
      sport: "Scanning...",
      description: "Please check API connection.",
      confidence: "low",
      details: "",
    };
  }
}

export async function POST(req: Request) {
  try {
    console.log("/api/upload called");
    const contentType = req.headers.get("content-type") || "";
    if (!contentType.includes("multipart/form-data")) {
      return NextResponse.json({ error: "Expected multipart/form-data" }, { status: 400 });
    }

    // Resolve the session once for the whole request, not per file
    const session = await getServerSession(authOptions);
    const userEmail = session?.user?.email ?? null;

    // If authenticated, upsert the User row once up front
    let dbUserId: string | null = null;
    if (userEmail) {
      try {
        const user = await prisma.user.upsert({
          where: { email: userEmail },
          update: {},
          create: { email: userEmail },
        });
        dbUserId = user.id;
      } catch (userErr) {
        console.error("User upsert error (non-fatal):", userErr);
      }
    }

    const form = await req.formData();
    const entries = form.getAll("files") as File[];

    await fs.mkdir(UPLOAD_DIR, { recursive: true });

    const results: Array<Record<string, unknown>> = [];

    for (const f of entries) {
      try {
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

        const relativePath = path.relative(process.cwd(), dest);
        console.log(`saved -> ${dest}`);

        // Call Gemini AI to analyze the image
        const analysis = type.startsWith("image/")
          ? await analyzeImageWithGemini(relativePath, name)
          : null;

        if (analysis) {
          console.log(`Analysis complete for ${name}:`, analysis);
        }

        // Persist to MongoDB via Prisma (best-effort, skipped for guests)
        if (dbUserId && analysis) {
          try {
            await prisma.upload.create({
              data: {
                imageUrl: `/uploads/${path.basename(dest)}`,
                sportName: analysis.sport ?? "Unknown",
                description: analysis.description ?? "",
                userId: dbUserId,
              },
            });
            console.log(`DB record saved for ${name}`);
          } catch (dbErr) {
            console.error("DB save error (non-fatal):", dbErr);
          }
        } else if (!dbUserId) {
          console.log("Guest mode — skipping DB save for", name);
        }

        results.push({
          name,
          size,
          type,
          status: "saved",
          path: relativePath,
          timestamp,
          analysis: analysis ?? undefined,
        });
      } catch (fileErr) {
        console.error("Error processing uploaded file:", fileErr);
        results.push({
          name: (f as File)?.name ?? "unknown",
          status: "error",
          reason: String((fileErr as any)?.message ?? fileErr ?? "unknown error"),
        });
      }
    }

    console.log("/api/upload result:", results);
    return NextResponse.json({ success: true, files: results });
  } catch (err) {
    console.error("/api/upload error:", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
