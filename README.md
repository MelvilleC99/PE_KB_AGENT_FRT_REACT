# PropEngine KB - Vite Frontend

New React + Vite frontend for PropEngine Knowledge Base, connecting to the existing FastAPI backend.

## ✅ What's Set Up

- ✅ Vite + React 18 + TypeScript
- ✅ Tailwind CSS v3 configured
- ✅ shadcn/ui utilities (cn function, CSS variables)
- ✅ React Router v6 for routing
- ✅ Firebase SDK installed
- ✅ Path aliases (@/ for src/)
- ✅ API configuration (connects to localhost:8000)

## 📁 Project Structure

```
src/
├── components/
│   └── ui/              # shadcn/ui components (to be added)
├── contexts/            # React contexts (auth, etc.)
├── hooks/               # Custom hooks
├── lib/
│   ├── api/
│   │   └── config.ts   # API configuration
│   └── utils.ts        # Utility functions (cn, etc.)
├── pages/               # Page components
├── App.tsx              # Main app with routing
└── index.css            # Global styles + Tailwind
```

## 🚀 Getting Started

### 1. Install Dependencies (Already Done!)
```bash
npm install
```

### 2. Create Environment Variables
Create a `.env.local` file:
```bash
# Backend API
VITE_BACKEND_URL=http://localhost:8000

# Firebase (copy from your Next.js .env)
VITE_FIREBASE_API_KEY=your_key_here
VITE_FIREBASE_AUTH_DOMAIN=your_domain_here
VITE_FIREBASE_PROJECT_ID=your_project_here
VITE_FIREBASE_STORAGE_BUCKET=your_bucket_here
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id_here
VITE_FIREBASE_APP_ID=your_app_id_here
```

### 3. Start Development Server
```bash
npm run dev
```

Visit: http://localhost:5173

## 🔄 Migration Plan

### Phase 1: Auth & Context (Next)
- [ ] Copy Firebase config from Next.js
- [ ] Copy user context (contexts/UserContext.tsx)
- [ ] Copy auth components (login, etc.)

### Phase 2: First Page (Test Agent)
- [ ] Copy test-agent page components
- [ ] Copy useChat hook
- [ ] Copy chat UI components
- [ ] Test API connectivity

### Phase 3: Remaining Pages
- [ ] Dashboard
- [ ] KB Management
- [ ] Admin pages
- [ ] System health

## 📡 API Configuration

All API calls go directly to FastAPI backend:
- Backend: `http://localhost:8000`
- No Next.js proxy layer
- CORS must be configured on backend

## 🎨 Styling

Using Tailwind CSS with CSS variables for theming:
- Light/dark mode support built-in
- shadcn/ui component system
- Consistent with Next.js version

## 🔑 Key Differences from Next.js

| Feature | Next.js | Vite |
|---------|---------|------|
| Routing | File-based | React Router |
| API Routes | Built-in (`/app/api/*`) | Direct backend calls |
| Env Vars | `NEXT_PUBLIC_*` | `VITE_*` |
| Dev Server | Port 3000 | Port 5173 |
| SSR | Yes | No (CSR only) |

## 🛠️ Development

### Run Both Projects Side-by-Side

Terminal 1 (Next.js):
```bash
cd ../Propengine-KB-frontend
npm run dev  # Port 3000
```

Terminal 2 (Vite):
```bash
cd propengine-kb-vite
npm run dev  # Port 5173
```

Terminal 3 (Backend):
```bash
# Your FastAPI backend
# Port 8000
```

## 📦 Dependencies

### Core
- react, react-dom
- react-router-dom
- typescript

### Styling
- tailwindcss
- tailwindcss-animate
- class-variance-authority
- clsx, tailwind-merge

### Backend Integration
- firebase

### UI (to be added as needed)
- @radix-ui/* (shadcn/ui components)
- lucide-react (icons)

## 🎯 Next Steps

1. Create `.env.local` with your Firebase credentials
2. Copy Firebase configuration
3. Copy user authentication context
4. Migrate test-agent page as proof of concept
5. Test full flow: login → chat → API calls

## 📝 Notes

- This is a **client-side only** app (no SSR)
- Keep Next.js version running for comparison during migration
- Migrate page by page, testing each one
- Backend CORS must allow `http://localhost:5173`
