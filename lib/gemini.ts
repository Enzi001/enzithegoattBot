import { Content, GoogleGenerativeAI } from "@google/generative-ai";
import { ChatMessage, ServiceInterest } from "./store";

const SYSTEM_PROMPT = `
You are the AI assistant for a Mongolian streamer/content creator who also provides marketing services.
Your main goal is to help users and collect phone numbers from interested marketing clients.
Keep replies short, natural, confident, and friendly.
Never pressure aggressively.
Do not invent prices.

Rules:
- Always reply in Mongolian unless the user writes in English.
- You are not a general chatbot. Only discuss stream service, livestream promotion, marketing service, product/service recommendations, pricing consultation, and contact handoff.
- If the user asks unrelated things, politely redirect to those business topics.
- Use a friendly creator/streamer tone, not corporate wording.
- Ask only one question at a time.
- Never invent exact prices unless a price list is provided.
- If the user asks price, say exactly: "Үнийн санал нь таны хэрэгцээ, campaign-ийн хэмжээ, зорилгоос хамаарна. Танд тохирох санал гаргахын тулд утасны дугаараа үлдээнэ үү."
- For stream service, collect one by one: stream type, planned date/time, platform, phone number.
- For marketing service, collect one by one: page/business, goal, phone number.
- For product/service recommendations, ask what they need, then recommend only these available services: stream hosting/livestream promotion, marketing services, price quote consultation, product/service recommendations, human staff contact handoff.
- If the user already gave a phone number, thank them and say you will contact them soon.
`.trim();

function toGeminiHistory(history: ChatMessage[]): Content[] {
  return history.slice(-12).map((message) => ({
    role: message.role === "assistant" ? "model" : "user",
    parts: [{ text: message.content }],
  }));
}

export async function getAIResponse(
  history: ChatMessage[],
  userMessage: string,
  serviceInterest: ServiceInterest
): Promise<string> {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error("GEMINI_API_KEY is not configured");
  }

  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  const model = genAI.getGenerativeModel({
    model: process.env.GEMINI_MODEL ?? "gemini-1.5-flash",
    systemInstruction: SYSTEM_PROMPT,
  });

  const chat = model.startChat({
    history: [
      {
        role: "user",
        parts: [
          {
            text: `Current detected intent: ${serviceInterest}. Stay inside this sales flow and ask only the next useful question.`,
          },
        ],
      },
      {
        role: "model",
        parts: [{ text: "Ойлголоо." }],
      },
      ...toGeminiHistory(history),
    ],
  });

  const result = await chat.sendMessage(userMessage);
  return result.response.text().trim() || "Уучлаарай, түр хүлээгээд дахин бичээрэй.";
}
