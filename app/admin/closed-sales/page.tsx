"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

type UnpaidRow = { name: string; amount: number; phone: string };

type ClosedSaleRecord = {
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
  unpaidRows: UnpaidRow[];
  zReport: number;
  balance: number;
  closedAt: string;
  closedBy?: string;
  shortageReason?: string;
  responsiblePerson?: string;
};

function fmt(n: number) {
  return n.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function todayISO() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export default function AdminClosedSalesPage() {
  const [records, setRecords] = useState<ClosedSaleRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [reportDate, setReportDate] = useState(todayISO());
  const [unpaidDetail, setUnpaidDetail] = useState<ClosedSaleRecord | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/closed-sales?date=${encodeURIComponent(reportDate)}`);
      if (res.ok) {
        const d = await res.json();
        setRecords(d.records || []);
      } else {
        setRecords([]);
      }
    } catch {
      setRecords([]);
    } finally {
      setLoading(false);
    }
  }, [reportDate]);

  useEffect(() => {
    load();
  }, [load]);

  const totals = useMemo(() => {
    return records.reduce(
      (acc, r) => ({
        dept: acc.dept + (r.departmentTotal || 0),
        tips: acc.tips + (r.cashierTipTotal || 0),
        unpaid: acc.unpaid + (r.unpaidSum || 0),
        z: acc.z + (r.zReport || 0),
        balance: acc.balance + (r.balance || 0),
      }),
      { dept: 0, tips: 0, unpaid: 0, z: 0, balance: 0 }
    );
  }, [records]);

  const inputStyle: React.CSSProperties = {
    padding: "10px 12px",
    border: "1px solid #e2e8f0",
    borderRadius: 10,
    fontSize: 14,
    background: "#fff",
  };

  return (
    <div style={{ maxWidth: 1100, margin: "0 auto", padding: "1.5rem" }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          gap: "1rem",
          marginBottom: "1.5rem",
          flexWrap: "wrap",
        }}
      >
        <div>
          <h1 style={{ margin: 0, fontSize: "1.5rem" }}>Closed Sales Report</h1>
          <p style={{ color: "#64748b", margin: "0.35rem 0 0", fontSize: "0.9rem" }}>
            View auditor closings by date. Click Unpaid to see bill details.
          </p>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <label style={{ fontSize: 13, fontWeight: 700, color: "#475569" }}>Date</label>
          <input
            type="date"
            value={reportDate}
            onChange={(e) => setReportDate(e.target.value)}
            style={inputStyle}
          />
          <button
            type="button"
            onClick={load}
            style={{
              padding: "10px 14px",
              borderRadius: 10,
              border: "1px solid #e2e8f0",
              background: "#fff",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Refresh
          </button>
        </div>
      </div>

      {loading ? (
        <p style={{ color: "#94a3b8" }}>Loading…</p>
      ) : records.length === 0 ? (
        <div
          style={{
            padding: "3rem",
            textAlign: "center",
            background: "#fff",
            borderRadius: 16,
            border: "1px solid #e2e8f0",
            color: "#94a3b8",
          }}
        >
          No closed sales for {reportDate}
        </div>
      ) : (
        <>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
              gap: 10,
              marginBottom: "1.25rem",
            }}
          >
            {[
              { label: "Closings", value: String(records.length) },
              { label: "Dept totals", value: fmt(totals.dept) },
              { label: "Tips", value: fmt(totals.tips) },
              { label: "Unpaid", value: fmt(totals.unpaid) },
              { label: "Z Report sum", value: fmt(totals.z) },
              { label: "Balance sum", value: fmt(totals.balance) },
            ].map((s) => (
              <div
                key={s.label}
                style={{
                  background: "#fff",
                  borderRadius: 12,
                  padding: "12px 14px",
                  border: "1px solid #e2e8f0",
                }}
              >
                <div
                  style={{
                    fontSize: 10,
                    fontWeight: 700,
                    color: "#64748b",
                    textTransform: "uppercase",
                    marginBottom: 4,
                  }}
                >
                  {s.label}
                </div>
                <div style={{ fontWeight: 800, fontSize: 16 }}>{s.value}</div>
              </div>
            ))}
          </div>

          <div
            style={{
              background: "#fff",
              borderRadius: 16,
              border: "1px solid #e2e8f0",
              overflow: "hidden",
            }}
          >
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                <thead>
                  <tr style={{ background: "#f0fdfa" }}>
                    {[
                      "Department",
                      "Cashier",
                      "Dept total",
                      "Tips",
                      "Unpaid",
                      "Z Report",
                      "Balance",
                      "Shortage reason",
                      "Responsible",
                      "Closed at",
                      "",
                    ].map((h, idx) => (
                      <th
                        key={h || `a-${idx}`}
                        style={{
                          textAlign: "left",
                          padding: "12px 10px",
                          borderBottom: "2px solid #99f6e4",
                          fontSize: 11,
                          textTransform: "uppercase",
                          color: "#0f766e",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {records.map((r) => (
                    <tr key={r.id}>
                      <td style={{ padding: "12px 10px", borderBottom: "1px solid #e2e8f0", fontWeight: 600 }}>
                        {r.departmentLabel}
                      </td>
                      <td style={{ padding: "12px 10px", borderBottom: "1px solid #e2e8f0" }}>
                        {r.cashierName}
                      </td>
                      <td style={{ padding: "12px 10px", borderBottom: "1px solid #e2e8f0" }}>
                        {fmt(r.departmentTotal)}
                      </td>
                      <td style={{ padding: "12px 10px", borderBottom: "1px solid #e2e8f0" }}>
                        {fmt(r.cashierTipTotal)}
                      </td>
                      <td style={{ padding: "12px 10px", borderBottom: "1px solid #e2e8f0" }}>
                        {fmt(r.unpaidSum)}
                      </td>
                      <td style={{ padding: "12px 10px", borderBottom: "1px solid #e2e8f0" }}>
                        {fmt(r.zReport)}
                      </td>
                      <td
                        style={{
                          padding: "12px 10px",
                          borderBottom: "1px solid #e2e8f0",
                          fontWeight: 800,
                          color:
                            r.balance === 0
                              ? "#059669"
                              : r.balance > 0
                                ? "#0369a1"
                                : "#dc2626",
                        }}
                      >
                        {fmt(r.balance)}
                      </td>
                      <td
                        style={{
                          padding: "12px 10px",
                          borderBottom: "1px solid #e2e8f0",
                          fontSize: 12,
                          maxWidth: 140,
                        }}
                      >
                        {r.shortageReason || "—"}
                      </td>
                      <td style={{ padding: "12px 10px", borderBottom: "1px solid #e2e8f0", fontSize: 12 }}>
                        {r.responsiblePerson || "—"}
                      </td>
                      <td
                        style={{
                          padding: "12px 10px",
                          borderBottom: "1px solid #e2e8f0",
                          whiteSpace: "nowrap",
                          fontSize: 12,
                          color: "#64748b",
                        }}
                      >
                        {new Date(r.closedAt).toLocaleString()}
                      </td>
                      <td style={{ padding: "12px 10px", borderBottom: "1px solid #e2e8f0" }}>
                        {r.unpaidSum > 0 || (r.unpaidRows && r.unpaidRows.length > 0) ? (
                          <button
                            type="button"
                            onClick={() => setUnpaidDetail(r)}
                            style={{
                              background: "#fef2f2",
                              border: "1px solid #fecaca",
                              color: "#b91c1c",
                              borderRadius: 8,
                              padding: "6px 10px",
                              fontWeight: 700,
                              fontSize: 12,
                              cursor: "pointer",
                              whiteSpace: "nowrap",
                            }}
                          >
                            Unpaid
                          </button>
                        ) : (
                          <span style={{ color: "#94a3b8", fontSize: 12 }}>—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {unpaidDetail && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(15, 23, 42, 0.5)",
            zIndex: 100,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "1.5rem",
          }}
          onClick={() => setUnpaidDetail(null)}
        >
          <div
            style={{
              background: "#fff",
              borderRadius: 16,
              maxWidth: 560,
              width: "100%",
              padding: "1.5rem",
              boxShadow: "0 20px 50px rgba(0,0,0,0.25)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "1rem",
              }}
            >
              <h2 style={{ margin: 0, fontSize: "1.15rem" }}>
                Unpaid details — {unpaidDetail.departmentLabel}
              </h2>
              <button
                type="button"
                onClick={() => setUnpaidDetail(null)}
                style={{
                  background: "#f1f5f9",
                  border: "none",
                  borderRadius: 8,
                  padding: "6px 12px",
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                Close
              </button>
            </div>
            <p style={{ margin: "0 0 1rem", fontSize: 13, color: "#64748b" }}>
              Cashier: <strong>{unpaidDetail.cashierName}</strong> · Date:{" "}
              <strong>{unpaidDetail.date}</strong>
            </p>
            {!unpaidDetail.unpaidRows || unpaidDetail.unpaidRows.length === 0 ? (
              <p style={{ color: "#94a3b8" }}>
                No line items recorded. Unpaid sum: {fmt(unpaidDetail.unpaidSum)} ETB
              </p>
            ) : (
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
                <thead>
                  <tr style={{ background: "#fef2f2" }}>
                    {["Name", "Bill amount", "Phone"].map((h) => (
                      <th
                        key={h}
                        style={{
                          textAlign: "left",
                          padding: "10px 12px",
                          borderBottom: "2px solid #fecaca",
                          fontSize: 11,
                          textTransform: "uppercase",
                          color: "#991b1b",
                        }}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {unpaidDetail.unpaidRows.map((u, i) => (
                    <tr key={i}>
                      <td style={{ padding: "10px 12px", borderBottom: "1px solid #fee2e2" }}>
                        {u.name || "—"}
                      </td>
                      <td
                        style={{
                          padding: "10px 12px",
                          borderBottom: "1px solid #fee2e2",
                          fontWeight: 600,
                        }}
                      >
                        {fmt(u.amount)} ETB
                      </td>
                      <td style={{ padding: "10px 12px", borderBottom: "1px solid #fee2e2" }}>
                        {u.phone || "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr>
                    <td
                      style={{
                        padding: "12px",
                        fontWeight: 800,
                        borderTop: "2px solid #fecaca",
                      }}
                    >
                      Sum of unpaid
                    </td>
                    <td
                      colSpan={2}
                      style={{
                        padding: "12px",
                        fontWeight: 800,
                        color: "#b91c1c",
                        borderTop: "2px solid #fecaca",
                      }}
                    >
                      {fmt(unpaidDetail.unpaidSum)} ETB
                    </td>
                  </tr>
                </tfoot>
              </table>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
