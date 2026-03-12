# Dashboard Rebuild Instructions

## 🔐 SECURITY REQUIREMENTS (CRITICAL)
- Keep ALL API keys in environment variables only (never hardcode)
- Use server-side API routes for sensitive operations (GitHub API, Supabase admin)
- Implement proper authentication checks on all protected routes
- Never expose SUPABASE_SERVICE_ROLE_KEY to client side (only use on server)
- Use Supabase RLS (Row Level Security) policies
- Validate all user inputs on API routes
- Use HTTPS only (Vercel handles this automatically)
- Sanitize all database queries (use parameterized queries)

## 🚀 VERCEL DEPLOYMENT (DO AT THE END)

After completing the rebuild and testing locally:

### 1. Commit changes
```bash
git add .
git commit -m "Rebuild dashboard with Next.js and SPCL branding"
```

### 2. Push to GitHub
```bash
git push origin main
```

### 3. Verify environment variables (should already be set)
```bash
vercel env ls
```

Required environment variables:
- NEXT_PUBLIC_SUPABASE_URL
- NEXT_PUBLIC_SUPABASE_ANON_KEY
- SUPABASE_SERVICE_ROLE_KEY
- GITHUB_TOKEN (for GitHub API)

### 4. Deploy to production
```bash
vercel --prod
```

### 5. Test deployment
- Visit the deployment URL
- Test login with: colton@spcl.tech
- Verify all features work
- Check browser console for errors
- Confirm styling matches

### 6. Report completion
```bash
openclaw system event --text "Done: Dashboard rebuilt and deployed to Vercel at [URL]" --mode now
```

## ✅ DEPLOYMENT CHECKLIST
- [ ] All features working locally
- [ ] Security audit passed (no exposed keys)
- [ ] Authentication tested
- [ ] Database queries secured
- [ ] Git committed and pushed
- [ ] Vercel deployment successful
- [ ] Production site tested
- [ ] No console errors
- [ ] Styling matches Python dashboard
