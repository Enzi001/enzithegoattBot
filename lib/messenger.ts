const GRAPH_API_BASE = "https://graph.facebook.com/v18.0";

export async function sendMessage(
  recipientId: string,
  text: string
): Promise<void> {
  const url = `${GRAPH_API_BASE}/me/messages?access_token=${process.env.PAGE_ACCESS_TOKEN}`;

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
    throw new Error(
      `Facebook Graph API error ${response.status}: ${JSON.stringify(errorBody)}`
    );
  }
}
