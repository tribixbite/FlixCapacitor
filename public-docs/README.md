# FlixCapacitor - Public Documentation Hosting

**Purpose:** Host Privacy Policy and Terms of Service for Google Play Store submission

**Created:** 2025-11-16
**Status:** Ready for deployment

---

## 📁 Contents

This directory contains HTML versions of legal documents for public hosting:

- **index.html** (4.0K) - Landing page with links to legal documents
- **privacy.html** (25K) - Privacy Policy (converted from PRIVACY.md)
- **terms.html** (23K) - Terms of Service (converted from TERMS.md)

All files use dark theme styling matching FlixCapacitor's brand identity.

---

## 🌐 Deployment Options

### Option 1: GitHub Pages (Recommended - Free)

**Advantages:**
- Free hosting
- HTTPS by default
- Automatic deployments on git push
- Custom domain support
- Good uptime and reliability

**Steps:**

1. **Commit and push this directory**
   ```bash
   git add public-docs/
   git commit -m "feat: add HTML versions of legal docs for hosting"
   git push origin main
   ```

2. **Enable GitHub Pages**
   - Go to repository Settings
   - Navigate to Pages section (left sidebar)
   - Under "Source", select:
     - Branch: `main`
     - Folder: `/public-docs`
   - Click Save

3. **Wait for deployment** (1-2 minutes)
   - GitHub will provide a URL: `https://[username].github.io/[repo]/`

4. **Update Play Store listing**
   - Privacy Policy URL: `https://[username].github.io/[repo]/privacy.html`
   - Terms of Service URL: `https://[username].github.io/[repo]/terms.html`

**Example URLs:**
- If repo is at `github.com/yourusername/popcorn-mobile`:
  - Privacy: `https://yourusername.github.io/popcorn-mobile/privacy.html`
  - Terms: `https://yourusername.github.io/popcorn-mobile/terms.html`

---

### Option 2: Netlify (Free, Easy)

**Advantages:**
- Drag-and-drop deployment
- Free SSL
- Custom domain support
- Automatic deployments from GitHub

**Steps:**

1. Sign up at [netlify.com](https://netlify.com)

2. **Deploy from GitHub:**
   - Click "Add new site" → "Import an existing project"
   - Connect to GitHub
   - Select your repository
   - Build settings:
     - Build command: *(leave empty)*
     - Publish directory: `public-docs`
   - Click "Deploy site"

3. **Or drag-and-drop:**
   - Zip the `public-docs` folder
   - Drag the zip to Netlify's deploy zone
   - Instant deployment

4. **Get URLs:**
   - Netlify provides: `https://[random-name].netlify.app/`
   - Privacy: `https://[random-name].netlify.app/privacy.html`
   - Terms: `https://[random-name].netlify.app/terms.html`

---

### Option 3: Vercel (Free, Fast)

**Advantages:**
- Extremely fast CDN
- Free SSL
- Automatic GitHub deployments
- Custom domain support

**Steps:**

1. Sign up at [vercel.com](https://vercel.com)

2. **Deploy:**
   - Click "Add New..." → "Project"
   - Import from GitHub
   - Select your repository
   - Framework Preset: Other
   - Root Directory: `public-docs`
   - Click "Deploy"

3. **Get URLs:**
   - Vercel provides: `https://[project-name].vercel.app/`
   - Privacy: `https://[project-name].vercel.app/privacy.html`
   - Terms: `https://[project-name].vercel.app/terms.html`

---

### Option 4: Firebase Hosting (Google, Free)

**Advantages:**
- Part of Google ecosystem (same as Play Store)
- Excellent performance
- Free SSL
- Custom domain support

**Steps:**

1. Install Firebase CLI: `npm install -g firebase-tools`

2. **Initialize Firebase:**
   ```bash
   cd public-docs
   firebase login
   firebase init hosting
   ```

   - Select or create a Firebase project
   - Public directory: `.` (current directory)
   - Single-page app: No
   - Overwrite index.html: No

3. **Deploy:**
   ```bash
   firebase deploy --only hosting
   ```

4. **Get URLs:**
   - Firebase provides: `https://[project-id].web.app/`
   - Privacy: `https://[project-id].web.app/privacy.html`
   - Terms: `https://[project-id].web.app/terms.html`

---

## 🔄 Updating Documents

When PRIVACY.md or TERMS.md are updated:

1. **Regenerate HTML files:**
   ```bash
   node scripts/convert-docs-to-html.js
   ```

2. **Commit and push:**
   ```bash
   git add public-docs/
   git commit -m "docs: update privacy policy and terms"
   git push
   ```

3. **Automatic deployment:**
   - GitHub Pages: Redeploys automatically
   - Netlify/Vercel: Redeploys automatically from GitHub
   - Firebase: Run `firebase deploy --only hosting`

---

## ✅ Verification Checklist

Before submitting to Play Store, verify:

- [ ] All HTML files load without errors
- [ ] Links between pages work (index → privacy, privacy → terms)
- [ ] Dark theme displays correctly
- [ ] Mobile responsive (test on phone)
- [ ] HTTPS enabled (required by Google)
- [ ] No broken images or resources
- [ ] Footer links work
- [ ] Last updated date is correct

**Test URLs:**
- Test privacy.html in browser
- Test terms.html in browser
- Test on mobile device
- Verify HTTPS certificate

---

## 📊 File Details

| File | Size | Purpose | Source |
|------|------|---------|--------|
| index.html | 4.0K | Landing page | Generated |
| privacy.html | 25K | Privacy Policy | PRIVACY.md |
| terms.html | 23K | Terms of Service | TERMS.md |

**Total:** 52K (well under any hosting limits)

---

## 🎨 Design Features

All HTML files include:

- **Dark theme** matching FlixCapacitor brand (#0a0a0a background)
- **Lightning bolt logo** (⚡) at top
- **Gradient branding** (red #e50914 → blue #3b82f6)
- **Responsive design** (mobile-friendly)
- **Professional styling** (modern, clean, accessible)
- **Footer navigation** (links between pages)

---

## 🔒 Security Considerations

**HTTPS Required:**
- Google Play Store requires HTTPS for privacy policy and terms URLs
- All recommended hosting options provide free SSL/HTTPS

**No Tracking:**
- Static HTML files only
- No JavaScript tracking code
- No cookies
- No analytics (unless you add them)
- Privacy-friendly by default

---

## 🚀 Quick Start (GitHub Pages)

**Fastest path to deployment:**

```bash
# 1. Commit files
git add public-docs/ scripts/convert-docs-to-html.js package.json package-lock.json
git commit -m "feat: add HTML hosting for legal docs"

# 2. Push to GitHub
git push origin main

# 3. Enable GitHub Pages in repo settings
# (Settings → Pages → Source: main branch, /public-docs folder)

# 4. Wait 2 minutes for deployment

# 5. Get URLs from GitHub Pages settings
# Privacy: https://[username].github.io/[repo]/privacy.html
# Terms: https://[username].github.io/[repo]/terms.html
```

**Copy these URLs to Play Store Console:**
- Play Console → App Content → Privacy Policy
- Play Console → App Content → Terms of Service

---

## 📝 Play Store Integration

Once deployed, update Google Play Console:

1. **Navigate to App Content**
   - Play Console → Your App → Policy → App Content

2. **Add Privacy Policy**
   - Privacy policy → Start
   - Enter URL: `https://your-domain.com/privacy.html`
   - Save

3. **Add Terms of Service** (optional but recommended)
   - Add URL to app description
   - Link from app settings page

4. **Verify links work**
   - Click the URLs in Play Console
   - Ensure they load correctly
   - Check HTTPS is enabled

---

## 🎯 Success Criteria

**Deployment is successful when:**

✅ Privacy Policy loads at public HTTPS URL
✅ Terms of Service loads at public HTTPS URL
✅ Both pages display correctly on mobile
✅ Navigation links work
✅ No console errors in browser
✅ HTTPS certificate is valid
✅ URLs added to Play Store Console

---

**Status:** Ready for immediate deployment
**Recommended:** GitHub Pages (free, integrated with git)
**Time to Deploy:** < 5 minutes

**Last Updated:** 2025-11-16
