#!/bin/bash
# FlixCapacitor TODO Cleanup Script
# Identifies obsolete TODO comments that reference already-implemented features

echo "=== FlixCapacitor TODO Cleanup ==="
echo ""
echo "Scanning for obsolete TODO comments that reference completed features..."
echo ""

# Define obsolete TODOs (already implemented)
declare -A OBSOLETE_TODOS=(
    ["Implement folder picker"]="DirectoryPicker plugin with Android SAF already implemented"
    ["Add folder picker to select directories"]="DirectoryPicker plugin with Android SAF already implemented"
    ["Integrate with real TV show APIs"]="TMDB/OMDB API integration already complete"
    ["Replace with real API calls"]="API integration already implemented"
    ["Integrate with real anime APIs"]="Anime providers already implemented"
)

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Find all TODO comments
found_count=0
obsolete_count=0

echo "📋 Scanning source files for TODO comments..."
echo ""

while IFS= read -r line; do
    file=$(echo "$line" | cut -d: -f1)
    line_num=$(echo "$line" | cut -d: -f2)
    comment=$(echo "$line" | cut -d: -f3-)

    found_count=$((found_count + 1))

    # Check if this TODO is obsolete
    is_obsolete=false
    reason=""

    for key in "${!OBSOLETE_TODOS[@]}"; do
        if echo "$comment" | grep -qi "$key"; then
            is_obsolete=true
            reason="${OBSOLETE_TODOS[$key]}"
            obsolete_count=$((obsolete_count + 1))
            break
        fi
    done

    if [ "$is_obsolete" = true ]; then
        echo -e "${RED}[OBSOLETE]${NC} $file:$line_num"
        echo "  Comment: $comment"
        echo -e "  ${GREEN}Reason: $reason${NC}"
        echo ""
    else
        echo -e "${YELLOW}[KEEP]${NC} $file:$line_num"
        echo "  Comment: $comment"
        echo ""
    fi
done < <(grep -rn "// TODO\|# TODO\|/\* TODO" --include="*.ts" --include="*.tsx" --include="*.js" src/ 2>/dev/null)

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📊 Summary:"
echo "  Total TODO comments found: $found_count"
echo "  Obsolete (should be removed): $obsolete_count"
echo "  Valid (keep for future work): $((found_count - obsolete_count))"
echo ""

if [ $obsolete_count -gt 0 ]; then
    echo -e "${YELLOW}⚠️  Recommendation:${NC} Remove obsolete TODOs in next code cleanup session"
    echo ""
    echo "These TODOs reference features that are already implemented and no longer"
    echo "need tracking. Removing them will reduce code clutter."
    echo ""
    echo "See TODO-AUDIT.md for detailed analysis of all TODO comments."
else
    echo -e "${GREEN}✅ No obsolete TODOs found!${NC}"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
