# Next Agent TODO

Checklist ini sengaja dibuat praktis. Jalankan dari atas agar tidak ada request user yang tertinggal.

## 1. Restore / Run Workspace

- [ ] Buka `C:\skripsi\migration\react-presenter-migration\code-snapshot`.
- [ ] Jalankan `npm install`.
- [ ] Jalankan `npm run build`.
- [ ] Jalankan `npm run dev -- --port 5174`.
- [ ] Buka `http://127.0.0.1:5174/`.

## 2. Validate Extractor Fix

- [ ] Clear localStorage.
- [ ] Buka slide 1.
- [ ] Pastikan advisor cards di cover tidak overlap.
- [ ] Jika masih overlap, inspect `public/data/slides.json` dan cari string `data-edit-id` yang masuk ke class.
- [ ] Jika ditemukan class rusak, patch `scripts/extract_presenter_data.js`, regenerate, build.

## 3. Repeat Functional QA

- [ ] Confirm `.rail-item` count = 45.
- [ ] Arrow right/left works.
- [ ] Left/right click zones work.
- [ ] `F` toggles fullscreen.
- [ ] `Ctrl+K` opens command palette.
- [ ] Click paragraph opens modal.
- [ ] `Lihat di draft` opens draft preview.
- [ ] `Replace text` lets user select partial draft text.
- [ ] Multiple selected snippets can be added.
- [ ] Apply replacement updates selected slide target.
- [ ] Asset insert adds layer.
- [ ] Layer drag works.
- [ ] Layer z-index input works.
- [ ] Theme switcher persists.

## 4. Finish Missing Features

- [ ] Add resize handles in `SlideCanvas.tsx`.
- [ ] Add snap-to-center and reset size buttons in `LayerPanel.tsx`.
- [ ] Add image alt/title fields in `AssetPanel.tsx` or `LayerPanel.tsx`.
- [ ] Consider moving export/import helpers to `src/utils/exportState.ts` if strict plan compliance matters.
- [ ] Add a small utility to export current edited slides to standalone HTML or JSON.

## 5. Improve Draft/Reference Precision

- [ ] Build better paragraph-to-slide mapping instead of only token search.
- [ ] For each slide item, store `draftBlockIds` if possible.
- [ ] For each reference card, verify page screenshot matches the clicked paragraph citation.
- [ ] Make reference preview scroll/crop to the cited paragraph area if feasible.

## 6. Content Integrity Checks

- [ ] Search slide text and modal context for forbidden rujukan:
  - `(Data penelitian FST, 2025)`
  - `(Hasil pengujian sistem, 2025)`
- [ ] Search for POV wording:
  - `Pendahuluan menjelaskan bahwa`
  - `Bagian ini menjelaskan bahwa`
- [ ] Confirm conflict tatap muka/teori appears in relevant slides:
  - slide masalah;
  - slide fitness;
  - slide penalty;
  - slide methodology/repair if applicable.
- [ ] Confirm fuzzy crossover wording includes diversity + stagnansi + Subburaj & Miruna Joe Amali (2025).
- [ ] Confirm fuzzy mutation wording includes pergerakan skor fitness iterasi sebelumnya + Pytel (2025).
- [ ] Confirm greedy post-processing is included as saran pengembangan and ideally flowchart.

## 7. Visual QA

- [ ] Capture desktop screenshot.
- [ ] Capture modal screenshot.
- [ ] Capture draft preview screenshot.
- [ ] Capture replaced text screenshot.
- [ ] Capture layer manager screenshot.
- [ ] Capture theme screenshot.
- [ ] Build montage preview.
- [ ] Inspect screenshots at full size.
- [ ] Fix visible issues:
  - clipped content;
  - overlap;
  - tiny toolbar text;
  - unreadable modal;
  - broken image;
  - references missing;
  - rail/inspector overflowing page.

## 8. Final Handoff Criteria

Only say work is complete after:

- [ ] `npm run build` exit code 0.
- [ ] Functional QA JSON has no console errors.
- [ ] Screenshots inspected manually.
- [ ] Montage preview generated.
- [ ] Known issues either fixed or explicitly listed.

