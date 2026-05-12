import { createClient } from "@supabase/supabase-js";
import { Lead, ServiceInterest } from "./store";

function normalizeSupabaseUrl(url: string): string {
  return url.trim().replace(/\/rest\/v1\/?$/i, "").replace(/\/+$/g, "");
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  ? normalizeSupabaseUrl(process.env.NEXT_PUBLIC_SUPABASE_URL)
  : undefined;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (process.env.NEXT_PUBLIC_SUPABASE_URL?.match(/\/rest\/v1\/?$/i)) {
  console.warn("[Supabase] NEXT_PUBLIC_SUPABASE_URL contained /rest/v1; using project URL only");
}

export const supabase =
  supabaseUrl && supabaseAnonKey
    ? createClient(supabaseUrl, supabaseAnonKey)
    : null;

function logSupabaseSuccess(action: string): void {
  console.log("SUPABASE_QUERY_SUCCESS", action);
}

function logSupabaseError(action: string, error: unknown): void {
  console.error("SUPABASE_QUERY_FAILED", action, error);
}

export async function saveConversationMessage(
  senderId: string,
  role: "user" | "assistant",
  message: string
): Promise<void> {
  if (!supabase) return;

  try {
    const { error } = await supabase.from("conversations").insert({
      sender_id: senderId,
      role,
      message,
    });

    if (error) {
      logSupabaseError("conversations.insert", error);
      return;
    }

    logSupabaseSuccess("conversations.insert");
    console.log("MESSAGE_SAVED", { senderId, role });
  } catch (error) {
    logSupabaseError("conversations.insert", error);
  }
}

export async function saveLead(
  lead: Lead,
  handoffRequested: boolean
): Promise<void> {
  if (!supabase) return;

  try {
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
      logSupabaseError("leads.insert", error);
      return;
    }

    logSupabaseSuccess("leads.insert");
    console.log("LEAD_SAVED", { senderId: lead.senderId, phoneNumber: lead.phoneNumber });
  } catch (error) {
    logSupabaseError("leads.insert", error);
  }
}

export async function isMessageProcessed(messageId: string): Promise<boolean> {
  if (!supabase) return false;

  try {
    const { data, error } = await supabase
      .from("processed_messages")
      .select("message_id")
      .eq("message_id", messageId)
      .maybeSingle();

    if (error) {
      logSupabaseError("processed_messages.select", error);
      return false;
    }

    logSupabaseSuccess("processed_messages.select");
    return Boolean(data);
  } catch (error) {
    logSupabaseError("processed_messages.select", error);
    return false;
  }
}

export async function saveProcessedMessage(
  messageId: string,
  senderId: string
): Promise<void> {
  if (!supabase) return;

  try {
    const { error } = await supabase.from("processed_messages").insert({
      message_id: messageId,
      sender_id: senderId,
    });

    if (error) {
      logSupabaseError("processed_messages.insert", error);
      return;
    }

    logSupabaseSuccess("processed_messages.insert");
  } catch (error) {
    logSupabaseError("processed_messages.insert", error);
  }
}

export async function isHandoffActive(senderId: string): Promise<boolean> {
  if (!supabase) return false;

  try {
    const { data, error } = await supabase
      .from("handoff_users")
      .select("active")
      .eq("sender_id", senderId)
      .eq("active", true)
      .maybeSingle();

    if (error) {
      logSupabaseError("handoff_users.select", error);
      return false;
    }

    logSupabaseSuccess("handoff_users.select");
    return Boolean(data?.active);
  } catch (error) {
    logSupabaseError("handoff_users.select", error);
    return false;
  }
}

export async function setHandoffActive(
  senderId: string,
  active: boolean,
  serviceInterest?: ServiceInterest
): Promise<void> {
  if (!supabase) return;

  try {
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
      logSupabaseError("handoff_users.upsert", error);
      return;
    }

    logSupabaseSuccess("handoff_users.upsert");
  } catch (error) {
    logSupabaseError("handoff_users.upsert", error);
  }
}
