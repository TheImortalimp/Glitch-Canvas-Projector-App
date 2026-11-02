# Security and responsible reporting

This is an offline, opt-in screen-capture application. Treat captured screens as sensitive. The renderer is sandboxed and uses a minimal, sender-validated IPC bridge. No app feature uploads captured media. Network restrictions, source selection, and stream cleanup should be reviewed on every release.

For a suspected vulnerability, contact the project owner privately using the repository's private vulnerability reporting or a contact method supplied by the owner. Do not include private screen contents or preset backups in public issues.

Automated mocked tests do not establish that a build is leak-free, signed, safe from all vulnerabilities, or ready for production. Complete the release checklist in README.md and use current supported dependencies.

The user-provided GHOST / OF ME Easter egg intentionally enables Flash, Strobe and continual randomization. Warn users and consider photosensitivity before activation.

VJ mode (Ctrl+Alt+T) hides the whole interface and keeps the window on top at 50% opacity. Entering is only possible while a source is active and is confirmed by the renderer through a validated, sender-checked IPC call; Esc and Ctrl+Alt+T always exit. The window is never click-through. Remember that a source being projected, and anything visible through the transparent window, may be seen by an audience.
