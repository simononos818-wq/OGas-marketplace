const BASE_URL = "https://v4.api.termii.com";
const API_KEY  = "TLkJXxfSOvJyRXewqqjAiOtEjcGkiswZYkFjzfXuFeAWyvsQwSoOvRYAWLqrpi";

async function sendTestSMS() {
  console.log("Using Number API (no Sender ID required)...");

  const payload = {
    api_key: API_KEY,
    to: "2349133110237",
    sms: "O-Gas test ✅ AI marketplace is live! Your order confirmation system is working."
  };

  try {
    const res = await fetch(`${BASE_URL}/api/sms/number/send`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    const text = await res.text();
    console.log("\nStatus:", res.status);
    console.log("Raw response:", text || "(empty)");

    if (text) {
      try {
        const data = JSON.parse(text);
        console.log("Parsed:", JSON.stringify(data, null, 2));

        if (data.message_id || data.code === "ok" || res.status === 200) {
          console.log("\n✅ SMS sent successfully!");
        }
      } catch {
        console.log("Not valid JSON");
      }
    }
  } catch (err) {
    console.error("Network error:", err.message);
  }
}

sendTestSMS();
