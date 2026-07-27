"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { getSheetData, updateSheetRow, deleteSheetRow } from "../register";

function getInitialRoot(): { username: string } | null {
  if (typeof window === "undefined") return null;
  const saved = localStorage.getItem("currentRoot");
  if (!saved) return null;
  try {
    return JSON.parse(saved);
  } catch {
    return null;
  }
}

function escapeCsv(value: unknown): string {
  const text = value === null || value === undefined ? "" : String(value);
  if (text.includes(",") || text.includes('"') || text.includes("\n")) {
    return `"${text.replace(/"/g, '""')}"`;
  }
  return text;
}

export default function SheetPage() {
  const router = useRouter();
  const [rootData, setRootData] = useState<{ username: string } | null>(null);
  const [password, setPassword] = useState("");
  const [tables, setTables] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState<{ table: string; rowid: number; values: Record<string, string>; original: Record<string, any> } | null>(null);

  useEffect(() => {
    const saved = getInitialRoot();
    if (!saved) {
      router.push("/root-login");
      return;
    }
    setRootData(saved);
  }, [router]);

  const handleLoad = async () => {
    if (!rootData) return;
    setLoading(true);
    setError("");
    setEditing(null);
    const result = await getSheetData(rootData.username, password);
    if (result.success) {
      setTables(result.tables || []);
    } else {
      setError(result.message || "❌ ไม่สามารถดึงข้อมูลได้");
    }
    setLoading(false);
  };

  const startEditRow = (tableName: string, columns: string[], row: any) => {
    const values: Record<string, string> = {};
    const original: Record<string, any> = {};
    for (const col of columns) {
      const value = row[col];
      original[col] = value;
      if (value === null || value === undefined) {
        values[col] = "";
      } else if (typeof value === "object") {
        values[col] = JSON.stringify(value);
      } else {
        values[col] = String(value);
      }
    }
    setEditing({ table: tableName, rowid: row._rowid_, values, original });
  };

  const handleUpdateCell = (col: string, value: string) => {
    if (!editing) return;
    setEditing({ ...editing, values: { ...editing.values, [col]: value } });
  };

  const handleSaveEdit = async () => {
    if (!editing || !rootData) return;
    setLoading(true);
    const payload: Record<string, any> = {};
    for (const col of Object.keys(editing.values)) {
      const raw = editing.values[col];
      payload[col] = raw === "" && editing.original[col] == null ? null : raw;
    }
    const result = await updateSheetRow(editing.table, editing.rowid, payload, rootData.username, password);
    if (result.success) {
      setError("");
      setEditing(null);
      await handleLoad();
    } else {
      setError(result.message || "❌ ไม่สามารถอัปเดตข้อมูลได้");
    }
    setLoading(false);
  };

  const handleDeleteRow = async (table: string, rowid: number) => {
    if (!rootData) return;
    if (!confirm(`ยืนยันการลบแถว #${rowid} จากตาราง ${table}?`)) return;
    setLoading(true);
    const result = await deleteSheetRow(table, rowid, rootData.username, password);
    if (result.success) {
      setError("");
      setEditing(null);
      await handleLoad();
    } else {
      setError(result.message || "❌ ไม่สามารถลบข้อมูลได้");
    }
    setLoading(false);
  };

  const cancelEdit = () => setEditing(null);

  const filteredTables = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return tables;
    return tables
      .map((table) => ({
        ...table,
        rows: table.rows.filter((row: any) =>
          table.columns.some((col: string) => {
            const value = row[col];
            if (value === null || value === undefined) return false;
            const text = typeof value === "object" ? JSON.stringify(value) : String(value);
            return text.toLowerCase().includes(term);
          })
        ),
      }))
      .filter((table) => table.rows.length > 0 || table.name.toLowerCase().includes(term));
  }, [tables, search]);

  const downloadCsv = (table: any) => {
    const lines = [table.columns.map(escapeCsv).join(",")];
    for (const row of table.rows) {
      lines.push(table.columns.map((col: string) => escapeCsv(row[col])).join(","));
    }
    const blob = new Blob(["\uFEFF" + lines.join("\n")], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `${table.name}.csv`;
    link.click();
    URL.revokeObjectURL(link.href);
  };

  if (!rootData) {
    return (
      <div className="min-h-screen bg-zinc-950 text-zinc-300 flex items-center justify-center">
        <div className="text-center animate-pulse">🔒 ตรวจสอบสิทธิ์ Root...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-200 p-4 sm:p-6 font-sans">
      <div className="max-w-[1600px] mx-auto space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/[0.06] pb-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-amber-400">🗂️ ข้อมูลทุกตาราง (Root only)</h1>
            <p className="text-xs text-zinc-500 mt-1">ดูข้อมูลทั้งหมดในฐานข้อมูลแบบ sheet (เข้าถึงได้เฉพาะผู้ดูแลสูงสุด)</p>
          </div>
          <button
            onClick={() => router.push("/root-dashboard")}
            className="text-xs px-3 py-2 rounded-lg bg-white/[0.05] border border-white/[0.08] hover:bg-white/[0.08] transition"
          >
            ← กลับหน้า Root
          </button>
        </div>

        {tables.length === 0 ? (
          <div className="max-w-md mx-auto p-6 bg-zinc-900/40 border border-white/[0.06] rounded-2xl space-y-4">
            <div className="text-sm text-zinc-300">กรุณายืนยันรหัสผ่าน Root อีกครั้งเพื่อดูข้อมูล</div>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="รหัสผ่าน Root"
              className="w-full h-10 px-4 rounded-lg bg-zinc-950 border border-white/[0.08] text-sm text-zinc-200 focus:border-amber-400 focus:outline-none"
            />
            {error && <p className="text-xs text-red-400">{error}</p>}
            <button
              onClick={handleLoad}
              disabled={loading || !password}
              className="w-full h-10 rounded-lg bg-amber-500/20 text-amber-300 border border-amber-500/30 text-sm font-medium hover:bg-amber-500/30 transition disabled:opacity-50"
            >
              {loading ? "กำลังโหลด..." : "ดูข้อมูลทุกตาราง"}
            </button>
          </div>
        ) : (
          <div className="space-y-8">
            <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="🔍 ค้นหาข้อมูลในทุกตาราง..."
                className="w-full sm:w-96 h-10 px-4 rounded-lg bg-zinc-950 border border-white/[0.08] text-sm text-zinc-200 focus:border-amber-400 focus:outline-none"
              />
              <button
                onClick={() => setTables([])}
                className="text-xs px-3 py-2 rounded-lg bg-red-500/10 text-red-300 border border-red-500/20 hover:bg-red-500/20 transition"
              >
                ล้างข้อมูล / ล็อกเอาต์จากหน้านี้
              </button>
            </div>

            {error && <p className="text-xs text-red-400">{error}</p>}
            {filteredTables.map((table) => (
              <div
                key={table.name}
                className="border border-white/[0.06] rounded-2xl overflow-hidden bg-zinc-900/30"
              >
                <div className="p-4 bg-white/[0.02] border-b border-white/[0.06] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h2 className="text-sm font-bold text-zinc-200">{table.name}</h2>
                    <span className="text-[10px] text-zinc-500">{table.rows.length} แถว · {table.columns.length} คอลัมน์</span>
                  </div>
                  <button
                    onClick={() => downloadCsv(table)}
                    className="text-[11px] px-3 py-1.5 rounded-md bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 hover:bg-emerald-500/20 transition"
                  >
                    ⬇️ ดาวน์โหลด CSV
                  </button>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-[11px] text-left">
                    <thead className="bg-zinc-950/60 text-zinc-400 border-b border-white/[0.06]">
                      <tr>
                        {table.columns.map((col: string) => (
                          <th key={col} className="px-4 py-3 font-medium whitespace-nowrap border-r border-white/[0.04] last:border-r-0">
                            {col}
                          </th>
                        ))}
                        <th className="px-4 py-3 font-medium whitespace-nowrap text-center border-l border-white/[0.06]">จัดการ</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/[0.04] text-zinc-300">
                      {table.rows.length === 0 ? (
                        <tr>
                          <td colSpan={table.columns.length + 1} className="text-center py-8 text-zinc-600">
                            ไม่มีข้อมูล
                          </td>
                        </tr>
                      ) : (
                        table.rows.map((row: any, idx: number) => {
                          const isEditing = editing?.table === table.name && editing?.rowid === row._rowid_;
                          return (
                            <tr key={row._rowid_ ?? idx} className={isEditing ? "bg-amber-500/5" : "hover:bg-white/[0.02]"}>
                              {table.columns.map((col: string) => {
                                const value = row[col];
                                const display = value === null || value === undefined ? "-" : typeof value === "object" ? JSON.stringify(value) : String(value);
                                return (
                                  <td key={col} className="px-4 py-2 whitespace-nowrap border-r border-white/[0.03] last:border-r-0">
                                    {isEditing ? (
                                      <input
                                        type="text"
                                        value={editing!.values[col] ?? ""}
                                        onChange={(e) => handleUpdateCell(col, e.target.value)}
                                        className="w-full min-w-[80px] h-7 px-2 rounded bg-zinc-950 border border-white/[0.08] text-zinc-200 text-[11px] focus:border-amber-400 focus:outline-none"
                                      />
                                    ) : (
                                      display
                                    )}
                                  </td>
                                );
                              })}
                              <td className="px-4 py-2 whitespace-nowrap text-center border-l border-white/[0.06]">
                                {isEditing ? (
                                  <div className="flex items-center justify-center gap-2">
                                    <button
                                      onClick={handleSaveEdit}
                                      disabled={loading}
                                      className="px-2 py-1 rounded bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 hover:bg-emerald-500/20 transition text-[10px] disabled:opacity-50"
                                    >
                                      บันทึก
                                    </button>
                                    <button
                                      onClick={cancelEdit}
                                      disabled={loading}
                                      className="px-2 py-1 rounded bg-zinc-800 text-zinc-300 border border-white/[0.08] hover:bg-zinc-700 transition text-[10px] disabled:opacity-50"
                                    >
                                      ยกเลิก
                                    </button>
                                  </div>
                                ) : (
                                  <div className="flex items-center justify-center gap-2">
                                    <button
                                      onClick={() => startEditRow(table.name, table.columns, row)}
                                      className="px-2 py-1 rounded bg-amber-500/10 text-amber-300 border border-amber-500/20 hover:bg-amber-500/20 transition text-[10px]"
                                    >
                                      แก้ไข
                                    </button>
                                    <button
                                      onClick={() => handleDeleteRow(table.name, row._rowid_)}
                                      className="px-2 py-1 rounded bg-red-500/10 text-red-300 border border-red-500/20 hover:bg-red-500/20 transition text-[10px]"
                                    >
                                      ลบ
                                    </button>
                                  </div>
                                )}
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}

            {filteredTables.length === 0 && (
              <div className="text-center py-20 text-zinc-600">🔍 ไม่พบข้อมูลที่ตรงกับคำค้นหา</div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
