# React Presenter Editor Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Membangun ulang presenter web skripsi sebagai aplikasi React + Vite yang lebih ringan, interaktif, dan dapat mengedit teks/gambar slide dari data draft skripsi.

**Architecture:** Aplikasi baru dibuat di workspace terpisah dan tidak mengganti presenter HTML lama. Data slide, referensi, aset, dan draft DOCX diekstrak menjadi JSON statis agar React dapat melakukan rendering cepat, pencarian, preview draft, replace text, asset insertion, layer editing, dan theme switching secara client-side. State editor disimpan di localStorage agar revisi sementara tidak hilang.

**Tech Stack:** React 18, Vite, TypeScript, CSS custom properties, Python DOCX/OOXML extraction, local JSON data, Playwright/Chrome validation.

---

## File Structure

- `package.json`  
  Script Vite (`dev`, `build`, `preview`) dan dependency React.
- `index.html`  
  Entry HTML ringan dengan favicon data URI.
- `vite.config.ts`  
  Konfigurasi Vite dan alias `@` ke `src`.
- `tsconfig.json`, `tsconfig.node.json`  
  Konfigurasi TypeScript untuk app dan tooling.
- `scripts/extract_thesis.py`  
  Membaca `Draft Skripsi F1E122037 Fix.docx`, mengekstrak paragraf, heading, tabel, section hint, dan searchable text.
- `scripts/extract_presenter_data.js`  
  Membaca presenter web lama, mengekstrak slide HTML, metadata slide, reference map, dan asset manifest.
- `src/data/thesis.json`  
  Hasil ekstraksi lengkap draft skripsi.
- `src/data/slides.json`  
  Hasil migrasi slide dan referensi dari presenter lama.
- `src/data/assets.json`  
  Manifest semua aset gambar yang dapat dipakai ulang di slide.
- `src/types.ts`  
  Tipe data slide, block draft, asset, layer, modal, editor state.
- `src/main.tsx`  
  Bootstrap React.
- `src/App.tsx`  
  Komposisi shell utama.
- `src/components/AppShell.tsx`  
  Layout toolbar, slide rail, canvas, dan inspector.
- `src/components/Toolbar.tsx`  
  Navigasi slide, theme switcher, undo/redo, save/export.
- `src/components/SlideRail.tsx`  
  Thumbnail daftar slide dengan virtual-friendly rendering sederhana.
- `src/components/SlideCanvas.tsx`  
  Render slide aktif dari HTML, menangkap klik paragraph/card/image, dan overlay layer editor.
- `src/components/DetailModal.tsx`  
  Modal clicked paragraph: konteks, referensi, tombol `Lihat di draft`, `Replace text`, dan action editing.
- `src/components/DraftPanel.tsx`  
  Viewer draft dengan search, section filter, preview lokasi paragraph, dan selectable text.
- `src/components/ReplaceTextPanel.tsx`  
  UI pemilihan beberapa potongan teks dari beberapa paragraf draft untuk mengganti teks slide.
- `src/components/AssetPanel.tsx`  
  Galeri aset, filter jenis, insert image, replace selected image.
- `src/components/LayerPanel.tsx`  
  Daftar layer tambahan per slide, z-index, posisi, ukuran, visibility, delete.
- `src/components/Inspector.tsx`  
  Tab kanan: Draft, Assets, Layers, References.
- `src/components/CommandPalette.tsx`  
  Fitur tambahan: shortcut cepat untuk cari slide/draft/aset/action.
- `src/hooks/useEditorState.ts`  
  State slide edits, selected element, layers, theme, history, localStorage.
- `src/hooks/useDraftSearch.ts`  
  Search/indexing draft ringan dengan memoized token matching.
- `src/utils/slideDom.ts`  
  Helper patch HTML slide: replace selected paragraph, replace image src, attach data ids.
- `src/utils/exportState.ts`  
  Export/import JSON state editor.
- `src/styles/tokens.css`  
  Theme tokens dan color scheme.
- `src/styles/app.css`  
  Layout utama dan komponen.
- `src/styles/slide-compat.css`  
  CSS compatibility untuk slide HTML lama agar tetap tampil baik di React canvas.
- `qa/`  
  Screenshot, audit JSON, dan montage setelah validasi.

---

## Requirement Mapping

- Workspace baru, tidak replace: Task 1.
- React + Vite untuk performa: Task 1, 5, 11.
- Load full script DOCX: Task 2.
- Preview dokumen via tombol `Lihat di draft`: Task 7.
- Replace text dari pilihan teks draft, bukan seluruh paragraf: Task 8.
- Multi selection dari beberapa paragraf: Task 8.
- Load semua image assets dan insert/replace gambar: Task 9.
- Manage z-index/depth/position image: Task 10.
- Theme dan color scheme: Task 6, 11.
- Fullscreen dengan shortcut: Task 11.
- Fitur tambahan berguna: command palette, undo/redo, autosave, export state: Task 11.
- Validasi visual dan interaksi: Task 12.

---

## Task 1: Workspace and Vite Scaffold

**Files:**
- Create: `package.json`
- Create: `index.html`
- Create: `vite.config.ts`
- Create: `tsconfig.json`
- Create: `tsconfig.node.json`
- Create: `src/main.tsx`
- Create: `src/App.tsx`

- [ ] Create React + Vite package.
- [ ] Install `react`, `react-dom`, `@vitejs/plugin-react`, `vite`, `typescript`.
- [ ] Add strict TypeScript config.
- [ ] Add empty app shell that renders without data.
- [ ] Run `npm run build` and confirm Vite compiles.

## Task 2: DOCX Extraction

**Files:**
- Create: `scripts/extract_thesis.py`
- Generate: `src/data/thesis.json`

- [ ] Extract all DOCX paragraphs from `word/document.xml`.
- [ ] Preserve paragraph order, style name, inferred heading level, section label, and text.
- [ ] Extract tables into row/cell arrays and flatten searchable text.
- [ ] Add `searchText` and `tokens` for draft search.
- [ ] Write summary counts: paragraph count, heading count, table count.
- [ ] Validate that key terms exist: `konflik ruang tatap muka`, `penalti`, `fuzzy`, `crossover`, `mutation`, `greedy`.

## Task 3: Presenter Data Migration

**Files:**
- Create: `scripts/extract_presenter_data.js`
- Generate: `src/data/slides.json`
- Generate: `src/data/assets.json`
- Copy: `public/assets/**`

- [ ] Read old presenter HTML from `outputs/manual-20260605-presenter-web/.../linux-portable/index.html`.
- [ ] Extract `PRESENTER_SLIDES` and `PRESENTER_REFERENCE_PDFS`.
- [ ] Extract actual slide `<section>` HTML from old deck source so React can render the slide visually.
- [ ] Attach stable `data-edit-id` to paragraphs, cards, image boxes, and slide images.
- [ ] Copy assets from old presenter into `public/assets`.
- [ ] Build manifest for images: filename, URL, dimensions if available, kind (`slide`, `reference`, `gui`, `isometric`, `logo`).
- [ ] Validate slide count is 45 and reference count is 20.

## Task 4: Shared Types and Utilities

**Files:**
- Create: `src/types.ts`
- Create: `src/utils/slideDom.ts`
- Create: `src/utils/exportState.ts`

- [ ] Define `Slide`, `ThesisBlock`, `AssetItem`, `SlideLayer`, `EditorState`, `SelectionTarget`.
- [ ] Implement HTML patching for replacing text by `data-edit-id`.
- [ ] Implement image source replacement by `data-edit-id`.
- [ ] Implement overlay layer serialization and z-index changes.
- [ ] Implement export/import editor state JSON.

## Task 5: App Shell and Performance Foundation

**Files:**
- Create: `src/components/AppShell.tsx`
- Create: `src/components/Toolbar.tsx`
- Create: `src/components/SlideRail.tsx`
- Create: `src/components/SlideCanvas.tsx`
- Create: `src/hooks/useEditorState.ts`
- Create: `src/styles/tokens.css`
- Create: `src/styles/app.css`
- Create: `src/styles/slide-compat.css`

- [ ] Render one active slide only in the main canvas.
- [ ] Render thumbnail rail as lightweight text thumbnails, not full 45 embedded slides.
- [ ] Use memoized active slide data and functional state updates.
- [ ] Add keyboard navigation: arrow left/right, `Ctrl+Z`, `Ctrl+Y`.
- [ ] Add click zones left/right for previous/next slide.
- [ ] Persist editor state to localStorage with schema version.

## Task 6: Theme and Color Scheme

**Files:**
- Modify: `src/hooks/useEditorState.ts`
- Modify: `src/components/Toolbar.tsx`
- Modify: `src/styles/tokens.css`

- [ ] Add theme options: `Light Academic`, `Mint Lab`, `Navy Focus`, `Warm Paper`, `High Contrast`.
- [ ] Apply theme via CSS custom properties on root app node.
- [ ] Add custom accent color input.
- [ ] Persist theme and accent color.
- [ ] Ensure slide canvas remains readable in every theme.

## Task 7: Detail Modal and Draft Preview

**Files:**
- Create: `src/components/DetailModal.tsx`
- Create: `src/components/ReferencePreview.tsx`
- Create: `src/components/DraftPanel.tsx`
- Create: `src/hooks/useDraftSearch.ts`

- [ ] On paragraph/card/image click, open modal with clicked item text.
- [ ] Show context summary based on slide metadata and clicked text.
- [ ] Show max two APA references for the current slide and local PDF page previews.
- [ ] Add button `Lihat di draft`.
- [ ] When clicked, switch modal to draft preview and search nearest matching paragraphs.
- [ ] Highlight matching terms in the draft preview.
- [ ] Add button to jump/open the right inspector Draft tab at the matching paragraph.

## Task 8: Replace Text from Draft Selection

**Files:**
- Create: `src/components/ReplaceTextPanel.tsx`
- Modify: `src/components/DetailModal.tsx`
- Modify: `src/utils/slideDom.ts`
- Modify: `src/hooks/useEditorState.ts`

- [ ] Add button `Replace text` in the modal.
- [ ] Open replacement mode with draft search and selectable text.
- [ ] Allow user to select arbitrary text ranges from visible paragraph text.
- [ ] Add selected ranges to a `selection basket`.
- [ ] Allow multiple selections from different paragraphs.
- [ ] Join selected ranges with spaces or new lines depending on user choice.
- [ ] Replace clicked slide element text while preserving citation spans if present.
- [ ] Add undo snapshot before replacement.

## Task 9: Asset Library and Image Insert/Replace

**Files:**
- Create: `src/components/AssetPanel.tsx`
- Modify: `src/components/SlideCanvas.tsx`
- Modify: `src/hooks/useEditorState.ts`

- [ ] Load all `assets.json` image items.
- [ ] Add filters: all, isometric, GUI, reference, logo.
- [ ] Add drag/click insert: selected asset becomes an overlay image layer on active slide.
- [ ] If current selected target is an image, allow `Replace current image`.
- [ ] Add image alt/title fields.
- [ ] Add snap-to-center and reset size buttons.

## Task 10: Layer and Z-Index Manager

**Files:**
- Create: `src/components/LayerPanel.tsx`
- Modify: `src/components/SlideCanvas.tsx`
- Modify: `src/hooks/useEditorState.ts`

- [ ] Render overlay image layers on top of slide.
- [ ] Support drag reposition with pointer events.
- [ ] Support resize handles.
- [ ] Support z-index up/down, send front/back.
- [ ] Support lock, hide, duplicate, delete.
- [ ] Keep layer operations undoable.

## Task 11: Useful Editor Features

**Files:**
- Create: `src/components/CommandPalette.tsx`
- Modify: `src/components/Toolbar.tsx`
- Modify: `src/hooks/useEditorState.ts`

- [ ] Add command palette with `Ctrl+K`.
- [ ] Commands: go to slide, search draft, search assets, toggle theme, export state, reset current slide edits.
- [ ] Add autosave indicator.
- [ ] Add undo/redo buttons.
- [ ] Add fullscreen toggle in toolbar.
- [ ] Add fullscreen shortcut: `F` and `Shift+F`.
- [ ] Add export/import state JSON.
- [ ] Add `Reset slide` and `Reset all edits` with confirm dialog.

## Task 12: Validation

**Files:**
- Generate: `qa/react-editor-visual-audit.json`
- Generate: `qa/react-editor-desktop.png`
- Generate: `qa/react-editor-modal.png`
- Generate: `qa/react-editor-montage.png`

- [ ] Run `npm run build`.
- [ ] Start Vite preview or dev server on an available port.
- [ ] Validate app loads without console errors.
- [ ] Validate slide navigation left/right.
- [ ] Validate modal opens from clicked paragraph.
- [ ] Validate `Lihat di draft` finds draft paragraphs.
- [ ] Validate `Replace text` can select multiple ranges and update slide.
- [ ] Validate asset insert and z-index changes.
- [ ] Validate theme switcher and persistence.
- [ ] Capture desktop screenshots and inspect with `view_image`.
- [ ] Fix any clipping, broken asset, unreadable text, or interaction bug and rerun validation.

---

## Acceptance Criteria

- App runs from the new workspace only.
- Old presenter web remains unchanged and available.
- 45 slides are available in React.
- Full DOCX draft is searchable and previewable.
- Modal has `Lihat di draft` and `Replace text`.
- Replace text supports multiple selected snippets from different paragraphs.
- Assets can be inserted/replaced and layers can be reordered by z-index.
- Theme/color scheme can be changed and persists.
- Fullscreen can be toggled from toolbar and keyboard shortcut.
- Final build passes.
- Browser validation screenshots show clean UI and working modal/editor interactions.
