#!/bin/bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")" && pwd)"
cd "$ROOT"

VERSION="$(
  python3 -c 'import json; print(json.load(open("app/version.json", encoding="utf-8"))["version"])'
)"
ARCH="$(uname -m)"
BUILD_ROOT="$ROOT/build/macos"
ICONSET="$BUILD_ROOT/FieldTrialSecretary.iconset"
ICON_PNG="$ROOT/app/assets/field-trial-secretary-icon.png"
ICON_FILE="$BUILD_ROOT/FieldTrialSecretary.icns"
APP_NAME="Field Trial Secretary"
APP_PATH="$ROOT/dist/$APP_NAME.app"
DMG_NAME="Field-Trial-Secretary-${VERSION}-macOS-${ARCH}.dmg"
DMG_PATH="$ROOT/dist/$DMG_NAME"

rm -rf "$BUILD_ROOT" "$APP_PATH" "$DMG_PATH"
mkdir -p "$ICONSET"

for size in 16 32 128 256 512; do
  double_size=$((size * 2))
  sips -z "$size" "$size" "$ICON_PNG" \
    --out "$ICONSET/icon_${size}x${size}.png" >/dev/null
  sips -z "$double_size" "$double_size" "$ICON_PNG" \
    --out "$ICONSET/icon_${size}x${size}@2x.png" >/dev/null
done
iconutil -c icns "$ICONSET" -o "$ICON_FILE"

python3 -m PyInstaller \
  --noconfirm \
  --clean \
  --windowed \
  --onedir \
  --name "$APP_NAME" \
  --icon "$ICON_FILE" \
  --osx-bundle-identifier "org.fieldtrialsecretary.app" \
  --collect-all pypdfium2 \
  --add-data "app:app" \
  --add-data "database:database" \
  server.py

codesign --force --deep --sign - "$APP_PATH"
codesign --verify --deep --strict "$APP_PATH"

STAGING="$BUILD_ROOT/dmg"
rm -rf "$STAGING"
mkdir -p "$STAGING"
cp -R "$APP_PATH" "$STAGING/"
ln -s /Applications "$STAGING/Applications"

hdiutil create \
  -volname "$APP_NAME" \
  -srcfolder "$STAGING" \
  -ov \
  -format UDZO \
  "$DMG_PATH"

echo "Created $DMG_PATH"