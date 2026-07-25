"use client";

import { useEffect, useState } from "react";
import Modal from "./Modal";

interface GangEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  gang: any;
  onSave: (data: any) => void;
  loading?: boolean;
  actor?: string;
}

const statusOptions = ["pending", "approved", "disbanded", "พัก", "รอยุบ"];
const typeOptions = ["Gang", "Gangs-LD", "Family"];

export default function GangEditModal({ isOpen, onClose, gang, onSave, loading, actor }: GangEditModalProps) {
  const [form, setForm] = useState<any>({});
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (gang) {
      setForm({ ...gang });
    } else {
      setForm({});
    }
    setShowPassword(false);
  }, [gang]);

  const update = (key: string, value: any) => {
    setForm((prev: any) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(form);
  };

  if (!gang) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`✏️ แก้ไขข้อมูลแก๊ง ${form.fullName || ""}`}
      className="max-w-4xl max-h-[90vh] overflow-y-auto"
    >
      <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
        <div className="flex flex-col gap-1">
          <span className="text-zinc-500 uppercase tracking-wider">รหัสแก๊ง</span>
          <span className="text-zinc-200 font-mono py-2">#{form.id}</span>
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-zinc-500 uppercase tracking-wider">ชื่อเต็ม</label>
          <input
            type="text"
            value={form.fullName || ""}
            onChange={(e) => update("fullName", e.target.value)}
            className="w-full h-9 px-3 rounded-lg bg-zinc-950 border border-white/10 text-zinc-200 focus:border-blue-400 focus:outline-none"
            required
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-zinc-500 uppercase tracking-wider">ชื่อย่อ</label>
          <input
            type="text"
            value={form.abbreviation || ""}
            onChange={(e) => update("abbreviation", e.target.value)}
            className="w-full h-9 px-3 rounded-lg bg-zinc-950 border border-white/10 text-zinc-200 focus:border-blue-400 focus:outline-none font-mono"
            required
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-zinc-500 uppercase tracking-wider">ประเภท</label>
          <select
            value={form.type || "Gang"}
            onChange={(e) => update("type", e.target.value)}
            className="w-full h-9 px-3 rounded-lg bg-zinc-950 border border-white/10 text-zinc-200 focus:border-blue-400 focus:outline-none"
          >
            {typeOptions.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-zinc-500 uppercase tracking-wider">สีแก๊ง</label>
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={form.colorTheme || "#3b82f6"}
              onChange={(e) => update("colorTheme", e.target.value)}
              className="w-10 h-9 rounded bg-transparent border border-white/10 cursor-pointer"
            />
            <input
              type="text"
              value={form.colorTheme || "#3b82f6"}
              onChange={(e) => update("colorTheme", e.target.value)}
              className="flex-1 h-9 px-3 rounded-lg bg-zinc-950 border border-white/10 text-zinc-200 focus:border-blue-400 focus:outline-none font-mono"
            />
          </div>
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-zinc-500 uppercase tracking-wider">สถานะ</label>
          <select
            value={form.status || "pending"}
            onChange={(e) => update("status", e.target.value)}
            className="w-full h-9 px-3 rounded-lg bg-zinc-950 border border-white/10 text-zinc-200 focus:border-blue-400 focus:outline-none"
          >
            {statusOptions.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-zinc-500 uppercase tracking-wider">หัวหน้าแก๊ง</label>
          <input
            type="text"
            value={form.leader || ""}
            onChange={(e) => update("leader", e.target.value)}
            className="w-full h-9 px-3 rounded-lg bg-zinc-950 border border-white/10 text-zinc-200 focus:border-blue-400 focus:outline-none"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-zinc-500 uppercase tracking-wider">Discord หัวหน้าแก๊ง</label>
          <input
            type="text"
            value={form.leaderDiscord || ""}
            onChange={(e) => update("leaderDiscord", e.target.value)}
            className="w-full h-9 px-3 rounded-lg bg-zinc-950 border border-white/10 text-zinc-200 focus:border-blue-400 focus:outline-none font-mono"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-zinc-500 uppercase tracking-wider">โทรศัพท์หัวหน้าแก๊ง</label>
          <input
            type="text"
            value={form.leaderPhone || ""}
            onChange={(e) => update("leaderPhone", e.target.value)}
            className="w-full h-9 px-3 rounded-lg bg-zinc-950 border border-white/10 text-zinc-200 focus:border-blue-400 focus:outline-none"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-zinc-500 uppercase tracking-wider">รองหัวหน้า 1</label>
          <input
            type="text"
            value={form.coLeader1 || ""}
            onChange={(e) => update("coLeader1", e.target.value)}
            className="w-full h-9 px-3 rounded-lg bg-zinc-950 border border-white/10 text-zinc-200 focus:border-blue-400 focus:outline-none"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-zinc-500 uppercase tracking-wider">Discord รองหัวหน้า 1</label>
          <input
            type="text"
            value={form.coLeader1Discord || ""}
            onChange={(e) => update("coLeader1Discord", e.target.value)}
            className="w-full h-9 px-3 rounded-lg bg-zinc-950 border border-white/10 text-zinc-200 focus:border-blue-400 focus:outline-none font-mono"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-zinc-500 uppercase tracking-wider">โทรศัพท์รองหัวหน้า 1</label>
          <input
            type="text"
            value={form.coLeader1Phone || ""}
            onChange={(e) => update("coLeader1Phone", e.target.value)}
            className="w-full h-9 px-3 rounded-lg bg-zinc-950 border border-white/10 text-zinc-200 focus:border-blue-400 focus:outline-none"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-zinc-500 uppercase tracking-wider">รองหัวหน้า 2</label>
          <input
            type="text"
            value={form.coLeader2 || ""}
            onChange={(e) => update("coLeader2", e.target.value)}
            className="w-full h-9 px-3 rounded-lg bg-zinc-950 border border-white/10 text-zinc-200 focus:border-blue-400 focus:outline-none"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-zinc-500 uppercase tracking-wider">Discord รองหัวหน้า 2</label>
          <input
            type="text"
            value={form.coLeader2Discord || ""}
            onChange={(e) => update("coLeader2Discord", e.target.value)}
            className="w-full h-9 px-3 rounded-lg bg-zinc-950 border border-white/10 text-zinc-200 focus:border-blue-400 focus:outline-none font-mono"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-zinc-500 uppercase tracking-wider">โทรศัพท์รองหัวหน้า 2</label>
          <input
            type="text"
            value={form.coLeader2Phone || ""}
            onChange={(e) => update("coLeader2Phone", e.target.value)}
            className="w-full h-9 px-3 rounded-lg bg-zinc-950 border border-white/10 text-zinc-200 focus:border-blue-400 focus:outline-none"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-zinc-500 uppercase tracking-wider">ผู้อนุมัติ</label>
          <input
            type="text"
            value={form.approver || ""}
            onChange={(e) => update("approver", e.target.value)}
            className="w-full h-9 px-3 rounded-lg bg-zinc-950 border border-white/10 text-zinc-200 focus:border-blue-400 focus:outline-none"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-zinc-500 uppercase tracking-wider">รหัสผ่าน</label>
          <div className="flex gap-2">
            <input
              type={showPassword ? "text" : "password"}
              value={form.password || ""}
              onChange={(e) => update("password", e.target.value)}
              className="flex-1 h-9 px-3 rounded-lg bg-zinc-950 border border-white/10 text-zinc-200 focus:border-blue-400 focus:outline-none font-mono"
            />
            <button
              type="button"
              onClick={() => setShowPassword((p) => !p)}
              className="px-3 rounded-lg bg-zinc-800 text-zinc-300 border border-white/10 hover:bg-zinc-700 transition"
            >
              {showPassword ? "🙈" : "👁️"}
            </button>
          </div>
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-zinc-500 uppercase tracking-wider">วันที่สร้าง</label>
          <span className="text-zinc-200 py-2">{form.createdAt ? new Date(form.createdAt).toLocaleString("th-TH") : "-"}</span>
        </div>

        <div className="sm:col-span-2 flex flex-col gap-1">
          <label className="text-zinc-500 uppercase tracking-wider">โลโก้แก๊ง (URL)</label>
          <input
            type="url"
            value={form.logoUrl || ""}
            onChange={(e) => update("logoUrl", e.target.value)}
            className="w-full h-9 px-3 rounded-lg bg-zinc-950 border border-white/10 text-zinc-200 focus:border-blue-400 focus:outline-none"
          />
          {form.logoUrl && (
            <a href={form.logoUrl} target="_blank" rel="noreferrer" className="text-blue-400 hover:underline break-all">{form.logoUrl}</a>
          )}
        </div>

        <div className="sm:col-span-2 flex flex-col gap-1">
          <label className="text-zinc-500 uppercase tracking-wider">เหตุผลแก้ไขล่าสุด / หมายเหตุ</label>
          <input
            type="text"
            value={form.editReason || ""}
            onChange={(e) => update("editReason", e.target.value)}
            className="w-full h-9 px-3 rounded-lg bg-zinc-950 border border-white/10 text-zinc-200 focus:border-blue-400 focus:outline-none"
          />
        </div>

        {actor && (
          <div className="sm:col-span-2 text-[10px] text-zinc-500">
            แก้ไขโดย: {actor}
          </div>
        )}

        <div className="sm:col-span-2 flex justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-zinc-800 text-zinc-300 border border-white/10 hover:bg-zinc-700 text-xs font-medium transition-all"
          >
            ยกเลิก
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 rounded-lg bg-blue-600 text-white border border-blue-500/30 hover:bg-blue-500 text-xs font-medium transition-all disabled:opacity-50"
          >
            {loading ? "กำลังบันทึก..." : "💾 บันทึกการแก้ไข"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
