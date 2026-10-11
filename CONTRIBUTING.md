# Contributing

Effects, translations, bug reports and device research are welcome. Open an issue before a major transport change. Include browser/OS, exact model, firmware, reproduction steps and whether testing used real hardware. Never upload credentials, browser profiles, personal paths or unrelated USB traffic.

## Source map

- `keys.js`: physical key IDs and preview positions.
- `effects.js`, `extras.js`, `game.js`: animation logic. Return RGB through the existing color pipeline; never write USB from an effect.
- `studio.js`: validated frame editor and JSON import/export.
- `app.js`: UI, packet encoding, device verification, backup/restore and bar controls.
- `i18n.js`: translation dictionary and reversible UI translation. Preserve user-authored names.

Run `npm test` and `npm run build` after edits. Include the rebuilt standalone HTML. Keep brightness defaulting to 100%, and preserve packet limits, pacing and backup-before-write behavior. Add tests for meaningful new failure paths.

## Another keyboard

Possible, but adding a USB ID alone is insufficient. Current transport is HERO84-specific, not an adapter framework.

1. Identify exact VID/PID, model identity, report descriptors and firmware. Keep existing rejection of unknown devices.
2. Observe lighting-only actions on your own device with permission. Separate identification, read, live-color and restore commands from firmware/configuration commands.
3. Document key IDs, byte layout, checksum, packet limits, timing, acknowledgements and recovery. Do not guess write commands.
4. Extract a device adapter with explicit `identify`, `readLighting`, `encodeFrame`, `restoreLighting` and capability definitions. Preserve the working HERO84 behavior and default to unsupported until verified.
5. Add synthetic packet fixtures and round-trip tests. Test connect/disconnect, timeouts, dark frames, saturated colors, stop/restore and recovery on physical hardware.
6. Keep bar capability separate: global color, built-in modes and addressable segments are different capabilities. Do not promise per-segment RGB without evidence.

Report tested hardware and remaining uncertainties in your PR. Do not submit vendor binaries, proprietary source bundles or media without redistribution permission.
