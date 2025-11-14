# Privacy Policy for FlixCapacitor

**Effective Date:** November 14, 2025
**Last Updated:** November 14, 2025
**Version:** 1.0.0

## Introduction

FlixCapacitor ("we," "our," or "the app") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our mobile application.

**By using FlixCapacitor, you agree to the collection and use of information in accordance with this policy.**

## Our Privacy Commitment

FlixCapacitor is built with a **local-first architecture**, meaning:

- Your data stays on your device by default
- Cloud sync is entirely optional and opt-in
- You maintain full control over your data
- No personal information is required to use core features
- We do not sell or share your personal data for advertising

## Information We Collect

### 1. Local Data Storage (On Your Device)

FlixCapacitor stores the following data locally on your device using SQLite:

**What We Store:**
- **Favorites:** Movies and shows you mark as favorites
- **Watchlist:** Items you add to your watchlist
- **Playback History:** Videos you've watched and playback progress
- **Library Metadata:** Information about videos in your library
- **App Settings:** Your preferences and configuration
- **Search History:** Your recent searches (stored locally only)

**Storage Location:** SQLite database on your device
**Access:** Only you can access this data
**Retention:** Until you delete the app or clear data
**Backup:** Not automatically backed up unless you use device backup

**Data Privacy:**
- This data never leaves your device unless you explicitly enable cloud sync
- This data is protected by your device's security measures
- We cannot access this data

### 2. Optional Cloud Sync (Supabase)

If you choose to enable cloud sync, we sync the following data to our cloud backend:

**What We Sync:**
- **Favorites:** Your favorite movies and shows
- **Watchlist:** Items in your watchlist
- **App Settings:** Your app preferences

**Cloud Provider:** Supabase (PostgreSQL database)
**Encryption:** Data is encrypted in transit (HTTPS) and at rest
**Access:** Only you can access your synced data (Row-Level Security)
**Retention:** Until you delete your account or revoke sync
**Purpose:** Enable cross-device synchronization

**How to Enable:**
1. Go to Settings > Cloud Sync
2. Create an account or sign in
3. Enable "Sync Favorites" and/or "Sync Settings"

**How to Disable:**
1. Go to Settings > Cloud Sync
2. Click "Sign Out" or disable individual sync options
3. Your cloud data is retained unless you request deletion

**Account Deletion:**
- To delete your cloud account and all synced data, email privacy@flixcapacitor.app
- We will permanently delete all your data within 30 days

### 3. Metadata from Third-Party APIs

To provide movie and show information (posters, descriptions, ratings), we query:

**TMDB (The Movie Database) API:**
- **Data Sent:** Movie/show titles you search for or view
- **Data Received:** Metadata (posters, descriptions, ratings, cast)
- **Privacy Policy:** https://www.themoviedb.org/privacy-policy
- **Our Use:** Display information only, not stored with personal identifiers

**OMDB (Open Movie Database) API:**
- **Data Sent:** Movie/show titles you search for
- **Data Received:** Metadata (ratings, plot summaries)
- **Privacy Policy:** http://www.omdbapi.com/legal.htm
- **Our Use:** Display information only

**Your IP Address:** These services may log your IP address
**Our Control:** We do not control these third-party services
**Opt-Out:** Not possible if you want metadata; consider using VPN

### 4. Crash Reports (Sentry) - When Implemented

If you opt in to crash reporting, we collect:

**What We Collect:**
- **Device Information:** Model, OS version, app version
- **Crash Logs:** Stack traces, error messages
- **Usage Context:** Screen you were on, actions leading to crash

**Provider:** Sentry (https://sentry.io)
**Purpose:** Fix bugs and improve app stability
**Encryption:** Encrypted in transit
**Retention:** 90 days
**Opt-Out:** Settings > Advanced > Crash Reporting (toggle off)

**Sensitive Data:** We automatically redact:
- File paths containing personal information
- User-entered text
- Passwords or credentials

### 5. Analytics - Not Currently Implemented

**Current Status:** FlixCapacitor does NOT collect analytics data

**If We Add Analytics (Future):**
- **Purpose:** Understand feature usage, improve user experience
- **Data:** Feature usage, performance metrics (anonymous)
- **Opt-In:** You will be asked for permission
- **Opt-Out:** Available in Settings

## How We Use Your Information

### Local Data
- **Display:** Show your favorites, watchlist, history
- **Functionality:** Resume playback, remember settings
- **Search:** Provide search suggestions

### Cloud Sync Data (If Enabled)
- **Synchronization:** Keep data consistent across your devices
- **Backup:** Provide data recovery if you lose your device
- **Account Management:** Manage your sync preferences

### Metadata
- **Display:** Show posters, descriptions, ratings
- **Discovery:** Help you find content

### Crash Reports (If Enabled)
- **Bug Fixes:** Identify and fix app crashes
- **Stability:** Improve app reliability

## How We Share Your Information

**We do NOT sell, trade, or rent your personal information to others.**

### Third-Party Services

We share information with these trusted partners:

1. **Supabase (Cloud Sync):**
   - **Data Shared:** Favorites, watchlist, settings (only if you enable sync)
   - **Purpose:** Cloud storage and synchronization
   - **Privacy:** https://supabase.com/privacy
   - **Security:** Row-Level Security (RLS) ensures only you access your data

2. **TMDB/OMDB (Metadata):**
   - **Data Shared:** Movie/show titles you search
   - **Purpose:** Retrieve metadata
   - **Privacy:** See respective privacy policies

3. **Sentry (Crash Reporting - If Enabled):**
   - **Data Shared:** Crash logs, device info
   - **Purpose:** Bug fixing
   - **Privacy:** https://sentry.io/privacy/

### Legal Requirements

We may disclose your information if required by law or in response to:
- Valid legal process (subpoena, court order)
- Protection of our rights or property
- Investigation of fraud or security issues
- Protection of user safety or public safety

**Notification:** We will notify you of legal requests unless prohibited by law

## Data Security

We implement industry-standard security measures:

### Local Data
- **Device Security:** Protected by your device's OS security
- **Permissions:** App runs with minimal required permissions
- **Encryption:** SQLite database is protected by Android encryption (if enabled)

### Cloud Data
- **Encryption in Transit:** HTTPS/TLS for all network communication
- **Encryption at Rest:** Data encrypted in Supabase database
- **Row-Level Security:** PostgreSQL RLS ensures data isolation
- **Authentication:** Secure JWT-based authentication

### App Security
- **ProGuard:** Code obfuscation in release builds
- **No Hardcoded Secrets:** API keys stored securely
- **Input Validation:** Protection against injection attacks
- **Secure Storage:** Sensitive data stored in Android KeyStore

**Despite our efforts, no method of transmission or storage is 100% secure. We cannot guarantee absolute security.**

## Your Rights

### Under GDPR (EU Users)

You have the right to:

1. **Access:** Request a copy of your data
2. **Rectification:** Correct inaccurate data
3. **Erasure:** Delete your data ("right to be forgotten")
4. **Portability:** Receive your data in machine-readable format
5. **Object:** Object to processing of your data
6. **Restrict:** Restrict processing of your data
7. **Withdraw Consent:** Withdraw consent for cloud sync at any time

**How to Exercise Rights:**
- Email: privacy@flixcapacitor.app
- Include: Your account email (if applicable) and specific request
- Response Time: Within 30 days

### Under CCPA (California Users)

You have the right to:

1. **Know:** What personal information we collect
2. **Delete:** Request deletion of your personal information
3. **Opt-Out:** Opt-out of sale of personal information (we don't sell)
4. **Non-Discrimination:** Not be discriminated against for exercising rights

**How to Exercise Rights:**
- Email: privacy@flixcapacitor.app
- Toll-Free: [To be added if required]
- Response Time: Within 45 days

**We Do Not Sell Personal Information:** FlixCapacitor does not sell personal information

## Children's Privacy

FlixCapacitor is not intended for users under 17 years of age.

**We do not knowingly collect personal information from children under 17.**

If you believe a child under 17 has provided us with personal information:
- Email: privacy@flixcapacitor.app
- We will promptly delete the information

**Parental Controls:** Parents should monitor their children's app usage

## Data Retention

### Local Data
- **Retention:** Until you delete the app or clear data
- **User Control:** You can clear data anytime via Settings or device settings

### Cloud Sync Data
- **Active Accounts:** Retained while your account is active
- **Inactive Accounts:** Retained for 1 year after last login
- **After Deletion:** Permanently deleted within 30 days of account deletion

### Crash Reports
- **Retention:** 90 days from collection
- **Automatic Deletion:** After 90 days

### Metadata Cache
- **Retention:** Cached temporarily for performance
- **Expiration:** 7 days or until cache cleared

## International Data Transfers

**Cloud Sync Data:**
- Stored on Supabase servers (location depends on Supabase configuration)
- May be transferred to countries outside your country of residence
- Protected by standard contractual clauses and encryption

**Your Rights:** If you're in the EU, you maintain GDPR protections regardless of data location

## Changes to This Privacy Policy

We may update this Privacy Policy from time to time.

**Notification of Changes:**
- Updated "Last Updated" date at the top
- In-app notification of material changes
- Continued use after changes constitutes acceptance

**Review:** Please review this policy periodically

**Material Changes:** If we make material changes, we will:
- Notify you via in-app notification
- Request your consent if required by law
- Provide 30 days' notice before changes take effect

## Third-Party Links

FlixCapacitor may contain links to third-party websites or services:

- **Torrent Sources:** You may access external torrent sites
- **TMDB/OMDB:** Metadata links to external databases
- **Streaming Sources:** External video sources

**We are not responsible for the privacy practices of these third parties.**

**Recommendation:** Review the privacy policies of any third-party sites you visit

## Cookies and Tracking

**FlixCapacitor does not use cookies or tracking technologies.**

**WebView:** The app uses Android WebView for video playback, which may store:
- Cookies from video sources
- Local storage for playback settings

**Control:** Clear cookies via Settings > Advanced > Clear Cache

## Your Choices

### Opt-Out Options:

1. **Cloud Sync:** Disable in Settings > Cloud Sync
2. **Crash Reporting:** Disable in Settings > Advanced (when implemented)
3. **Analytics:** Opt-out in Settings (when implemented)
4. **Metadata:** Not possible without losing functionality
5. **Data Deletion:** Uninstall app or clear data

### Data Minimization:

FlixCapacitor follows data minimization principles:
- Only collects data necessary for functionality
- Does not collect personal information without consent
- Provides granular privacy controls

## Do Not Track (DNT)

We do not currently respond to Do Not Track signals because:
- We don't track users across sites
- We don't use tracking for advertising
- Our tracking is minimal and functional only

## Contact Us

If you have questions or concerns about this Privacy Policy:

**Email:** privacy@flixcapacitor.app
**GitHub Issues:** https://github.com/tribixbite/FlixCapacitor/issues
**Response Time:** Within 7 business days

**For GDPR Requests:** Include "GDPR Request" in subject line
**For CCPA Requests:** Include "CCPA Request" in subject line

## Data Protection Officer (DPO)

If required by GDPR, we will designate a Data Protection Officer.

**Current Status:** Not required (small organization)
**If Designated:** Contact information will be added here

## Supervisory Authority

If you're in the EU, you have the right to lodge a complaint with your local supervisory authority:

**List of EU DPAs:** https://edpb.europa.eu/about-edpb/board/members_en

## Consent

By using FlixCapacitor, you consent to:
- This Privacy Policy
- Collection and use of information as described
- Transfer of data as described

**Withdrawal of Consent:** You may withdraw consent by:
1. Disabling cloud sync
2. Uninstalling the app
3. Requesting account deletion

## Special Notice for California Residents

### California Consumer Privacy Act (CCPA)

**Categories of Personal Information:**
- Device identifiers (for crash reporting, if enabled)
- Usage data (local only)
- Account credentials (for cloud sync, if enabled)

**Business Purposes:**
- Provide app functionality
- Cloud synchronization (if enabled)
- Bug fixing (if crash reporting enabled)

**Third Parties We Share With:**
- Supabase (cloud sync, if enabled)
- Sentry (crash reporting, if enabled)
- TMDB/OMDB (metadata)

**Sale of Personal Information:** None
**Retention Period:** See "Data Retention" section
**Requests:** See "Your Rights" section

## Accessibility

If you have difficulty accessing this Privacy Policy:

- **Large Print:** Use device accessibility settings to increase text size
- **Screen Reader:** This policy is screen-reader compatible
- **Alternative Format:** Request by emailing privacy@flixcapacitor.app

---

**Summary:**

FlixCapacitor respects your privacy and follows these principles:

1. **Local-First:** Your data stays on your device by default
2. **Opt-In:** Cloud sync and telemetry require your explicit consent
3. **Transparent:** We clearly explain what data we collect and why
4. **Secure:** We use industry-standard security measures
5. **User Control:** You control your data and can delete it anytime
6. **No Sale:** We never sell your personal information
7. **Minimal Collection:** We only collect data necessary for functionality

**Questions?** Email privacy@flixcapacitor.app

---

**Document Information:**

- **Policy Version:** 1.0.0
- **Effective Date:** November 14, 2025
- **Last Updated:** November 14, 2025
- **Jurisdiction:** International (GDPR, CCPA compliant)
- **Language:** English (translations may be provided)

This Privacy Policy was created in compliance with:
- General Data Protection Regulation (GDPR)
- California Consumer Privacy Act (CCPA)
- Google Play Store policies
- Industry best practices
