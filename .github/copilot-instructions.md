# Glitch Canvas Projector — Copilot project guidance

- This is a local Electron desktop app. Keep it offline and do not add YouTube feeds, default streams, analytics or automatic screen capture.
- Keep Node integration disabled, context isolation and renderer sandbox enabled. Expose only narrowly scoped APIs through `src/main/preload.cjs`. Validate all IPC senders, arguments, pending consent and capture sources in the main process.
- Screen capture must require explicit source selection, be stoppable, and never capture audio unless the user specifically requests it in a future feature.
- The projector is the same resizable frameless window as the controls. Do not claim it is a second output window or network casting. Preserve display selection, native drag region, hide/show controls and Ctrl+Alt+F, including an in-app fullscreen fallback.
- The 250 machine presets are fixed immutable snapshots. User presets are stored separately; retain the existing `glitchCanvasPresets_v2` storage format and JSON import/export. Do not modify a built-in preset when saving.
- Printable ASCII and Unicode banks are deliberately large and use Unicode code points, not UTF-16 indexing. Preserve the selectable tables, glyph-safe selection and original AI Warp/Revision 3 bank credits.
- Flash and strobe controls exist; preserve the warning and do not introduce automatic flashing into machine snapshots.
- Before release run `npm ci`, `npm test`, build on the target operating system, and manually verify capture, permission prompts, display movement, resize, fullscreen, stopping, preset restore and export/import. Do not claim signing or platform verification without actually performing them.
