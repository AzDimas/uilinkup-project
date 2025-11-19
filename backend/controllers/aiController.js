// controllers/aiController.js
const { searchWithAI } = require("../services/aiSearchService");

exports.handleAiSearch = async (req, res) => {
  try {
    const result = await searchWithAI(req.body);
    res.json(result);
  } catch (err) {
    console.error("❌ AI search error:", err);
    res.status(500).json({ error: err.message });
  }
};
