# Date Ideas

A simple web app to track places to visit and food to try.

## Features

- 📍 Track food and places separately
- 🏷️ Organize with custom categories (Restaurant, Cafe, Museum, etc.)
- ✅ Mark items as visited

## Quick Start

1. **Clone and install**
   ```bash
   git clone https://github.com/iqbalsetiawan/date-ideas.git
   cd date-ideas
   npm install
   ```

2. **Set up database**
   - Create a [Supabase](https://supabase.com) project
   - Run the SQL from `supabase-schema.sql` in your Supabase SQL editor
   - Get your project URL and API key from Settings > API

3. **Add environment variables**
   Create `.env.local`:
   ```
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   NEXT_PUBLIC_APP_URL=https://date-ideas-two.vercel.app
   ```

4. **Run the app**
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000)

## How to Use

1. **Manage Categories**: Click "Manage Types" to add categories like "Restaurant" or "Museum"
2. **Add Items**: Click "Add New" to add places or food with location and links
3. **Track Progress**: Use checkboxes to mark items as visited
4. **Navigate**: Click map icons for Google Maps, link icons for saved URLs

## Deploy to Vercel

1. Push code to GitHub
2. Connect repository to [Vercel](https://vercel.com)
3. Add environment variables in Vercel dashboard
4. Deploy

## Tech Stack

- Next.js + React + TypeScript
- Supabase (database)
- Tailwind CSS + shadcn/ui
- Zustand (state management)

---

**Live Demo**: [https://date-ideas-two.vercel.app](https://date-ideas-two.vercel.app)