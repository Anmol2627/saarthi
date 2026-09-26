import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "No audio file provided" }, { status: 400 });
    }

    // Forward the file directly to Sarvam API
    const sarvamFormData = new FormData();
    sarvamFormData.append("file", file);
    sarvamFormData.append("model", "saaras:v2");

    const response = await fetch("https://api.sarvam.ai/speech-to-text", {
      method: "POST",
      headers: {
        "API-Subscription-Key": process.env.SARVAM_API_KEY || "",
      },
      body: sarvamFormData,
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Sarvam STT failed: ${response.status} - ${errText}`);
    }

    const data = await response.json();
    return NextResponse.json({ transcript: data.transcript });

  } catch (error: any) {
    console.error("STT API Error:", error);
    return NextResponse.json(
      { error: "Failed to transcribe speech" },
      { status: 500 }
    );
  }
}
