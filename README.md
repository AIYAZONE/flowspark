# FlowSpark (Personal Growth OS)

**English** | [中文](README_ZH.md)

**FlowSpark** is a minimalist, focused, and visualized personal goal management system designed to help you turn ambition into reality through **Flow** and **Surprise**. Built with Next.js 16 and Supabase.

Live Demo: [https://flowspark.aiyazone.com](https://flowspark.aiyazone.com)

## ✨ Features

- **🎯 Goal Management**: Create, track, and manage your long-term goals with start/end dates and success criteria.
- **⚡️ Daily Focus**: Set a "Core Action" for the day to ensure you're always moving forward.
- **📊 Quantified Growth**:
  - **Daily Score**: Rate your day (1-5) to track your subjective performance.
  - **Streaks**: Visualize your consistency with streak tracking and milestones.
  - **Trend Analysis**: View your performance trends over the last 30 days.
- **🔐 Secure Authentication**: Complete sign-up, login, and password reset flows using Supabase Auth.
- **🌍 Internationalization**: Built-in support for English and Chinese (Simplified).
- **🌗 Dark Mode**: Fully supported dark theme.

## 🛠 Tech Stack

- **Framework**: [Next.js 16](https://nextjs.org/) (App Router)
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/)
- **UI Components**: [Radix UI](https://www.radix-ui.com/) & [Lucide React](https://lucide.dev/)
- **Charts**: [Recharts](https://recharts.org/)
- **Backend & Auth**: [Supabase](https://supabase.com/)
- **State Management**: Zustand
- **Date Handling**: date-fns

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- npm, pnpm, or yarn
- A Supabase project

### Installation

1. **Clone the repository**

   ```bash
   git clone https://github.com/AIYAZONE/goals.git
   cd goals
   ```

2. **Install dependencies**

   ```bash
   npm install
   # or
   pnpm install
   ```

3. **Environment Setup**

   Create a `.env.local` file in the root directory and add your Supabase credentials:

   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

4. **Database Setup**

   Please refer to the [Supabase Initialization Guide](supabase/README_EN.md) for detailed instructions on setting up the database tables, RLS policies, and storage.

5. **Run the development server**

   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## 📂 Project Structure

```text
src/
├── app/                 # Next.js App Router pages and layouts
│   ├── (authenticated)/ # Protected routes (Dashboard, Goals, etc.)
│   ├── auth/            # Auth routes (Login, Signup, etc.)
│   └── api/             # API routes
├── components/          # React components
│   ├── ui/              # Reusable UI components
│   └── ...              # Feature-specific components
├── lib/                 # Utilities and Supabase client
├── i18n/                # Localization files (en.json, zh.json)
└── ...
```

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

This project is licensed under the MIT License.
