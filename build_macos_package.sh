#!/bin/bash
set -euo pipefail

if [[ ! -f "app/default_form_alignment.js" ]]; then
  echo "Paperwork alignment defaults are missing."
  exit 1
fi

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
SIGN_IDENTITY="${MACOS_SIGN_IDENTITY:-}"

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

PYINSTALLER_ARGS=(
  --noconfirm
  --clean
  --windowed
  --onedir
  --name "$APP_NAME"
  --icon "$ICON_FILE"
  --osx-bundle-identifier "org.fieldtrialsecretary.app"
  --collect-all pypdfium2
  --collect-all pdfplumber
  --collect-all pdfminer
  --add-data "app:app"
  --add-data "database:database"
)

if [[ -n "$SIGN_IDENTITY" ]]; then
  PYINSTALLER_ARGS+=(--codesign-identity "$SIGN_IDENTITY")
fi

python3 -m PyInstaller "${PYINSTALLER_ARGS[@]}" server.py

if [[ -n "$SIGN_IDENTITY" ]]; then
  codesign \
    --force \
    --deep \
    --options runtime \
    --timestamp \
    --sign "$SIGN_IDENTITY" \
    "$APP_PATH"
else
  echo "Warning: building an ad-hoc signed macOS app. Tagged releases must use Developer ID signing."
  codesign --force --deep --sign - "$APP_PATH"
fi
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

if [[ -n "$SIGN_IDENTITY" ]]; then
  codesign \
    --force \
    --timestamp \
    --sign "$SIGN_IDENTITY" \
    "$DMG_PATH"
  codesign --verify --strict "$DMG_PATH"
fi

echo "Created $DMG_PATH"
