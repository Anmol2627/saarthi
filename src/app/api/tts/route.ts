import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const { text, lang = "hi-IN" } = await request.json();

    if (!text) {
      return NextResponse.json({ error: "Text is required" }, { status: 400 });
    }

    // Truncate to 500 chars to stay within Sarvam TTS limits
    const truncatedText = text.substring(0, 500);

    const apiRes = await fetch("https://api.sarvam.ai/text-to-speech", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "API-Subscription-Key": process.env.SARVAM_API_KEY || ""
      },
      body: JSON.stringify({
        inputs: [truncatedText],
        target_language_code: lang,
        speaker: "ritu",
        pitch: 0,
        pace: 1.0,
        loudness: 1.5,
        speech_sample_rate: 8000,
        enable_preprocessing: true,
        model: "bulbul:v3"
      })
    });

    if (!apiRes.ok) {
       const errText = await apiRes.text();
       throw new Error(`Sarvam TTS API failed: ${apiRes.status} - ${errText}`);
    }

    const response = await apiRes.json();

    // The API returns an object with an 'audios' array of base64 strings
    if (response && response.audios && response.audios.length > 0) {
      return NextResponse.json({ audioBase64: response.audios[0] });
    } else {
      throw new Error("No audio returned from Sarvam API");
    }

  } catch (error: any) {
    console.error("TTS API Error:", error);
    return NextResponse.json(
      { error: "Failed to synthesize speech" },
      { status: 500 }
    );
  }
}
