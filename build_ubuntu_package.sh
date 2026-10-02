#!/bin/bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")" && pwd)"
cd "$ROOT"

if [[ ! -f "app/default_form_alignment.js" ]]; then
  echo "Paperwork alignment defaults are missing."
  exit 1
fi

BLANK_DB_TEMPLATE="$ROOT/database/blank_field_trial_secretary.sqlite"
rm -f "$BLANK_DB_TEMPLATE"
python3 -c 'import pathlib, server; server.build_blank_database(pathlib.Path("database/blank_field_trial_secretary.sqlite"))'
trap 'rm -f "$BLANK_DB_TEMPLATE"' EXIT

VERSION="$(python3 -c 'import json; print(json.load(open("app/version.json", encoding="utf-8"))["version"])')"
MACHINE="$(uname -m)"
if [[ "$MACHINE" != "x86_64" ]]; then
  echo "The Ubuntu release workflow currently supports x86_64 runners only."
  exit 1
fi

BUILD_ROOT="$ROOT/build/ubuntu"
PYINSTALLER_DIST="$ROOT/dist/FieldTrialSecretary"
APPDIR="$BUILD_ROOT/HALO.AppDir"
DEB_ROOT="$BUILD_ROOT/deb"
APPIMAGE_PATH="$ROOT/dist/HALO-${VERSION}-x86_64.AppImage"
DEB_PATH="$ROOT/dist/HALO-${VERSION}-Ubuntu-amd64.deb"
ICON="$ROOT/app/assets/halo-icon.png"

rm -rf "$BUILD_ROOT" "$PYINSTALLER_DIST" "$APPIMAGE_PATH" "$DEB_PATH"
mkdir -p "$BUILD_ROOT" "$ROOT/dist"

python3 -m PyInstaller \
  --noconfirm \
  --clean \
  --windowed \
  --onedir \
  --name FieldTrialSecretary \
  --collect-all pypdfium2 \
  --collect-all pdfplumber \
  --collect-all pdfminer \
  --add-data "app:app" \
  --add-data "database:database" \
  server.py

mkdir -p "$APPDIR/usr/lib/halo" "$APPDIR/usr/share/applications" "$APPDIR/usr/share/icons/hicolor/256x256/apps"
cp -a "$PYINSTALLER_DIST/." "$APPDIR/usr/lib/halo/"
cp "$ICON" "$APPDIR/halo.png"
cp "$ICON" "$APPDIR/usr/share/icons/hicolor/256x256/apps/halo.png"

cat > "$APPDIR/AppRun" <<'EOF'
#!/bin/sh
HERE="$(dirname "$(readlink -f "$0")")"
if [ -z "${CI:-}" ]; then
  set -- --open-browser "$@"
fi
exec "$HERE/usr/lib/halo/FieldTrialSecretary" "$@"
EOF
chmod 755 "$APPDIR/AppRun"

cat > "$APPDIR/halo.desktop" <<'EOF'
[Desktop Entry]
Type=Application
Name=HALO
Comment=Hound Administration and Lure Operations
Exec=halo
Icon=halo
Terminal=false
Categories=Office;Utility;
StartupNotify=true
EOF
cp "$APPDIR/halo.desktop" "$APPDIR/usr/share/applications/halo.desktop"
desktop-file-validate "$APPDIR/halo.desktop"

APPIMAGETOOL="$BUILD_ROOT/appimagetool-x86_64.AppImage"
curl --fail --location --retry 3 \
  https://github.com/AppImage/appimagetool/releases/download/continuous/appimagetool-x86_64.AppImage \
  --output "$APPIMAGETOOL"
chmod 755 "$APPIMAGETOOL"
ARCH=x86_64 "$APPIMAGETOOL" --appimage-extract-and-run "$APPDIR" "$APPIMAGE_PATH"
chmod 755 "$APPIMAGE_PATH"

mkdir -p \
  "$DEB_ROOT/DEBIAN" \
  "$DEB_ROOT/usr/lib/halo" \
  "$DEB_ROOT/usr/bin" \
  "$DEB_ROOT/usr/share/applications" \
  "$DEB_ROOT/usr/share/icons/hicolor/256x256/apps"
cp -a "$PYINSTALLER_DIST/." "$DEB_ROOT/usr/lib/halo/"
cp "$ICON" "$DEB_ROOT/usr/share/icons/hicolor/256x256/apps/halo.png"
cp "$APPDIR/halo.desktop" "$DEB_ROOT/usr/share/applications/halo.desktop"

cat > "$DEB_ROOT/usr/bin/halo" <<'EOF'
#!/bin/sh
exec /usr/lib/halo/FieldTrialSecretary --open-browser "$@"
EOF
chmod 755 "$DEB_ROOT/usr/bin/halo"

INSTALLED_SIZE="$(du -sk "$DEB_ROOT/usr" | cut -f1)"
cat > "$DEB_ROOT/DEBIAN/control" <<EOF
Package: halo-field-trial-secretary
Version: $VERSION
Section: utils
Priority: optional
Architecture: amd64
Installed-Size: $INSTALLED_SIZE
Depends: libc6, libstdc++6, xdg-utils
Maintainer: HALO Project
Description: Offline lure coursing field trial management
 HALO manages AKC and ASFA trials from entries and roll call through
 judging, scoring, official paperwork, and final archiving.
EOF

dpkg-deb --build --root-owner-group "$DEB_ROOT" "$DEB_PATH"

echo "Created $APPIMAGE_PATH"
echo "Created $DEB_PATH"
