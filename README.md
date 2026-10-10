# ClientFlow — Enterprise CRM & Sales Management System

> **Turn relationships into revenue.**  
> A production-minded, multi-tenant B2B Customer Relationship Management (CRM) and Sales Management System engineered for modern businesses.

[![Node.js](https://img.shields.io/badge/Node.js-20.x-green.svg)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-18.3-blue.svg)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.4-blue.svg)](https://www.typescriptlang.org/)
[![Prisma](https://img.shields.io/badge/Prisma-5.14-teal.svg)](https://www.prisma.io/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-336791.svg)](https://www.postgresql.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4-38bdf8.svg)](https://tailwindcss.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

---

## 📌 Table of Contents
- [1. Executive Overview](#1-executive-overview)
- [2. Key Features & Capabilities](#2-key-features--capabilities)
- [3. Application Architecture & Tech Stack](#3-application-architecture--tech-stack)
- [4. Project Structure](#4-project-structure)
- [5. Database Model & Multi-Tenant Scoping](#5-database-model--multi-tenant-scoping)
- [6. Getting Started & Local Setup](#6-getting-started--local-setup)
- [7. Seeded Demo Accounts](#7-seeded-demo-accounts)
- [8. Interactive Documentation & PDF Guide](#8-interactive-documentation--pdf-guide)
- [9. API Endpoint Reference](#9-api-endpoint-reference)
- [10. Testing & Quality Assurance](#10-testing--quality-assurance)
- [11. Security & Compliance](#11-security--compliance)
- [12. License](#12-license)

---

## 1. Executive Overview

Small and medium-sized enterprises (SMEs) frequently struggle with fragmented customer data across disparate spreadsheets, disconnected communication channels, and opaque sales projections. 

**ClientFlow** is a complete, scalable, and secure SaaS solution designed to streamline the entire revenue cycle. From the initial moment a prospect reaches out to deal closure and ongoing customer success, ClientFlow brings leads, deals, contacts, pipeline stages, tasks, and analytics into a cohesive, high-performance workspace.

### Core Value Propositions:
- **Zero Data Leakage:** Strict multi-tenant boundaries ensure an organization's records are never accessible by other tenants.
- **Fast Qualification-to-Pipeline Velocity:** 1-click atomic conversion transforms qualified leads into structured Contacts, Companies, and Deals simultaneously.
- **Visual Sales Acceleration:** Interactive drag-and-drop Kanban pipeline with optimistic updates and live revenue calculations.
- **Executive Obsidian Aesthetic:** Custom modern B2B SaaS interface styled with an obsidian dark theme, high contrast readability, and jewel-toned KPI widgets.

---

## 2. Key Features & Capabilities

### 🌐 Public Landing Page & Sandbox Navigation
- Professional marketing showcase with high-impact hero section, live interactive CRM preview card, and feature highlights.
- Top navigation bar featuring instant "Sign In" and "Register" access.
- Role-based sandbox cards linking directly to the secure sign-in portal.

### 📊 Real-Time Executive Dashboard
- **KPI Cards:** Realized Revenue, Win Rate (%), Total Open Pipeline Value, Closed Won Deals, and Lead-to-Customer Conversion Rate.
- **Interactive Recharts Visualizations:** Monthly Revenue Trends (Area Chart), Deals Won vs. Lost (Bar Chart), and Lead Source Distribution (Pie Chart).
- **Recent Activity Feed:** Audit log tracking newly created leads, stage advancements, and closed business contracts.
- **Quick Action Bar:** Modal triggers for creating leads, contacts, deals, or tasks from anywhere on the dashboard.

### 🎯 Lead Management & Atomic 1-Click Conversion
- Multi-parameter filtering by Status (`NEW`, `CONTACTED`, `QUALIFIED`, `UNQUALIFIED`, `CONVERTED`), Acquisition Source, and Priority.
- Duplicate detection warning banner alerts reps when multiple leads share the same email address.
- **Atomic Lead Conversion Modal:** Converts a `QUALIFIED` lead into:
  1. A new **Customer Contact** record.
  2. A new **Company Account** (if company name is provided).
  3. An active **Sales Deal** placed in the chosen pipeline stage.

### 🗂️ Customer Contacts & Enterprise Target Accounts
- **Contacts Directory (`/contacts`):** Directory of verified customer decision-makers, phone numbers, emails, and account owners.
- **Target Companies (`/companies`):** Enterprise account records with industry sector, location, linked contacts count, and active deals count.

### 🚀 Interactive Drag-and-Drop Sales Pipeline (Kanban)
- Drag opportunity cards smoothly across stages (`Qualification`, `Discovery`, `Proposal`, `Negotiation`, `Closed Won`, `Closed Lost`).
- Optimistic UI updates ensure immediate visual feedback while automatically synchronizing with the database.
- Dynamic stage headers calculate total open value, deal counts, and win probabilities in real-time.
- Seamless view toggle between the visual Kanban Board and structured Deals Data Table (`/deals`).

### ✅ Task Orchestration & Follow-Up Scheduler
- Categorized status tabs: `All Tasks`, `Due Today`, `Overdue`, and `Completed`.
- Prominent overdue warnings and urgent task badges prevent missed follow-up deadlines.
- 1-click completion checkbox with strike-through task styling.

### 📈 Reports, Performance Analytics & Sanitized CSV Export
- Multi-period aggregation filter: `Last 7 Days`, `Last 30 Days`, `Current Quarter`, `Year to Date (YTD)`, or `All Time`.
- **Sales Representative Productivity:** Breakdown of opportunities managed, deals won, win rate %, and realized revenue per rep.
- **Channel Conversion Velocity:** Conversion metrics segmented by acquisition channel.
- **Sanitized CSV Exporters:** 1-click download of deals and leads data formatted safely against spreadsheet formula injection.

### 👥 Team Administration & Role-Based Access Control (RBAC)
- Fine-grained permissions enforced across four standardized roles:
  - **Organization Admin:** Full system access, workspace configuration, user invitation, and role assignment.
  - **Sales Manager:** Full pipeline visibility, team assignment, and sales analytics.
  - **Sales Representative:** Management of assigned leads, contacts, deals, and tasks.
  - **Read-Only Analyst:** Read-only access to records and performance reports.

---

## 3. Application Architecture & Tech Stack

ClientFlow is built as a type-safe TypeScript monorepo combining a modern React frontend and a robust Node.js backend.

```
+-----------------------------------------------------------------------+
|                             CLIENT / BROWSER                          |
|  React 18 + Vite 5 + Tailwind CSS (Obsidian Theme) + TanStack Query   |
+-----------------------------------+-----------------------------------+
                                    | HTTP / REST (JWT Auth)
                                    v
+-----------------------------------+-----------------------------------+
|                           EXPRESS API SERVER                          |
|  Auth Guards | RBAC Middleware | Zod Validator | Error Logger         |
+-----------------------------------+-----------------------------------+
                                    | Prisma ORM
                                    v
+-----------------------------------+-----------------------------------+
|                        POSTGRESQL DATABASE                            |
|  salesmanagement_db (Multi-tenant scoped by OrganizationId)           |
+-----------------------------------------------------------------------+
```

### Frontend (`apps/web`)
- **Framework:** React 18 + TypeScript + Vite 5
- **Styling:** Tailwind CSS with Obsidian Executive Dark Theme (`#080d16` canvas, `#0e1628` card containers, high contrast text)
- **Data Fetching:** TanStack React Query v5 (caching, background revalidation, optimistic mutations)
- **Routing:** React Router DOM v6
- **Forms & Validation:** React Hook Form + Zod
- **Visuals & Charts:** Recharts + Lucide React icons
- **Feedback:** Toast Notification System

### Backend (`apps/api`)
- **Runtime:** Node.js + Express.js in TypeScript
- **Database ORM:** Prisma ORM with PostgreSQL
- **Authentication:** JWT Bearer tokens + Argon2id / bcrypt password hashing (12 salt rounds)
- **Validation:** Zod request body, query, and parameter middleware
- **Security:** Helmet, CORS, Express-Rate-Limit, SQL Injection prevention via Prisma, and CSV formula sanitation

### Shared (`packages/shared`)
- Universal TypeScript interfaces, enums, and Zod schemas shared between client and server.

---

## 4. Project Structure

```text
clientflow/
├── apps/
│   ├── web/                         # React 18 + Vite Single Page Application
│   │   ├── public/                  # Public assets & interactive documentation
│   │   │   └── doc.html             # Printable HTML documentation & PDF export
│   │   └── src/
│   │       ├── api/                 # Axios-based API client with auto-refresh
│   │       ├── components/          # Common UI components (Button, Modal, Card, Badge, etc.)
│   │       ├── context/             # AuthContext, ToastContext
│   │       ├── layouts/             # AppShell (Sidebar, Topbar, Global Search)
│   │       ├── pages/               # Landing, Login, Dashboard, Leads, Deals, Pipeline, etc.
│   │       └── routes/              # Protected & public routes
│   └── api/                         # Node.js + Express REST API
│       ├── src/
│       │   ├── config/              # Environment, Logger, Prisma DB Client
│       │   ├── middleware/          # Auth, RBAC, Validation, Error Handler, Rate Limiting
│       │   ├── modules/             # Auth, Leads, Deals, Contacts, Companies, Tasks, Reports
│       │   ├── tests/               # Automated Supertest API test suite
│       │   └── app.ts               # Express application configuration
│       └── prisma/
│           ├── schema.prisma        # Multi-tenant PostgreSQL database schema
│           └── seed.ts              # Database seeding script with demo B2B data
├── packages/
│   └── shared/                      # Shared types, Zod schemas, and enums
├── CLIENTFLOW_SYSTEM_DOCUMENTATION.html # Standalone printable documentation
├── CLIENTFLOW_SYSTEM_DOCUMENTATION.md   # Comprehensive technical manual with screenshot specs
├── docker-compose.yml               # Containerized PostgreSQL service
├── package.json                     # Monorepo workspaces configuration
└── .env                             # Environment configuration
```

---

## 5. Database Model & Multi-Tenant Scoping

Every database entity belongs to an `Organization`. Backend middleware automatically extracts the tenant ID from the verified JWT payload and scopes all Prisma queries:

- `Organization`: Workspace tenant root (`id`, `name`, `currency`, `timezone`, `createdAt`)
- `User` & `Membership`: User identities and role permissions (`ORG_ADMIN`, `SALES_MANAGER`, `SALES_REP`, `READ_ONLY_ANALYST`)
- `Lead`: Prospective customers (`firstName`, `lastName`, `companyName`, `status`, `source`, `priority`, `estimatedValue`)
- `Company`: Target accounts (`name`, `industry`, `website`, `location`, `size`)
- `Contact`: Customer stakeholders linked to a Company (`firstName`, `lastName`, `email`, `phone`, `jobTitle`)
- `Pipeline` & `PipelineStage`: Pipeline definitions (`order`, `probability`, `isWon`, `isLost`)
- `Deal`: Revenue opportunities (`name`, `amount`, `stageId`, `expectedCloseDate`)
- `Task` & `Activity`: Scheduled follow-ups and chronological interaction timelines

---

## 6. Getting Started & Local Setup

### Prerequisites
- **Node.js** (v18.x or v20.x recommended)
- **PostgreSQL** running locally on port `5432` (or via Docker)

### Step 1: Install Dependencies
```bash
npm install
```

### Step 2: Configure Environment Variables
Create or verify your `.env` file in the project root:
```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/salesmanagement_db?schema=public"
PORT=5000
FRONTEND_URL=http://localhost:5173
JWT_ACCESS_SECRET=clientflow_dev_super_secret_access_jwt_key_2026_secure
JWT_REFRESH_SECRET=clientflow_dev_super_secret_refresh_jwt_key_2026_secure
NODE_ENV=development
```
*(Note: If your PostgreSQL password contains special characters like `@` or `#`, percent-encode them in the connection string, e.g., `@P@ss#123` becomes `%40P%40ss%23123`)*

### Step 3: Initialize Database Schema & Seed Data
```bash
# Push Prisma schema to PostgreSQL
npm run db:push

# Seed the database with demo organization, pipeline, leads, and deals
npm run db:seed
```

### Step 4: Start Development Servers
```bash
# Run both Backend API and Frontend Web concurrently
npm run dev
```

- **Frontend Web App:** [http://localhost:5173](http://localhost:5173)
- **Backend REST API:** [http://localhost:5000](http://localhost:5000)
- **API Health Check:** [http://localhost:5000/api/v1/health](http://localhost:5000/api/v1/health)

---

## 7. Seeded Demo Accounts

The database comes pre-populated with a demo organization (**Apex Enterprises**). You can use any of these credentials to sign in:

| Role | Name | Email Address | Password | Permissions |
| :--- | :--- | :--- | :--- | :--- |
| **Organization Admin** | Alex Morgan | `admin@apex.com` | `Password123!` | Full workspace access, user invitations, settings |
| **Sales Manager** | Marcus Vance | `manager@apex.com` | `Password123!` | Pipeline stage config, team oversight, reports |
| **Sales Representative** | Sarah Jenkins | `rep.sarah@apex.com` | `Password123!` | Lead management, deals, tasks, note logging |
| **Sales Representative** | David Chen | `rep.david@apex.com` | `Password123!` | Lead management, deals, tasks, note logging |
| **Read-Only Analyst** | Rachel Kim | `analyst@apex.com` | `Password123!` | Reports and analytics inspection (read-only) |

*(Note: You can also register a new organization anytime on the `/register` page using your custom credentials).*

---

## 8. Interactive Documentation & PDF Guide

A comprehensive, printable system manual has been created:

- **Live In-Browser Documentation:** [http://localhost:5173/doc.html](http://localhost:5173/doc.html)
- **Standalone HTML File:** `CLIENTFLOW_SYSTEM_DOCUMENTATION.html`
- **Markdown Specification File:** `CLIENTFLOW_SYSTEM_DOCUMENTATION.md`

### How to Save as a PDF:
1. Open **[http://localhost:5173/doc.html](http://localhost:5173/doc.html)** in Google Chrome, Microsoft Edge, or Firefox.
2. Press **`Ctrl + P`** (or **`Cmd + P`**).
3. Select **"Save as PDF"** as the destination.
4. Ensure **"Background graphics"** is checked to preserve the dark theme styling.
5. Click **Save**.

The documentation includes **13 dedicated screenshot placeholder frames** with recommended capture routes, dimensions, and highlighted UI elements so you can insert your own live screenshots.

---

## 9. API Endpoint Reference

| Method | Endpoint | Description | Auth Required | Minimum Role |
| :--- | :--- | :--- | :---: | :--- |
| `POST` | `/api/v1/auth/register` | Register new organization & initial admin | No | Public |
| `POST` | `/api/v1/auth/login` | Authenticate user & issue JWT token | No | Public |
| `GET` | `/api/v1/auth/me` | Fetch authenticated user profile | Yes | Any |
| `GET` | `/api/v1/dashboard/stats` | Fetch real-time KPI metrics & chart data | Yes | Any |
| `GET` | `/api/v1/leads` | List leads (supports search & filters) | Yes | Any |
| `POST` | `/api/v1/leads` | Create a new sales lead | Yes | Sales Rep |
| `POST` | `/api/v1/leads/:id/convert` | 1-click convert lead to Contact, Company & Deal | Yes | Sales Rep |
| `GET` | `/api/v1/contacts` | List customer contacts directory | Yes | Any |
| `GET` | `/api/v1/companies` | List target enterprise business accounts | Yes | Any |
| `GET` | `/api/v1/deals` | List sales opportunities | Yes | Any |
| `PATCH` | `/api/v1/deals/:id/stage` | Update deal stage (Kanban drag-and-drop) | Yes | Sales Rep |
| `GET` | `/api/v1/pipeline` | Fetch active pipeline and stage definitions | Yes | Any |
| `GET` | `/api/v1/tasks` | List tasks filtered by status | Yes | Any |
| `PATCH` | `/api/v1/tasks/:id/toggle` | Toggle task completion status | Yes | Sales Rep |
| `GET` | `/api/v1/reports/summary` | Fetch sales analytics & rep productivity rankings | Yes | Sales Manager |
| `GET` | `/api/v1/reports/export/:type` | Download sanitized CSV file (`deals` or `leads`) | Yes | Sales Manager |
| `GET` | `/api/v1/team/members` | List organization team members | Yes | Org Admin |
| `PATCH` | `/api/v1/team/members/:id/role` | Update user permission role | Yes | Org Admin |

---

## 10. Testing & Quality Assurance

ClientFlow includes comprehensive automated testing:

```bash
# Run backend API integration test suite
npm run test --workspace=@clientflow/api

# Run full TypeScript compilation check & frontend production build
npm run build
```

- **Integration Tests:** 17/17 integration tests passing (`Supertest` + `Jest`).
- **Production Build:** Clean Vite build output (`dist/assets/index-EZpBYn_m.js`) with zero compiler or linting errors.

---

## 11. Security & Compliance

- **Multi-Tenant Data Isolation:** Tenant scoping enforced at the database query level via authenticated JWT claims.
- **Password Security:** Argon2id / bcrypt hashing with 12 salt rounds; plaintext passwords are never logged or stored.
- **Formula Injection Prevention:** CSV export values prefix formulas (`=`, `+`, `-`, `@`) with single quotes to protect spreadsheet users.
- **Rate Limiting:** Protects `/auth/login` and `/auth/register` endpoints against brute-force attacks.
- **Input Validation:** Zod schemas validate both incoming API requests and frontend form submissions.

---

## 12. License

This project is licensed under the **MIT License**.
You are free to use, modify, and distribute this codebase for portfolio demonstrations, freelance proposals, and commercial software development.
