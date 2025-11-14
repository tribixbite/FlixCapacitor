# FlixCapacitor - Production Monitoring Guide

**Version:** 1.0.0
**Date:** 2025-11-14  
**Status:** Production Ready

## Overview

This guide explains how to set up and use production monitoring for FlixCapacitor using Sentry crash reporting and performance monitoring.

## Table of Contents

- [Why Monitoring?](#why-monitoring)
- [Sentry Setup](#sentry-setup)
- [Configuration](#configuration)
- [Privacy & Compliance](#privacy--compliance)
- [Usage](#usage)
- [Troubleshooting](#troubleshooting)
- [Best Practices](#best-practices)

## Why Monitoring?

Production monitoring helps you:

- **Detect crashes** before users report them
- **Debug issues** with detailed stack traces
- **Track performance** (app startup, API calls)
- **Monitor trends** (crash-free rate, error frequency)
- **Improve quality** based on real-world data

**FlixCapacitor uses Sentry** for crash reporting and performance monitoring.

## Sentry Setup

### Step 1: Create Sentry Account

1. Go to https://sentry.io
2. Sign up for free account (free tier includes 5,000 errors/month)
3. Create a new project:
   - Platform: **Android**
   - Project name: **flixcapacitor**
   - Team: Your team

### Step 2: Get Your DSN

1. Go to Project Settings > Client Keys (DSN)
2. Copy your DSN (looks like: `https://abc123@o123456.ingest.sentry.io/789012`)
3. Keep this secure - it's like an API key

### Step 3: Configure Environment

Add to your `.env` file:

```bash
# Sentry Configuration
VITE_SENTRY_DSN=https://your-dsn-here@o123456.ingest.sentry.io/789012
VITE_SENTRY_ENVIRONMENT=production
VITE_SENTRY_DEBUG=false
```

**Never commit .env to git!** (Already in .gitignore)

### Step 4: Rebuild App

```bash
# Build with Sentry enabled
npm run build
npx cap sync android
./build-release.sh
```

Sentry will automatically start reporting crashes.

## Configuration

### Environment Variables

**Required:**
- `VITE_SENTRY_DSN` - Your Sentry DSN (leave empty to disable)

**Optional:**
- `VITE_SENTRY_ENVIRONMENT` - Environment name (default: production)
- `VITE_SENTRY_DEBUG` - Enable debug logging (default: false)

### Configuration File

See `src/config/sentry-config.ts` for advanced configuration:

```typescript
import { initializeSentry, getSentryConfig } from './config/sentry-config';

// Initialize Sentry early in app startup
initializeSentry(getSentryConfig());
```

### Features Enabled

**Crash Reporting:**
- Automatic crash detection
- Stack traces with line numbers
- Device information (model, OS version)
- App version tracking

**Performance Monitoring:**
- 20% transaction sampling (configurable)
- App startup time
- Network request duration
- Database query performance

**Privacy Features:**
- Sensitive data scrubbing
- User opt-out support
- GDPR/CCPA compliant
- No PII collection

## Privacy & Compliance

### What Data Is Collected?

**Crash Data:**
- Stack trace (file names, line numbers, method names)
- Exception type and message
- Device model and OS version
- App version
- Timestamp

**Performance Data:**
- Transaction duration
- Network request timing
- Screen load times

**NOT Collected:**
- User's personal information
- File paths with personal data (scrubbed)
- Passwords or credentials
- User-entered text

### Privacy Compliance

**GDPR (EU):**
- ✅ Data processed for legitimate interest (app stability)
- ✅ User can opt-out (Settings > Advanced > Crash Reporting)
- ✅ Data retention: 90 days
- ✅ Data deletion: On request

**CCPA (California):**
- ✅ User can opt-out
- ✅ Data not sold to third parties
- ✅ Transparent privacy policy

**User Opt-Out:**

Users can disable crash reporting in:
Settings > Advanced > Crash Reporting (toggle off)

### Privacy Policy Disclosure

Already included in PRIVACY.md:
- Section 4: Crash Reports (Sentry)
- Retention: 90 days
- Opt-out: Available in settings
- Purpose: Bug fixing and stability

## Usage

### Automatic Crash Reporting

Crashes are automatically reported:

```typescript
// This crash will be automatically reported
throw new Error('Something went wrong!');
```

### Manual Error Reporting

For caught errors:

```typescript
import { captureException } from './config/sentry-config';

try {
  // Risky operation
  dangerousFunction();
} catch (error) {
  // Report to Sentry but don't crash app
  captureException(error as Error, {
    context: 'torrent-streaming',
    torrentHash: 'abc123',
  });

  // Show user-friendly error
  showToast('Failed to start stream');
}
```

### Manual Message Reporting

For important events:

```typescript
import { captureMessage } from './config/sentry-config';

// Report warning
captureMessage('Large torrent file detected', 'warning', {
  fileSize: '10GB',
  fileName: 'movie.mkv',
});
```

### User Context

When user signs in to cloud sync:

```typescript
import { setUserContext, clearUserContext } from './config/sentry-config';

// On sign in
setUserContext({
  id: user.id,
  email: user.email,
});

// On sign out
clearUserContext();
```

### Breadcrumbs

Track events leading to crashes:

```typescript
import { addBreadcrumb } from './config/sentry-config';

// Track user actions
addBreadcrumb('User started torrent stream', {
  magnetLink: '...',
  fileName: 'movie.mkv',
});

addBreadcrumb('Video player initialized');

addBreadcrumb('Playback started');

// If app crashes, Sentry includes these breadcrumbs
```

## Sentry Dashboard

### Viewing Issues

1. Go to https://sentry.io
2. Select **flixcapacitor** project
3. View **Issues** tab

**Issue Details:**
- Stack trace
- Device information
- Breadcrumbs (events before crash)
- User context (if set)
- Frequency and trends

### Resolving Issues

1. Click on issue
2. Review stack trace
3. Fix bug in code
4. Deploy new version
5. Mark issue as "Resolved"

Sentry tracks if issue reoccurs.

### Release Tracking

Tag releases in `sentry-config.ts`:

```typescript
release: 'flixcapacitor@1.0.1'
```

Sentry shows:
- New issues in this release
- Resolved issues from previous releases
- Regression detection

### Performance Monitoring

View **Performance** tab:

- Transaction overview
- Slowest operations
- Error rates by transaction
- Percentile charts (p50, p95, p99)

### Alerts

Set up alerts in Sentry:

1. Go to **Alerts**
2. Create alert rule:
   - New issue detected
   - Issue frequency spike
   - Performance regression
3. Notification: Email, Slack, PagerDuty, etc.

## Troubleshooting

### Sentry Not Reporting

**Check:**

1. **DSN configured?**
   ```bash
   grep VITE_SENTRY_DSN .env
   ```

2. **Sentry initialized?**
   ```typescript
   import { isSentryEnabled } from './config/sentry-config';
   console.log('Sentry enabled:', isSentryEnabled());
   ```

3. **Internet connection?**
   - Sentry requires network to send reports

4. **ProGuard issues?**
   - Check ProGuard rules in `proguard-rules.pro`
   - Ensure Sentry classes are kept

### Missing Stack Traces

**Cause:** ProGuard obfuscates code

**Solution:** Upload ProGuard mapping files to Sentry

```bash
# After release build
cd android/app/build/outputs/mapping/release

# Upload to Sentry
sentry-cli upload-proguard \
  --auth-token YOUR_AUTH_TOKEN \
  --org YOUR_ORG \
  --project flixcapacitor \
  mapping.txt
```

### Too Many Errors

**Causes:**
- Network errors (common in mobile apps)
- Third-party library issues
- Non-critical errors

**Solutions:**

1. **Ignore specific errors** in `sentry-config.ts`:
   ```typescript
   ignoreErrors: [
     'NetworkError',
     'Failed to fetch',
     // Add more patterns
   ]
   ```

2. **Filter by environment:**
   - Only report production errors
   - Disable in development

3. **Rate limiting:**
   - Sentry has automatic rate limiting
   - Adjust sample rates

### High Sentry Costs

**Solutions:**

1. **Reduce sample rate** in `sentry-config.ts`:
   ```typescript
   tracesSampleRate: 0.1, // 10% of transactions
   ```

2. **Filter transactions:**
   - Only monitor critical operations
   - Ignore frequent non-critical calls

3. **Set quota:**
   - Sentry > Settings > Quotas
   - Set monthly quota limit

4. **Upgrade plan:**
   - Free: 5,000 errors/month
   - Team: 50,000 errors/month ($26/month)
   - Business: Higher limits

## Best Practices

### 1. Tag Releases

Always tag releases for better tracking:

```typescript
release: 'flixcapacitor@1.0.1'
```

### 2. Use Breadcrumbs

Add breadcrumbs for important events:

```typescript
addBreadcrumb('User action', { action: 'play_video' });
```

### 3. Add Context

Include relevant context with errors:

```typescript
captureException(error, {
  screen: 'VideoPlayer',
  torrentHash: 'abc123',
});
```

### 4. Handle Errors Gracefully

Catch and report errors, but keep app functional:

```typescript
try {
  riskyOperation();
} catch (error) {
  captureException(error);
  showUserFriendlyError();
}
```

### 5. Monitor Performance

Track slow operations:

```typescript
import * as Sentry from '@sentry/capacitor';

const transaction = Sentry.startTransaction({
  name: 'torrent-stream-start',
});

await startTorrentStream();

transaction.finish();
```

### 6. Clean Up Sensitive Data

Ensure no PII in error messages:

```typescript
// Bad
throw new Error(`User ${email} failed to login`);

// Good
throw new Error('Login failed');
captureException(error, { userId: hashedUserId });
```

### 7. Set Up Alerts

Get notified of critical issues:

- New crash type detected
- Crash rate > 1%
- Performance regression

### 8. Review Regularly

Weekly review:
- Check new issues
- Review crash-free rate
- Monitor performance trends
- Respond to regressions

### 9. Fix High-Impact Issues First

Prioritize by:
- Frequency (affects many users)
- Severity (causes data loss)
- Recent regressions

### 10. Test Release Builds

Always test with Sentry enabled:

```bash
./build-release.sh
# Install and test on device
```

## Metrics to Monitor

### Crash-Free Rate

**Target:** > 99%

Check in Sentry Dashboard > Releases

**If below target:**
- Identify top crashes
- Fix critical issues
- Release hotfix

### Error Frequency

**Target:** Decreasing trend

**If increasing:**
- New bugs introduced
- Edge cases in production
- Performance degradation

### Performance

**Target:**
- App startup < 2s
- API calls < 500ms
- Video start < 3s

**If degraded:**
- Profile slow operations
- Optimize bottlenecks
- Consider caching

## Support

For Sentry issues:

- **Sentry Docs:** https://docs.sentry.io
- **Sentry Support:** support@sentry.io
- **FlixCapacitor Monitoring:** monitoring@flixcapacitor.app

For FlixCapacitor issues:

- **GitHub Issues:** https://github.com/tribixbite/FlixCapacitor/issues
- **Email:** support@flixcapacitor.app

---

**Last Updated:** 2025-11-14
**Version:** 1.0.0
**Status:** Production Ready
**Phase:** 12E Day 6 Complete
