# Glitch Canvas Projector App

A Windows desktop projector for a screen, application window or local video, with the Glitch Canvas / AI Warp effects. No YouTube signals or playlists are included.

## Target and prerequisites

- **Windows 10/11, 64-bit x64, Intel or AMD compatible.** This is a native x64 Electron package, not a 32-bit executable or a way to run x64 software on a 32-bit edition of Windows. Electron 45 does not provide 32-bit Windows builds.
- Node.js 22.12 or later (Node 22 LTS recommended), npm, VS Code, and an internet connection for the first dependency installation/build.
- A DirectX-compatible GPU and working drivers are recommended. Some effects, including Tech Artist, require WebGL. Fonts determine which Unicode glyphs are visible.

## Open and run in VS Code

1. Extract the project ZIP and open **Glitch-Canvas-Projector-App** as the folder in VS Code.
2. In the integrated terminal, run:

   ```powershell
   npm ci
   npm test
   npm start
   ```

3. Or use **Run and Debug → Launch Glitch Canvas Projector** after `npm ci`.

## Project a source

1. Choose **CHOOSE SCREEN OR WINDOW**, then explicitly select a screen or window. The app never begins capture automatically. Screen capture is **video only**; system sound and microphone audio are not captured.
2. Pick a starting look or one of **250 fixed MACHINE presets**, or adjust the individual effect sliders. The snapshot settings do not change, though the visual effects themselves animate. Flash/strobe effects are available; use care if anyone is photosensitive. Randomization can enable them.
3. Use **Move to display…** in the top bar to select a connected monitor/projector. This moves the **same borderless app window**; it is not a separate projector window and does not implement network protocols such as Chromecast or Miracast. A projector must be available as a Windows display.
4. Drag the top bar to reposition the window; drag its native window edges/corners to resize. Press **Ctrl+Alt+F** or the square button for fullscreen. If another app owns the global shortcut, the button remains available and the shortcut works while focused where possible. Use **HIDE CONTROL U.I.** for a cleaner image, and **SHOW CONTROL U.I.** to return.
5. Choose **STOP SOURCE** to stop capture, or **CHANGE SCREEN / WINDOW** to select a different source. Closing the app also stops the stream. To avoid visual feedback, do not capture the same display that is showing the projector window.

You can also drag a supported local video file into the window or use **OPEN VIDEO**. Local file decoding depends on the codecs bundled with Electron; playback is muted, and no microphone or system audio is recorded.

## Presets and character tables

The machine snapshots are bundled and cannot be overwritten through the UI. Personal named presets are saved in this app's local browser storage; use **EXPORT** to back them up and **IMPORT** to restore/merge them. Storage may be cleared by uninstalling or by Windows cleanup, so keep backups. In-app storage is separate from the website's storage: export there and import here if migrating.

The app has 125 Unicode tables (including all 95 printable ASCII characters) and over 127,000 assigned printable code points. Not all fonts cover every script or pictograph; unsupported glyphs may display as empty boxes. Combining marks and control codes are excluded because they do not stand alone reliably.

## Hidden preset: GHOST / OF ME

Press **Ctrl+Alt+G** while the app window is focused to load the supplied GHOST / OF ME snapshot. It preserves the uploaded values, locks, AI warp and continual randomization. **Flash and strobe are enabled in this preset**, so its appearance can change and it may flash. It is separate from the 250 fixed machine snapshots. You can save a modified copy as a personal preset.

## Build a Windows x64 installer

On a Windows x64 PC, in the project folder:

```powershell
npm ci
npm test
npm run package:win
```

The generated NSIS installer is in `dist/`. `npm run package:dir` creates an unpacked app for testing. The GitHub Actions workflow also builds an **unsigned** Windows x64 installer as a workflow artifact; it does not publish a release. Configure your own Windows code-signing certificate and release process before public distribution. An unsigned executable can trigger SmartScreen warnings.

## Privacy, security and limitations

- Screen and window lists and preview thumbnails are requested only after opening the source picker. Only the selected source is authorized, and the authorization expires. Cancel closes and clears the pending selection.
- No screen/audio capture or telemetry is uploaded by this app. Renderer network connections are blocked by CSP; navigation and popup windows are denied. Presets are stored locally or explicitly exported to a file.
- Electron renderer sandbox and context isolation are enabled, Node integration is disabled, IPC requests are sender-checked, and display sources are validated in the main process. Capture streams, temporary video URLs, source lists and effect frame buffers are released when their session ends; rendering pauses when no source is active and canvas drawing is capped at 30 fps.
- These safeguards are not a guarantee of zero vulnerabilities, resource leaks or data leakage. Dependencies, Windows permissions, GPU drivers, third-party apps and the user-selected screen remain outside the app's control. Do not show sensitive content on a shared source. Run security review and the manual tests below before release.
- In Windows Settings, ensure screen-recording permissions and graphics drivers allow the source. Protected/DRM video and some elevated or hardware-protected windows may appear black or be unavailable. Choosing an entire screen may include confidential notifications. A projector can lose connection or change IDs; choose it again if necessary.
- No physical projector, multi-monitor Windows desktop or real Windows capture session was available in the preparation environment. The automated tests use mocks; complete the manual checklist before distributing.

## Manual release checklist (on Windows)

- `npm ci`, `npm test`, `npm run package:win`; install the generated installer on a clean 64-bit Windows 10/11 machine.
- Capture a screen and a separate app window, cancel the picker, switch sources, stop, and confirm capture indicators disappear. Check sensitive and DRM windows behave as expected.
- Connect two displays, select the second, drag and resize the frameless window, toggle Ctrl+Alt+F twice, hide/show controls, and disconnect/reconnect the second display.
- Exercise the two live-source effects (FRAME ECHO and TIME SLICES), R3 effects, all basic controls, 250 machine selections/search, Unicode choices, custom save/load, export/import and legacy preset migration.
- Run longer sessions at different resolutions while watching Windows Task Manager for CPU/GPU/memory growth. Repeat starting, stopping, switching sources and resizing; independently profile before claiming no leaks.
- Verify DPI scaling, visual alignment, high contrast, keyboard navigation, error handling and the actual signed installer on target systems.

## Project files

- `src/main/`: Electron window, validated capture/display IPC, preload bridge.
- `src/renderer/`: local UI, original effect banks, glyph and preset library, and projector-specific effects.
- `tests/`: automated mocked tests (not real capture or GPU integration tests).
- `.vscode/`: launch and build tasks. `.github/`: Copilot instructions and Windows CI.
- `THIRD_PARTY_NOTICES.md`: effect bank provenance and dependency notices.
