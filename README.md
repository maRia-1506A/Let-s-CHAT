# Let's CHAT 💬

A modern, real-time chat application built with **React**, **Vite**, **Tailwind CSS**, and **Supabase**.

---

## 🚀 Features

- 🔐 **Authentication**: Email/Password signup & login + Google OAuth support.
- 💬 **Real-time Messaging**: Instant one-on-one messaging powered by Supabase WebSockets.
- 🟢 **Presence Tracking**: Live online/offline status indicator & "last active" timestamps.
- 📁 **File & Image Sharing**: Attach photos and documents directly inside chats via Supabase Storage.
- 📞 **Voice & Video Calls**: Call modal interface for audio and video calls.
- 👑 **Admin Role & Management**: Admins can view and monitor all user conversations across the platform.
- 👤 **Profile Customization**: Customizable display names, bios, and avatar upload.

---

## 🛠️ Tech Stack

- **Frontend**: React (Vite), Tailwind CSS, Lucide Icons, Radix UI
- **Backend & Database**: Supabase (PostgreSQL, Auth, Storage, Realtime subscriptions)

---

## ⚙️ Setup & Installation

### 1. Prerequisites

Make sure you have [Node.js](https://nodejs.org/) (v18+) installed.

### 2. Install Dependencies

```bash
npm install
```

### 3. Environment Variables

Create a `.env` file in the root directory (refer to `.env.example`):

```env
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-public-key
```

### 4. Database Setup

1. Open your project in the [Supabase Dashboard](https://supabase.com).
2. Go to **SQL Editor** -> **New Query**.
3. Copy the contents of `supabase_schema.sql`, paste it into the editor, and click **Run**.

---

## 🏃 Running Locally

To start the local Vite development server:

```bash
npm run dev
```

Open your browser and navigate to `http://localhost:5173`.

---

## 📦 Building for Production

To create an optimized production build:

```bash
npm run build
```
