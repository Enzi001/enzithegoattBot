export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export interface Lead {
  senderId: string;
  name?: string;
  phoneNumber: string;
  serviceInterest: ServiceInterest;
  businessPage?: string;
  productInterest?: string;
  goal?: string;
  preferredPlatform?: string;
  message: string;
  createdAt: string;
}

export type ServiceInterest =
  | "stream"
  | "marketing"
  | "product"
  | "price quote"
  | "human contact"
  | "unknown";

export interface LeadDraft {
  serviceInterest?: ServiceInterest;
  businessPage?: string;
  productInterest?: string;
  goal?: string;
  preferredPlatform?: string;
  name?: string;
}

const store = new Map<string, ChatMessage[]>();
const processedMessageIds = new Set<string>();
const leads = new Map<string, Lead>();
const leadDrafts = new Map<string, LeadDraft>();
const handoffUsers = new Map<string, boolean>();

export function getHistory(senderId: string): ChatMessage[] {
  return store.get(senderId) ?? [];
}

export function appendToHistory(senderId: string, message: ChatMessage): void {
  const existing = store.get(senderId);
  if (existing) {
    existing.push(message);
  } else {
    store.set(senderId, [message]);
  }
}

export function clearHistory(senderId: string): void {
  store.delete(senderId);
}

export function hasProcessedMessage(messageId: string): boolean {
  return processedMessageIds.has(messageId);
}

export function markMessageProcessed(messageId: string): void {
  processedMessageIds.add(messageId);
}

export function markLead(lead: Lead): void {
  leads.set(lead.senderId, lead);
}

export function getLead(senderId: string): Lead | undefined {
  return leads.get(senderId);
}

export function getLeadDraft(senderId: string): LeadDraft {
  return leadDrafts.get(senderId) ?? {};
}

export function updateLeadDraft(
  senderId: string,
  updates: Partial<LeadDraft>
): LeadDraft {
  const draft = { ...getLeadDraft(senderId), ...updates };
  leadDrafts.set(senderId, draft);
  return draft;
}

export function isHandoffEnabled(senderId: string): boolean {
  return handoffUsers.get(senderId) === true;
}

export function disableBotForUser(senderId: string): void {
  handoffUsers.set(senderId, true);
}

export function enableBotForUser(senderId: string): void {
  handoffUsers.delete(senderId);
}
