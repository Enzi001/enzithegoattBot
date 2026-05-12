import { createClient } from "@supabase/supabase-js";
import { Lead, ServiceInterest } from "./store";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const supabase =
  supabaseUrl && supabaseAnonKey
    ? createClient(supabaseUrl, supabaseAnonKey)
    : null;

function logSupabaseError(action: string, error: unknown): void {
  console.error(`[Supabase] ${action} failed:`, error);
}

export async function saveConversationMessage(
  senderId: string,
  role: "user" | "assistant",
  message: string
): Promise<void> {
  if (!supabase) return;

  const { error } = await supabase.from("conversations").insert({
    sender_id: senderId,
    role,
    message,
  });

  if (error) {
    logSupabaseError("save conversation", error);
    return;
  }

  console.log("MESSAGE_SAVED", { senderId, role });
}

export async function saveLead(
  lead: Lead,
  handoffRequested: boolean
): Promise<void> {
  if (!supabase) return;

  const { error } = await supabase.from("leads").insert({
    sender_id: lead.senderId,
    phone_number: lead.phoneNumber,
    service_interest: lead.serviceInterest,
    business_page: lead.businessPage,
    goal: lead.goal,
    preferred_platform: lead.preferredPlatform,
    original_message: lead.message,
    handoff_requested: handoffRequested,
  });

  if (error) {
    logSupabaseError("save lead", error);
    return;
  }

  console.log("LEAD_SAVED", { senderId: lead.senderId, phoneNumber: lead.phoneNumber });
}

export async function isMessageProcessed(messageId: string): Promise<boolean> {
  if (!supabase) return false;

  const { data, error } = await supabase
    .from("processed_messages")
    .select("message_id")
    .eq("message_id", messageId)
    .maybeSingle();

  if (error) {
    logSupabaseError("check processed message", error);
    return false;
  }

  return Boolean(data);
}

export async function saveProcessedMessage(
  messageId: string,
  senderId: string
): Promise<void> {
  if (!supabase) return;

  const { error } = await supabase.from("processed_messages").insert({
    message_id: messageId,
    sender_id: senderId,
  });

  if (error) {
    logSupabaseError("save processed message", error);
  }
}

export async function isHandoffActive(senderId: string): Promise<boolean> {
  if (!supabase) return false;

  const { data, error } = await supabase
    .from("handoff_users")
    .select("active")
    .eq("sender_id", senderId)
    .eq("active", true)
    .maybeSingle();

  if (error) {
    logSupabaseError("check handoff", error);
    return false;
  }

  return Boolean(data?.active);
}

export async function setHandoffActive(
  senderId: string,
  active: boolean,
  serviceInterest?: ServiceInterest
): Promise<void> {
  if (!supabase) return;

  const { error } = await supabase.from("handoff_users").upsert(
    {
      sender_id: senderId,
      active,
      service_interest: serviceInterest,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "sender_id" }
  );

  if (error) {
    logSupabaseError("set handoff", error);
  }
}
