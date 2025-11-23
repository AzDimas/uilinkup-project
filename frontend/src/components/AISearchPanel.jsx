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

      // cek di console kalau mau debugging
      console.log("AI search data:", data);

      setAiMessage(data.message);
      setResults(data.results || []);
    } catch (err) {
      console.error(err);
      setError(err.message || "Terjadi kesalahan pada pencarian AI.");
    } finally {
      setLoading(false);
    }
  };

  const formatSourceLabel = (source) => {
    switch (source) {
      case "alumni":
        return "ALUMNI";
      case "student":
        return "STUDENT";
      case "job":
        return "JOB";
      case "event":
        return "EVENT";
      default:
        return (source || "").toUpperCase();
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-4 space-y-4">
      <h2 className="text-xl font-semibold">AI Career Assistant</h2>
      <p className="text-sm text-gray-600">
        Cari alumni, mentor, atau peluang karir pakai AI.
      </p>

      {/* FORM INPUT */}
      <form onSubmit={handleSearch} className="space-y-3">
        <div className="space-y-1">
          <label className="text-sm font-medium">Pertanyaan / Keyword</label>
          <input
            type="text"
            className="w-full border rounded-md px-3 py-2 text-sm"
            placeholder='contoh: "Alumni yang bekerja sebagai backend engineer di Jakarta"'
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

      {error && <div className="text-sm text-red-600">Error: {error}</div>}

      {aiMessage && (
        <div className="text-sm italic text-gray-700 text-center">
          {aiMessage}
        </div>
      )}

      {/* HASIL PENCARIAN */}
      <div className="space-y-3">
        {results.map((r, idx) => (
          <div
            key={idx}
            className="border rounded-xl p-4 text-sm space-y-2 shadow-sm bg-white/60"
          >
            {/* LABEL SOURCE */}
            {r.source && (
              <div className="text-[10px] font-semibold tracking-wide text-gray-500 uppercase">
                {formatSourceLabel(r.source)}
              </div>
            )}

            {/* NAMA (UTAMA) */}
            <div className="text-lg font-semibold text-blue-800">
              {r.name
                ? r.name
                : r.title
                ? r.title
                : r.source === "student"
                ? "Mahasiswa"
                : r.source === "alumni"
                ? "Alumni"
                : "(tanpa nama)"}
            </div>

            {/* TITLE + CONTEXT (job/fakultas/perusahaan) */}
            {(r.title || r.context) && (
              <div className="text-sm text-gray-800">
                {r.title && <span>{r.title}</span>}
                {r.title && r.context && <span> • </span>}
                {r.context && <span>{r.context}</span>}
              </div>
            )}

            {/* FAKULTAS & ANGKATAN */}
            {(r.fakultas || r.angkatan) && (
              <div className="text-xs text-gray-600">
                {r.fakultas && <span>Fakultas: {r.fakultas}</span>}
                {r.fakultas && r.angkatan && <span> • </span>}
                {r.angkatan && <span>Angkatan: {r.angkatan}</span>}
              </div>
            )}

            {/* IPK & SEMESTER */}
            {(r.ipk || r.semester) && (
              <div className="text-xs text-gray-600">
                {r.ipk && <span>IPK: {r.ipk}</span>}
                {r.ipk && r.semester && <span> • </span>}
                {r.semester && <span>Semester: {r.semester}</span>}
              </div>
            )}

            {/* INTEREST FIELD */}
            {r.interest && r.interest.length > 0 && (
              <div className="text-xs text-gray-600">
                Minat: {r.interest.join(", ")}
              </div>
            )}

            {/* BIO / DESCRIPTION */}
            {r.bio && (
              <div className="text-sm text-gray-800 mt-1">
                {r.bio}
              </div>
            )}

            {/* SCORE */}
            <div className="text-[11px] text-gray-500 mt-1">
              {typeof r.score === "number" && (
                <>score: {r.score.toFixed(3)}</>
              )}
            </div>
          </div>
        ))}

        {results.length === 0 && aiMessage && (
          <div className="text-center text-gray-500 text-sm">
            Tidak ada hasil relevan.
          </div>
        )}
      </div>
    </div>
  );
}
