# FlixCapacitor - Next Manual Steps for Play Store Submission

**Date:** 2025-11-20
**Current Status:** 100% Production Ready (All Autonomous Work Complete)
**Next Blocker:** Release APK Build and Testing (Manual User Work)

---

## Current State ✅

**Completed (100% Autonomous Work):**
- ✅ All code development complete
- ✅ All UI bugs fixed (Rounds 1-12)
- ✅ 6 Play Store screenshots captured and verified
- ✅ Play Store assets ready (icon, feature graphic)
- ✅ Legal documents ready (Privacy Policy, Terms of Service)
- ✅ Documentation complete (10,850+ lines)
- ✅ `npm run verify-submission` passed (Success: 15 | Warnings: 1 | Errors: 0)

**Status:** ✅ READY FOR PLAY STORE SUBMISSION (pending manual device work)

---

## Next Steps (Manual User Work Required)

### Why Manual Work is Required:

The following tasks **cannot be automated** because they require:
1. **Keystore passwords** (should never be in codebase for security)
2. **Physical device testing** (to verify release build works correctly)
3. **Google Play Console access** (requires your Google account and payment)

---

## Step 1: Prepare for Release Build (5 minutes)

### 1.1 Check Keystore Exists

```bash
ls -lh android/app/flixcapacitor-release.keystore
```

**Expected:** File should exist (created during Phase 12E)
**If missing:** See BUILD-RELEASE.md section "Keystore Management"

### 1.2 Retrieve Keystore Passwords

You need two passwords:
- `KEYSTORE_PASSWORD`: Password for the keystore file
- `KEY_PASSWORD`: Password for the key alias (usually the same)

**Where to find them:**
- Check your password manager (1Password, LastPass, etc.)
- Check your secure notes from Phase 12E (Nov 14, 2025)
- If lost: You'll need to regenerate the keystore (see troubleshooting below)

### 1.3 Set Environment Variables

```bash
# Option 1: Temporary (for this session only)
export KEYSTORE_PASSWORD="your_password_here"
export KEY_PASSWORD="your_password_here"

# Option 2: Store in .bashrc (persistent)
echo 'export KEYSTORE_PASSWORD="your_password_here"' >> ~/.bashrc
echo 'export KEY_PASSWORD="your_password_here"' >> ~/.bashrc
source ~/.bashrc
```

**⚠️ Security Note:** Never commit passwords to git!

---

## Step 2: Build Release APK (2-4 hours)

### 2.1 Build Web Assets (Production Mode)

```bash
# Clean previous builds
rm -rf dist/ android/app/build/

# Build production web assets
npm run build
```

**Expected output:**
```
✓ built in 30-40s
dist/assets/main-*.js   74.87 kB (19.85 kB gzipped)
dist/assets/vendor-*.js 243.03 kB (78.92 kB gzipped)
```

### 2.2 Sync to Capacitor

```bash
npx cap sync android
```

**Expected output:**
```
✔ Copying web assets from dist to android
✔ Updating Android plugins
[info] Found 15 Capacitor plugins
✔ update android in ~1s
```

### 2.3 Build Release APK with Custom AAPT2

**⚠️ CRITICAL:** On Termux ARM64, you MUST use the custom AAPT2 tool.

```bash
cd android

# Set custom AAPT2 path (required for Termux)
export ANDROID_AAPT2_FROM_MAVEN_OVERRIDE="/data/data/com.termux/files/home/git/pop/popcorn-mobile/tools/aapt2-arm64/aapt2"

# Build release APK (this will take 2-4 minutes)
./gradlew assembleRelease

cd ..
```

**Expected output:**
```
BUILD SUCCESSFUL in 2m 30s
```

### 2.4 Verify Release APK Created

```bash
ls -lh android/app/build/outputs/apk/release/app-release.apk
```

**Expected:**
- File size: ~76-80MB (similar to debug APK)
- File should exist
- Created timestamp should be recent

### 2.5 Copy APK to Project Root

```bash
cp android/app/build/outputs/apk/release/app-release.apk \
   flixcapacitor-v1.0.0.apk

ls -lh flixcapacitor-v1.0.0.apk
```

---

## Step 3: Test Release APK on Physical Device (2-3 hours)

**⚠️ CRITICAL:** Release builds have ProGuard enabled, which can break functionality. You MUST test thoroughly!

### 3.1 Install Release APK

```bash
# Method 1: ADB (if connected)
adb install -r flixcapacitor-v1.0.0.apk

# Method 2: termux-open (will prompt for installation)
termux-open flixcapacitor-v1.0.0.apk

# Method 3: Manual copy to device and install
cp flixcapacitor-v1.0.0.apk ~/storage/shared/Download/
# Then open file manager on device and install
```

### 3.2 Complete Testing Checklist

Follow the comprehensive testing guide:

```bash
cat MANUAL-TESTING-GUIDE.md
```

**Critical Test Areas:**
- [ ] App launches without crashes
- [ ] Browse movies/shows/anime tabs work
- [ ] Movie detail view displays correctly
- [ ] Torrent playback works
- [ ] Collections feature works (create, view, reorder)
- [ ] Favorites sync works
- [ ] Library scanning works
- [ ] Settings save and load correctly
- [ ] Cloud sync works (if configured)
- [ ] All modals/dialogs open and close
- [ ] No JavaScript errors in console
- [ ] No crashes during 30-minute usage
- [ ] All UI elements properly spaced (safe areas)
- [ ] Performance is acceptable (smooth scrolling, fast loading)

**Estimated Time:** 2-3 hours for thorough testing

### 3.3 Check for ProGuard Issues

**Common ProGuard problems:**
- Methods/classes getting removed that are used via reflection
- JavaScript-to-native bridge calls failing
- Third-party library issues

**If you find issues:**
1. Check `android/app/proguard-rules.pro`
2. Add keep rules for broken classes/methods
3. Rebuild release APK
4. Test again

### 3.4 Check APK Size

```bash
ls -lh flixcapacitor-v1.0.0.apk
```

**Expected:** ~70-80MB
**Play Store Limit:** 150MB (we're well under)

---

## Step 4: Play Store Submission (90 minutes)

Once you've confirmed the release APK works perfectly, follow the submission guide:

```bash
cat AFTER-SCREENSHOTS.md
```

**Key Steps:**
1. Go to [Play Console](https://play.google.com/console)
2. Create new app (if not already created)
3. Fill in store listing (copy from PLAY-STORE-LISTING.md)
4. Upload screenshots from `play-store-assets/screenshots/phone/`
5. Upload app icon and feature graphic from `play-store-assets/`
6. Upload `flixcapacitor-v1.0.0.apk`
7. Complete content rating questionnaire
8. Fill in data safety declarations
9. Submit for review

**Timeline:**
- Submission process: ~90 minutes
- Google review: 7-10 days
- Total: 2-3 weeks to launch

---

## Troubleshooting

### Issue: "KEYSTORE_PASSWORD not set"

```bash
# Verify environment variables are set
echo $KEYSTORE_PASSWORD
echo $KEY_PASSWORD

# If empty, set them:
export KEYSTORE_PASSWORD="your_password"
export KEY_PASSWORD="your_password"
```

### Issue: "Keystore not found"

```bash
# Check if keystore exists
ls -lh android/app/flixcapacitor-release.keystore

# If missing, you need to regenerate it (see BUILD-RELEASE.md)
# WARNING: If you already submitted to Play Store with a different keystore,
# you cannot update the app! Keep backups!
```

### Issue: "Build failed - AAPT2 error"

```bash
# Ensure custom AAPT2 is set
export ANDROID_AAPT2_FROM_MAVEN_OVERRIDE="/data/data/com.termux/files/home/git/pop/popcorn-mobile/tools/aapt2-arm64/aapt2"

# Verify the file exists
ls -lh tools/aapt2-arm64/aapt2

# Try again
cd android && ./gradlew assembleRelease
```

### Issue: "Release APK crashes immediately"

**Likely cause:** ProGuard removed required code

**Solution:**
1. Check crash logs: `adb logcat | grep FlixCapacitor`
2. Identify missing classes/methods
3. Add to `android/app/proguard-rules.pro`:
   ```
   -keep class com.example.MissingClass { *; }
   ```
4. Rebuild and test again

### Issue: "Forgot keystore password"

**⚠️ CRITICAL:** If you forgot your keystore password and already published to Play Store, you **cannot** update your app. You would need to publish a new app.

**If not yet published:**
1. Generate new keystore (see BUILD-RELEASE.md)
2. Update `android/app/build.gradle` with new keystore path
3. Rebuild release APK

---

## Optional: Deploy GitHub Pages (2 minutes)

You can deploy Privacy Policy and Terms of Service to GitHub Pages:

```bash
cat GITHUB-PAGES-SETUP.md
```

**Steps:**
1. Go to repository settings on GitHub
2. Pages → Source: main branch, /public-docs folder
3. Wait 1-2 minutes for deployment
4. URLs will be:
   - Privacy: `https://tribixbite.github.io/FlixCapacitor/privacy.html`
   - Terms: `https://tribixbite.github.io/FlixCapacitor/terms.html`

**Note:** This is optional. You can also use your personal email instead of hosted URLs in Play Store listing.

---

## Summary of Time Estimates

| Task | Duration | Required |
|------|----------|----------|
| Prepare for build | 5 min | Yes |
| Build release APK | 2-4 hours | Yes |
| Test release APK | 2-3 hours | Yes |
| Play Store submission | 90 min | Yes |
| **TOTAL USER WORK** | **5-7.5 hours** | - |
| Google review period | 7-10 days | - |
| **TOTAL CALENDAR TIME** | **2-3 weeks** | - |

---

## Resources

**Build Documentation:**
- `BUILD-RELEASE.md` - Detailed release build guide
- `MANUAL-TESTING-GUIDE.md` - Comprehensive testing checklist
- `PRE-LAUNCH-CHECKLIST.md` - Pre-submission verification

**Submission Documentation:**
- `AFTER-SCREENSHOTS.md` - Step-by-step Play Store submission
- `PLAY-STORE-LISTING.md` - Store listing content (copy/paste ready)
- `RELEASE-NOTES.md` - v1.0.0 release notes

**Support:**
- [Google Play Console Help](https://support.google.com/googleplay/android-developer/)
- [Capacitor Docs](https://capacitorjs.com/docs)
- [ProGuard Documentation](https://www.guardsquare.com/manual/home)

---

## What Happens After Submission?

### Google Review Process:
1. **Submitted** - App queued for review
2. **In Review** - Google testing your app (2-7 days typically)
3. **Published** or **Rejected**
   - If published: App goes live on Play Store
   - If rejected: Fix issues and resubmit

### If Approved:
1. App appears on Play Store
2. Users can find and install it
3. Monitor crash reports in Play Console
4. Respond to user reviews
5. Plan v1.1.0 updates

### If Rejected:
Common rejection reasons:
- Privacy policy issues
- Content rating mismatch
- App crashes on review device
- Policy violations

**Action:** Fix specific issues mentioned, rebuild, resubmit

---

## Conclusion

FlixCapacitor v1.0.0 is **100% production-ready** from an autonomous development standpoint. All code, documentation, and assets are complete.

The remaining work is **manual user work** that requires:
- Your keystore passwords (security requirement)
- Physical device for testing (quality assurance requirement)
- Google Play Console account (submission requirement)

**Estimated time to Play Store:** 2-3 weeks (5-7.5 hours of your work + 7-10 days Google review)

---

**Last Updated:** 2025-11-20
**Status:** ✅ READY FOR MANUAL USER WORK
**Next Step:** Build release APK with keystore passwords (Step 2 above)

---

**Good luck with your Play Store launch! 🚀**
