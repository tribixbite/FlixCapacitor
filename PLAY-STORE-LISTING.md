# FlixCapacitor - Google Play Store Listing

**Date:** 2025-11-16
**Status:** Draft - Ready for Review
**Phase:** 12E Day 3 - Play Store Assets & Listing

---

## App Information

### App Title
**FlixCapacitor - Torrent Streaming**

*Character count: 37/50*

### Short Description
Stream torrents instantly with native playback, cloud sync, and offline library.

*Character count: 80/80*

### Full Description

**Experience the future of torrent streaming on Android**

FlixCapacitor is a powerful, privacy-focused torrent streaming app that lets you watch your favorite movies and TV shows without waiting for downloads. With native jlibtorrent integration, beautiful mobile-first UI, and optional cloud sync, FlixCapacitor brings desktop-class torrent streaming to your Android device.

**🎬 Key Features**

**Native Torrent Streaming**
- Instant playback with jlibtorrent engine
- No external apps or servers required
- Stream while downloading
- Support for all video formats
- Sequential downloading for smooth playback

**📱 Beautiful Mobile Interface**
- Dark mode optimized design
- Gesture-based navigation
- Bottom navigation for one-handed use
- Smooth animations and transitions
- Responsive grid layouts for all screen sizes

**📚 Personal Collections**
- Organize torrents into custom collections
- Reorder content with drag-and-drop
- Cloud sync across multiple devices (optional)
- Automatic conflict resolution
- Share collections with friends

**❤️ Smart Library Management**
- Add local video files to your library
- SQLite-powered offline storage
- Fast full-text search
- Filter by quality, year, genre
- Resume playback from where you left off

**🎯 Advanced Features**
- Playback queue with auto-play next
- Picture-in-Picture (PiP) mode
- Subtitle support (auto-detect)
- Multi-file torrent selection
- Battery optimization
- Network-aware streaming (WiFi/cellular)
- Background playback support

**☁️ Optional Cloud Sync**
- Sync favorites across devices
- Backup settings to cloud
- Last Write Wins conflict resolution
- Privacy-first (end-to-end encryption option)
- Works offline, syncs when online

**🔒 Privacy & Security**
- No ads, no tracking (unless you opt-in)
- Local-first architecture
- Optional cloud features
- Open source (coming soon)
- GDPR compliant

**⚡ Performance Optimized**
- 89.8% smaller bundle size vs traditional apps
- Lazy loading for instant startup
- Efficient memory management
- Code splitting for faster load times
- ProGuard optimized release builds

**📊 Content Discovery**
- Browse curated public domain content
- Search popular torrents
- Filter by quality (720p, 1080p, 4K)
- View seeder/peer health
- IMDB integration for metadata

**🎨 Modern Technology Stack**
- TypeScript + Capacitor
- Native Android integration
- Supabase backend (optional)
- SQLite local storage
- jlibtorrent streaming engine

**Perfect for:**
- Cord-cutters looking for flexible streaming
- Privacy-conscious users
- Torrent enthusiasts
- Mobile streaming on the go
- Users with limited storage

**Requirements:**
- Android 7.0 (API 24) or higher
- 100MB free space
- Internet connection for streaming
- Optional: Supabase account for cloud sync

**Disclaimer:**
FlixCapacitor is a torrent streaming client. Users are responsible for ensuring they have the right to access and stream the content they choose. We do not host, provide, or endorse any specific content. Please respect copyright laws in your jurisdiction.

**Support & Feedback:**
- GitHub: https://github.com/tribixbite/FlixCapacitor
- Email: support@flixcapacitor.app
- Documentation: https://docs.flixcapacitor.app

*Character count: 2,961/4,000*

---

## Category & Classification

**Primary Category:** Entertainment
**Sub-Category:** Video Players & Editors

**Tags/Keywords:**
- torrent
- streaming
- video player
- movies
- tv shows
- anime
- torrent client
- p2p
- media player
- offline viewing

---

## Content Rating

### Target Audience
- **Primary:** Adults 18+
- **Secondary:** Teens 13-17 (with parental guidance)

### Content Rating Questionnaire Responses

**Does your app contain:**

1. **Violence or Gore?** No
   - The app itself contains no violent content
   - User-streamed content responsibility lies with the user

2. **Sexual Content?** No
   - The app contains no sexual content
   - Users responsible for content they choose to stream

3. **Profanity?** No
   - The app interface contains no profanity

4. **Drug/Alcohol/Tobacco Reference?** No
   - The app contains no substance references

5. **Fear or Horror Themes?** No
   - The app contains no horror themes

6. **Gambling?** No
   - No gambling mechanics or simulations

7. **Controlled Substances?** No
   - No controlled substance content

8. **Crude Humor?** No
   - Professional, clean interface

9. **Discrimination?** No
   - Inclusive, accessible design

10. **Social Features?**
    - Optional: Collection sharing
    - Optional: Cloud sync (no user-to-user chat)
    - No social networking features

11. **User-Generated Content?** No
    - Users organize their own content
    - No public content sharing platform
    - No user uploads to servers

12. **Location Sharing?** No
    - No location tracking or sharing

13. **Purchases?** No
    - 100% free app
    - No in-app purchases
    - No subscriptions
    - No ads

**Expected Rating:** Teen (13+) or Mature (17+)
- Due to torrent content responsibility disclaimer

---

## Technical Details

### Version Information
- **Version Name:** 1.0.0
- **Version Code:** 1
- **Minimum SDK:** 24 (Android 7.0)
- **Target SDK:** 35 (Android 15)

### APK Information
- **Release APK Size:** ~45-50 MB (estimated with ProGuard)
- **Debug APK Size:** 76 MB
- **Install Size:** ~100-150 MB (with cache)

### Permissions Required

**Essential Permissions:**
```xml
<!-- Storage -->
<uses-permission android:name="android.permission.READ_EXTERNAL_STORAGE" />
<uses-permission android:name="android.permission.WRITE_EXTERNAL_STORAGE" />

<!-- Network -->
<uses-permission android:name="android.permission.INTERNET" />
<uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />

<!-- Torrent Streaming -->
<uses-permission android:name="android.permission.WAKE_LOCK" />
<uses-permission android:name="android.permission.FOREGROUND_SERVICE" />
```

**Optional Permissions:**
```xml
<!-- For optimal performance -->
<uses-permission android:name="android.permission.REQUEST_IGNORE_BATTERY_OPTIMIZATIONS" />
```

### Supported Languages
- **Launch:** English (US)
- **Future:** Spanish, Portuguese, French, German

### Supported Devices
- **Phones:** ✅ Optimized
- **Tablets:** ✅ Supported (7-10 inch)
- **Android TV:** ⏳ Future support planned
- **Wear OS:** ❌ Not applicable
- **ChromeOS:** ⏳ Future support planned

### Supported Architectures
- **ARM64-v8a:** ✅ Primary
- **ARMv7:** ✅ Supported
- **x86:** ⏳ Future
- **x86_64:** ⏳ Future

---

## Privacy & Data Safety

### Data Collection
**We collect minimal data:**

**Collected Locally (Never leaves device unless cloud sync enabled):**
- Favorite movies/shows
- Playback history
- Settings preferences
- Collection organization
- Torrent metadata

**Collected with Cloud Sync (Optional, opt-in only):**
- User email (authentication only)
- Encrypted favorites list
- Encrypted settings backup
- Collection metadata
- Last sync timestamp

**Collected for Analytics (Optional, opt-in only):**
- Anonymous usage statistics
- Crash reports (via Sentry)
- Performance metrics
- Feature usage analytics

### Data Usage
- **Local storage:** SQLite database (encrypted)
- **Cloud sync:** Supabase (encrypted in transit and at rest)
- **No selling of data:** We never sell user data
- **No ads:** No advertising or tracking pixels
- **No third-party sharing:** Data stays with you and our services only

### User Control
- ✅ Opt-in cloud sync
- ✅ Opt-in analytics
- ✅ Delete all data at any time
- ✅ Export data
- ✅ Account deletion
- ✅ Clear cache and history

### Security
- **Encryption:** TLS/SSL for all network communication
- **Authentication:** Supabase secure authentication
- **Local storage:** SQLite with optional encryption
- **No password storage:** Authentication handled by Supabase
- **Regular security updates:** Active maintenance

---

## Marketing Assets Required

### App Icon
**Specifications:**
- **Size:** 512x512 pixels
- **Format:** 32-bit PNG
- **Color Space:** sRGB
- **Alpha Channel:** Yes
- **Max File Size:** 1MB

**Design Notes:**
- ⚡ Lightning bolt icon (brand symbol)
- Dark background with gradient
- High contrast for visibility
- Works at all sizes (48dp to 512px)

### Feature Graphic
**Specifications:**
- **Size:** 1024x500 pixels
- **Format:** JPG or PNG
- **Max File Size:** 1MB

**Design Concept:**
- App name: "FlixCapacitor"
- Tagline: "Stream Instantly"
- Visual: Lightning bolt + play button + mobile device
- Color scheme: Dark with red/blue accents
- Modern, clean design

### Screenshots

**Phone Screenshots (Required - Minimum 2, Maximum 8):**
- **Size:** 1080x1920 or 1920x1080 (16:9 ratio)
- **Format:** JPG or PNG
- **Max File Size:** 8MB per screenshot

**Recommended Screenshots:**
1. **Home Screen** - Browse movies grid with bottom nav
2. **Movie Detail** - Detail view with torrents and "Add to Collection"
3. **Video Player** - Video playing with controls
4. **Collections** - Collections grid view
5. **Collection Detail** - Torrent list with reordering
6. **Library** - Personal library with local files
7. **Settings** - Settings screen with cloud sync
8. **Search** - Search results with filters

**Tablet Screenshots (Optional - Minimum 1, Maximum 8):**
- **Size:** 2048x1536 or 1536x2048
- **Format:** JPG or PNG
- **Max File Size:** 8MB per screenshot

**Design Guidelines:**
- Clean, uncluttered screenshots
- Show key features
- Use real content (not Lorem Ipsum)
- Annotations optional but helpful
- High quality (no compression artifacts)
- Dark mode screenshots (matches app theme)

### Promotional Video (Optional)
**Specifications:**
- **Platform:** YouTube
- **Length:** 30 seconds to 2 minutes
- **Format:** YouTube URL only
- **Resolution:** 1080p minimum

**Video Content:**
- Quick app walkthrough
- Key features demonstration
- Smooth transitions
- Professional voiceover or text overlays
- Call to action at end

---

## Store Listing Checklist

### Content
- [x] App title (37/50 chars)
- [x] Short description (80/80 chars)
- [x] Full description (2,961/4,000 chars)
- [x] Category selection
- [x] Content rating questionnaire
- [ ] Privacy policy URL
- [ ] Terms of service URL

### Graphics
- [ ] App icon (512x512)
- [ ] Feature graphic (1024x500)
- [ ] Phone screenshots (minimum 2, target 8)
- [ ] Tablet screenshots (optional, target 4)
- [ ] Promotional video (optional)

### Technical
- [x] Release APK (signed with ProGuard)
- [x] Version code and name
- [x] Supported devices
- [x] Supported languages
- [ ] Content rating certificate

### Legal
- [x] Privacy policy drafted
- [x] Terms of service drafted
- [x] GDPR compliance documented
- [ ] Copyright verification
- [ ] Open source license

### Marketing
- [ ] Feature announcement
- [ ] Social media posts
- [ ] Press release (optional)
- [ ] Landing page (optional)

---

## Launch Timeline

### Pre-Launch (Week -2)
- [ ] Finalize all store assets
- [ ] Complete content rating
- [ ] Final APK testing
- [ ] Privacy policy live
- [ ] Terms of service live

### Closed Beta (Week -1)
- [ ] Upload to Play Console (closed track)
- [ ] Invite 10-15 internal testers
- [ ] Gather feedback
- [ ] Fix critical bugs
- [ ] Performance validation

### Open Beta (Week 0)
- [ ] Promote to open beta
- [ ] Gradual rollout (1% → 5% → 20% → 50%)
- [ ] Monitor crash reports
- [ ] Respond to feedback
- [ ] Iterate based on issues

### Production Release (Week 1+)
- [ ] Promote to production
- [ ] Staged rollout (100%)
- [ ] Monitor metrics
- [ ] Support users
- [ ] Plan v1.1.0 updates

---

## Contact & Links

**Developer:** tribixbite
**Email:** support@flixcapacitor.app
**Website:** https://flixcapacitor.app (coming soon)
**GitHub:** https://github.com/tribixbite/FlixCapacitor
**Privacy Policy:** https://github.com/tribixbite/FlixCapacitor/blob/main/PRIVACY.md
**Terms of Service:** https://github.com/tribixbite/FlixCapacitor/blob/main/TERMS.md
**Documentation:** https://github.com/tribixbite/FlixCapacitor/blob/main/docs/

---

**Last Updated:** 2025-11-16
**Next Review:** Before Play Store submission
**Status:** ✅ Ready for asset creation
