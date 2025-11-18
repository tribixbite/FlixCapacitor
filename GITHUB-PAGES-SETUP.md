# GitHub Pages Setup - FlixCapacitor Legal Docs

**Status:** ✅ Files pushed to GitHub, ready for Pages deployment
**Date:** 2025-11-18
**Repository:** https://github.com/tribixbite/FlixCapacitor

---

## ✅ What's Done

All HTML legal documents have been committed and pushed to GitHub:

- `public-docs/index.html` (4.0K) - Landing page
- `public-docs/privacy.html` (25K) - Privacy Policy
- `public-docs/terms.html` (23K) - Terms of Service

**Latest commit:** 0e78794c (2025-11-18)
**Files location:** https://github.com/tribixbite/FlixCapacitor/tree/main/public-docs

---

## 🎯 Next Step: Enable GitHub Pages (Manual - 2 minutes)

You need to enable GitHub Pages in your repository settings. This is a **one-time web UI action** that I cannot perform.

### Steps:

1. **Go to your repository on GitHub:**
   - URL: https://github.com/tribixbite/FlixCapacitor

2. **Open Settings:**
   - Click the "Settings" tab (top right, near "Code" and "Issues")

3. **Navigate to Pages:**
   - In the left sidebar, scroll down and click "Pages"

4. **Configure Source:**
   - Under "Build and deployment"
   - Under "Source", select **"Deploy from a branch"**
   - Under "Branch":
     - Branch: **main** (from dropdown)
     - Folder: **/public-docs** (from dropdown)
   - Click **Save**

5. **Wait for deployment (1-2 minutes):**
   - GitHub will show: "Your site is live at https://tribixbite.github.io/FlixCapacitor/"
   - A green checkmark will appear when ready

---

## 📋 URLs After Deployment

Once GitHub Pages is enabled, your legal documents will be available at:

| Document | URL |
|----------|-----|
| Landing Page | https://tribixbite.github.io/FlixCapacitor/ |
| Privacy Policy | https://tribixbite.github.io/FlixCapacitor/privacy.html |
| Terms of Service | https://tribixbite.github.io/FlixCapacitor/terms.html |

---

## ✅ Verification Checklist

After enabling GitHub Pages:

- [ ] Visit https://tribixbite.github.io/FlixCapacitor/privacy.html
  - Should load without errors
  - Dark theme should display correctly
  - All sections should be readable

- [ ] Visit https://tribixbite.github.io/FlixCapacitor/terms.html
  - Should load without errors
  - All terms should be displayed
  - Navigation links should work

- [ ] Test on mobile device:
  - Pages should be responsive
  - Text should be readable
  - No horizontal scrolling

- [ ] Verify HTTPS:
  - URL should start with https:// (green padlock)
  - Certificate should be valid
  - No security warnings

---

## 🎮 Play Store Integration

Once Pages are live and verified:

1. **Copy the URLs:**
   - Privacy Policy: `https://tribixbite.github.io/FlixCapacitor/privacy.html`
   - Terms of Service: `https://tribixbite.github.io/FlixCapacitor/terms.html`

2. **Add to Google Play Console:**
   - Go to Play Console → Your App → Policy → App Content
   - Privacy policy → Start
   - Paste Privacy Policy URL: `https://tribixbite.github.io/FlixCapacitor/privacy.html`
   - Save

3. **Add Terms to Description (Optional):**
   - Include Terms URL in the app description
   - Or add a "Terms" button in Settings view

---

## 🔄 Updating Documents Later

When you need to update PRIVACY.md or TERMS.md:

1. **Edit the source Markdown file:**
   ```bash
   # Edit PRIVACY.md or TERMS.md
   nano PRIVACY.md
   ```

2. **Regenerate HTML files:**
   ```bash
   node scripts/convert-docs-to-html.js
   ```

3. **Commit and push:**
   ```bash
   git add public-docs/
   git commit -m "docs: update privacy policy"
   git push origin main
   ```

4. **GitHub Pages automatically redeploys** (1-2 minutes)
   - No manual intervention needed
   - Changes will be live automatically

---

## 🚨 Troubleshooting

### Pages not deploying?

- Check Settings → Pages → Build history
- Look for error messages
- Ensure branch is set to "main" and folder to "/public-docs"

### 404 errors?

- Wait 2-3 minutes after enabling Pages
- Clear browser cache
- Check that files exist: https://github.com/tribixbite/FlixCapacitor/tree/main/public-docs

### HTTPS not working?

- GitHub Pages automatically enables HTTPS
- May take 5-10 minutes for certificate to provision
- If still not working after 1 hour, check GitHub Status

### Links broken?

- Ensure all internal links use relative paths (they do)
- Check browser console for errors
- Verify HTML files are valid (they are)

---

## 📊 Summary

**What's ready:**
- ✅ All HTML files created and validated
- ✅ Files committed to git (commit 867e7c02)
- ✅ Files pushed to GitHub (commit 0e78794c)
- ✅ Dark theme styling applied
- ✅ Mobile responsive design
- ✅ Navigation links between pages

**What you need to do:**
- ⏳ Enable GitHub Pages in repo settings (2 minutes)
- ⏳ Verify URLs load correctly
- ⏳ Add URLs to Play Store Console

**Time to complete:** ~5 minutes

---

## 🎯 Success Criteria

GitHub Pages setup is complete when:

✅ Privacy Policy loads at https://tribixbite.github.io/FlixCapacitor/privacy.html
✅ Terms loads at https://tribixbite.github.io/FlixCapacitor/terms.html
✅ Both pages display correctly on desktop and mobile
✅ HTTPS certificate is valid (green padlock)
✅ No console errors in browser
✅ Navigation links work between pages

Once verified, you can submit these URLs to Google Play Console.

---

**Next PRE-LAUNCH-CHECKLIST.md task:** Capture 8 Play Store screenshots on device
**Priority:** HIGH (Primary blocker for Play Store submission)
