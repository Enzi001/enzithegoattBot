import { NextRequest, NextResponse } from "next/server";
import {
  ServiceInterest,
  appendToHistory,
  disableBotForUser,
  enableBotForUser,
  getHistory,
  getLeadDraft,
  hasProcessedMessage,
  isHandoffEnabled,
  markLead,
  markMessageProcessed,
  updateLeadDraft,
} from "@/lib/store";
import { getAIResponse } from "@/lib/gemini";
import { sendMessage } from "@/lib/messenger";
import { sendTelegramNotification } from "@/lib/notifications";
import {
  isHandoffActive,
  isMessageProcessed,
  saveConversationMessage,
  saveLead,
  saveProcessedMessage,
  setHandoffActive,
} from "@/lib/supabase";

interface MessagingEvent {
  sender: { id: string };
  recipient: { id: string };
  timestamp: number;
  message?: {
    mid: string;
    text?: string;
    is_echo?: boolean;
  };
  postback?: unknown;
  delivery?: unknown;
  read?: unknown;
}

interface WebhookEntry {
  id: string;
  time: number;
  messaging: MessagingEvent[];
}

interface WebhookBody {
  object: string;
  entry: WebhookEntry[];
}

const WELCOME_MESSAGE =
  "Сайн байна уу 👋 Та stream хийлгэх, marketing үйлчилгээ авах, үнийн санал авах эсвэл бүтээгдэхүүн/үйлчилгээний талаар мэдээлэл авах гэж байна уу?";
const FALLBACK_GREETING_MESSAGE =
  "Сайн байна уу 👋 Та stream хийлгэх, marketing үйлчилгээ авах, content/reel хийлгэх, үнийн санал авах эсвэл ажилтантай холбогдох гэж байна уу?";
const REDIRECT_MESSAGE =
  "Энэ чат нь stream, marketing үйлчилгээ, үнийн санал болон бүтээгдэхүүн/үйлчилгээний мэдээлэл өгөх зориулалттай. Та аль үйлчилгээний талаар асуух вэ?";
const PRICE_MESSAGE =
  "Үнийн санал нь таны хэрэгцээ, campaign-ийн хэмжээ, зорилгоос хамаарна. Танд тохирох санал гаргахын тулд утасны дугаараа үлдээнэ үү.";
const LEAD_CONFIRMATION =
  "Баярлалаа. Таны мэдээллийг хүлээн авлаа. Манай баг удахгүй холбогдоно.";
const HANDOFF_CONFIRMATION =
  "Ойлголоо. Chatbot-г түр унтраалаа. Манай ажилтан удахгүй тантай холбогдоно. Буцааж асаах бол \"ai асаа\" гэж бичээрэй.";
const RESUME_CONFIRMATION =
  "Chatbot дахин идэвхжлээ 👋 Танд stream, marketing эсвэл үнийн саналын талаар юугаар туслах вэ?";

function normalize(text: string): string {
  return text.toLowerCase().trim();
}

function isEnglishMessage(text: string): boolean {
  return /^[\x00-\x7F\s.,!?'"()\-:;0-9/]+$/.test(text);
}

function extractPhoneNumber(text: string): string | null {
  const match = text.match(/(?:\+?976[-\s]?)?(?:\d[-\s]?){8}/);
  if (!match) return null;

  const digits = match[0].replace(/\D/g, "");
  if (digits.length === 11 && digits.startsWith("976")) return digits.slice(3);
  return digits.length === 8 ? digits : null;
}

function hasHandoffIntent(text: string): boolean {
  const value = normalize(text);
  const directMatches = [
    "ажилтантай холбогдох",
    "ажилтантай чатлах",
    "ажилтантай ярих",
    "хүнтэй холбогдох",
    "хүнтэй чатлах",
    "хүнтэй ярих",
    "админтай холбогдох",
    "админтай чатлах",
    "админтай ярих",
    "оператор",
    "дугаар өг",
    "утсаар ярья",
    "утсаар ярих",
    "утсаар холбогдох",
    "хүн байна уу",
  ];
  const hasHumanWord = /(ажилтан|хүн|админ|оператор)/.test(value);
  const hasContactWord = /(холбогд|чат|яри|утас|дугаар)/.test(value);

  return (
    directMatches.some((phrase) => value.includes(phrase)) ||
    (hasHumanWord && hasContactWord) ||
    /\b(human|admin|operator|staff|contact)\b/.test(value)
  );
}

function hasResumeIntent(text: string): boolean {
  return /^(bot|ai|chatbot|resume|бот|ai асаа|chatbot асаа|дахин chatbot)$/i.test(
    normalize(text)
  );
}

function detectServiceIntent(text: string): ServiceInterest | null {
  const value = normalize(text);

  if (hasHandoffIntent(text)) return "human contact";
  if (/үнийн санал|үнэ|төлбөр|ханш|хэд вэ|price|quote|cost|fee|how much/.test(value)) {
    return "price quote";
  }
  if (/stream|стрим|live|лайв/.test(value)) return "stream";
  if (
    /маркетинг|marketing|ads?|facebook|instagram|reels?|рийл|рилл|контент|сурталчилгаа|реклам|campaign|collaboration|хамтрал|page growth|дагагч|борлуулалт|messages|booking|brand/.test(
      value
    )
  ) {
    return "marketing";
  }
  if (/бүтээгдэхүүн|үйлчилгээ|product|recommend|зөвлөх|санал болго/.test(value)) {
    return "product";
  }

  return null;
}

function isGreeting(text: string): boolean {
  return /^(сайн|сайн уу|сайн байна уу|hi|hello|hey|yo|hi there)[\s!.?]*$/i.test(
    text.trim()
  );
}

function isFallbackGreeting(text: string): boolean {
  return /^(сайн|сайн уу|сайн байна уу|hi|hello|hey|yo|hi there)[\s!.?]*$/i.test(
    text.trim()
  );
}

function guessGoal(text: string): string | undefined {
  const value = normalize(text);
  if (/борлуулалт|sales|зарах/.test(value)) return "sales";
  if (/followers|дагагч/.test(value)) return "followers";
  if (/messages|чат|inbox|dm/.test(value)) return "messages";
  if (/booking|захиалга|цаг ав/.test(value)) return "booking";
  if (/brand|танигдалт|awareness/.test(value)) return "brand awareness";
  return undefined;
}

function guessPlatform(text: string): string | undefined {
  const value = normalize(text);
  if (/facebook|fb/.test(value)) return "Facebook";
  if (/tiktok|tik tok/.test(value)) return "TikTok";
  if (/youtube|yt/.test(value)) return "YouTube";
  return undefined;
}

function guessName(text: string): string | undefined {
  const match = text.match(/(?:намайг|миний нэр|name is|i am)\s+([A-Za-zА-Яа-яӨөҮүЁё -]{2,40})/i);
  return match?.[1]?.trim();
}

function updateDraftFromMessage(
  senderId: string,
  serviceInterest: ServiceInterest,
  text: string
) {
  const current = getLeadDraft(senderId);
  const updates: {
    serviceInterest: ServiceInterest;
    name?: string;
    goal?: string;
    preferredPlatform?: string;
    businessPage?: string;
    productInterest?: string;
  } = {
    serviceInterest,
    name: current.name ?? guessName(text),
    preferredPlatform: current.preferredPlatform ?? guessPlatform(text),
  };

  if (serviceInterest === "stream") {
    if (!current.businessPage && !detectServiceIntent(text)) updates.businessPage = text;
    else if (!current.goal && !guessPlatform(text)) updates.goal = text;
    return updateLeadDraft(senderId, updates);
  }

  if (serviceInterest === "marketing") {
    if (!current.businessPage && !detectServiceIntent(text)) updates.businessPage = text;
    else if (!current.goal) updates.goal = guessGoal(text) ?? text;
    return updateLeadDraft(senderId, updates);
  }

  if (serviceInterest === "product" && !current.productInterest && !detectServiceIntent(text)) {
    updates.productInterest = text;
  }

  return updateLeadDraft(senderId, updates);
}

function nextQuestion(senderId: string, serviceInterest: ServiceInterest): string {
  const draft = getLeadDraft(senderId);

  if (serviceInterest === "stream") {
    if (!draft.businessPage) return "Ямар төрлийн stream хийлгэх вэ?";
    if (!draft.goal) return "Хэзээ хийх төлөвлөгөөтэй вэ?";
    if (!draft.preferredPlatform) return "Ямар platform дээр хийх вэ? Facebook/TikTok/YouTube?";
    return "Холбогдох утасны дугаараа үлдээнэ үү?";
  }

  if (serviceInterest === "marketing") {
    if (!draft.businessPage) return "Ямар page/business өсгөх гэж байгаа вэ?";
    if (!draft.goal) {
      return "Гол зорилго юу вэ? Борлуулалт, followers, messages, booking, brand awareness?";
    }
    return "Холбогдох утасны дугаараа үлдээнэ үү?";
  }

  if (serviceInterest === "product") {
    if (!draft.productInterest) return "Ямар бүтээгдэхүүн эсвэл үйлчилгээ хайж байгаа вэ?";
    return "Танд stream promotion, marketing, content/reels санаа, campaign planning эсвэл page growth strategy илүү тохирно. Холбогдох утасны дугаараа үлдээх үү?";
  }

  if (serviceInterest === "price quote") return PRICE_MESSAGE;
  if (serviceInterest === "human contact") return "Мэдээж, admin удахгүй холбогдоно. Холбогдох утасны дугаараа үлдээнэ үү?";
  return WELCOME_MESSAGE;
}

function buildLead(senderId: string, phoneNumber: string, message: string) {
  const draft = getLeadDraft(senderId);
  return {
    senderId,
    name: draft.name,
    phoneNumber,
    serviceInterest: draft.serviceInterest ?? "unknown",
    businessPage: draft.businessPage,
    productInterest: draft.productInterest,
    goal: draft.goal,
    preferredPlatform: draft.preferredPlatform,
    message,
    createdAt: new Date().toISOString(),
  };
}

function buildTelegramHandoffMessage(
  senderId: string,
  userMessage: string,
  timestamp: string
): string {
  return [
    "🚨 Human handoff requested",
    "",
    `User ID: ${senderId}`,
    `Message: ${userMessage}`,
    `Time: ${timestamp}`,
    "",
    "Please reply manually in Facebook Page Inbox.",
  ].join("\n");
}

function buildTelegramLeadMessage(lead: ReturnType<typeof buildLead>): string {
  return [
    "📞 New lead phone number",
    "",
    `User ID: ${lead.senderId}`,
    `Phone: ${lead.phoneNumber}`,
    `Interest: ${lead.serviceInterest}`,
    `Message: ${lead.message}`,
    `Time: ${lead.createdAt}`,
    "",
    "Please reply manually in Facebook Page Inbox.",
  ].join("\n");
}

async function triggerHandoff(senderId: string, userText: string): Promise<void> {
  const timestamp = new Date().toISOString();

  updateLeadDraft(senderId, { serviceInterest: "human contact" });
  disableBotForUser(senderId);
  await setHandoffActive(senderId, true, "human contact");

  console.log("HANDOFF_TRIGGERED", { senderId, userMessage: userText, timestamp });
  console.log("BOT_DISABLED_FOR_USER", senderId);

  appendToHistory(senderId, { role: "user", content: userText });
  appendToHistory(senderId, { role: "assistant", content: HANDOFF_CONFIRMATION });
  await saveConversationMessage(senderId, "assistant", HANDOFF_CONFIRMATION);

  try {
    await sendMessage(senderId, HANDOFF_CONFIRMATION);
  } catch (error) {
    console.error(`[Messenger] Failed to send handoff confirmation to ${senderId}:`, error);
  }

  sendTelegramNotification(buildTelegramHandoffMessage(senderId, userText, timestamp)).catch(
    (error) => console.error("TELEGRAM_NOTIFICATION_FAILED", error)
  );
}

async function resumeAi(senderId: string, userText: string): Promise<void> {
  enableBotForUser(senderId);
  await setHandoffActive(senderId, false);
  console.log("AI_RESUMED", senderId);

  appendToHistory(senderId, { role: "user", content: userText });
  appendToHistory(senderId, { role: "assistant", content: RESUME_CONFIRMATION });
  await saveConversationMessage(senderId, "assistant", RESUME_CONFIRMATION);

  try {
    await sendMessage(senderId, RESUME_CONFIRMATION);
  } catch (error) {
    console.error(`[Messenger] Failed to send resume confirmation to ${senderId}:`, error);
  }
}

function fallbackReply(senderId: string, text: string): string {
  if (isGreeting(text)) return isEnglishMessage(text)
    ? "Hi! Are you looking for stream promotion, marketing service, a price quote, or product/service information?"
    : WELCOME_MESSAGE;

  const currentDraft = getLeadDraft(senderId);
  const detectedIntent = detectServiceIntent(text) ?? currentDraft.serviceInterest;
  if (!detectedIntent) return isEnglishMessage(text)
    ? "This chat is for stream services, marketing, price quotes, and product/service information. Which service do you want to ask about?"
    : REDIRECT_MESSAGE;

  const draft = updateDraftFromMessage(senderId, detectedIntent, text);
  return nextQuestion(senderId, draft.serviceInterest ?? detectedIntent);
}

async function buildReply(senderId: string, text: string): Promise<string> {
  if (isGreeting(text)) return isEnglishMessage(text)
    ? "Hi! Are you looking for stream promotion, marketing service, a price quote, or product/service information?"
    : WELCOME_MESSAGE;

  const currentDraft = getLeadDraft(senderId);
  const detectedIntent = detectServiceIntent(text) ?? currentDraft.serviceInterest;
  if (!detectedIntent) return isEnglishMessage(text)
    ? "This chat is for stream services, marketing, price quotes, and product/service information. Which service do you want to ask about?"
    : REDIRECT_MESSAGE;

  updateDraftFromMessage(senderId, detectedIntent, text);

  if (detectedIntent === "price quote") return PRICE_MESSAGE;
  if (detectedIntent === "human contact") return nextQuestion(senderId, "human contact");

  try {
    const aiReply = await getAIResponse(getHistory(senderId), text, detectedIntent);
    return aiReply || nextQuestion(senderId, detectedIntent);
  } catch (error) {
    console.error(`[Gemini] Error for sender ${senderId}:`, error);
    return fallbackReply(senderId, text);
  }
}

export async function GET(request: Request): Promise<Response> {
  const { searchParams } = new URL(request.url);
  const mode = searchParams.get("hub.mode");
  const token = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");
  const expectedToken = process.env.VERIFY_TOKEN;

  console.log("[Webhook] received verify token:", token);
  console.log("[Webhook] env token exists:", Boolean(expectedToken));

  if (mode === "subscribe" && token === expectedToken && challenge) {
    console.log("[Webhook] verification success");
    return new Response(challenge, { status: 200 });
  }

  console.warn("[Webhook] verification fail", {
    mode,
    hasChallenge: Boolean(challenge),
    tokenMatches: token === expectedToken,
  });
  return Response.json({ error: "Verification failed" }, { status: 403 });
}

async function processWebhookBody(body: WebhookBody): Promise<void> {
  if (body.object !== "page") return;

  for (const entry of body.entry ?? []) {
    for (const event of entry.messaging ?? []) {
      if (
        event.delivery ||
        event.read ||
        event.postback ||
        event.message?.is_echo ||
        !event.message?.text
      ) {
        continue;
      }

      const messageId = event.message.mid;
      const alreadyProcessed =
        hasProcessedMessage(messageId) || (await isMessageProcessed(messageId));

      if (alreadyProcessed) {
        console.log("DUPLICATE_MESSAGE_SKIPPED", messageId);
        continue;
      }

      const senderId = event.sender.id;
      const userText = event.message.text;

      markMessageProcessed(messageId);
      await saveProcessedMessage(messageId, senderId);

      console.log("MESSAGE_RECEIVED", { senderId, messageId, userText });
      console.log("MESSAGE_TEXT", userText);
      appendToHistory(senderId, { role: "user", content: userText });
      await saveConversationMessage(senderId, "user", userText);

      if (isFallbackGreeting(userText)) {
        appendToHistory(senderId, {
          role: "assistant",
          content: FALLBACK_GREETING_MESSAGE,
        });
        await saveConversationMessage(senderId, "assistant", FALLBACK_GREETING_MESSAGE);

        try {
          await sendMessage(senderId, FALLBACK_GREETING_MESSAGE);
        } catch (error) {
          console.error(`[Messenger] Failed to send greeting to ${senderId}:`, error);
        }

        continue;
      }

      const handoffActive =
        isHandoffEnabled(senderId) || (await isHandoffActive(senderId));

      if (handoffActive) {
        if (hasResumeIntent(userText)) {
          await resumeAi(senderId, userText);
          continue;
        }

        console.log("AI_SKIPPED_HANDOFF_MODE", senderId);
        continue;
      }

      if (hasHandoffIntent(userText)) {
        await triggerHandoff(senderId, userText);
        continue;
      }

      const phoneNumber = extractPhoneNumber(userText);
      if (phoneNumber) {
        const lead = buildLead(senderId, phoneNumber, userText);
        markLead(lead);
        await saveLead(lead, handoffActive);
        console.log("NEW SALES LEAD:", JSON.stringify(lead, null, 2));

        appendToHistory(senderId, { role: "assistant", content: LEAD_CONFIRMATION });
        await saveConversationMessage(senderId, "assistant", LEAD_CONFIRMATION);

        try {
          await sendMessage(senderId, LEAD_CONFIRMATION);
        } catch (error) {
          console.error(`[Messenger] Failed to send to ${senderId}:`, error);
        }

        sendTelegramNotification(buildTelegramLeadMessage(lead)).catch((error) =>
          console.error("TELEGRAM_NOTIFICATION_FAILED", error)
        );

        continue;
      }

      const reply = await buildReply(senderId, userText);
      appendToHistory(senderId, { role: "assistant", content: reply });
      await saveConversationMessage(senderId, "assistant", reply);

      try {
        await sendMessage(senderId, reply);
      } catch (error) {
        console.error(`[Messenger] Failed to send to ${senderId}:`, error);
      }
    }
  }
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  console.log("WEBHOOK_POST_RECEIVED");
  const body: WebhookBody = await request.json();

  try {
    await processWebhookBody(body);
  } catch (error) {
    console.error("[Webhook] Background processing failed:", error);
  }

  return NextResponse.json({ status: "ok" }, { status: 200 });
}
