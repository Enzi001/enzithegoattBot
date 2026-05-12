const GRAPH_API_BASE = "https://graph.facebook.com/v18.0";

export async function sendMessage(
  recipientId: string,
  text: string
): Promise<void> {
  const url = `${GRAPH_API_BASE}/me/messages?access_token=${process.env.PAGE_ACCESS_TOKEN}`;

  console.log("SEND_MESSAGE_ATTEMPT", { recipientId });

  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      recipient: { id: recipientId },
      message: { text },
    }),
  });

  if (!response.ok) {
    const errorBody = await response.json().catch(() => response.statusText);
    console.error("SEND_MESSAGE_FAILED", { recipientId, status: response.status, errorBody });
    throw new Error(
      `Facebook Graph API error ${response.status}: ${JSON.stringify(errorBody)}`
    );
  }

  console.log("SEND_MESSAGE_SUCCESS", { recipientId });
}
