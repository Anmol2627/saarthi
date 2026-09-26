const fs = require('fs');

async function test() {
  const formData = new FormData();
  // Create a dummy file blob
  const blob = new Blob(["dummy audio content"], { type: "audio/wav" });
  formData.append("file", blob, "dummy.wav");
  formData.append("model", "saaras:v1");

  try {
    const res = await fetch("https://api.sarvam.ai/speech-to-text", {
      method: "POST",
      headers: {
        "API-Subscription-Key": process.env.SARVAM_API_KEY
      },
      body: formData
    });
    const data = await res.json();
    console.log("RESPONSE:", JSON.stringify(data));
  } catch (e) {
    console.error(e);
  }
}

test();
