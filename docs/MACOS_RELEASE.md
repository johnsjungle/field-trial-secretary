# macOS Release Setup

Field Trial Secretary uses GitHub Actions to build separate Apple Silicon and Intel DMG installers. Tagged releases require Developer ID signing and Apple notarization.

## One-Time Apple Setup

1. Join the Apple Developer Program.
2. Create a Developer ID Application certificate.
3. Install the certificate on a Mac and export the certificate with its private key as a password-protected `.p12` file.
4. Create an app-specific password for the Apple account used for notarization.
5. Note the ten-character Apple Developer Team ID.

## GitHub Actions Secrets

Open the repository on GitHub, then select **Settings > Secrets and variables > Actions > New repository secret**.

Add:

- `MACOS_CERTIFICATE`: Base64 contents of the exported `.p12` file.
- `MACOS_CERTIFICATE_PASSWORD`: Password used when exporting the `.p12` file.
- `APPLE_ID`: Apple account email used for notarization.
- `APPLE_APP_SPECIFIC_PASSWORD`: App-specific password for that Apple account.
- `APPLE_TEAM_ID`: Apple Developer Team ID.

Create the certificate secret on a Mac with:

```bash
base64 -i FieldTrialSecretaryDeveloperID.p12 | pbcopy
```

Paste the clipboard into `MACOS_CERTIFICATE`. Never commit the certificate, private key, or passwords to the repository.

## Publish a Release

After the release commit is on `master`, create and push a matching version tag:

```bash
git tag -a v0.3.7 -m "Field Trial Secretary v0.3.7"
git push origin v0.3.7
```

The workflow builds Windows, Apple Silicon, and Intel installers. It signs the Mac app with Hardened Runtime, signs the DMG, submits it through `notarytool`, staples the ticket, validates Gatekeeper acceptance, and then publishes the installers with SHA-256 checksums.

Tagged builds fail instead of publishing an unsigned or unnotarized Mac installer. Ordinary branch builds may still create ad-hoc signed artifacts for development testing.

## Mac User Download

- Apple M-series Mac: download the `arm64` DMG.
- Intel Mac: download the `x86_64` DMG.
- Open the DMG and drag **Field Trial Secretary** to **Applications**.
