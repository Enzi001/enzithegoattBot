import { NextRequest, NextResponse } from "next/server";
import { enableBotForUser } from "@/lib/store";
import { setHandoffActive } from "@/lib/supabase";

interface ResetBody {
  senderId?: string;
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  const body = (await request.json().catch(() => ({}))) as ResetBody;

  if (!body.senderId) {
    return NextResponse.json(
      { error: "senderId is required" },
      { status: 400 }
    );
  }

  enableBotForUser(body.senderId);
  await setHandoffActive(body.senderId, false);
  console.log(`[Admin] Bot reset for sender ${body.senderId}`);

  return NextResponse.json({ status: "ok", senderId: body.senderId });
}
