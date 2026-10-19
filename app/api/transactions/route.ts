import { NextRequest, NextResponse } from "next/server";
import { getSession, requireRole } from "@/lib/auth";
import {
  getTransactions,
  createTransaction,
  getTransactionByFt,
  deleteTransaction,
} from "@/lib/db";

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!requireRole(session, ["admin", "auditor", "cashier"])) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const { searchParams } = new URL(req.url);
  const ft = searchParams.get("ft");
  if (ft) {
    const existing = await getTransactionByFt(ft);
    return NextResponse.json({
      exists: !!existing,
      transaction: existing || null,
    });
  }
  let txs = await getTransactions();
  const from = searchParams.get("from");
  const to = searchParams.get("to");
  const cashierId = searchParams.get("cashierId");
  if (from) txs = txs.filter((t) => t.createdAt >= from);
  if (to) txs = txs.filter((t) => t.createdAt <= to + "T23:59:59");
  if (cashierId) txs = txs.filter((t) => t.cashierId === cashierId);
  return NextResponse.json({ transactions: txs });
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!requireRole(session, ["cashier"])) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  try {
    const body = await req.json();
    const {
      ftNumber,
      totalAmount,
      restaurantAmount,
      cafeAmount,
      butcheryAmount,
      tip,
      senderName,
      receiverName,
      imageData,
      tableNumber,
      waiterId,
      waiterName,
    } = body;

    if (totalAmount == null || totalAmount === "") {
      return NextResponse.json(
        { error: "Total amount is required" },
        { status: 400 }
      );
    }
    if (!tableNumber || !String(tableNumber).trim()) {
      return NextResponse.json(
        { error: "Table number is required" },
        { status: 400 }
      );
    }
    if (!waiterId && !waiterName) {
      return NextResponse.json(
        { error: "Waiter is required" },
        { status: 400 }
      );
    }

    const r = Number(restaurantAmount) || 0;
    const c = Number(cafeAmount) || 0;
    const b = Number(butcheryAmount) || 0;
    const t = Number(tip) || 0;
    const total = Number(totalAmount);

    if (Math.abs(r + c + b + t - total) > 0.01) {
      return NextResponse.json(
        {
          error: `Sum of restaurant + cafe + butchery + tip (${(r + c + b + t).toFixed(2)}) must equal scanned amount (${total.toFixed(2)})`,
        },
        { status: 400 }
      );
    }

    // FT / transaction number is optional — auto-generate if missing
    let finalFt = String(ftNumber || "").trim();
    if (!finalFt) {
      finalFt = `TXN-${Date.now()}`;
    } else if (await getTransactionByFt(finalFt)) {
      return NextResponse.json(
        { error: "This transaction / FT number already exists in the system" },
        { status: 409 }
      );
    }

    let safeImage: string | undefined = imageData || undefined;
    if (safeImage && safeImage.length > 1_500_000) {
      safeImage = undefined;
    }

    const tx = await createTransaction({
      ftNumber: finalFt,
      totalAmount: total,
      restaurantAmount: r,
      cafeAmount: c,
      butcheryAmount: b,
      tip: t,
      senderName: senderName || "",
      receiverName: receiverName || "",
      imageData: safeImage,
      cashierId: session!.id,
      cashierName: session!.fullName,
      tableNumber: String(tableNumber).trim(),
      waiterId: waiterId ? String(waiterId) : "",
      waiterName: waiterName ? String(waiterName) : "",
    });

    return NextResponse.json({ transaction: tx }, { status: 201 });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Failed to create transaction";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}

export async function DELETE(req: NextRequest) {
  const session = await getSession();
  if (!requireRole(session, ["admin"])) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) {
      return NextResponse.json({ error: "Transaction id required" }, { status: 400 });
    }
    await deleteTransaction(id);
    return NextResponse.json({ ok: true });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Failed to delete transaction";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
