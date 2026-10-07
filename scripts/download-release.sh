#!/usr/bin/env bash
# download-release.sh - 从 GitHub Release 拉取核心安装包到本地 releases/ 目录
# 用法: ./scripts/download-release.sh [tag]     # tag 可选，默认 latest
# 示例: GH_TOKEN=xxx ./scripts/download-release.sh v0.1.0
#       GH_TOKEN=xxx ./scripts/download-release.sh

set -euo pipefail

REPO="shaoyihang2021/days-matter-desktop"
TAG="${1:-latest}"
TOKEN="${GH_TOKEN:-}"
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
DEST="$ROOT/releases/$TAG"
mkdir -p "$DEST"

echo "📦 Days Matter Desktop Release 下载器"
echo "   Repo:  $REPO"
echo "   Tag:   $TAG"
echo "   目标:  $DEST"
[ -n "$TOKEN" ] && echo "   Token: ✅ 已设置" || echo "   Token: ⚠️ 未设置 (公开 Release 无需 token)"
echo ""

# 构建 header
AUTH=()
[ -n "$TOKEN" ] && AUTH=(-H "Authorization: Bearer $TOKEN")

# 获取 release info
if [ "$TAG" = "latest" ]; then
  API_URL="https://api.github.com/repos/$REPO/releases/latest"
else
  API_URL="https://api.github.com/repos/$REPO/releases/tags/$TAG"
fi

echo "🔍 查询 Release..."
RELEASE_JSON=$(curl -s "${AUTH[@]}" "$API_URL")
if ! echo "$RELEASE_JSON" | python3 -c "import sys,json; json.load(sys.stdin)" 2>/dev/null; then
  echo "❌ API 返回无效 JSON"
  echo "$RELEASE_JSON" | head -3
  exit 1
fi

ACTUAL_TAG=$(echo "$RELEASE_JSON" | python3 -c "import sys,json; print(json.load(sys.stdin)['tag_name'])")
PUBLISHED=$(echo "$RELEASE_JSON" | python3 -c "import sys,json; print(json.load(sys.stdin)['published_at'])")
TOTAL_ASSETS=$(echo "$RELEASE_JSON" | python3 -c "import sys,json; print(len(json.load(sys.stdin)['assets']))")
echo "✅ 找到 Release: $ACTUAL_TAG  ($PUBLISHED)  共 $TOTAL_ASSETS 个 assets"
echo ""

# 筛选核心安装包 → 临时文件
echo "$RELEASE_JSON" | python3 -c "
import sys,json
d=json.load(sys.stdin)
assets=d['assets']
# 优先 Setup exe → win zip → dmg → mac zip → AppImage
priority = [
    lambda a: a['name'].lower().endswith('.exe') and 'setup' in a['name'].lower(),
    lambda a: a['name'].lower().endswith('.zip') and 'win' in a['name'].lower(),
    lambda a: a['name'].lower().endswith('.dmg'),
    lambda a: a['name'].lower().endswith('.zip') and 'mac' in a['name'].lower(),
    lambda a: a['name'].lower().endswith('.appimage'),
    lambda a: 'days-matter-desktop' in a['name'].lower() and a['size']>50_000_000,
]
selected=[]; seen=set()
for fn in priority:
    for a in assets:
        if a['name'] in seen: continue
        if fn(a):
            selected.append(a); seen.add(a['name']); break
for a in selected:
    print(f\"{a['name']}\t{a['size']}\t{a['browser_download_url']}\")
" > /tmp/dm_download_list.txt

echo "🎯 筛选到 $(wc -l < /tmp/dm_download_list.txt) 个核心包:"
echo ""

FAILED=0
while IFS=$'\t' read -r NAME SIZE URL; do
    [ -z "$NAME" ] && continue
    SIZE_MB=$(( SIZE / 1024 / 1024 ))
    TARGET="$DEST/$NAME"

    # 跳过已下载且大小匹配的 (±10%)
    if [ -f "$TARGET" ]; then
        LOCAL_SIZE=$(stat -c%s "$TARGET" 2>/dev/null || echo 0)
        if [ "$LOCAL_SIZE" -gt 100000 ] && \
           [ "$LOCAL_SIZE" -ge $((SIZE * 90 / 100)) ] && \
           [ "$LOCAL_SIZE" -le $((SIZE * 110 / 100)) ]; then
            echo "  ⏭️ $NAME 已存在 ($((LOCAL_SIZE/1024/1024))MB)"
            continue
        fi
    fi

    echo -n "  ⬇️ $NAME ($SIZE_MB MB) ... "
    if curl -sL "${AUTH[@]}" \
        -o "$TARGET" \
        --connect-timeout 30 \
        --retry 2 --retry-delay 5 \
        "$URL" 2>/dev/null; then
        DL_SIZE=$(stat -c%s "$TARGET" 2>/dev/null || echo 0)
        if [ "$DL_SIZE" -lt 100000 ]; then
            echo "❌ 下载失败 (文件太小: $DL_SIZE bytes)"
            rm -f "$TARGET"; FAILED=$((FAILED+1))
        else
            echo "✅ $(du -sh "$TARGET" | cut -f1)"
        fi
    else
        echo "❌ curl 失败"; FAILED=$((FAILED+1))
    fi
done < /tmp/dm_download_list.txt

echo ""
echo "════════════════════════════════════════════"
echo "  📂 TRAE workspace: $DEST"
ls -lh "$DEST"
echo ""
echo "  📊 总大小: $(du -sh "$DEST" | cut -f1)"
echo "  🔗 https://github.com/$REPO/releases/tag/$ACTUAL_TAG"
echo "════════════════════════════════════════════"

[ "$FAILED" -gt 0 ] && { echo ""; echo "⚠️ $FAILED 个包失败"; exit 1; }
echo ""
echo "🎉 全部取回成功！"
