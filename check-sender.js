const BASE_URL = "https://v4.api.termii.com";
const API_KEY  = "TLkJXxfSOvJyRXewqqjAiOtEjcGkiswZYkFjzfXuFeAWyvsQwSoOvRYAWLqrpi";

async function checkSenders() {
  try {
    const res = await fetch(`${BASE_URL}/api/sender-id?api_key=${API_KEY}`);
    const text = await res.text();
    console.log("Status:", res.status);
    console.log("Response:", text);
  } catch (err) {
    console.error(err.message);
  }
}

checkSenders();
