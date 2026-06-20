import React, { useState } from "react";
import api from "../lib/api";

const AIAssistantPanel = ({ title, subtitle, endpoint, suggestions = [] }) => {
  const [question, setQuestion] = useState(suggestions[0] || "");
  const [answer, setAnswer] = useState("");
  const [loading, setLoading] = useState(false);

  const askAssistant = async (prompt = question) => {
    if (!prompt.trim()) return;
    setLoading(true);
    setAnswer("");

    try {
      const res = await api.post(endpoint, { question: prompt });

      setAnswer(
        res.data.success
          ? res.data.answer
          : res.data.message || "AI assistant could not answer."
      );
    } catch (error) {
      setAnswer(error.response?.data?.message || "AI assistant is unavailable.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="mt-6 p-5 bg-white rounded shadow">
      <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
        AI Assistant
      </p>
      <h3 className="mt-1 text-xl font-semibold text-gray-900">{title}</h3>
      <p className="mt-1 text-sm text-gray-600">{subtitle}</p>

      <div className="flex flex-wrap gap-2 my-4">
        {suggestions.map((item) => (
          <button
            key={item}
            type="button"
            onClick={() => {
              setQuestion(item);
              askAssistant(item);
            }}
            className="border border-gray-300 px-3 py-2 text-xs text-gray-700 hover:border-blue-600 hover:text-blue-700"
          >
            {item}
          </button>
        ))}
      </div>

      <textarea
        value={question}
        onChange={(e) => setQuestion(e.target.value)}
        rows={3}
        className="w-full border border-gray-300 rounded p-3 text-sm outline-none focus:border-blue-600"
        placeholder="Ask about your products, stock, reviews, or orders..."
      />

      <button
        type="button"
        onClick={() => askAssistant()}
        disabled={loading}
        className="mt-3 px-6 py-2 bg-blue-600 text-white text-sm font-medium rounded disabled:bg-gray-400"
      >
        {loading ? "Thinking..." : "Ask AI"}
      </button>

      {answer && (
        <div className="mt-5 whitespace-pre-wrap border-l-4 border-blue-600 bg-blue-50 p-4 text-sm leading-6 text-gray-800">
          {answer}
        </div>
      )}
    </section>
  );
};

export default AIAssistantPanel;
