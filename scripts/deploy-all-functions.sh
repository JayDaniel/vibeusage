#!/bin/bash
# 批量部署所有 Supabase Edge Functions (无交互)
# Created by Skyler Liu on 2026-03-14

set -euo pipefail

PROJECT_REF="llzgqbytjhcizqixvhwm"
ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
FUNCTIONS_DIR="$ROOT_DIR/supabase/functions"

echo "=== VibeUsage Edge Functions Batch Deploy ==="
echo "Project: $PROJECT_REF"
echo ""

# 获取所有函数目录
FUNC_DIRS=$(find "$FUNCTIONS_DIR" -mindepth 1 -maxdepth 1 -type d | sort)
TOTAL=$(echo "$FUNC_DIRS" | wc -l | tr -d ' ')

echo "Found $TOTAL functions to deploy"
echo ""

SUCCESS=0
FAILED=0
FAILED_NAMES=""
COUNT=0

for FUNC_DIR in $FUNC_DIRS; do
  FUNC_NAME=$(basename "$FUNC_DIR")
  COUNT=$((COUNT + 1))

  echo "[$COUNT/$TOTAL] Deploying $FUNC_NAME..."

  if supabase functions deploy "$FUNC_NAME" \
    --no-verify-jwt \
    --use-api \
    --project-ref "$PROJECT_REF" 2>&1; then
    SUCCESS=$((SUCCESS + 1))
    echo "  -> OK"
  else
    FAILED=$((FAILED + 1))
    FAILED_NAMES="$FAILED_NAMES $FUNC_NAME"
    echo "  -> FAILED"
  fi
done

echo ""
echo "=== Deploy Summary ==="
echo "Total:   $TOTAL"
echo "Success: $SUCCESS"
echo "Failed:  $FAILED"
if [ -n "$FAILED_NAMES" ]; then
  echo "Failed functions:$FAILED_NAMES"
fi
