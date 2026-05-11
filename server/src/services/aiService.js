import OpenAI from "openai";
import { env } from "../config/env.js";

const openai = env.openAiKey ? new OpenAI({ apiKey: env.openAiKey }) : null;

const priorityRules = (text) => {
  const urgent = ["down", "outage", "breach", "security", "fraud", "cannot login", "payment failed"];
  const high = ["broken", "error", "blocked", "angry", "refund", "cancel"];
  const lower = text.toLowerCase();
  if (urgent.some((word) => lower.includes(word))) return "urgent";
  if (high.some((word) => lower.includes(word))) return "high";
  return "medium";
};

const sentimentRules = (text) => {
  const lower = text.toLowerCase();
  if (["furious", "angry", "terrible", "unacceptable"].some((word) => lower.includes(word))) {
    return { label: "angry", score: -0.9 };
  }
  if (["bad", "broken", "frustrated", "issue"].some((word) => lower.includes(word))) {
    return { label: "negative", score: -0.45 };
  }
  if (["thanks", "great", "love"].some((word) => lower.includes(word))) {
    return { label: "positive", score: 0.7 };
  }
  return { label: "neutral", score: 0 };
};

export const analyzeTicket = async ({ title, description }) => {
  const text = `${title}\n${description}`;

  if (!openai) {
    return {
      summary: description.slice(0, 220),
      suggestedReply: "Thanks for reaching out. We are reviewing this and will update you shortly.",
      sentiment: sentimentRules(text),
      detectedPriority: priorityRules(text)
    };
  }

  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    temperature: 0.2,
    response_format: { type: "json_object" },
    messages: [
      {
        role: "system",
        content:
          "You analyze customer support tickets. Return JSON with summary, suggestedReply, sentiment {label, score}, and detectedPriority. Priority must be low, medium, high, or urgent. Sentiment label must be positive, neutral, negative, or angry."
      },
      { role: "user", content: text }
    ]
  });

  return JSON.parse(response.choices[0].message.content);
};
