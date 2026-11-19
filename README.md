# 📊 SurvPulse Pro — Dynamic Survey Builder & Analytics Platform

[![Node.js](https://img.shields.io/badge/Node.js-v20+-green.svg)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-18-blue.svg)](https://reactjs.org/)
[![Vite](https://img.shields.io/badge/Vite-5.4-purple.svg)](https://vitejs.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-blue.svg)](https://www.typescriptlang.org/)
[![Express](https://img.shields.io/badge/Express-4.21-lightgrey.svg)](https://expressjs.com/)
[![MongoDB](https://img.shields.io/badge/MongoDB-Atlas%20%2F%20Mongoose-brightgreen.svg)](https://www.mongodb.com/atlas)
[![TailwindCSS](https://img.shields.io/badge/TailwindCSS-3.4-38bdf8.svg)](https://tailwindcss.com/)

A full-stack, enterprise-grade dynamic survey platform built with the **MERN** stack (**React + Vite + Tailwind CSS**, **Node.js + Express**, and **MongoDB + Mongoose**). It enables administrators to create dynamic surveys with complex branching/conditional logic, public participants to submit validated responses with real-time reactive questions, and teams to monitor aggregate analytics with CSV/JSON exports.

---

## 🌟 Key Features

### 1. 🛠️ Admin Panel (Survey Builder)
- **Metadata Management**: Title, description, status (`draft`, `published`, `archived`), and versioning counter.
- **Multiple Question Types**:
  - 📝 **Text Input**: Single-line and multi-line responses.
  - 🔘 **Multiple Choice (Single Select)**: Interactive radio choices with custom options.
  - ☑️ **Checkbox (Multi-Select)**: Multiple options selection with array serialization.
  - ⭐ **Rating (1–5 Scale)**: Clickable star/number scale with custom lowest and highest labels (e.g. *1 - Poor* to *5 - Excellent*).
- **Question Controls**:
  - Add, delete, duplicate, and move questions up/down in sequence.
  - Mark questions as required or optional.
  - Real-time Interactive Test Preview inside the builder before publishing.
- **Dynamic Conditional Logic (Branching Engine)**:
  - Configure multi-rule branching: *Show Question B only if Question A equals / not-equals / contains / > / < Value*.
  - Clean UI rule selector referencing any preceding question in the survey.

### 2. 📋 Public Survey Form (Respondent Interface)
- **Public URL Access**: Direct link (`/survey/:id`) accessible without login.
- **Reactive Dynamic Rendering**: Evaluates branching conditions in real-time as users interact; dependent questions appear/disappear smoothly.
- **Validation**:
  - Dynamically enforces required fields **only** on currently visible questions.
  - Rating range and type enforcement.
- **Spam Protection & Security**:
  - Hidden honeypot field (`_hp_anti_bot`) to silently drop automated spam bots.
  - Rate limiting on submission endpoints (50 requests / 15 mins per IP).
- **Cloud-Saved Partial Drafts (Bonus)**:
  - Participants can click **"Save Draft"** to persist progress directly to the MongoDB backend without relying on `localStorage`.
  - Generates a secure resume code allowing respondents to restore their answers on any device.

### 3. 📈 Analytics & Insights Dashboard
- **Aggregate Metrics**: Total response count, survey question count, timestamp of last submission.
- **Per-Question Visualizations**:
  - **Multiple Choice & Checkbox**: Visual percentage bars and vote distributions.
  - **Rating Scale (1–5)**: Calculated average score (e.g. `4.35 / 5`), total rating count, and 1-to-5 star vote breakdown.
  - **Text Responses**: Searchable list view with live keyword filtering, timestamps, and response details.
- **Data Exporting**:
  - 📥 **Export to CSV**: Download complete survey response dataset with column headers.
  - 📥 **Export to JSON**: Formatted JSON data ready for analytics pipelines.

### 4. 🔐 Security & Bonus Highlights
- **JWT Authentication**: Secure admin signup, login, and bearer token protection on all administrative and analytics endpoints.
- **Session-Scoped Auth**: Tokens stored safely without using `localStorage`.
- **Survey Versioning**: Automatically tracks schema revisions whenever question structures change.
- **Rate Limiting**: `express-rate-limit` prevents brute-force logins and submission flooding.

---

## 🏗️ Architecture Decisions & Trade-Offs

### 1. Database & Schema Design: MongoDB with Mongoose
- **Decision**: Used MongoDB document storage with a nested `questions` array and a dynamic `answers: Map<string, any>` structure on `SurveyResponse`.
- **Reasoning**:
  - Surveys are inherently semi-structured: question types change, options vary, and conditional rules evolve. MongoDB's native JSON document model accommodates dynamic schemas without complex multi-table migrations.
  - Storing answers as a key-value Map (`questionId -> value`) enables $O(1)$ lookups, flexible storage of strings, arrays, or numbers, and resilient reporting.
- **Trade-Off**: Schemaless flexibility requires robust application-level validation. We enforce strict validation in both the Mongoose schema and Express controllers before saving.

### 2. Condition Evaluation Engine: Dual-Layer (Client + Server)
- **Decision**: Implemented identical conditional logic evaluators on both the React frontend (`client/src/utils/conditionEvaluator.ts`) and Express backend (`server/src/utils/conditionEvaluator.ts`).
- **Reasoning**:
  - **Client**: Provides zero-latency reactive feedback as the respondent answers questions.
  - **Server**: Prevents malicious or stale submissions from saving answers to questions that should have been hidden or skipped by conditional rules.

### 3. Partial Draft Storage: Backend Cloud Token (No LocalStorage)
- **Decision**: Created a dedicated `SurveyDraft` collection on MongoDB with unique UUID tokens and automatic 7-day TTL index expiry.
- **Reasoning**:
  - Composes cleanly with the requirement to avoid `localStorage`.
  - Enables cross-device resumption: a respondent can start on mobile and finish on desktop using their resume token.

---

## 📂 Project Structure

```
fullstack-internship-task/
├── server/
│   ├── src/
│   │   ├── config/
│   │   │   └── db.ts                   # MongoDB Atlas connection
│   │   ├── controllers/
│   │   │   ├── authController.ts       # JWT registration & login
│   │   │   ├── surveyController.ts     # Survey CRUD & status management
│   │   │   ├── responseController.ts   # Submission, honeypot & drafts
│   │   │   └── analyticsController.ts  # Visual aggregations & CSV export
│   │   ├── middlewares/
│   │   │   ├── auth.ts                 # JWT Bearer token verification
│   │   │   └── rateLimiter.ts          # Express rate limiting
│   │   ├── models/
│   │   │   ├── User.ts                 # Admin user schema (bcrypt)
│   │   │   ├── Survey.ts               # Dynamic survey schema & conditions
│   │   │   ├── Response.ts             # Participant responses
│   │   │   └── Draft.ts                # Backend partial responses
│   │   ├── routes/                     # Express route declarations
│   │   ├── utils/
│   │   │   └── conditionEvaluator.ts   # Rule evaluation logic
│   │   ├── seed.ts                     # Database seeder with demo data
│   │   └── server.ts                   # Express server entry point
│   ├── package.json
│   ├── tsconfig.json
│   └── .env.example
├── client/
│   ├── src/
│   │   ├── api/
│   │   │   └── client.ts               # Axios instance with interceptors
│   │   ├── components/
│   │   │   ├── Navbar.tsx              # Navigation bar & user profile
│   │   │   └── Footer.tsx              # System footer
│   │   ├── context/
│   │   │   └── AuthContext.tsx         # Auth state provider
│   │   ├── pages/
│   │   │   ├── Admin/
│   │   │   │   ├── Dashboard.tsx       # Survey management & metrics
│   │   │   │   ├── SurveyBuilder.tsx   # Visual builder & branching logic
│   │   │   │   └── SurveyAnalytics.tsx # Analytics, charts & CSV export
│   │   │   ├── Auth/
│   │   │   │   ├── Login.tsx           # Admin sign in
│   │   │   │   └── Register.tsx        # Admin registration
│   │   │   └── Public/
│   │   │       └── PublicSurveyView.tsx# Public responsive survey form
│   │   ├── types/
│   │   │   └── index.ts                # TypeScript interfaces
│   │   ├── utils/
│   │   │   └── conditionEvaluator.ts   # Client-side rule engine
│   │   ├── App.tsx                     # React Router configurations
│   │   ├── main.tsx                    # React DOM entry
│   │   └── index.css                   # Tailwind styles
│   ├── package.json
│   ├── tailwind.config.js
│   └── vite.config.ts
├── package.json                        # Root helper scripts
└── README.md                           # Documentation & setup guide
```

---

## 🚀 Getting Started

### Prerequisites
- **Node.js**: `v18.0.0` or higher (Tested on `v20.19.5`)
- **npm**: `v9.0.0` or higher
- **MongoDB**: A free MongoDB Atlas cluster connection string (or local MongoDB)

---

### Step 1: Clone & Install Dependencies

```bash
# Clone the repository
git clone <your-repo-url>
cd fullstack-internship-task

# Install dependencies for both server and client
npm run install:all
```

---

### Step 2: Configure Environment Variables

#### Backend Configuration (`server/.env`):
Create `server/.env` (or copy from `server/.env.example`):

```env
PORT=5000
NODE_ENV=development
MONGO_URI=mongodb+srv://<username>:<password>@<cluster>.mongodb.net/survey_platform?retryWrites=true&w=majority
JWT_SECRET=your_super_secret_jwt_key_2026
CLIENT_URL=http://localhost:5173
```

#### Frontend Configuration (`client/.env`):
Create `client/.env` (or copy from `client/.env.example`):

```env
VITE_API_URL=http://localhost:5000/api
```

---

### Step 3: Seed Sample Data & Demo Admin (Recommended)

Run the automated seeder to generate a ready-to-use Admin account, a feature-complete demo survey with conditional branching, and 8 realistic responses:

```bash
npm run seed
```

**Pre-configured Demo Credentials:**
- **Email**: `admin@survey.dev`
- **Password**: `admin123456`
*(You can also use the "Click to fill Demo Admin credentials" shortcut button on the login screen).*

---

### Step 4: Run the Application

In development, start both backend and frontend concurrently:

```bash
# Terminal 1: Start Express API (runs on http://localhost:5000)
npm run dev:server

# Terminal 2: Start Vite React Frontend (runs on http://localhost:5173)
npm run dev:client
```

Open your browser at **[http://localhost:5173](http://localhost:5173)**.

---

## 🧪 Testing the Core Flows

### 1. Conditional Logic Flow
1. Sign in as Admin at `/login`.
2. Open the seeded survey: **"Customer Experience & Product Feedback 2026"**.
3. Click **"Interactive Preview"** or copy the public link to view the form.
4. Observe Question 1: *"Have you used our product or platform before?"*
   - Select **"Yes"** ➔ Question 2 (*"How often do you use our platform?"*) and Question 3 (*"Which features do you use most?"*) dynamically appear.
   - Select **"No"** ➔ Question 2 and 3 disappear, and Question 4 (*"What has prevented you from trying our product so far?"*) dynamically appears.
5. Submit the response and view the real-time update in `/admin/surveys/:id/analytics`.

### 2. Analytics & Export Flow
1. Navigate to `/admin` and click the **Analytics** icon on any survey.
2. Review:
   - Total responses and response rates.
   - Choice distributions and percentage bars for multiple choice/checkbox.
   - 1–5 star rating distribution and average score.
   - Searchable text response cards.
3. Click **"Export CSV"** or **"Export JSON"** to download the complete response dataset.

### 3. Backend Cloud Draft Save Flow
1. Open a public survey form (`/survey/:id`).
2. Answer the first 2 questions.
3. Click **"Save Draft"** in the top bar.
4. Copy the generated resume code.
5. Refresh the page or click **"Resume"**, paste your code, and watch your answers restore instantly from the cloud.


## 📹 Demo Video Outline

1. **Architecture & Tech Stack Walkthrough**: MERN stack with TypeScript and clean separation.
2. **Admin Survey Builder**: Adding questions, configuring required toggles, reordering, and configuring conditional branching rules.
3. **Public Survey Experience**: Dynamic question reveal/hide, form validation, and cloud draft saving.
4. **Analytics Dashboard**: Aggregated insights, rating breakdown, keyword search on text answers, and CSV export.
