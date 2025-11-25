const { searchWithAI } = require("../services/aiSearchService");

exports.handleAiSearch = async (req, res) => {
  try {
    const {
      message,
      keyword = "",
      location = null,
      skill = null,
      limit = 5,
      offset = 0,
    } = req.body || {};

    if (!message || typeof message !== "string") {
      return res.status(400).json({ error: "Field 'message' wajib diisi." });
    }

    // 🔎 cek apa yang dikasih middleware JWT ke req.user
    console.log("[AI] decoded req.user:", req.user);

    // support dua kemungkinan: { user_id: ... } atau { id: ... }
    const currentUserId = req.user?.user_id ?? req.user?.id ?? null;

    console.log("[AI] search request:", {
      userId: currentUserId,
      message,
      keyword,
      location,
      skill,
      limit,
      offset,
    });

    const result = await searchWithAI({
      message,
      keyword,
      location,
      skill,
      limit,
      offset,
      currentUserId,
    });

    return res.json(result);
  } catch (err) {
    console.error("AI search error (controller):", err);
    return res.status(500).json({
      error:
        "Terjadi kesalahan pada modul AI search. Silakan coba lagi beberapa saat.",
    });
  }
};
