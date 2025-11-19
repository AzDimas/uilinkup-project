// frontend/src/components/AISearchPanel.jsx
import { useState } from "react";
import { aiSearch } from "../services/aiClient";

export default function AISearchPanel() {
  const [query, setQuery] = useState("");
  const [location, setLocation] = useState("");
  const [skill, setSkill] = useState("");
  const [loading, setLoading] = useState(false);
  const [aiMessage, setAiMessage] = useState("");
  const [results, setResults] = useState([]);
  const [error, setError] = useState("");

  const handleSearch = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const data = await aiSearch({
        message: query,
        keyword: query,
        location,
        skill,
        limit: 5,
        offset: 0,
      });
      setAiMessage(data.message);
      setResults(data.results || []);
    } catch (err) {
      console.error(err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto p-4 space-y-4">
      <h2 className="text-xl font-semibold">AI Alumni & Job Search</h2>

      <form onSubmit={handleSearch} className="space-y-3">
        <div className="space-y-1">
          <label className="text-sm font-medium">
            Pertanyaan / Keyword
          </label>
          <input
            type="text"
            className="w-full border rounded-md px-3 py-2 text-sm"
            placeholder="cari alumni backend engineer di Jakarta..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>

        <div className="flex gap-2">
          <input
            type="text"
            className="flex-1 border rounded-md px-3 py-2 text-sm"
            placeholder="Lokasi (opsional)"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
          />
          <input
            type="text"
            className="flex-1 border rounded-md px-3 py-2 text-sm"
            placeholder="Skill (opsional, mis. Python)"
            value={skill}
            onChange={(e) => setSkill(e.target.value)}
          />
        </div>

        <button
          type="submit"
          disabled={loading || !query}
          className="px-4 py-2 rounded-md bg-blue-600 text-white text-sm disabled:opacity-50"
        >
          {loading ? "Mencari..." : "Cari dengan AI"}
        </button>
      </form>

      {error && (
        <div className="text-sm text-red-600">
          Error: {error}
        </div>
      )}

      {aiMessage && (
        <div className="text-sm italic text-gray-700">
          {aiMessage}
        </div>
      )}

      <div className="space-y-3">
        {results.map((r, idx) => (
          <div
            key={idx}
            className="border rounded-lg p-3 text-sm space-y-1"
          >
            <div className="text-xs uppercase tracking-wide text-gray-500">
              Source: {r.source}
            </div>
            <div className="font-semibold">
              {r.title || "(tanpa judul)"}
            </div>
            {r.context && (
              <div className="text-gray-700">
                {r.context}
              </div>
            )}
            <div className="text-xs text-gray-500">
              Score: {r.score?.toFixed(3)}
            </div>
            <div className="text-gray-800">
              {r.bio}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
