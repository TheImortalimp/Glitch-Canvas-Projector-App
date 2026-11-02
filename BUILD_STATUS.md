# Build and verification status

Prepared: 2026-11-02. Target: Windows 10/11 x64 (Intel/AMD compatible).

## Completed in the preparation environment

- Node.js 22 dependency installation with `npm ci` completed.
- `npm test` passed: mocked capture authorization and display selection; renderer/preset/Unicode/Easter-egg behavior; bounded temporal frame-buffer allocation/release.
- `electron-builder --win --x64 --dir` produced an **unsigned unpacked Windows build** on the Linux preparation host. That generated build is not included in the source ZIP.
- The full Windows NSIS installer attempt on the Linux host **did not finish** because Wine was not installed. No installer is being supplied. Build the installer on Windows or through the supplied Windows GitHub Actions workflow.
- `npm audit` on 2026-11-02 reported 15 moderate dependency advisory entries and zero high/critical entries. They are in the build-tool dependency tree (a minimatch advisory propagated through electron-builder). Review advisories and update compatible build tooling before public release; do not blindly force major dependency overrides.

## Still required before public release

Test the app and installer on an actual Windows x64 system and monitor/projector, including real capture permission, GPU effects, shortcuts, resize, display hot-plug, repeated start/stop cycles and longer memory profiling. Review dependencies, sign the executable/installer with an appropriate Windows certificate, and assess SmartScreen reputation. Mock tests and frame-buffer bounds do **not** prove the absence of memory leaks or security vulnerabilities.
