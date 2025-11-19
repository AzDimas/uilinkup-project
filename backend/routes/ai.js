const express = require("express");
const router = express.Router();
const { handleAiSearch } = require("../controllers/aiController");

router.post("/search", handleAiSearch);

module.exports = router;
