import { NextRequest, NextResponse } from "next/server";
import { getSession, requireRole } from "@/lib/auth";
import { getUsers, getUsersByRole, createUser, updateUser } from "@/lib/db";
import type { Role } from "@/lib/types";

export async function GET(req: NextRequest) {
  const session = await getSession();
  const { searchParams } = new URL(req.url);
  const role = searchParams.get("role") as Role | null;

  // Cashiers need the waiter list for the dropdown
  if (role === "waiter" && requireRole(session, ["cashier", "admin"])) {
    const waiters = await getUsersByRole("waiter");
    return NextResponse.json({
      users: waiters.map(({ passwordHash, ...u }) => u),
    });
  }

  if (!requireRole(session, ["admin"])) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const users = (await getUsers()).map(({ passwordHash, ...u }) => u);
  return NextResponse.json({ users });
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!requireRole(session, ["admin"])) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  try {
    const body = await req.json();
    const { username, password, fullName, role } = body;
    if (!username || !password || !fullName || !role) {
      return NextResponse.json(
        { error: "All fields required" },
        { status: 400 }
      );
    }
    if (!["admin", "auditor", "cashier", "waiter"].includes(role)) {
      return NextResponse.json({ error: "Invalid role" }, { status: 400 });
    }
    const user = await createUser({ username, password, fullName, role });
    const { passwordHash, ...safe } = user;
    return NextResponse.json({ user: safe }, { status: 201 });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Failed to create user";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}

export async function PATCH(req: NextRequest) {
  const session = await getSession();
  if (!requireRole(session, ["admin"])) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  try {
    const body = await req.json();
    const { id, ...data } = body;
    if (!id) {
      return NextResponse.json({ error: "User id required" }, { status: 400 });
    }
    if (data.role && !["admin", "auditor", "cashier", "waiter"].includes(data.role)) {
      return NextResponse.json({ error: "Invalid role" }, { status: 400 });
    }
    const user = await updateUser(id, data);
    const { passwordHash, ...safe } = user;
    return NextResponse.json({ user: safe });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Failed to update user";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
