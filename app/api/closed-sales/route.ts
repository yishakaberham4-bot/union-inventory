import { NextRequest, NextResponse } from "next/server";
import { getSession, requireRole } from "@/lib/auth";
import { promises as fs } from "fs";
import path from "path";

const DATA_DIR = path.join(process.cwd(), "data");
const DATA_FILE = path.join(DATA_DIR, "closed-sales.json");

export type ClosedSaleRecord = {
  id: string;
  date: string;
  department: "restaurant" | "cafe" | "butchery";
  departmentLabel: string;
  cashierId: string;
  cashierName: string;
  departmentTotal: number;
  cashierDeptTotal: number;
  cashierTipTotal: number;
  unpaidSum: number;
  unpaidRows: { name: string; amount: number; phone: string }[];
  zReport: number;
  balance: number;
  closedAt: string;
  closedBy?: string;
  shortageReason?: string;
  responsiblePerson?: string;
};

async function readAll(): Promise<ClosedSaleRecord[]> {
  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
    const raw = await fs.readFile(DATA_FILE, "utf8");
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

async function writeAll(records: ClosedSaleRecord[]) {
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.writeFile(DATA_FILE, JSON.stringify(records, null, 2), "utf8");
}

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!requireRole(session, ["admin", "auditor"])) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const date = searchParams.get("date");
  const department = searchParams.get("department");
  const cashierId = searchParams.get("cashierId");

  let records = await readAll();
  if (date) records = records.filter((r) => r.date === date);
  if (department) records = records.filter((r) => r.department === department);
  if (cashierId) {
    records = records.filter(
      (r) => r.cashierId === cashierId || r.cashierName === cashierId
    );
  }

  records.sort((a, b) => b.closedAt.localeCompare(a.closedAt));
  return NextResponse.json({ records });
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!requireRole(session, ["auditor", "admin"])) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const body = await req.json();
    const {
      date,
      department,
      departmentLabel,
      cashierId,
      cashierName,
      departmentTotal,
      cashierDeptTotal,
      cashierTipTotal,
      unpaidSum,
      unpaidRows,
      zReport,
      balance,
      shortageReason,
      responsiblePerson,
    } = body;

    if (!date || !department || !cashierId) {
      return NextResponse.json(
        { error: "date, department, and cashierId are required" },
        { status: 400 }
      );
    }

    const existing = await readAll();
    const duplicate = existing.some(
      (r) =>
        r.date === date &&
        r.department === department &&
        (r.cashierId === cashierId || r.cashierName === cashierId)
    );
    if (duplicate) {
      return NextResponse.json(
        {
          error:
            "Already submitted today for this department and cashier. Only one submission per day is allowed.",
        },
        { status: 409 }
      );
    }

    if (Number(balance) < 0) {
      if (!String(shortageReason || "").trim() || !String(responsiblePerson || "").trim()) {
        return NextResponse.json(
          {
            error:
              "Balance is negative (shortage). Reason and responsible person are required.",
          },
          { status: 400 }
        );
      }
    }

    const record: ClosedSaleRecord = {
      id: `cs-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      date: String(date),
      department,
      departmentLabel: departmentLabel || department,
      cashierId: String(cashierId),
      cashierName: String(cashierName || ""),
      departmentTotal: Number(departmentTotal) || 0,
      cashierDeptTotal: Number(cashierDeptTotal) || 0,
      cashierTipTotal: Number(cashierTipTotal) || 0,
      unpaidSum: Number(unpaidSum) || 0,
      unpaidRows: Array.isArray(unpaidRows) ? unpaidRows : [],
      zReport: Number(zReport) || 0,
      balance: Number(balance) || 0,
      closedAt: new Date().toISOString(),
      closedBy: session?.fullName || session?.username || "",
      shortageReason:
        Number(balance) < 0 ? String(shortageReason).trim() : undefined,
      responsiblePerson:
        Number(balance) < 0 ? String(responsiblePerson).trim() : undefined,
    };

    existing.push(record);
    await writeAll(existing);

    return NextResponse.json({ record }, { status: 201 });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Failed to save closed sale";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
