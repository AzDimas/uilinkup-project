// frontend/src/services/aiClient.js
const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

export async function aiSearch({
  message,
  keyword,
  location,
  skill,
  limit = 5,
  offset = 0,
}) {
  const resp = await fetch(`${API_BASE}/api/ai/search`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      message,
      // kalau keyword kosong, pakai message sebagai keyword BM25
      keyword: keyword ?? message,
      location: location || null,
      skill: skill || null,
      limit,
      offset,
    }),
  });

  if (!resp.ok) {
    const err = await resp.json().catch(() => ({}));
    throw new Error(err.error || `Request failed: ${resp.status}`);
  }

  return resp.json(); // { message, results, meta }
}
