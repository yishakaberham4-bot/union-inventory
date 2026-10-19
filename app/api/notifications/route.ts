import { NextRequest, NextResponse } from "next/server";
import { getSession, requireRole } from "@/lib/auth";
import {
  getNotifications,
  markNotificationRead,
  markAllNotificationsRead,
} from "@/lib/db";

export async function GET() {
  const session = await getSession();
  if (!requireRole(session, ["auditor", "admin"])) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  return NextResponse.json({ notifications: await getNotifications() });
}

export async function PATCH(req: NextRequest) {
  const session = await getSession();
  if (!requireRole(session, ["auditor", "admin"])) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const body = await req.json();
  if (body.all) {
    await markAllNotificationsRead();
  } else if (body.id) {
    await markNotificationRead(body.id);
  }
  return NextResponse.json({ ok: true });
}
