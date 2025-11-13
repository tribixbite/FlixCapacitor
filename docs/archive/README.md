# Archived Documentation

This directory contains legacy documentation that is no longer relevant to the current FlixCapacitor Mobile architecture but preserved for historical reference.

## Archived Files

### Server-Side Architecture (Not Used in Mobile App)

- **STREAMING_SERVER.md** - Express server documentation
- **STREAMING_SERVER_API.md** - Express API endpoints
- **ANDROID_SETUP.md** - Setup instructions for Express server

**Why Archived:** The mobile app uses a native Android architecture with jlibtorrent (Java torrent client) and NanoHTTPD (Java HTTP server with dynamic port allocation) for local streaming. No Node.js/Express server is required or used.

**Historical Note:** Original implementation used hardcoded port 8888, which was replaced with dynamic port allocation (port 0, OS-assigned ephemeral ports) in 2025-11-13 to resolve app restart crashes. See `NATIVE-TORRENT-STREAMING.md` v1.1.0 for current implementation.

### Temporary Notes

- **REBUILD_INSTRUCTIONS.md** - Temporary rebuild instructions

**Why Archived:** Superseded by `build-and-install.sh` script and BUILD-AND-TEST.md documentation.

### Development Tools

- **BUN-TERMUX-NOTES.md** - Bun compatibility investigation

**Why Archived:** Project uses npm as the package manager. Bun is not compatible with Termux ARM64 environment.

### Processing Logs

- **PUBLIC_DOMAIN_PROCESSING.md** - Historical processing log for 890 public domain movies

**Why Archived:** Historical record of content curation. Not needed for app usage or development.

## Current Documentation

For up-to-date documentation, see the root directory:

- **QUICK-START.md** - User-friendly 5-minute setup guide
- **MANUAL-TESTING-GUIDE.md** - Manual testing procedures
- **README.md** - Technical architecture overview
- **PRODUCTION-READINESS.md** - Deployment checklist
- **NEXT-STEPS.md** - Current project status
- **CHANGELOG.md** - Complete version history
- **TODO-AUDIT.md** - Future development roadmap

---

**Date Archived:** 2025-11-13
**Reason:** Documentation cleanup to focus on current mobile-first architecture
