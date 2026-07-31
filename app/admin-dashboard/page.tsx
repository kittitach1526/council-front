"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  getAllWelfareRequests,
  updateWelfareStatus,
  getAllUniformFiles,
  updateUniformStatus,
  getLeaveRequests,
  getAllGangs,
} from "../register";
import { useStatusModal } from "../components/StatusModalProvider";

type AdminData = {
  id: number;
  name: string;
  username: string;
  status: string;
  createdAt: string;
};

type WelfareRequest = {
  id: number;
  gangName: string;
  gangAbbreviation: string;
  requestName: string;
  discordId: string;
  welfareItem: string;
  requestType?: string;
  status: string;
  createdAt: string;
  details?: any;
  hasWelfare?: boolean;
  activeWelfareItems?: any[];
};

type UniformFile = {
  id: number;
  gangName: string;
  uniformType: string;
  fileUrl: string;
  approver: string;
  approverDiscord: string;
  reason: string | null;
  status: string;
  createdAt: string;
  details?: any;
};

const parseDetails = (raw: any) => {
  if (!raw) return {};
  if (typeof raw === "object") return raw;
  try { return JSON.parse(raw); } catch { return {}; }
};

export default function AdminDashboard() {
  const router = useRouter();
  const showStatus = useStatusModal();
  const [adminData, setAdminData] = useState<AdminData | null>(null);
  const currentActor = adminData?.name || adminData?.username || "แอดมิน";
  const currentActorRole = "admin";
  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab] = useState<"outfit" | "welfare">("outfit");
  const [loading, setLoading] = useState(false);
  const [welfareRequests, setWelfareRequests] = useState<WelfareRequest[]>([]);
  const [uniformFiles, setUniformFiles] = useState<UniformFile[]>([]);
  const [leaveRequests, setLeaveRequests] = useState<WelfareRequest[]>([]);
  const [gangs, setGangs] = useState<any[]>([]);
  const [selectedGang, setSelectedGang] = useState<string>("ทั้งหมด");
  const [selectedOutfitGang, setSelectedOutfitGang] = useState<string>("");
  const [selectedLeaveGang, setSelectedLeaveGang] = useState<string>("ทั้งหมด");
  const [uniformStatusFilter, setUniformStatusFilter] = useState<"all" | "pending" | "completed">("all");
  const [uniformPage, setUniformPage] = useState(1);
  const UNIFORM_PER_PAGE = 10;

  const filteredWelfareRequests = useMemo(() => {
    const active = welfareRequests.filter((r) => r.status === "รับไปแล้ว" || r.status === "รอเอาออก");
    if (selectedGang === "ทั้งหมด") return active;
    return active.filter((r) => r.gangAbbreviation === selectedGang);
  }, [welfareRequests, selectedGang]);

  const groupedWelfareRequests = useMemo(() => {
    const getHolderKey = (req: WelfareRequest) => {
      const details = parseDetails(req.details);
      const isTrade = req.requestType === "trade";
      const name = isTrade
        ? details.tradeHolderName || req.requestName || "-"
        : details.receiverName || req.requestName || "-";
      const discord = isTrade
        ? details.tradeHolderDiscord || req.discordId || "-"
        : details.receiverDiscord || req.discordId || "-";
      return `${name}|${discord}`;
    };
    const map = new Map<string, WelfareRequest[]>();
    for (const req of filteredWelfareRequests) {
      const key = getHolderKey(req);
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(req);
    }
    return Array.from(map.values());
  }, [filteredWelfareRequests]);

  const gangOptions = useMemo(() => {
    return ["ทั้งหมด", ...Array.from(new Set(welfareRequests.map((r) => r.gangAbbreviation).filter(Boolean)))];
  }, [welfareRequests]);

  const gangByAbbr = useMemo(() => {
    const map = new Map<string, string>();
    for (const r of welfareRequests) {
      if (r.gangAbbreviation && r.gangName) map.set(r.gangAbbreviation, r.gangName);
    }
    return map;
  }, [welfareRequests]);

  const sortedUniformFiles = useMemo(() => {
    return [...uniformFiles].sort((a, b) => b.id - a.id);
  }, [uniformFiles]);

  const filteredUniformFiles = useMemo(() => {
    if (uniformStatusFilter === "pending") {
      return sortedUniformFiles.filter((f) => f.status === "รอลง");
    }
    if (uniformStatusFilter === "completed") {
      return sortedUniformFiles.filter((f) => f.status === "ลงแล้ว");
    }
    return sortedUniformFiles;
  }, [sortedUniformFiles, uniformStatusFilter]);

  const uniformTotalPages = useMemo(
    () => Math.max(1, Math.ceil(filteredUniformFiles.length / UNIFORM_PER_PAGE)),
    [filteredUniformFiles.length]
  );

  const pagedUniformFiles = useMemo(() => {
    const start = (uniformPage - 1) * UNIFORM_PER_PAGE;
    return filteredUniformFiles.slice(start, start + UNIFORM_PER_PAGE);
  }, [filteredUniformFiles, uniformPage]);

  useEffect(() => {
    setUniformPage(1);
  }, [uniformStatusFilter]);

  const approvedGangNames = useMemo(() => {
    return Array.from(new Set(gangs.filter((g) => g.status === "approved").map((g) => g.fullName).filter(Boolean)));
  }, [gangs]);

  const gangTypeByName = useMemo(() => {
    const map: Record<string, string> = {};
    for (const g of gangs) {
      if (g.fullName) map[g.fullName] = g.type || "Gang";
    }
    return map;
  }, [gangs]);

  const outfitGangOptions = approvedGangNames;

  const perGangUniformFiles = useMemo(() => {
    if (!selectedOutfitGang) return [];
    return sortedUniformFiles.filter((f) => f.gangName === selectedOutfitGang);
  }, [sortedUniformFiles, selectedOutfitGang]);

  const filteredLeaveRequests = useMemo(() => {
    if (selectedLeaveGang === "ทั้งหมด") return leaveRequests;
    return leaveRequests.filter((r) => r.gangAbbreviation === selectedLeaveGang);
  }, [leaveRequests, selectedLeaveGang]);

  const leaveGangOptions = useMemo(() => {
    return ["ทั้งหมด", ...Array.from(new Set(leaveRequests.map((r) => r.gangAbbreviation).filter(Boolean)))];
  }, [leaveRequests]);

  useEffect(() => {
    setMounted(true);
    const saved = localStorage.getItem("currentAdmin");
    if (saved) {
      try {
        setAdminData(JSON.parse(saved) as AdminData);
      } catch {
        setAdminData(null);
      }
    }
  }, []);

  useEffect(() => {
    if (mounted && !adminData) {
      showStatus({ type: "error", message: "🔒 กรุณาเข้าสู่ระบบด้วยบัญชีผู้ดูแลระบบก่อน" });
      router.push("/admin-login");
    }
  }, [mounted, adminData, router]);

  useEffect(() => {
    if (approvedGangNames.length > 0 && !selectedOutfitGang) {
      setSelectedOutfitGang(approvedGangNames[0]);
    }
  }, [approvedGangNames, selectedOutfitGang]);

  useEffect(() => {
    if (!adminData) return;

    const fetchData = async () => {
      setLoading(true);
      try {
        if (activeTab === "welfare") {
          const welfareResult = await getAllWelfareRequests();
          setWelfareRequests(welfareResult.success ? welfareResult.requests || [] : []);
        }

        if (activeTab === "outfit") {
          const [uniformResult, gangsResult] = await Promise.all([getAllUniformFiles(), getAllGangs()]);
          setUniformFiles(uniformResult.success ? uniformResult.files || [] : []);
          setGangs(gangsResult.success ? gangsResult.gangs || [] : []);
        }

      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [activeTab, adminData]);

  const handleLogout = () => {
    localStorage.removeItem("currentAdmin");
    router.push("/");
  };

  const translateWelfareItem = (item: string) => {
    switch (item) {
      case "car":
        return "🚗 กล่องยานพาหนะกองกำลัง";
      case "money":
        return "💰 ทุนสนับสนุนสภา (500,000 Roll)";
      case "weapon":
        return "📦 คลังอาวุธยุทธภัณฑ์ (War Box)";
      default:
        return item;
    }
  };

  const handleWelfareAction = async (id: number, status: "รับไปแล้ว" | "เอาออกแล้ว" | "เอาสวัสดิการออกแล้ว") => {
    try {
      const result = await updateWelfareStatus(id, status, currentActor, currentActorRole);
      if (result.success) {
        showStatus({ type: "success", message: result.message });
        setWelfareRequests((prev) =>
          prev.map((req) => (req.id === id ? { ...req, status } : req))
        );
      } else {
        showStatus({ type: "error", message: result.message });
      }
    } catch (error) {
      console.error(error);
      showStatus({ type: "error", message: "❌ ไม่สามารถอัปเดตสถานะสวัสดิการได้" });
    }
  };

  const handleRemoveGroup = async (ids: number[]) => {
    try {
      for (const id of ids) {
        const result = await updateWelfareStatus(id, "เอาสวัสดิการออกแล้ว", currentActor, currentActorRole);
        if (!result.success) {
          showStatus({ type: "error", message: result.message });
          return;
        }
      }
      showStatus({ type: "success", message: "เอาสวัสดิการออกจากรายชื่อนี้แล้ว" });
      const welfareResult = await getAllWelfareRequests();
      setWelfareRequests(welfareResult.success ? welfareResult.requests || [] : []);
    } catch (error) {
      console.error(error);
      showStatus({ type: "error", message: "❌ ไม่สามารถอัปเดตสถานะสวัสดิการได้" });
    }
  };

  const handleLeaveAction = async (id: number, status: string) => {
    try {
      const result = await updateWelfareStatus(id, status, currentActor, currentActorRole);
      if (result.success) {
        showStatus({ type: "success", message: result.message });
        const [welfareResult, leaveResult] = await Promise.all([
          getAllWelfareRequests(),
          getLeaveRequests(),
        ]);
        if (welfareResult.success) setWelfareRequests(welfareResult.requests || []);
        else setWelfareRequests([]);
        if (leaveResult.success) setLeaveRequests(leaveResult.requests || []);
        else setLeaveRequests([]);
      } else {
        showStatus({ type: "error", message: result.message });
      }
    } catch (error) {
      console.error(error);
      showStatus({ type: "error", message: "❌ ไม่สามารถอัปเดตสถานะคำขอออกลอยได้" });
    }
  };

  const handleOutfitAction = async (id: number, status: "ลงแล้ว" | "ปฏิเสธ") => {
    try {
      const result = await updateUniformStatus(id, status, currentActor, currentActorRole);
      if (result.success) {
        showStatus({ type: result.success ? "success" : "error", message: result.message });
        setUniformFiles((prev) =>
          prev.map((file) => (file.id === id ? { ...file, status } : file))
        );
      } else {
        showStatus({ type: result.success ? "success" : "error", message: result.message });
      }
    } catch (error) {
      console.error(error);
      showStatus({ type: "error", message: "❌ ไม่สามารถอัปเดตสถานะชุดได้" });
    }
  };

  if (!mounted || !adminData) {
    return (
      <div className="text-zinc-500 text-center mt-20 font-light tracking-widest animate-pulse">
        🔒 กำลังตรวจสอบสิทธิ์ผู้ดูแลระบบ...
      </div>
    );
  }

  return (
    <div
      className="relative flex flex-col items-center justify-start min-h-screen bg-cover bg-center bg-no-repeat bg-fixed font-sans antialiased py-12 px-4 text-zinc-300"
      style={{ backgroundImage: "url('/COUNCIL.PNG')" }}
    >
      <div className="absolute inset-0 bg-zinc-950/60 dark:bg-black/70 backdrop-blur-[2px]" />

      <main className="relative z-10 flex w-full flex-col gap-8 bg-white/10 dark:bg-zinc-900/20 backdrop-blur-md border border-white/20 dark:border-zinc-800/30 rounded-3xl shadow-2xl p-4 md:p-6 mx-4">
        {/* Header */}
        <div className="w-full flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-white/10 pb-6 gap-4">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
              Cloud City
            </h1>
            <p className="text-zinc-200 text-sm md:text-base font-light mt-1">
              หน้าจัดการระบบสำหรับผู้ดูแลระบบ
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-zinc-200 text-sm font-medium transition-all duration-200 hover:bg-white/10 hover:text-white"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
              </svg>
              ย้อนกลับ
            </Link>
            <button
              onClick={handleLogout}
              className="px-4 py-2 text-sm font-medium bg-white/5 border border-white/10 text-zinc-200 rounded-xl hover:bg-white/10 hover:text-white transition-all duration-200"
            >
              ออกจากระบบ
            </button>
          </div>
        </div>

        {/* Tab Selection - สไตล์หน้า select */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full">
          <button
            onClick={() => setActiveTab("outfit")}
            className={`group flex flex-col items-center sm:items-start gap-3 p-6 rounded-2xl border text-white transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] shadow-lg text-center sm:text-left ${
              activeTab === "outfit"
                ? "bg-gradient-to-br from-purple-600/30 to-pink-600/30 border-purple-400/50"
                : "bg-white/5 border-white/10 hover:bg-white/10"
            }`}
          >
            <div className={`p-3 rounded-xl transition-transform group-hover:scale-110 ${activeTab === "outfit" ? "bg-purple-500/20 text-purple-300" : "bg-white/10 text-zinc-300"}`}>
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" />
              </svg>
            </div>
            <div>
              <h3 className="text-lg font-bold">ไฟล์ชุด</h3>
              <p className="text-xs text-zinc-300/80 mt-1 font-light">ตรวจสอบและอัปเดตสถานะไฟล์ชุดที่ส่งเข้ามา</p>
            </div>
          </button>

          <button
            onClick={() => setActiveTab("welfare")}
            className={`group flex flex-col items-center sm:items-start gap-3 p-6 rounded-2xl border text-white transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] shadow-lg text-center sm:text-left ${
              activeTab === "welfare"
                ? "bg-gradient-to-br from-amber-600/30 to-red-600/30 border-amber-400/50"
                : "bg-white/5 border-white/10 hover:bg-white/10"
            }`}
          >
            <div className={`p-3 rounded-xl transition-transform group-hover:scale-110 ${activeTab === "welfare" ? "bg-amber-500/20 text-amber-300" : "bg-white/10 text-zinc-300"}`}>
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <div>
              <h3 className="text-lg font-bold">เอาสวัสดิการออก</h3>
              <p className="text-xs text-zinc-300/80 mt-1 font-light">เอาสวัสดิการออกจากผู้ถือ</p>
            </div>
          </button>
        </div>

        {/* Content Area */}
        <div className="w-full min-h-[300px] bg-black/10 rounded-2xl border border-white/10 overflow-hidden backdrop-blur-sm">
          {loading && (
            <div className="text-center text-xs text-zinc-500 py-24 animate-pulse tracking-widest font-light">
              กำลังดึงข้อมูลจากฐานข้อมูล...
            </div>
          )}

          {!loading && activeTab === "welfare" && (
            <div className="overflow-x-auto">
              <div className="flex flex-col sm:flex-row gap-4 p-4 border-b border-white/10 bg-white/5">
                <label className="text-sm font-medium text-zinc-300 flex items-center gap-2">
                  <span>กรองตามแก๊ง</span>
                  <select
                    value={selectedGang}
                    onChange={(e) => setSelectedGang(e.target.value)}
                    className="h-10 px-3 rounded-xl bg-zinc-950 border border-white/10 text-zinc-200 text-sm focus:outline-none focus:border-blue-400"
                  >
                    {gangOptions.map((g) => (
                      <option key={g} value={g}>{g === "ทั้งหมด" ? g : gangByAbbr.get(g) || g}</option>
                    ))}
                  </select>
                </label>
                <span className="text-xs text-zinc-500 flex items-center">แสดง {filteredWelfareRequests.length} รายการ</span>
              </div>
              <table className="w-full text-xs text-left whitespace-nowrap">
                <thead className="bg-zinc-950/40 text-zinc-400 border-b border-white/10 font-medium">
                  <tr>
                    <th className="px-6 py-4">แก๊ง</th>
                    <th className="px-6 py-4">เลข ID</th>
                    <th className="px-6 py-4">ชื่อผู้ถือสวัสดิการ</th>
                    <th className="px-6 py-4">Discord ผู้ถือ</th>
                    <th className="px-6 py-4">สวัสดิการที่ถืออยู่</th>
                    <th className="px-6 py-4 text-center">จัดการ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/10 text-zinc-300">
                  {filteredWelfareRequests.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="text-center py-20 text-zinc-500 font-light tracking-wide">
                        📭 ไม่มีสวัสดิการที่ต้องเอาออก
                      </td>
                    </tr>
                  ) : (
                    groupedWelfareRequests.map((group) => {
                      const firstReq = group[0];
                      const details = parseDetails(firstReq.details);
                      const isTrade = firstReq.requestType === "trade";
                      const holderName = isTrade
                        ? details.tradeHolderName || firstReq.requestName || "-"
                        : details.receiverName || firstReq.requestName || "-";
                      const holderDiscord = isTrade
                        ? details.tradeHolderDiscord || firstReq.discordId || "-"
                        : details.receiverDiscord || firstReq.discordId || "-";

                      const uniqueByItem = new Map<string, WelfareRequest>();
                      for (const req of group) {
                        const d = parseDetails(req.details);
                        const held = req.requestType === "trade" ? d.tradeHolderWelfare || req.welfareItem : req.welfareItem;
                        if (!uniqueByItem.has(held)) uniqueByItem.set(held, req);
                      }
                      const uniqueReqs = Array.from(uniqueByItem.values());

                      return (
                        <tr key={firstReq.id} className="hover:bg-white/5 transition-colors">
                          <td className="px-6 py-4 font-semibold text-white">
                            {firstReq.gangName}{" "}
                            <span className="text-zinc-500 font-normal">[{firstReq.gangAbbreviation}]</span>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex flex-col gap-1 font-mono text-zinc-400">
                              {uniqueReqs.map((req) => (
                                <div key={req.id}>#{req.id}</div>
                              ))}
                            </div>
                          </td>
                          <td className="px-6 py-4 text-zinc-300 font-medium">
                            {holderName}
                            {isTrade && details.tradeToName ? (
                              <span className="block text-[10px] text-amber-400 mt-0.5">เทรดให้: {details.tradeToName}</span>
                            ) : null}
                          </td>
                          <td className="px-6 py-4 text-sm text-zinc-500 font-mono">{holderDiscord}</td>
                          <td className="px-6 py-4">
                            <div className="flex flex-col gap-1 text-zinc-400">
                              {uniqueReqs.map((req) => {
                                const d = parseDetails(req.details);
                                const held = req.requestType === "trade" ? d.tradeHolderWelfare || req.welfareItem : req.welfareItem;
                                return <div key={req.id}>{translateWelfareItem(held)}</div>;
                              })}
                            </div>
                          </td>
                          <td className="px-6 py-4 text-center">
                            <div className="flex justify-center gap-2">
                              <button
                                onClick={() => handleRemoveGroup(uniqueReqs.map((req) => req.id))}
                                className="px-4 py-1.5 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/30 rounded-lg transition-all text-[11px]"
                              >
                                เอาสวัสดิการออกแล้ว
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          )}

          {!loading && activeTab === "outfit" && (
            <div className="flex flex-col gap-8">
              {/* ตารางที่ 1: รวมรายการล่าสุดทุกแก๊ง */}
              <div className="overflow-x-auto rounded-2xl border border-white/10 bg-zinc-950/40">
                <div className="p-4 border-b border-white/10 bg-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <h3 className="text-sm font-bold text-white">📋 รายการไฟล์ชุดล่าสุดทุกแก๊ง</h3>
                  <div className="flex items-center gap-3">
                    <label className="text-xs text-zinc-300 flex items-center gap-2">
                      <span>กรองตามสถานะ</span>
                      <select
                        value={uniformStatusFilter}
                        onChange={(e) => setUniformStatusFilter(e.target.value as any)}
                        className="h-9 px-3 rounded-xl bg-zinc-950 border border-white/10 text-zinc-200 text-xs focus:outline-none focus:border-purple-400"
                      >
                        <option value="all">ทั้งหมด</option>
                        <option value="pending">ยังไม่ได้ลง</option>
                        <option value="completed">ลงไปแล้ว</option>
                      </select>
                    </label>
                    <span className="text-xs text-zinc-500">แสดง {pagedUniformFiles.length} / {filteredUniformFiles.length} รายการ</span>
                  </div>
                </div>
                <table className="w-full text-xs text-left whitespace-nowrap">
                  <thead className="bg-zinc-950/40 text-zinc-400 border-b border-white/10 font-medium">
                    <tr>
                      <th className="px-6 py-4">แก๊ง</th>
                      <th className="px-6 py-4">ประเภทแก๊ง</th>
                      <th className="px-6 py-4">ประเภทชุด</th>
                      <th className="px-6 py-4">สี</th>
                      <th className="px-6 py-4">ลิงก์ไฟล์</th>
                      <th className="px-6 py-4">เหตุผล</th>
                      <th className="px-6 py-4">สถานะ</th>
                      <th className="px-6 py-4">เวลายื่น</th>
                      <th className="px-6 py-4 text-center">จัดการ</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/10 text-zinc-300">
                    {pagedUniformFiles.length === 0 ? (
                      <tr>
                        <td colSpan={9} className="text-center py-20 text-zinc-500 font-light tracking-wide">
                          📭 ไม่มีไฟล์ชุดในระบบ
                        </td>
                      </tr>
                    ) : (
                      pagedUniformFiles.map((file) => {
                        const details = parseDetails(file.details);
                        return (
                        <tr key={file.id} className="hover:bg-white/5 transition-colors">
                          <td className="px-6 py-4 font-semibold text-white">{file.gangName}</td>
                          <td className="px-6 py-4 text-zinc-300">{gangTypeByName[file.gangName] || "-"}</td>
                          <td className="px-6 py-4 text-zinc-400">{file.uniformType}</td>
                          <td className="px-6 py-4">
                            {details.colorName || details.hexColor ? (
                              <div className="flex items-center gap-2">
                                <span className="w-5 h-5 rounded-md border border-white/10 inline-block" style={{ backgroundColor: details.hexColor || "#3b82f6" }} />
                                <div className="flex flex-col leading-tight">
                                  <span className="text-zinc-300">{details.colorName || "-"}</span>
                                  <span className="text-[10px] font-mono text-zinc-400">{details.hexColor || "-"}</span>
                                </div>
                              </div>
                            ) : (
                              <span className="text-zinc-500">-</span>
                            )}
                          </td>
                          <td className="px-6 py-4">
                            <a
                              href={file.fileUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-zinc-400 hover:text-white underline underline-offset-4 transition-colors font-medium"
                            >
                              📥 ดาวน์โหลด
                            </a>
                          </td>
                          <td className="px-6 py-4 text-zinc-400 whitespace-normal">{file.reason || "-"}</td>
                          <td className="px-6 py-4">
                            <span className={`text-[10px] font-medium px-2.5 py-1 rounded-md border ${
                              file.status === "ลงแล้ว"
                                ? "bg-white/10 text-white border-white/20"
                                : file.status === "ปฏิเสธ"
                                ? "bg-red-500/10 text-red-300 border-red-500/20"
                                : "bg-white/5 text-zinc-400 border-white/10"
                            }`}>
                              {file.status === "ลงแล้ว" ? "✓ ลงแล้ว" : file.status === "ปฏิเสธ" ? "✕ ปฏิเสธ" : "⏳ รอลง"}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-zinc-400 text-xs font-mono">{file.createdAt}</td>
                          <td className="px-6 py-4 text-center">
                            {file.status === "รอลง" ? (
                              <div className="flex justify-center gap-2">
                                <button
                                  onClick={() => handleOutfitAction(file.id, "ลงแล้ว")}
                                  className="px-4 py-1.5 bg-white/10 hover:bg-white hover:text-black font-medium rounded-lg border border-white/10 transition-all text-[11px] shadow-sm"
                                >
                                  ลงแล้ว
                                </button>
                                <button
                                  onClick={() => handleOutfitAction(file.id, "ปฏิเสธ")}
                                  className="px-4 py-1.5 bg-zinc-900/60 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 border border-white/10 rounded-lg transition-all text-[11px]"
                                >
                                  ปฏิเสธ
                                </button>
                              </div>
                            ) : file.status === "ปฏิเสธ" ? (
                              <span className="text-red-400 text-xs font-medium">✕ ปฏิเสธแล้ว</span>
                            ) : (
                              <span className="text-zinc-500 text-xs">-</span>
                            )}
                          </td>
                        </tr>
                      )
                    })
                  )}
                  </tbody>
                </table>
                {filteredUniformFiles.length > UNIFORM_PER_PAGE && (
                  <div className="p-4 border-t border-white/10 bg-white/5 flex items-center justify-between">
                    <span className="text-xs text-zinc-500">
                      หน้า {uniformPage} / {uniformTotalPages}
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        disabled={uniformPage <= 1}
                        onClick={() => setUniformPage((p) => Math.max(1, p - 1))}
                        className="px-3 py-1.5 rounded-lg bg-zinc-950 border border-white/10 text-zinc-300 text-xs hover:bg-white/10 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                      >
                        ← ก่อนหน้า
                      </button>
                      <button
                        disabled={uniformPage >= uniformTotalPages}
                        onClick={() => setUniformPage((p) => Math.min(uniformTotalPages, p + 1))}
                        className="px-3 py-1.5 rounded-lg bg-zinc-950 border border-white/10 text-zinc-300 text-xs hover:bg-white/10 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                      >
                        ถัดไป →
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* ตารางที่ 2: เลือกดูตามแก๊ง */}
              <div className="overflow-x-auto rounded-2xl border border-white/10 bg-zinc-950/40">
                <div className="flex flex-col sm:flex-row gap-4 p-4 border-b border-white/10 bg-white/5 items-start sm:items-center justify-between">
                  <h3 className="text-sm font-bold text-white">🔎 รายการไฟล์ชุดตามแก๊ง</h3>
                  <div className="flex items-center gap-3">
                    <label className="text-sm font-medium text-zinc-300 flex items-center gap-2">
                      <span>เลือกแก๊ง</span>
                      <select
                        value={selectedOutfitGang}
                        onChange={(e) => setSelectedOutfitGang(e.target.value)}
                        className="h-10 px-3 rounded-xl bg-zinc-950 border border-white/10 text-zinc-200 text-sm focus:outline-none focus:border-purple-400"
                      >
                        {outfitGangOptions.map((g) => (
                          <option key={g} value={g}>{g}</option>
                        ))}
                      </select>
                    </label>
                    <span className="text-xs text-zinc-500">แสดง {perGangUniformFiles.length} รายการ</span>
                  </div>
                </div>
                <table className="w-full text-xs text-left whitespace-nowrap">
                  <thead className="bg-zinc-950/40 text-zinc-400 border-b border-white/10 font-medium">
                    <tr>
                      <th className="px-6 py-4">แก๊ง</th>
                      <th className="px-6 py-4">ประเภทแก๊ง</th>
                      <th className="px-6 py-4">ประเภทชุด</th>
                      <th className="px-6 py-4">ลิงก์ไฟล์</th>
                      <th className="px-6 py-4">เหตุผล</th>
                      <th className="px-6 py-4">สถานะ</th>
                      <th className="px-6 py-4 text-center">จัดการ</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/10 text-zinc-300">
                    {perGangUniformFiles.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="text-center py-20 text-zinc-500 font-light tracking-wide">
                          📭 ไม่มีไฟล์ชุดของแก๊งนี้
                        </td>
                      </tr>
                    ) : (
                      perGangUniformFiles.map((file) => (
                        <tr key={file.id} className="hover:bg-white/5 transition-colors">
                          <td className="px-6 py-4 font-semibold text-white">{file.gangName}</td>
                          <td className="px-6 py-4 text-zinc-300">{gangTypeByName[file.gangName] || "-"}</td>
                          <td className="px-6 py-4 text-zinc-400">{file.uniformType}</td>
                          <td className="px-6 py-4">
                            <a
                              href={file.fileUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-zinc-400 hover:text-white underline underline-offset-4 transition-colors font-medium"
                            >
                              📥 ดาวน์โหลด
                            </a>
                          </td>
                          <td className="px-6 py-4 text-zinc-400 whitespace-normal">{file.reason || "-"}</td>
                          <td className="px-6 py-4">
                            <span className={`text-[10px] font-medium px-2.5 py-1 rounded-md border ${
                              file.status === "ลงแล้ว"
                                ? "bg-white/10 text-white border-white/20"
                                : file.status === "ปฏิเสธ"
                                ? "bg-red-500/10 text-red-300 border-red-500/20"
                                : "bg-white/5 text-zinc-400 border-white/10"
                            }`}>
                              {file.status === "ลงแล้ว" ? "✓ ลงแล้ว" : file.status === "ปฏิเสธ" ? "✕ ปฏิเสธ" : "⏳ รอลง"}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-center">
                            {file.status === "รอลง" ? (
                              <div className="flex justify-center gap-2">
                                <button
                                  onClick={() => handleOutfitAction(file.id, "ลงแล้ว")}
                                  className="px-4 py-1.5 bg-white/10 hover:bg-white hover:text-black font-medium rounded-lg border border-white/10 transition-all text-[11px] shadow-sm"
                                >
                                  ลงแล้ว
                                </button>
                                <button
                                  onClick={() => handleOutfitAction(file.id, "ปฏิเสธ")}
                                  className="px-4 py-1.5 bg-zinc-900/60 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 border border-white/10 rounded-lg transition-all text-[11px]"
                                >
                                  ปฏิเสธ
                                </button>
                              </div>
                            ) : file.status === "ปฏิเสธ" ? (
                              <span className="text-red-400 text-xs font-medium">✕ ปฏิเสธแล้ว</span>
                            ) : (
                              <span className="text-zinc-500 text-xs">-</span>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

        </div>
      </main>
    </div>
  );
}
