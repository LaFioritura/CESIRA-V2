# CESIRA

A browser-based autonomous electronic music workstation built from scratch with React and the Web Audio API.

## Included
- generative multi-lane sequencer
- performance macros and safe live actions
- section/arrangement control
- original preset system
- per-lane mixer with mute/solo
- local autosave
- JSON session import/export
- live audio recording to WebM
- offline loop export to WAV
- note export to CSV-style MIDI note sheet

## Run
```bash
npm install
npm run dev
```

## Build
```bash
npm run build
```

## Notes
- The loop WAV export renders the current pattern offline into a stereo WAV file.
- The "Export MIDI Notes" action exports melodic note data as CSV for further conversion/workflow use.
- The app is intentionally a fresh codebase and not derived from previously uploaded project files.
