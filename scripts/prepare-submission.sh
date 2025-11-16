#!/bin/bash

# FlixCapacitor - Play Store Submission Preparation Script
# Verifies all assets and provides submission readiness report
#
# Usage: ./scripts/prepare-submission.sh

# Note: Not using 'set -e' to avoid issues with counter increments

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

ERRORS=0
WARNINGS=0
SUCCESS=0

echo "╔════════════════════════════════════════════════════════════════╗"
echo "║   FlixCapacitor - Play Store Submission Readiness Check       ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo

# Function to format bytes to human-readable size
format_bytes() {
    local bytes=$1
    if [ $bytes -lt 1024 ]; then
        echo "${bytes}B"
    elif [ $bytes -lt 1048576 ]; then
        echo "$((bytes / 1024))KiB"
    else
        echo "$((bytes / 1048576))MiB"
    fi
}

# Function to print status
print_status() {
    local status=$1
    local message=$2
    case $status in
        "success")
            echo -e "${GREEN}✅${NC} $message"
            ((SUCCESS++))
            ;;
        "warning")
            echo -e "${YELLOW}⚠️ ${NC} $message"
            ((WARNINGS++))
            ;;
        "error")
            echo -e "${RED}❌${NC} $message"
            ((ERRORS++))
            ;;
        "info")
            echo -e "${BLUE}ℹ️ ${NC} $message"
            ;;
    esac
}

# Check app icon
echo "━━━ 📦 Play Store Assets ━━━"
if [ -f "play-store-assets/app-icon-512.png" ]; then
    SIZE=$(stat -c%s "play-store-assets/app-icon-512.png" 2>/dev/null || stat -f%z "play-store-assets/app-icon-512.png" 2>/dev/null)
    if [ $SIZE -lt 1048576 ]; then
        print_status "success" "App icon (512x512px, $(format_bytes $SIZE))"
    else
        print_status "warning" "App icon too large ($(format_bytes $SIZE) > 1MB)"
    fi
else
    print_status "error" "App icon missing (play-store-assets/app-icon-512.png)"
fi

# Check feature graphic
if [ -f "play-store-assets/feature-graphic-1024x500.png" ]; then
    SIZE=$(stat -c%s "play-store-assets/feature-graphic-1024x500.png" 2>/dev/null || stat -f%z "play-store-assets/feature-graphic-1024x500.png" 2>/dev/null)
    if [ $SIZE -lt 1048576 ]; then
        print_status "success" "Feature graphic (1024x500px, $(format_bytes $SIZE))"
    else
        print_status "warning" "Feature graphic too large ($(format_bytes $SIZE) > 1MB)"
    fi
else
    print_status "error" "Feature graphic missing"
fi

# Check screenshots
echo
echo "━━━ 📸 Screenshots ━━━"
SCREENSHOT_COUNT=$(find play-store-assets/screenshots/phone/ -type f \( -name "*.png" -o -name "*.jpg" \) 2>/dev/null | wc -l)
if [ $SCREENSHOT_COUNT -ge 6 ] && [ $SCREENSHOT_COUNT -le 8 ]; then
    print_status "success" "Phone screenshots ($SCREENSHOT_COUNT/6-8)"
    echo
    echo "   Screenshots found:"
    find play-store-assets/screenshots/phone/ -type f \( -name "*.png" -o -name "*.jpg" \) 2>/dev/null | while read file; do
        SIZE=$(stat -c%s "$file" 2>/dev/null || stat -f%z "$file" 2>/dev/null)
        echo "   • $(basename "$file") ($(format_bytes $SIZE))"
    done
elif [ $SCREENSHOT_COUNT -eq 0 ]; then
    print_status "error" "No screenshots found (need 6-8)"
    print_status "info" "Follow SCREENSHOT-URLS.md for capture instructions"
    print_status "info" "Server running at: http://localhost:3000/"
else
    print_status "warning" "Screenshot count: $SCREENSHOT_COUNT (recommended: 6-8)"
fi

# Check legal documents
echo
echo "━━━ 📄 Legal Documents ━━━"
if [ -f "public-docs/privacy.html" ]; then
    print_status "success" "Privacy Policy HTML"
else
    print_status "error" "Privacy Policy HTML missing"
fi

if [ -f "public-docs/terms.html" ]; then
    print_status "success" "Terms of Service HTML"
else
    print_status "error" "Terms of Service HTML missing"
fi

# Check hosting readiness
echo
echo "━━━ 🌐 Hosting Deployment ━━━"
if [ -f "public-docs/README.md" ]; then
    print_status "success" "Deployment guide available"
    print_status "info" "Deploy via: GitHub Pages (5 min) - See public-docs/README.md"
else
    print_status "warning" "Deployment guide missing"
fi

# Check documentation
echo
echo "━━━ 📚 Documentation ━━━"
DOCS=("PLAY-STORE-LISTING.md" "AFTER-SCREENSHOTS.md" "BUILD-RELEASE.md" "MANUAL-TESTING-GUIDE.md")
for doc in "${DOCS[@]}"; do
    if [ -f "$doc" ]; then
        print_status "success" "$doc"
    else
        print_status "warning" "$doc missing"
    fi
done

# Check build system
echo
echo "━━━ 🔧 Build Configuration ━━━"
if [ -f "build-and-install.sh" ]; then
    print_status "success" "Build script (build-and-install.sh)"
else
    print_status "error" "Build script missing"
fi

if [ -f "android/app/flixcapacitor-release.keystore" ]; then
    print_status "success" "Release keystore"
else
    print_status "error" "Release keystore missing (expected: android/app/flixcapacitor-release.keystore)"
fi

if [ -f "android/app/proguard-rules.pro" ]; then
    print_status "success" "ProGuard rules"
else
    print_status "warning" "ProGuard rules missing"
fi

# Check production build
echo
echo "━━━ 📦 Production Build ━━━"
if [ -d "dist" ] && [ "$(ls -A dist 2>/dev/null)" ]; then
    DIST_SIZE=$(du -sh dist 2>/dev/null | awk '{print $1}')
    print_status "success" "Production build exists ($DIST_SIZE)"
else
    print_status "warning" "Production build not found (run: npm run build)"
fi

# Check security
echo
echo "━━━ 🔐 Security ━━━"
VULNS=$(npm audit --production 2>&1 | grep -oP '\d+(?= vulnerabilities)' | head -1 || echo "0")
if [ "$VULNS" = "0" ]; then
    print_status "success" "No production vulnerabilities"
else
    print_status "warning" "$VULNS production vulnerabilities found"
fi

# Check git status
echo
echo "━━━ 📊 Git Status ━━━"
if git diff-index --quiet HEAD -- 2>/dev/null; then
    print_status "success" "Working tree clean"
else
    print_status "warning" "Uncommitted changes present"
fi

COMMITS_AHEAD=$(git rev-list --count origin/main..HEAD 2>/dev/null || echo "unknown")
if [ "$COMMITS_AHEAD" != "unknown" ] && [ $COMMITS_AHEAD -gt 0 ]; then
    print_status "info" "$COMMITS_AHEAD commits ahead of origin/main"
fi

# Summary
echo
echo "╔════════════════════════════════════════════════════════════════╗"
echo "║                      Verification Summary                      ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo
echo -e "${GREEN}Success: $SUCCESS${NC} | ${YELLOW}Warnings: $WARNINGS${NC} | ${RED}Errors: $ERRORS${NC}"
echo

# Provide guidance
if [ $ERRORS -eq 0 ] && [ $SCREENSHOT_COUNT -ge 6 ]; then
    echo -e "${GREEN}✅ READY FOR PLAY STORE SUBMISSION${NC}"
    echo
    echo "Next steps:"
    echo "1. Optional: Deploy hosting (5 min)"
    echo "   → See: public-docs/README.md"
    echo
    echo "2. Build release APK (20 min)"
    echo "   → Run: ./build-and-install.sh"
    echo "   → Test all features thoroughly"
    echo
    echo "3. Submit to Play Store (90 min)"
    echo "   → Follow: AFTER-SCREENSHOTS.md"
    echo
elif [ $SCREENSHOT_COUNT -eq 0 ]; then
    echo -e "${RED}🔴 PRIMARY BLOCKER: Screenshot Capture${NC}"
    echo
    echo "You need to capture 6-8 phone screenshots."
    echo
    echo "Steps:"
    echo "1. Ensure dev server is running:"
    echo "   → npm run dev"
    echo
    echo "2. Open Android browser to: http://localhost:3000/"
    echo
    echo "3. Follow screenshot guide:"
    echo "   → SCREENSHOT-URLS.md"
    echo
    echo "4. Capture screenshots (Volume Down + Power)"
    echo
    echo "5. Move to: play-store-assets/screenshots/phone/"
    echo
    echo "6. Re-run this script to verify"
    echo
elif [ $SCREENSHOT_COUNT -lt 6 ]; then
    echo -e "${YELLOW}⚠️  NEED MORE SCREENSHOTS${NC}"
    echo
    echo "Current: $SCREENSHOT_COUNT screenshots"
    echo "Required: 6-8 screenshots"
    echo
    echo "Follow SCREENSHOT-URLS.md for remaining screenshots."
    echo
else
    echo -e "${YELLOW}⚠️  REVIEW ERRORS AND WARNINGS ABOVE${NC}"
    echo
    echo "Fix the $ERRORS error(s) before submission."
    echo
fi

# Exit with error code if critical issues
if [ $ERRORS -gt 0 ]; then
    exit 1
else
    exit 0
fi
