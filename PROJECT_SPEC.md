# Cloud City Council Management — Project Specification for AI Agents

> เอกสารสำหรับ AI Agent ที่จะสร้าง/พัฒนาโปรเจกต์ต่อ ระบบนี้เป็นระบบบริหารจัดการแก๊ง/สภา/แอดมินสำหรับคอมมูนิตี้เกม (FiveM/RDRP style) โดยมีฟีเจอร์หลักคือ ลงทะเบียนแก๊ง อนุมัติ/ปฏิเสธแก๊ง จัดการสวัสดิการ ชุดแก๊ง คำขอยุบ/พักแก๊ง และบัญชีผู้ใช้

---

## 1. Overview / ภาพรวม

- **ชื่อระบบ:** Cloud City Council Management
- **ลักษณะ:** Web dashboard สำหรับผู้เล่น/แก๊ง, สภา, แอดมิน และ root สำหรับคอมมูนิตี้เกม
- **Frontend:** Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS v4
- **Backend:** Flask 3 (Python), SQLite3
- **Communication:** Server Actions (`use server`) ใน `app/register.ts` เรียก REST API ของ Flask
- **State / Auth:** ไม่ใช้ session ฝั่ง backend อย่างเป็นทางการ แต่ใช้ `localStorage` เก็บข้อมูลผู้ใช้ที่ล็อกอิน (`currentGang`, `currentCouncil`, `currentAdmin`, `currentRoot`) แล้วตรวจสอบก่อน render dashboard
- **Notifications:** Discord Webhooks สำหรับบันทึก/แจ้งเตือนการกระทำสำคัญ โดยมี webhook แยกตามหมวดหมู่

---

## 2. Tech Stack

### 2.1 Frontend

```json
// package.json (สาระสำคัญ)
{
  "dependencies": {
    "next": "16.2.10",
    "react": "19.2.4",
    "react-dom": "19.2.4"
  },
  "devDependencies": {
    "@tailwindcss/postcss": "^4",
    "tailwindcss": "^4",
    "typescript": "^5",
    "@types/react": "^19",
    "eslint": "^9",
    "eslint-config-next": "16.2.10"
  }
}
```

- **Tailwind v4** ใช้ `@import "tailwindcss"` ใน `app/globals.css` และ `@tailwindcss/postcss` ใน `postcss.config.mjs`
- **Next Config:** `next.config.ts` มี `allowedDevOrigins: ['localhost', '**.*']`
- **Font:** `Geist` / `Geist_Mono` จาก `next/font/google`
- **Path alias:** `@/*` ชี้ไปที่ root (`./*`)
- **Strict TypeScript:** `strict: true`, `noEmit: true`

### 2.2 Backend

```
backend/
  app.py              # Flask entrypoint + CORS + register routes + /api/health
  database.py         # SQLite schema, migrations, seed root users
  helpers.py          # utility, logging, Discord webhook routing
  notifications.py    # Discord webhook sender (urllib, background thread)
  url.py              # webhook URLs
  requirements.txt    # Flask==3.0.3, flask-cors==5.0.0
  routes/             # Flask blueprints
```

- เปิด Flask ด้วย `python backend/app.py` (port 4000 โดย default)
- CORS เปิดทั้งหมด (`CORS(app)`)
- Database file: `backend/database.db` (SQLite)

---

## 3. Project Structure

```
CW2-2/
├── app/                              # Next.js App Router
│   ├── page.tsx                      # Landing page (Cloud City Council Management)
│   ├── select/page.tsx               # เลือกบทบาท (Gang/Council/Admin)
│   ├── gangs-menu/page.tsx           # เมนูแก๊ง (Register / Login)
│   ├── register/page.tsx             # ฟอร์มลงทะเบียนแก๊ง
│   ├── edit-login/page.tsx           # ล็อกอินแก๊ง (abbreviation + password)
│   ├── gangs-dashboard/page.tsx      # Dashboard ของแก๊ง (หลายแท็บ)
│   ├── admin-login/page.tsx          # ล็อกอินแอดมิน
│   ├── admin-dashboard/page.tsx      # Dashboard แอดมิน
│   ├── council-login/page.tsx        # ล็อกอินสภา
│   ├── council-dashboard/page.tsx    # Dashboard สภา
│   ├── root-login/page.tsx           # ล็อกอิน root (hardcoded)
│   ├── root-dashboard/page.tsx       # จัดการบัญชี council/admin
│   ├── register.ts                   # Server Actions / API client
│   ├── layout.tsx                    # Root layout + StatusModalProvider
│   ├── globals.css                   # Tailwind + animations
│   └── components/
│       ├── Modal.tsx                 # Generic modal (fixed + portal)
│       ├── StatusModal.tsx           # Animated success/error modal
│       ├── StatusModalProvider.tsx   # Context + provider for status modal
│       └── ImageUpload.tsx           # URL input with image preview
├── backend/                          # Flask backend
│   ├── app.py
│   ├── database.py
│   ├── helpers.py
│   ├── notifications.py
│   ├── url.py
│   ├── requirements.txt
│   ├── database.db
│   └── routes/                       # Blueprints
│       ├── __init__.py
│       ├── gangs.py
│       ├── gang_edit_requests.py
│       ├── disband_requests.py
│       ├── pause_requests.py
│       ├── uniform_files.py
│       ├── welfare_requests.py
│       ├── welfare_items.py
│       ├── welfare_season_management.py
│       ├── council_users.py
│       ├── admin_users.py
│       └── root_login.py
├── public/
│   ├── COUNCIL.PNG                   # background image
│   ├── logo.png
│   └── text.png
├── package.json
├── next.config.ts
├── tsconfig.json
├── postcss.config.mjs
├── eslint.config.mjs
└── README.md
```

---

## 4. Database Schema

ใช้ SQLite3 โดยมีตารางดังนี้ (จาก `backend/database.py`):

```sql
-- gangs: ข้อมูลแก๊งหลัก
CREATE TABLE IF NOT EXISTS gangs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    fullName TEXT NOT NULL,
    abbreviation TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL,
    colorTheme TEXT DEFAULT '#3b82f6',
    leader TEXT NOT NULL,
    leaderDiscord TEXT NOT NULL,
    coLeader1 TEXT,
    coLeader1Discord TEXT,
    coLeader2 TEXT,
    coLeader2Discord TEXT,
    leaderPhone TEXT,
    coLeader1Phone TEXT,
    coLeader2Phone TEXT,
    approver TEXT NOT NULL,
    status TEXT DEFAULT 'pending',
    createdAt TEXT,
    logoUrl TEXT,
    editReason TEXT,
    type TEXT DEFAULT 'Gang'
);

-- gang_edit_requests: คำขอแก้ไขข้อมูลแก๊ง (รอ council อนุมัติ)
CREATE TABLE IF NOT EXISTS gang_edit_requests (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    gangId INTEGER NOT NULL,
    fullName TEXT NOT NULL,
    abbreviation TEXT NOT NULL,
    colorTheme TEXT,
    leader TEXT NOT NULL,
    leaderDiscord TEXT NOT NULL,
    coLeader1 TEXT,
    coLeader1Discord TEXT,
    coLeader2 TEXT,
    coLeader2Discord TEXT,
    leaderPhone TEXT,
    coLeader1Phone TEXT,
    coLeader2Phone TEXT,
    type TEXT,
    logoUrl TEXT,
    editReason TEXT,
    approver TEXT,
    newPassword TEXT,
    status TEXT DEFAULT 'pending',
    createdAt TEXT,
    reviewedAt TEXT,
    reviewer TEXT,
    FOREIGN KEY (gangId) REFERENCES gangs(id) ON DELETE CASCADE
);

-- uniform_files: ไฟล์ชุดแก๊ง
CREATE TABLE IF NOT EXISTS uniform_files (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    gangName TEXT NOT NULL,
    uniformType TEXT NOT NULL,
    fileUrl TEXT NOT NULL,
    approver TEXT NOT NULL,
    approverDiscord TEXT DEFAULT '',
    reason TEXT,
    status TEXT DEFAULT 'รอลง',
    createdAt TEXT,
    details TEXT
);

-- disband_requests: คำขอยุบแก๊ง
CREATE TABLE IF NOT EXISTS disband_requests (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    gangId INTEGER NOT NULL UNIQUE,
    reason TEXT,
    approver TEXT,
    status TEXT DEFAULT 'pending',
    createdAt TEXT,
    reviewedAt TEXT,
    reviewer TEXT,
    FOREIGN KEY (gangId) REFERENCES gangs(id) ON DELETE CASCADE
);

-- pause_requests: คำขอพักแก๊ง
CREATE TABLE IF NOT EXISTS pause_requests (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    gangId INTEGER NOT NULL,
    reason TEXT,
    approver TEXT,
    durationDays INTEGER,
    startDate TEXT,
    endDate TEXT,
    status TEXT DEFAULT 'pending',
    createdAt TEXT,
    reviewedAt TEXT,
    reviewer TEXT,
    reportedAt TEXT,
    FOREIGN KEY (gangId) REFERENCES gangs(id) ON DELETE CASCADE
);

-- welfare_requests: คำขอสวัสดิการ (receive, trade, leave)
CREATE TABLE IF NOT EXISTS welfare_requests (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    gangName TEXT,
    gangAbbreviation TEXT,
    requestName TEXT NOT NULL,
    discordId TEXT NOT NULL,
    welfareItem TEXT NOT NULL,
    requestType TEXT DEFAULT 'receive',
    status TEXT DEFAULT 'รอรับ',
    approver TEXT,
    createdAt TEXT,
    details TEXT
);

-- welfare_items: รายการสวัสดิการหลัก
CREATE TABLE IF NOT EXISTS welfare_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    type TEXT NOT NULL,
    gang_limit INTEGER,
    female_gang_limit INTEGER,
    family_limit INTEGER,
    active INTEGER DEFAULT 1,
    createdAt TEXT
);

-- gang_welfare_items: จำกัดจำนวนสวัสดิการต่อแก๊ง
CREATE TABLE IF NOT EXISTS gang_welfare_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    gangId INTEGER NOT NULL,
    welfareItemId INTEGER NOT NULL,
    item_limit INTEGER,
    active INTEGER DEFAULT 1,
    createdAt TEXT,
    UNIQUE(gangId, welfareItemId),
    FOREIGN KEY (gangId) REFERENCES gangs(id) ON DELETE CASCADE,
    FOREIGN KEY (welfareItemId) REFERENCES welfare_items(id) ON DELETE CASCADE
);

-- welfare_seasons: ซีซันสวัสดิการ (อาวุธประจำฤดูกาล)
CREATE TABLE IF NOT EXISTS welfare_seasons (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    kind TEXT DEFAULT 'regular',
    startDate TEXT,
    endDate TEXT,
    active INTEGER DEFAULT 1,
    allowedTypes TEXT,
    gangSelection TEXT DEFAULT 'all',
    selectedGangs TEXT,
    createdAt TEXT
);

-- welfare_season_weapons: อาวุธในซีซัน
CREATE TABLE IF NOT EXISTS welfare_season_weapons (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    seasonId INTEGER NOT NULL,
    type TEXT NOT NULL,
    weapon TEXT NOT NULL,
    quantity INTEGER DEFAULT 1,
    FOREIGN KEY (seasonId) REFERENCES welfare_seasons(id) ON DELETE CASCADE
);

-- council_users / admin_users: บัญชีผู้ใช้งาน
CREATE TABLE IF NOT EXISTS council_users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    username TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL,
    status TEXT DEFAULT 'รอรับ',
    createdAt TEXT
);

CREATE TABLE IF NOT EXISTS admin_users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    username TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL,
    status TEXT DEFAULT 'รอรับ',
    createdAt TEXT
);

-- system_logs: บันทึกการกระทำ (ใช้ส่ง Discord + audit)
CREATE TABLE IF NOT EXISTS system_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    actor TEXT,
    actorRole TEXT,
    action TEXT NOT NULL,
    targetType TEXT,
    targetId INTEGER,
    targetName TEXT,
    details TEXT,
    description TEXT,
    createdAt TEXT
);
```

### 4.1 Migrations (ใน `database.py` ฟังก์ชัน `migrate_db`)

- เพิ่มคอลัมน์แบบ incremental ถ้ายังไม่มี:
  - `uniform_files.details`
  - `welfare_requests.details`, `requestType`, `approver`
  - `disband_requests.approver`
  - `gangs.leaderPhone`, `coLeader1Phone`, `coLeader2Phone`
  - `gang_edit_requests.*Phone`, `approver`, `logoUrl`
  - `welfare_season_weapons.quantity`
  - `welfare_items.gang_limit`, `female_gang_limit`, `family_limit`
  - `system_logs.description`
- สร้าง `UNIQUE INDEX idx_council_users_name`
- ปรับ `uniform_files.approverDiscord` ให้เป็น TEXT DEFAULT '' (แก้ schema เก่าที่ NOT NULL)
- Seed `gang_welfare_items` จาก legacy limits เมื่อมี welfare_items ใหม่

### 4.2 Seed Data

- `seed_root_users` สร้างบัญชี `root` ใน `council_users` และ `admin_users` โดย default password `p@ssw0rd`
- ต้องเรียก `init_db()` ก่อนใช้งานครั้งแรก

---

## 5. Backend API Endpoints

Base URL (frontend default): `http://127.0.0.1:4000`

### 5.1 Gangs

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/gangs/register` | ลงทะเบียนแก๊งใหม่ (status = pending) |
| POST | `/api/gangs/login` | ล็อกอินแก๊ง คืน object แก๊งทั้งก้อน |
| GET | `/api/gangs` | รายชื่อแก๊งทั้งหมด |
| PATCH | `/api/gangs/<int:id>/status` | อัปเดตสถานะแก๊ง (approved / disbanded / pending / รอยุบ / พัก) |

### 5.2 Gang Edit Requests

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/gangs/<int:gang_id>/edit-requests` | ส่ง/อัปเดตคำขอแก้ไขข้อมูลแก๊ง |
| GET | `/api/gangs/<int:gang_id>/edit-requests` | ดึงคำขอ pending ล่าสุดของแก๊ง |
| GET | `/api/edit-requests/pending` | รายการคำขอแก้ไขที่รออนุมัติ (JOIN gangs) |
| POST | `/api/edit-requests/<int:id>/approve` | อนุมัติ → อัปเดตตาราง `gangs` + เปลี่ยนรหัสผ่านถ้ามี `newPassword` |
| POST | `/api/edit-requests/<int:id>/reject` | ปฏิเสธคำขอ |

### 5.3 Disband Requests

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/gangs/disband` | ส่งคำขอยุบแก๊ง (โดย abbreviation) |
| GET | `/api/disband-requests` | รายการ pending (JOIN gangs) |
| GET | `/api/gangs/<int:gang_id>/disband-request` | คำขอของแก๊ง |
| POST | `/api/disband-requests/<int:id>/approve` | อนุมัติ → `gangs.status = 'รอยุบ'` |
| POST | `/api/disband-requests/<int:id>/reject` | ปฏิเสธ |

### 5.4 Pause Requests

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/gangs/pause` | ส่งคำขอพักแก๊ง (reason, approver, durationDays 1-30) |
| GET | `/api/gangs/<int:gang_id>/pause-request` | คำขอล่าสุดของแก๊ง |
| GET | `/api/pause-requests` | รายการ pending/approved (JOIN gangs) |
| POST | `/api/pause-requests/<int:id>/approve` | อนุมัติ → คำนวณ start/end date, `gangs.status = 'พัก'` |
| POST | `/api/pause-requests/<int:id>/reject` | ปฏิเสธ |
| POST | `/api/pause-requests/<int:id>/report` | รายงานตัวหลังพัก → `gangs.status = 'approved'` |

### 5.5 Uniform Files

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/uniform-files` | ส่งไฟล์ชุด (gangName, uniformType, fileUrl, approver, reason, details JSON) |
| GET | `/api/uniform-files` | รายการไฟล์ชุดทั้งหมด |
| PATCH | `/api/uniform-files/<int:id>/link` | อัปเดตลิงก์ไฟล์ใหม่ + เหตุผล → status กลับเป็น `รอลง` |
| PATCH | `/api/uniform-files/<int:id>/status` | อัปเดตสถานะ (`ลงแล้ว` / `ปฏิเสธ` / `รอลง`) |

### 5.6 Welfare Requests

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/welfare` | ส่งคำขอสวัสดิการ (receive/trade/leave) มี validate limit |
| GET | `/api/welfare` | คำขอทั้งหมด |
| GET | `/api/welfare/gang/<gang_abbreviation>` | คำขอของแก๊ง |
| PATCH | `/api/welfare/<int:id>/status` | อัปเดตสถานะ (`รับไปแล้ว` / `เอาออกแล้ว` / `เอาสวัสดิการออกแล้ว`) |
| GET | `/api/welfare/leave` | คำขอออก-ออกลอย พร้อม active welfare ของคนนั้น |

**Validate limit สำหรับ `receive`:**
- ดึง `welfare_items` + `gangs` ตาม `gangAbbreviation`
- ถ้ามี `gang_welfare_items.item_limit` ที่ active ใช้ค่านั้น
- ไม่มี → fallback ตาม `gangs.type` ไปยัง `gang_limit` / `female_gang_limit` / `family_limit`
- นับจำนวน receive ที่ยังไม่ถูกเอาออก ถ้า >= limit ปฏิเสธ

### 5.7 Welfare Items

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/welfare-items` | รายการ active |
| POST | `/api/welfare-items` | สร้าง item ใหม่ + seed `gang_welfare_items` ให้ทุกแก๊ง |
| PATCH | `/api/welfare-items/<int:item_id>` | แก้ไขชื่อ ประเภท active และ limits |
| DELETE | `/api/welfare-items/<int:item_id>` | ลบ |
| GET | `/api/welfare-items/<int:item_id>/gangs` | รายชื่อ approved gangs พร้อม limit/active ของ item |
| POST | `/api/welfare-items/<int:item_id>/gangs` | บันทึก per-gang limits `{ gangLimits: [{gangId, item_limit, active}] }` |

### 5.8 Welfare Season Management

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/welfare-seasons` | รายการซีซันพร้อม weapons |
| POST | `/api/welfare-seasons` | สร้างซีซัน |
| PATCH | `/api/welfare-seasons/<int:season_id>` | แก้ไขซีซัน |
| DELETE | `/api/welfare-seasons/<int:season_id>` | ลบ |
| POST | `/api/welfare-seasons/<int:season_id>/weapons` | บันทึกรายการอาวุธ (replace all) |
| GET | `/api/welfare-remaining/<gang_abbreviation>` | คำนวณอาวุธคงเหลือของแก๊งตาม active season |

### 5.9 Users

#### Council
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/council/login` | ล็อกอิน |
| GET | `/api/council` | รายชื่อบัญชีสภา |
| GET | `/api/council/names` | รายชื่อที่ได้รับอนุมัติ (distinct name) สำหรับ dropdown |
| POST | `/api/council` | สร้าง council user |
| PATCH | `/api/council/<int:id>/status` | เปลี่ยนสถานะ (`อนุมัติ` / `ระงับใช้งาน`) |
| DELETE | `/api/council/<int:id>` | ลบ |
| PATCH | `/api/council/<int:id>` | แก้ไขบัญชี (name, username, password, status) |

#### Admin
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/admin/login` | ล็อกอิน |
| GET | `/api/admin` | รายชื่อ |
| POST | `/api/admin` | สร้าง |
| PATCH | `/api/admin/<int:id>/status` | เปลี่ยนสถานะ |
| DELETE | `/api/admin/<int:id>` | ลบ |
| PATCH | `/api/admin/<int:id>` | แก้ไข |

#### Root
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/root/login` | ล็อกอิน root (hardcoded `root` / `p@ssw0rd` หรือ env) |
| GET | `/` | health check (`{"success":"API START !"}`) |

---

## 6. Frontend Pages & Components

### 6.1 Shared Components

- **`Modal.tsx`** — generic modal ใช้ `createPortal` ใน `document.body`, fixed inset-0, z-50, คลิก backdrop ปิด, รับ `className`, `title`, `children`
- **`StatusModal.tsx`** — modal แสดง success/error พร้อม animation, z-[1001]
- **`StatusModalProvider.tsx`** — Context `useStatusModal()` ให้เรียก `showStatus({type, message, onClose?})`
- **`ImageUpload.tsx`** — input URL สำหรับรูปภาพ + preview (`<img>`)

### 6.2 Landing / Auth Flow

```
/         → Landing page (เลือก "เริ่มต้นใช้งาน" → /select)
/select   → เลือกบทบาท Gang/Council/Admin
/gangs-menu → แก๊ง (Register / Login)
/register   → ฟอร์มลงทะเบียนแก๊ง
/edit-login → ล็อกอินแก๊ง → /gangs-dashboard
/admin-login  → /admin-dashboard
council-login → /council-dashboard
/root-login   → /root-dashboard
```

**Auth pattern:**
- ทุกหน้า dashboard เป็น `"use client"`
- อ่าน `localStorage` ในหน้า dashboard (`currentGang`, `currentCouncil`, `currentAdmin`, `currentRoot`)
- ถ้าไม่มี → redirect ไปหน้า login พร้อม `showStatus`
- ปุ่ม logout → `localStorage.removeItem(...)` + `router.push('/')`

### 6.3 Gang Dashboard (`/gangs-dashboard`)

แท็บหลัก:
- `overview` — ภาพรวมแก๊ง สถิติไฟล์ชุด/สวัสดิการ/คำขอยุบพัก
- `edit` — แก้ไขข้อมูลแก๊ง (ส่ง `gang_edit_requests`)
- `welfare` — ยื่นสวัสดิการ (sub tabs `receive` / `trade`)
- `leave` — ออก-ออกลอย
- `upload_uniform` — ฟอร์มส่งไฟล์ชุด (Suit/Hood/Armor/Mod, action types: สวัสดิการ, แก้ไข, ลงเพิ่ม, ถูกชิงสี)
- `view_uniforms` — ตารางไฟล์ชุดของแก๊ง
- `pause` — ฟอร์มขอพักแก๊ง
- `disband` — ฟอร์มขอยุบแก๊ง

ฟีเจอร์หลัก:
- โหลดข้อมูลแก๊งจาก `localStorage`
- แสดง pending edit/disband/pause
- ฟอร์มสวัสดิการรองรับ `receive`, `trade`, `leave`
- คำนวณ `welfareRemaining` ฝั่ง client จาก `welfareItems` และ `welfareRequests`
- ฟอร์มชุดมี color picker + ชิ้นส่วนชุด (Family ใส่ Hood ได้อย่างเดียว)

### 6.4 Council Dashboard (`/council-dashboard`)

แท็บหลัก:
- `approve_gang` — อนุมัติ/ปฏิเสธ/ยุบแก๊ง
- `approve_welfare` — อนุมัติสวัสดิการ
- `approve_leave` — อนุมัติออก-ออกลอย
- `approve_uniform` — อนุมัติไฟล์ชุด
- `approve_gang_edit` — อนุมัติคำขอแก้ไขแก๊ง
- `approve_disband` — อนุมัติยุบแก๊ง
- `approve_pause` — อนุมัติ/ปฏิเสธ/รายงตัวหลังพัก
- `gang_list` — รายการแก๊งทั้งหมด
- `rejected_gangs` — แก๊งที่ถูกปฏิเสธ
- `welfare_by_gang` — ดูสวัสดิการตามแก๊ง
- `welfare_items` — จัดการรายการสวัสดิการ + modal กำหนดจำนวนต่อแก๊ง (filter/search)

ฟีเจอร์หลัก:
- ตรวจสอบ `currentCouncil` ใน `localStorage`
- มี Modal component สำหรับเพิ่มประเภทสวัสดิการ, ดูรายละเอียดแก๊ง, จัดการแก๊งสวัสดิการ
- welfare gang modal มี filter `all / Gang / Gangs-LD / Family` และ search box
- อนุมัติ/ปฏิเสธ/เปลี่ยนสถานะผ่าน API

### 6.5 Admin Dashboard (`/admin-dashboard`)

แท็บหลัก:
- `welfare` — จัดการคำขอสวัสดิการทั้งหมด (อนุมัติรับ/เอาออก)
- `outfit` — จัดการไฟล์ชุด (อนุมัติ `ลงแล้ว` / ปฏิเสธ)
- `leave` — จัดการคำขอออก-ออกลอย

ฟีเจอร์หลัก:
- อ่าน `currentAdmin` จาก localStorage
- filter ตามแก๊ง
- ปุ่ม action แบบ inline ในตาราง
- status badges สี (รอลง/ลงแล้ว/ปฏิเสธ, รอรับ/รับไปแล้ว/เอาออกแล้ว)

### 6.6 Root Dashboard (`/root-dashboard`)

แท็บ:
- `council` — จัดการบัญชีสภา (สร้าง, แก้ไข, ระงับ/เปิดใช้งาน, ลบ)
- `admin` — จัดการบัญชีแอดมินเหมือนกัน

ฟีเจอร์:
- ล็อกอินผ่าน hardcoded root (`root`/`p@ssw0rd`)
- ฟอร์มสร้างบัญชี (name, username, password)
- ตารางแสดงสถานะ (อนุมัติ/ระงับใช้งาน)
- modal แก้ไขบัญชี (name, username, password, status) ต้องอยู่หน้าสุด + autoFocus ชื่อ

---

## 7. API Client (`app/register.ts`)

เป็น `use server` ไฟล์ที่ export functions สำหรับเรียก Flask API ทั้งหมด มีรูปแบบ:

```ts
const API_BASE_URL = process.env.API_BASE_URL || "http://127.0.0.1:4000";

async function apiFetch(method, path, body?) {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    method,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  return res.json().catch(() => ({}));
}
```

ทุก function รับ `actor?`, `actorRole?` สำหรับ logging ในหลังบ้าน

กลุ่ม functions หลัก:
- `loginGang`, `createRegistration`, `getAllGangs`, `updateGangStatus`
- `requestDisbandGang`, `approveDisbandRequest`, `rejectDisbandRequest`, `getPendingDisbandRequests`, `getDisbandRequestByGang`
- `requestPauseGang`, `approvePauseRequest`, `rejectPauseRequest`, `reportPauseRequest`, `getPauseRequests`, `getPauseRequestByGang`
- `createGangEditRequest`, `approveGangEditRequest`, `rejectGangEditRequest`, `getPendingGangEditRequests`, `getGangEditRequestByGang`
- `createUniformFile`, `getAllUniformFiles`, `updateUniformFileLink`, `updateUniformStatus`
- `createWelfareRequest`, `getWelfareRequestsByGang`, `getAllWelfareRequests`, `updateWelfareStatus`, `getLeaveRequests`, `getWelfareItems`, `createWelfareItem`, `updateWelfareItem`, `deleteWelfareItem`, `getWelfareItemGangLimits`, `updateWelfareItemGangLimits`
- `loginCouncil`, `getAllCouncilUsers`, `createCouncilUser`, `updateCouncilUserStatus`, `updateCouncilUser`, `deleteCouncilUser`, `getCouncilNames`
- `loginAdmin`, `getAllAdminUsers`, `createAdminUser`, `updateAdminUserStatus`, `updateAdminUser`, `deleteAdminUser`
- `loginRoot` (frontend-only, hardcoded check)

---

## 8. Notifications / Discord Webhooks

ไฟล์ `backend/url.py` เก็บ webhook URLs สำหรับแต่ละหมวดหมู่:

- `gangs_webhook`
- `council_webhook`
- `admin_webhook`
- `register_webhook`
- `gangs_edit_webhook`
- `gangs_status_webhook`
- `disband_webhook`
- `pause_webhook`
- `welfare_webhook`
- `uniform_webhook`
- `council_actions_webhook`
- `admin_actions_webhook`

`helpers.py` มี `ACTION_WEBHOOK_OVERRIDES` แมพชื่อ action ไปยัง webhook variable และ `ACTION_LABELS` สำหรับข้อความภาษาไทย

`_log_action(...)` จะถูกเรียกหลังจากทุก action ที่สำคัญ โดย:
- ดึงข้อมูลจาก `request.get_json()` และ caller locals
- สร้างข้อความภาษาไทยที่อ่านง่าย
- ส่ง webhook ไปยัง Discord ใน background thread
- ถ้าไม่มี webhook URL จะเป็น no-op
- ข้อผิดพลาดในการส่ง webhook ถูก swallow (ไม่ทำให้ API fail)

---

## 9. UI / Styling Design System

- **Background:** ภาพ `COUNCIL.PNG` ทั่วทั้งแอป ด้วย overlay ดำ (`bg-zinc-950/60` ถึง `bg-black/85`) และ `backdrop-blur`
- **Glassmorphism:** กล่องเนื้อหาใช้ `bg-white/10`, `backdrop-blur-md`, `border-white/20`, `rounded-3xl`, `shadow-2xl`
- **Typography:** ขาว-เทา (`text-white`, `text-zinc-200/300/400`), font `Geist`
- **Color accents:** blue/indigo/purple/amber/emerald/red ตามบทบาท
- **Inputs:** `bg-white/5`, `border-white/10`, `rounded-xl`, `focus:border-*-400`
- **Tables:** header `bg-white/5`, แถวแบ่งด้วย `border-white/5`, status badges สี pastel
- **Animations:** อยู่ใน `globals.css` สำหรับ `StatusModal` (scale, check draw, ring pulse, shake)
- **Z-index layers:**
  - Modal generic: `z-50` (portal to body)
  - Root edit modal: `z-[1000]`
  - StatusModal: `z-[1001]`

---

## 10. Key Business Rules / Flows

### 10.1 Gang Lifecycle

1. **Register** (`/register`) → `gangs` status `pending`
2. **Council approve** (`approve_gang` tab) → `approved`
3. **Gang dashboard** ใช้งานได้เมื่อ `approved` (ยกเว้น `รอยุบ` ถูก lock)
4. **Edit request** → `gang_edit_requests` pending → council approve → อัปเดต `gangs`
5. **Pause request** → council approve → `gangs.status = 'พัก'` → หมดเวลา/รายงานตัว → `approved`
6. **Disband request** → council approve → `gangs.status = 'รอยุบ'`

### 10.2 Uniform File Flow

1. แก๊ง submit ไฟล์ชุด (`/api/uniform-files`) → `รอลง`
2. Admin อนุมัติ (`/api/uniform-files/<id>/status` → `ลงแล้ว`) หรือ `ปฏิเสธ`
3. ถ้าต้องการเปลี่ยนลิงก์ แก๊งส่ง `PATCH /link` → กลับไป `รอลง` เพื่อ admin ตรวจใหม่

### 10.3 Welfare Flow

1. Council สร้าง `welfare_items` (`welfare_items` tab) พร้อม default limits ตามประเภทแก๊ง
2. ระบบ seed `gang_welfare_items` ให้ทุกแก๊ง
3. Council สามารถเปิด modal "จัดการแก๊ง" เพื่อตั้งค่า limit/active รายแก๊ง
4. แก๊งยื่นคำขอ `receive` / `trade` / `leave`
5. ระบบตรวจ limit ฝั่ง backend (`receive`)
6. Council/Admin อนุมัติ (`รับไปแล้ว`) หรือเอาออก (`เอาออกแล้ว` / `เอาสวัสดิการออกแล้ว`)
7. `leave` ต้องเช็คว่าคนออกไม่มี active welfare ค้าง

### 10.4 Welfare Season (Weapons)

1. Council สร้าง `welfare_seasons` (regular/event) พร้อม `allowedTypes` และ `selectedGangs`
2. ตั้งค่าอาวุธ (`POST /weapons`) แยกตาม `type` (Gang/Gangs-LD/Family) และ `quantity`
3. `GET /api/welfare-remaining/<gang_abbreviation>` คำนวณคงเหลือโดยนับ `welfare_requests` ที่ `requestType='receive'`, `welfareItem='สวัสดิการอาวุธ'`, `details.category=='weapon'`, `details.weaponType==<weapon>` และ status ไม่ใช่เอาออก

---

## 11. Running / Development

### 11.1 Backend

```bash
cd backend
python -m venv venv
venv\Scripts\activate        # Windows
pip install -r requirements.txt
python app.py                 # รัน port 4000
# หรือเรียก init_db() ก่อนครั้งแรก
python database.py
```

### 11.2 Frontend

```bash
npm install
npm run dev                   # Next.js dev server port 3000
```

### 11.3 Production Notes

- รหัสผ่านเก็บ plain text ในฐานข้อมูล (password hashing ยังไม่ได้ implement)
- Webhook URLs ถูก hardcode ใน `url.py` ควรย้ายไป environment variables
- `ROOT_USERNAME`/`ROOT_PASSWORD` อยู่ใน `backend/helpers.py` และ `app/register.ts` ควรใช้ env
- `API_BASE_URL` ควรตั้งผ่าน environment variable
- CORS เปิดทั้งหมดในปัจจุบัน ควรจำกัด origin ใน production

---

## 12. Status Values Reference

### Gangs
- `pending` — รอ council อนุมัติ
- `approved` — ใช้งานได้
- `disbanded` — ถูกปฏิเสธ/ยุบ
- `รอยุบ` — อนุมัติคำขอยุบแล้ว รอดำเนินการ
- `พัก` — กำลังพักใช้งาน

### Uniform Files
- `รอลง` — รอ admin ตรวจ
- `ลงแล้ว` — อนุมัติแล้ว
- `ปฏิเสธ` — ถูกปฏิเสธ

### Welfare Requests
- `รอรับ` — รอ council/admin อนุมัติ
- `รับไปแล้ว` — อนุมัติแล้ว
- `เอาออกแล้ว` / `เอาสวัสดิการออกแล้ว` — ยกเลิก/เอาคืน

### User Accounts
- `อนุมัติ` — เปิดใช้งาน
- `ระงับใช้งาน` — ถูกระงับ
- `รอรับ` — รอเปิดใช้งาน

---

## 13. Additional Notes for AI Agents

- **Modal positioning:** `Modal.tsx` ต้อง render ผ่าน `createPortal` ไปยัง `document.body` เพื่อหลีกเลี่ยงปัญหาถูก clip โดย ancestor ที่มี `backdrop-filter` หรือ `transform`
- **Root edit modal:** ต้องมี `z-[1000]` และ `autoFocus` ที่ช่องชื่อเพื่อให้ผู้ใช้ focus ทันที
- **Date time:** ใช้ `Asia/Bangkok` ในหลังบ้าน (`now_thai`) และแสดงผลเป็น `th-TH` ในหน้าบ้าน (`formatThaiDate`)
- **Frontend state:** ใช้ `useState` + `useEffect` เป็นหลัก ไม่มี global state library
- **Form handling:** บางหน้าใช้ `action={clientAction}` (Next.js Server Action form) บางหน้าใช้ `onSubmit={handleSubmit}`
- **Error handling:** API ทุกตัวคืน `{success: boolean, message: string, ...}` โดย frontend แสดงผลผ่าน `StatusModal`

---

*สร้างโดย AI coding assistant เพื่อให้ AI agents อื่นๆ สามารถทำความเข้าใจและสร้างโปรเจกต์นี้ได้*
