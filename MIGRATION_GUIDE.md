# Migration Guide: Next.js → Vite

## ✅ What's Been Done

### Infrastructure Setup (COMPLETED)
- ✅ Vite + React + TypeScript project created
- ✅ Tailwind CSS configured with shadcn/ui setup
- ✅ React Router installed and basic routing set up
- ✅ Path aliases configured (@/ → src/)
- ✅ API configuration created (direct backend calls)
- ✅ Environment variables structure defined
- ✅ Dev server running on **http://localhost:5173**

### Current Status
```
✅ Next.js code committed to GitHub
✅ Vite project created alongside Next.js
✅ Basic routing working
✅ Styling system ready
✅ Ready for component migration
```

## 🚀 Next Steps: Phase-by-Phase Migration

### Phase 1: Firebase & Authentication (START HERE)

#### Step 1.1: Copy Firebase Configuration
```bash
# From Next.js project
cp Propengine-KB-frontend/lib/firebase/config.ts propengine-kb-vite/src/lib/firebase/config.ts
```

Update imports to use Vite env vars:
```typescript
// Change: process.env.NEXT_PUBLIC_FIREBASE_API_KEY
// To:     import.meta.env.VITE_FIREBASE_API_KEY
```

#### Step 1.2: Copy User Context
```bash
# Copy the auth context
cp Propengine-KB-frontend/components/auth/user-context.tsx propengine-kb-vite/src/contexts/UserContext.tsx
```

Update:
- Remove `"use client"` directive (not needed in Vite)
- Update import paths to use `@/` alias

#### Step 1.3: Copy Auth Components
```bash
cp -r Propengine-KB-frontend/components/auth/* propengine-kb-vite/src/components/auth/
```

Update each file:
- Remove `"use client"` directives
- Update imports

#### Step 1.4: Wrap App in UserProvider
In `src/App.tsx`:
```typescript
import { UserProvider } from '@/contexts/UserContext'

function App() {
  return (
    <UserProvider>
      <BrowserRouter>
        {/* routes */}
      </BrowserRouter>
    </UserProvider>
  )
}
```

### Phase 2: First Feature (Test Agent Page)

#### Step 2.1: Copy Chat Hook
```bash
cp Propengine-KB-frontend/components/chat/useChat.ts propengine-kb-vite/src/hooks/useChat.ts
```

Update:
```typescript
// Change: fetch(`/api/${agentType}-agent`, ...)
// To:     fetch(`${API_CONFIG.ENDPOINTS.TEST_AGENT}`, ...)
```

#### Step 2.2: Copy Chat Components
```bash
# Copy all chat components
cp -r Propengine-KB-frontend/components/chat/* propengine-kb-vite/src/components/chat/
```

#### Step 2.3: Copy UI Components
```bash
# Copy shadcn/ui components you use
cp Propengine-KB-frontend/components/ui/button.tsx propengine-kb-vite/src/components/ui/
cp Propengine-KB-frontend/components/ui/card.tsx propengine-kb-vite/src/components/ui/
# ... copy others as needed
```

#### Step 2.4: Create Test Agent Page
```bash
cp Propengine-KB-frontend/app/kb/test-agent/page.tsx propengine-kb-vite/src/pages/TestAgentPage.tsx
```

Update:
- Remove `export const metadata` (no SSR metadata in Vite)
- Export as regular component
- Add to router in `App.tsx`

### Phase 3: Incremental Migration

Migrate one page at a time:
1. **Dashboard** - Copy dashboard components
2. **KB Add/Edit** - Copy KB form components
3. **Admin Pages** - Copy admin components
4. **System Health** - Copy health dashboard

For each page:
```bash
# 1. Copy page component
cp Propengine-KB-frontend/app/kb/[page]/page.tsx propengine-kb-vite/src/pages/[Page].tsx

# 2. Update imports and API calls
# 3. Add route to App.tsx
# 4. Test functionality
# 5. Compare with Next.js version
```

## 🔄 API Call Migration Pattern

### Before (Next.js):
```typescript
// Called Next.js API route
const response = await fetch('/api/test-agent', {
  method: 'POST',
  body: JSON.stringify({ message })
})
```

### After (Vite):
```typescript
// Calls FastAPI backend directly
import { API_CONFIG } from '@/lib/api/config'

const response = await fetch(API_CONFIG.ENDPOINTS.TEST_AGENT, {
  method: 'POST',
  headers: API_CONFIG.HEADERS,
  body: JSON.stringify({ message })
})
```

## 🎯 Testing Strategy

### Run Both Simultaneously
```bash
# Terminal 1 - Next.js (for comparison)
cd Propengine-KB-frontend
npm run dev  # Port 3000

# Terminal 2 - Vite (new version)
cd propengine-kb-vite
npm run dev  # Port 5173

# Terminal 3 - Backend
# Your FastAPI backend on port 8000
```

### For Each Migrated Feature:
1. Test in Vite version (port 5173)
2. Compare with Next.js version (port 3000)
3. Verify:
   - UI looks the same
   - API calls work
   - Authentication works
   - Error handling works

## 📋 Checklist for Each Component

- [ ] Copy component file
- [ ] Update imports (`@/` alias)
- [ ] Remove `"use client"` if present
- [ ] Update API calls (direct backend)
- [ ] Update env vars (`VITE_*`)
- [ ] Test in browser
- [ ] Check console for errors
- [ ] Compare with Next.js version

## 🐛 Common Migration Issues

### Issue 1: Module not found
**Fix:** Check import paths use `@/` alias

### Issue 2: Environment variable undefined
**Fix:** 
```typescript
// Wrong: process.env.NEXT_PUBLIC_*
// Right: import.meta.env.VITE_*
```

### Issue 3: CORS errors
**Fix:** Ensure backend CORS allows `http://localhost:5173`

### Issue 4: API call fails
**Fix:** Check `API_CONFIG.ENDPOINTS` are correct

## 📦 Adding shadcn/ui Components

When you need a new shadcn component:
```bash
# Example: Adding Dialog component
npx shadcn@latest add dialog
```

Or manually copy from Next.js:
```bash
cp Propengine-KB-frontend/components/ui/dialog.tsx propengine-kb-vite/src/components/ui/
```

## 🎨 Styling Notes

Both projects use same Tailwind setup:
- CSS variables defined in `index.css`
- Same color tokens
- Same spacing/sizing
- Should look identical

## 🔐 Environment Variables

Create `.env.local` with:
```bash
# Backend
VITE_BACKEND_URL=http://localhost:8000

# Firebase (copy from Next.js .env)
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_PROJECT_ID=...
VITE_FIREBASE_STORAGE_BUCKET=...
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...
```

## 🚀 When Ready for Production

### Build for Production
```bash
npm run build
```

### Preview Production Build
```bash
npm run preview
```

### Deploy
- Build output is in `dist/`
- Deploy to Vercel, Netlify, or any static host
- Set environment variables in hosting platform

## 📝 Tips

1. **Migrate incrementally** - Don't copy everything at once
2. **Test frequently** - After each component
3. **Keep Next.js running** - For comparison
4. **Use git branches** - For each major feature
5. **Document issues** - So you can reference later

## 🎯 Success Criteria

Migration is complete when:
- [ ] All pages accessible via routing
- [ ] Authentication works end-to-end
- [ ] All API calls connect to backend
- [ ] UI matches Next.js version
- [ ] No console errors
- [ ] Production build succeeds
- [ ] Can delete Next.js project

## 📞 Need Help?

If stuck:
1. Check browser console for errors
2. Check network tab for failed requests
3. Verify backend is running
4. Compare with working Next.js version
5. Check this guide's common issues section

Good luck! 🚀
