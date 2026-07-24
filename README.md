# GODSMOVE — Universal Luxury E-Commerce Platform

![GODSMOVE Platform](public/images/logo/Banner.png)

GODSMOVE is an architectural, Apple- & luxury-inspired e-commerce platform built for high-end streetwear, archive garments, limited allocations, and private drop releases.

---

## 💎 Features

### 🏛️ Storefront Experience
- **Atmospheric Visuals**: Glassmorphism, smooth animations, dynamic color themes, and luxury typography.
- **Archive Catalog**: High-performance grid with instant filtering, sorting, multi-attribute collection view, and quick size/colour modals.
- **Exclusive Unlock & Vault Drops**: Private drop access, exclusive rack allocations, and count-down timers.
- **Garment Care & Repairs**: Integrated Care request pipeline allowing customers to log garment repair requests and track resolution.
- **Wallet & Credits**: Integrated store credit system for immediate refund settlements and loyalty allocations.
- **Order & Collection Ledger**: Apple-inspired archival purchase history, PDF invoice generation, and status tracking.

### ⚙️ Comprehensive Admin CRM
- **Product & Inventory Management**: Multi-variant SKU management, stock thresholds, channel allocations (`STOREFRONT`, `EXCLUSIVE_RACK`, `EXCLUSIVE_UNLOCK`).
- **Customer CRM**: Detailed customer profile inspect, wallet credit adjustments, and order histories.
- **Care Requests Desk**: Step-by-step repair ticket management with Razorpay and credit settlement capabilities.
- **Order & Return Desk**: End-to-end lifecycle management for shipments, returns, and automatic wallet credit payouts.
- **Hero & Editorial Curation**: Live hero slider configuration and collection highlight management.

---

## 🛠️ Technology Stack

- **Framework**: [Next.js 16 (App Router)](https://nextjs.org/)
- **UI & Styling**: React 19, Vanilla CSS Modules, Lucide React Icons
- **Database & ORM**: PostgreSQL, [Prisma ORM](https://www.prisma.io/)
- **Authentication**: [Supabase Auth](https://supabase.com/) & Custom SSR Middleware
- **Payments**: Razorpay Payment Gateway Integration
- **PDF Generation**: `jspdf` & `jspdf-autotable`
- **State Management**: Zustand Persistent Local Storage

---

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ or 20+
- PostgreSQL Database (Local or Cloud/Supabase)
- npm or yarn

### Installation

1. **Clone Repository**:
   ```bash
   git clone https://github.com/LivinArt/godsmove.git
   cd godsmove
   ```

2. **Install Dependencies**:
   ```bash
   npm install
   ```

3. **Configure Environment**:
   Copy `.env.example` to `.env.local` and populate environment parameters:
   ```bash
   cp .env.example .env.local
   ```

4. **Database Setup**:
   ```bash
   npx prisma db push
   npx prisma generate
   ```

5. **Start Development Server**:
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🔑 Environment Variables

| Variable | Description |
| :--- | :--- |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase Public Anonymous API Key |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase Service Role Secret |
| `DATABASE_URL` | PostgreSQL Connection String |
| `DIRECT_DATABASE_URL` | Direct PostgreSQL Connection String for Prisma |
| `NEXT_PUBLIC_RAZORPAY_KEY_ID` | Razorpay Public Key ID |
| `RAZORPAY_KEY_SECRET` | Razorpay Secret Key |
| `NEXT_PUBLIC_APP_URL` | Application Public Domain URL |

---

## 📁 Folder Structure

```
GODSMOVE/
├── prisma/               # Database Schema & Migrations
├── public/               # Static Images, Uploads & Assets
├── src/
│   ├── actions/          # Server Actions (Orders, Profile, Care, Admin)
│   ├── app/              # Next.js App Router (Storefront & Admin Routes)
│   ├── components/       # Reusable UI Components
│   ├── lib/              # Database Clients, Utilities, PDF Generators
│   ├── store/            # Zustand Local & Cart State
│   └── styles/           # Design System & Token Definitions
├── .env.example          # Environment Template
└── package.json          # Project Scripts & Dependencies
```

---

## 📦 Production Deployment

To generate an optimized production bundle:

```bash
npm run build
npm run start
```

---

## 📄 License

Copyright © 2026 GODSMOVE. All rights reserved.
