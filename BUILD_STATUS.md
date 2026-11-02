# Build and verification status

Prepared: 2026-11-02. Target: Windows 10/11 x64 (Intel/AMD compatible).

## Version 1.0.1 — VJ mode

Adds **Ctrl+Alt+T** VJ mode: all HUD hidden, window fullscreen on its current monitor at 50% opacity, kept on top of other windows, not click-through. **Esc** or **Ctrl+Alt+T** exits.

Done on 2026-11-02 (Windows 11 x64, single display):

- `node --test tests/*.test.cjs` passed (5/5), including mocked main-process tests (sender/argument validation, renderer-confirmed entry, Esc and Ctrl+Alt+T exit, restore of fullscreen and always-on-top state) and renderer tests (all HUD hidden, show/hide button hidden, exit restores HUD, STOP SOURCE exits).
- A real Electron run confirmed entering VJ mode gives opacity 0.5, fullscreen and always-on-top, and Esc restores opacity 1, windowed and not on top.
- `npm run package:win` produced an **unsigned** NSIS installer, `Glitch Canvas Projector App Setup 1.0.1.exe`; its asar contents were checked for the VJ code and version 1.0.1.
- GitHub Actions "Windows build" (windows-latest, Node 22): the 1.0.0 run passed `npm ci` and `npm test` but failed at packaging, because electron-builder publishes implicitly when it detects CI and no `GH_TOKEN` is set. The workflow now runs `npm run package:win -- --publish never` (nothing is published; workflow permissions stay read-only). [Run 41503085474](https://github.com/TheImortalimp/Glitch-Canvas-Projector-App/actions/runs/41503085474) on commit `17535cd` passed `npm ci` and `npm test`, packaged the unsigned installer and uploaded it as the `glitch-canvas-projector-windows-unsigned` artifact.
- Repository and supply-chain integrity review: every commit on `main` carries the owner's author and committer identity; the `v1.0.0` tag points at the initial commit; every Actions run and the v1.0.0 release were triggered or published by the owner's account; there are no other collaborators, deploy keys, webhooks, Actions secrets, issues or pull requests; `git fsck` is clean; `package-lock.json` resolves only from `registry.npmjs.org`; `package.json` has no install lifecycle scripts and no runtime `dependencies`. A search of `src/` for URLs, `fetch`, `XMLHttpRequest`, `WebSocket`, `child_process`, `eval`, `new Function`, `openExternal` and `net.request` found only the Revision 3 credit URL in a comment, and a search for common prompt-injection phrases found nothing. The published v1.0.0 installer has SHA-256 `6f46593d1aac9d660ed2e635e2a459dcfbbe72be2879e3e017214bb133fd7eae`, which matches the copy built and delivered locally. `npm audit` still reports 15 moderate advisories and no high or critical ones, all inside the electron-builder build-tool tree and none bundled into the installer; npm's only suggested fix downgrades electron-builder to 20.23.1, so it was not applied. This review cannot show whether the owner's GitHub account, tokens or Copilot billing are uncompromised; that can only be checked in the account's security log and billing pages.

Not done: running either installer (the local build or the CI artifact) on a clean machine, a second monitor or projector, pressing the real global Ctrl+Alt+T hotkey, code signing and SmartScreen assessment, and long-session profiling.

## Completed in the preparation environment (1.0.0)

- Node.js 22 dependency installation with `npm ci` completed.
- `npm test` passed: mocked capture authorization and display selection; renderer/preset/Unicode/Easter-egg behavior; bounded temporal frame-buffer allocation/release.
- `electron-builder --win --x64 --dir` produced an **unsigned unpacked Windows build** on the Linux preparation host. That generated build is not included in the source ZIP.
- The full Windows NSIS installer attempt on the Linux host **did not finish** because Wine was not installed. No installer is being supplied. Build the installer on Windows or through the supplied Windows GitHub Actions workflow.
- `npm audit` on 2026-11-02 reported 15 moderate dependency advisory entries and zero high/critical entries. They are in the build-tool dependency tree (a minimatch advisory propagated through electron-builder). Review advisories and update compatible build tooling before public release; do not blindly force major dependency overrides.

## Still required before public release

Test the app and installer on an actual Windows x64 system and monitor/projector, including real capture permission, GPU effects, shortcuts, resize, display hot-plug, repeated start/stop cycles and longer memory profiling. Review dependencies, sign the executable/installer with an appropriate Windows certificate, and assess SmartScreen reputation. Mock tests and frame-buffer bounds do **not** prove the absence of memory leaks or security vulnerabilities.
