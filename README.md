# Date Ideas - Places & Food Tracker

A modern, production-ready web application to track and manage your list of places to visit and food to try. Built with Next.js, Supabase, shadcn/ui, and Zustand with comprehensive error handling, SEO optimization, and performance enhancements.

## ✨ Features

### Core Functionality
- 📍 **Dual Categories**: Separate tracking for food and places
- 🏷️ **Type Management**: Organize items with custom types (Restaurant, Cafe, Museum, Park, etc.)
- ✅ **Visit Status**: Mark items as visited with checkbox functionality
- 🗺️ **Google Maps Integration**: Direct links to locations
- 🔗 **Social Links**: Store TikTok, Instagram, or review links
- 📱 **Responsive Design**: Works perfectly on desktop and mobile

### User Experience
- 🎨 **Modern UI**: Built with shadcn/ui components
- 🔔 **Toast Notifications**: Real-time feedback for all actions
- ❓ **Confirmation Dialogs**: Safe deletion with custom confirmation modals
- 🖱️ **Cursor Interactions**: Proper pointer cursors on all interactive elements
- ⚡ **Loading States**: Skeleton loaders and loading overlays
- 🛡️ **Error Boundaries**: Graceful error handling with recovery options

### Performance & SEO
- 🚀 **Performance Optimized**: React.memo, useMemo, useCallback for optimal rendering
- 🔍 **SEO Ready**: Comprehensive meta tags, Open Graph, Twitter Cards
- 📱 **PWA Support**: Web app manifest for mobile installation
- 🔒 **Security Headers**: Production-ready security configurations
- 🗺️ **Sitemap & Robots**: SEO optimization files included

## 🛠️ Tech Stack

- **Frontend**: Next.js 15, React 19, TypeScript
- **Database**: Supabase (PostgreSQL)
- **State Management**: Zustand
- **UI Components**: shadcn/ui
- **Styling**: Tailwind CSS
- **Icons**: Lucide React
- **Performance**: React optimization patterns
- **SEO**: Next.js metadata API

## Getting Started

### Prerequisites

- Node.js 18+ 
- A Supabase account and project

### 1. Clone and Install

```bash
git clone <your-repo-url>
cd date-ideas
npm install
```

### 2. Set up Supabase

1. Create a new project in [Supabase](https://supabase.com)
2. Go to the SQL Editor in your Supabase dashboard
3. Run the SQL commands from `supabase-schema.sql` to create the database schema
4. Get your project URL and anon key from Settings > API

### 3. Environment Variables

1. Copy the environment template:
   ```bash
   cp .env.local.example .env.local
   ```

2. Fill in your Supabase credentials in `.env.local`:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

### 4. Run the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the application.

## Database Schema

The application uses two main tables:

### `types` table
- `id`: Primary key
- `name`: Type name (e.g., "Restaurant", "Museum")
- `category`: Either "food" or "place"
- `created_at`: Timestamp

### `items` table
- `id`: Primary key
- `nama`: Item name
- `type_id`: Foreign key to types table
- `lokasi`: Location/address
- `link`: Optional link to reviews/social media
- `status`: Boolean for visited status
- `category`: Either "food" or "place"
- `created_at`: Timestamp

## Usage

### Managing Types
1. Click "Manage Types" to add/edit/delete categories
2. Create types for both food (Restaurant, Cafe, etc.) and places (Museum, Park, etc.)

### Adding Items
1. Click "Add New" to create a new item
2. Fill in the name, select a type, add location
3. Optionally add a link to reviews or social media
4. Mark as visited if you've already been there

### Viewing and Managing
- Switch between Food and Places tabs
- Click the map icon to open location in Google Maps
- Click the link icon to open associated URLs
- Use the checkbox to mark items as visited
- Edit or delete items using the action buttons

## 📁 Project Structure

```
├── app/
│   ├── globals.css
│   ├── layout.tsx       # Root layout with SEO & error boundary
│   └── page.tsx         # Main page with performance optimizations
├── components/
│   ├── ui/              # shadcn/ui components (enhanced with cursor styles)
│   ├── error-boundary.tsx  # Error boundary component
│   ├── loading.tsx      # Loading components and skeletons
│   ├── item-form.tsx    # Add/edit item dialog
│   ├── item-table.tsx   # Items display table
│   ├── type-form.tsx    # Type management dialog
│   └── type-table.tsx   # Types display table
├── lib/
│   ├── store.ts         # Zustand state management
│   ├── supabase.ts      # Supabase client and types
│   └── utils.ts         # Utility functions
├── public/
│   ├── manifest.json    # PWA manifest
│   ├── robots.txt       # SEO robots file
│   └── sitemap.xml      # SEO sitemap
├── next.config.ts       # Next.js config with optimizations
└── supabase-schema.sql  # Database schema
```

## 🚀 Production Features

### Error Handling
- **Error Boundaries**: Catch and handle React errors gracefully
- **Fallback UI**: User-friendly error messages with recovery options
- **Development Mode**: Detailed error information in development
- **Production Mode**: Clean error messages for users

### Performance Optimizations
- **React.memo**: Memoized components to prevent unnecessary re-renders
- **useMemo & useCallback**: Optimized hooks for expensive computations
- **Loading States**: Skeleton loaders and loading overlays
- **Bundle Optimization**: Package imports optimization in Next.js config
- **Font Display Swap**: Optimized font loading strategy

### SEO & Metadata
- **Comprehensive Meta Tags**: Title, description, keywords, authors
- **Open Graph**: Social media sharing optimization
- **Twitter Cards**: Twitter-specific metadata
- **Structured Data**: SEO-friendly markup
- **Sitemap & Robots**: Search engine optimization files
- **Canonical URLs**: Proper URL structure

### Security
- **Security Headers**: X-Frame-Options, Content-Type-Options, Referrer-Policy
- **Permissions Policy**: Camera, microphone, geolocation restrictions
- **Content Security**: Protection against common web vulnerabilities

### PWA Support
- **Web App Manifest**: Mobile app-like experience
- **Apple Touch Icons**: iOS home screen support
- **Responsive Design**: Perfect mobile experience
- **Offline Capability**: Ready for service worker implementation

## 🌐 Deployment

### Environment Variables
Create a `.env.local` file with:
```bash
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
NEXT_PUBLIC_APP_URL=https://your-domain.com
```

### Vercel Deployment (Recommended)
1. Push your code to GitHub
2. Connect your repository to Vercel
3. Add environment variables in Vercel dashboard
4. Deploy automatically on every push

### Other Platforms
- **Netlify**: Works with standard Next.js deployment
- **Railway**: Database and app hosting
- **Supabase**: Can host both database and frontend

### Production Checklist
- [ ] Set up Supabase production database
- [ ] Configure environment variables
- [ ] Update `NEXT_PUBLIC_APP_URL` in environment
- [ ] Update domain in `robots.txt` and `sitemap.xml`
- [ ] Add custom app icons (192x192.png, 512x512.png)
- [ ] Set up error monitoring (optional: Sentry, LogRocket)
- [ ] Configure analytics (optional: Google Analytics, Plausible)
- [ ] Test error boundaries and loading states
- [ ] Verify SEO metadata with tools like Google Search Console

## 🔧 Performance Monitoring

### Built-in Optimizations
- Console logs removed in production
- Optimized package imports
- Image optimization with WebP/AVIF
- Proper caching headers
- DNS prefetch for external resources

### Recommended Tools
- **Lighthouse**: Performance, SEO, and accessibility auditing
- **Web Vitals**: Core web vitals monitoring
- **Bundle Analyzer**: Analyze bundle size (uncomment in next.config.ts)
- **Vercel Analytics**: Real-time performance insights

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

MIT License - feel free to use this project for your own date planning needs!
