# After Screenshots - Quick Play Store Submission Guide

**Purpose:** Streamlined workflow for Play Store submission after screenshot capture is complete.

**Prerequisites:**
- ✅ 8 phone screenshots captured and saved to `play-store-assets/screenshots/phone/`
- ✅ All documentation and assets ready (see PRE-LAUNCH-CHECKLIST.md)

---

## Step 1: Verify Screenshots (5 minutes)

```bash
# Check screenshot count
ls -1 play-store-assets/screenshots/phone/*.png | wc -l
# Should show: 8 (or 6-8)

# Verify file sizes
ls -lh play-store-assets/screenshots/phone/
# Each should be < 8MB

# Rename if needed (optional - use descriptive names)
cd play-store-assets/screenshots/phone/
mv Screenshot1.png 01-home-movies-grid.png
mv Screenshot2.png 02-movie-detail-add-to-collection.png
mv Screenshot3.png 03-video-player-playback.png
mv Screenshot4.png 04-collections-grid.png
mv Screenshot5.png 05-collection-detail-reorder.png
mv Screenshot6.png 06-library-management.png
mv Screenshot7.png 07-favorites-sync.png
mv Screenshot8.png 08-settings-cloud-sync.png
cd ../../..
```

**Quality Check:**
- [ ] All screenshots are 1080x1920 or similar portrait aspect ratio
- [ ] Dark theme visible throughout
- [ ] Text is readable (not blurry)
- [ ] UI elements are not cut off
- [ ] No personal information visible

---

## Step 2: Optional - Deploy Hosting (5 minutes)

**GitHub Pages (Recommended):**

```bash
# 1. Push all commits
git push origin main

# 2. Go to repository Settings on GitHub
# Settings → Pages → Source: main branch, /public-docs folder

# 3. Wait 1-2 minutes for deployment

# 4. URLs will be:
# Privacy: https://[username].github.io/[repo]/privacy.html
# Terms: https://[username].github.io/[repo]/terms.html
```

**Alternative: Netlify (3 minutes)**
1. Go to https://app.netlify.com/drop
2. Drag `public-docs/` folder
3. Get URLs from deployment

**Skip if:** You'll use personal email instead of hosted URLs

---

## Step 3: Create Google Play Console Account (10 minutes)

**If you don't have one already:**

1. Go to https://play.google.com/console
2. Sign in with Google account
3. Accept Developer Agreement
4. Pay $25 USD one-time registration fee
5. Complete account details

**Important:** Use the Google account you want associated with the app long-term.

---

## Step 4: Create New App in Play Console (15 minutes)

### 4.1 App Details

1. **Create app** button
2. **App name:** FlixCapacitor - Torrent Streaming
3. **Default language:** English (United States)
4. **App or game:** App
5. **Free or paid:** Free

### 4.2 Store Listing

**Main Details:**
- **App name:** FlixCapacitor - Torrent Streaming
- **Short description:** Copy from `PLAY-STORE-LISTING.md` (80 chars)
- **Full description:** Copy from `PLAY-STORE-LISTING.md` (~3,000 chars)

**Graphics:**
- **App icon:** Upload `play-store-assets/app-icon-512.png`
- **Feature graphic:** Upload `play-store-assets/feature-graphic-1024x500.png`
- **Phone screenshots:** Upload all 8 from `play-store-assets/screenshots/phone/`

**Categorization:**
- **App category:** Entertainment → Video Players & Editors
- **Tags:** Leave empty (optional)

**Contact Details:**
- **Email:** your-email@example.com (or support@flixcapacitor.app if domain configured)
- **Privacy Policy URL:**
  - If hosted: `https://[username].github.io/[repo]/privacy.html`
  - If not: Upload `PRIVACY.md` as PDF
- **Terms of Service URL (optional):**
  - If hosted: `https://[username].github.io/[repo]/terms.html`

---

## Step 5: Content Rating (10 minutes)

1. Go to **Content rating** section
2. **Start questionnaire**
3. **Category:** Entertainment
4. **Answers:** (from PLAY-STORE-LISTING.md)
   - Violence: No
   - Sexual content: No
   - Profanity: No
   - Drugs/alcohol: No
   - User-generated content: No
   - Social features: Optional (collection sharing in future)
   - In-app purchases: No
5. **Submit**
6. Expected rating: **Teen (13+)** or **Mature (17+)**

---

## Step 6: App Content (15 minutes)

### 6.1 Privacy & Security

**Data safety section:**
1. **Data collection:** Yes (favorites, history, settings - all local by default)
2. **Data sharing:** No (unless user opts into cloud sync)
3. **Encryption:** Yes (when using cloud sync)
4. **User controls:** Yes (delete data, export data, opt-in/out)

**Declaration:**
- [ ] This app doesn't collect or share user data
- [x] This app collects data (but locally, with opt-in cloud sync)

**Data types collected (opt-in only):**
- Personal info: Email (for cloud sync authentication)
- App activity: Favorites, watch history (for sync)
- App info: Settings (for sync)

**Data usage:**
- App functionality (sync across devices)
- Not shared with third parties
- Encrypted in transit (HTTPS)
- User can request deletion

### 6.2 Ads Declaration

- [ ] No, this app does not contain ads ✓

### 6.3 Target Audience

- **Target age group:** 13+ (Teens and Adults)
- **Appeals to children:** No

### 6.4 News App

- [ ] No, this is not a news app ✓

---

## Step 7: Upload APK/AAB (20 minutes)

### 7.1 Build Release APK

```bash
# Ensure working tree is clean
git status

# Build release APK with ProGuard
./build-and-install.sh

# APK location:
# android/app/build/outputs/apk/release/app-release.apk
```

### 7.2 Test Release Build (Critical!)

```bash
# APK should auto-install via script
# If not, install manually:
adb install android/app/build/outputs/apk/release/app-release.apk

# Test all core features:
# - Browse movies
# - Play torrent
# - Add to collection
# - View collections
# - Favorites
# - Settings
# - Cloud sync (if configured)
```

**⚠️ IMPORTANT:** Test the release build thoroughly. ProGuard can break functionality.

### 7.3 Upload to Play Console

1. Go to **Production** → **Releases**
2. **Create new release**
3. **Upload APK** (or convert to AAB if preferred)
4. **Release name:** v1.0.0 (Initial Release)
5. **Release notes:** Copy from `RELEASE-NOTES.md`

**Version details:**
- Version name: 1.0.0
- Version code: 1
- Minimum SDK: 24 (Android 7.0)
- Target SDK: 35 (Android 15)

---

## Step 8: Review and Submit (10 minutes)

### 8.1 Final Checklist

- [ ] App icon uploaded (512x512)
- [ ] Feature graphic uploaded (1024x500)
- [ ] 6-8 phone screenshots uploaded
- [ ] Short description (80 chars)
- [ ] Full description (~3,000 chars)
- [ ] Privacy Policy URL (or PDF)
- [ ] Content rating complete
- [ ] Data safety declaration complete
- [ ] Release APK uploaded and tested
- [ ] Release notes added

### 8.2 Review Summary

Play Console will show summary of:
- Missing required items (red)
- Warnings (yellow)
- Complete items (green)

**Fix any red items before submitting.**

### 8.3 Submit for Review

1. **Review** all sections
2. **Save as draft** (if not ready)
3. **Submit for review** when ready

**Review timeline:**
- Initial review: 7-10 days (can be up to 2 weeks)
- Updates: 1-3 days (typically faster)

---

## Step 9: Post-Submission (Ongoing)

### Monitor Review Status

1. Check email for review updates
2. Respond to any review questions within 3 days
3. Address any policy violations immediately

### If Rejected

Common rejection reasons:
- Privacy policy issues (ensure HTTPS URL works)
- Content rating mismatch (torrents = mature content)
- Data safety disclosure incomplete
- App crashes on review device

**Action:**
1. Read rejection email carefully
2. Fix specific issues mentioned
3. Re-submit within 14 days

### If Approved

1. **Publish immediately** or **schedule release**
2. Monitor crash reports in Play Console
3. Respond to user reviews
4. Plan first update (bug fixes, improvements)

---

## Rollout Strategy

**Recommended: Staged Rollout**

1. **10% rollout** for 2-3 days
   - Monitor crash rate
   - Monitor user reviews
   - Check for critical bugs

2. **50% rollout** for 2-3 days
   - Verify stability
   - Gather feedback

3. **100% rollout**
   - Full public release

**Alternative: Immediate 100%**
- Higher risk
- Faster user acquisition
- Good if you have thorough QA testing

---

## Emergency Procedures

### Critical Bug After Release

1. **Halt rollout** (pause at current percentage)
2. **Fix bug** in codebase
3. **Build new APK** with incremented version code
4. **Test thoroughly**
5. **Upload update** to Play Console
6. **Submit for review** (usually faster than initial review)
7. **Resume rollout** when approved

### Remove App from Store

1. Go to **Production** → **Releases**
2. **Unpublish app** (temporary)
3. **Deactivate app** (permanent)

**Note:** Users who already installed can continue using it.

---

## Timeline Summary

| Task | Duration | Can Parallelize |
|------|----------|-----------------|
| Verify screenshots | 5 min | - |
| Deploy hosting | 5 min | Yes (while filling forms) |
| Create Play Console account | 10 min | - |
| Create app & store listing | 15 min | - |
| Content rating | 10 min | - |
| App content declarations | 15 min | - |
| Build & test release APK | 20 min | - |
| Upload APK | 10 min | - |
| Review & submit | 10 min | - |
| **TOTAL** | **~90 minutes** | - |

**Plus:** 7-10 days for Google review

---

## Troubleshooting

### "Privacy Policy URL not accessible"
- Ensure GitHub Pages deployed successfully
- Test URL in incognito browser
- Check for HTTPS (required)
- Alternative: Upload PDF instead

### "Screenshots don't meet requirements"
- Must be 1080x1920 or similar portrait ratio
- 16:9 aspect ratio minimum
- No border/frame allowed
- PNG or JPG only

### "APK signature verification failed"
- Ensure using same keystore for all builds
- Check keystore password correct
- Verify keystore file not corrupted

### "App crashes on review device"
- Test on clean Android 7.0+ device
- Check ProGuard rules not too aggressive
- Review crash logs in Play Console
- Test without any data pre-populated

### "Content rating appeal needed"
- Torrents = mature content in many regions
- Ensure disclaimer about user responsibility
- Consider Teen (13+) rating with warning

---

## Next Steps After Approval

1. **Announce launch** (social media, email, etc.)
2. **Monitor metrics:**
   - Install count
   - Crash-free rate (target: > 99%)
   - Uninstall rate
   - User reviews
3. **Respond to reviews** (build community)
4. **Plan v1.1.0:**
   - Bug fixes
   - User-requested features
   - Performance improvements
5. **Set up analytics** (if not already)
6. **Consider beta testing program** for future updates

---

## Resources

**Documentation:**
- [PLAY-STORE-LISTING.md](PLAY-STORE-LISTING.md) - Store listing content
- [RELEASE-NOTES.md](RELEASE-NOTES.md) - v1.0.0 release notes
- [BUILD-RELEASE.md](BUILD-RELEASE.md) - Detailed build instructions
- [MANUAL-TESTING-GUIDE.md](MANUAL-TESTING-GUIDE.md) - QA checklist
- [PRE-LAUNCH-CHECKLIST.md](PRE-LAUNCH-CHECKLIST.md) - Complete pre-launch tasks

**Google Resources:**
- [Play Console Help](https://support.google.com/googleplay/android-developer/)
- [Launch Checklist](https://developer.android.com/distribute/best-practices/launch/launch-checklist)
- [App Quality Guidelines](https://developer.android.com/quality)

---

**Last Updated:** 2025-11-16
**Status:** Ready for use after screenshot capture
**Estimated Time:** 90 minutes + 7-10 day review
**Success Rate:** High (all assets ready, comprehensive testing complete)
