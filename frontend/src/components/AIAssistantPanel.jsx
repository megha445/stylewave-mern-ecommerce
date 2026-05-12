import React, { useState } from "react";
import axios from "axios";

const AIAssistantPanel = ({ title, subtitle, endpoint, token, suggestions = [] }) => {
  const [question, setQuestion] = useState(suggestions[0] || "");
  const [answer, setAnswer] = useState("");
  const [loading, setLoading] = useState(false);

  const askAssistant = async (prompt = question) => {
    if (!prompt.trim()) return;
    setLoading(true);
    setAnswer("");

    try {
      const res = await axios.post(
        endpoint,
        { question: prompt },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (res.data.success) {
        setAnswer(res.data.answer);
      } else {
        setAnswer(res.data.message || "AI assistant could not answer.");
      }
    } catch (error) {
      setAnswer(error.response?.data?.message || "AI assistant is unavailable.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="mt-6 border border-gray-200 bg-white p-6">
      <div className="mb-4">
        <p className="text-sm font-semibold uppercase tracking-wide text-gray-500">
          AI Assistant
        </p>
        <h2 className="mt-1 text-xl font-semibold text-gray-900">{title}</h2>
        <p className="mt-1 text-sm text-gray-600">{subtitle}</p>
      </div>

      <div className="flex flex-wrap gap-2 mb-4">
        {suggestions.map((item) => (
          <button
            key={item}
            type="button"
            onClick={() => {
              setQuestion(item);
              askAssistant(item);
            }}
            className="border border-gray-300 px-3 py-2 text-xs text-gray-700 hover:border-gray-900 hover:text-gray-900"
          >
            {item}
          </button>
        ))}
      </div>

      <textarea
        value={question}
        onChange={(e) => setQuestion(e.target.value)}
        rows={3}
        className="w-full border border-gray-300 p-3 text-sm outline-none focus:border-gray-900"
        placeholder="Ask a question..."
      />

      <button
        type="button"
        onClick={() => askAssistant()}
        disabled={loading}
        className="mt-3 bg-black px-6 py-2 text-sm font-medium text-white disabled:bg-gray-400"
      >
        {loading ? "Thinking..." : "Ask AI"}
      </button>

      {answer && (
        <div className="mt-5 whitespace-pre-wrap border-l-4 border-black bg-gray-50 p-4 text-sm leading-6 text-gray-800">
          {answer}
        </div>
      )}
    </section>
  );
};

export default AIAssistantPanel;
