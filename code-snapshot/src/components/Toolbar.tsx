import { useRef } from "react";
import {
  ArrowDownTrayIcon,
  ArrowLeftIcon,
  ArrowRightIcon,
  ArrowsPointingInIcon,
  ArrowsPointingOutIcon,
  ArrowUpTrayIcon,
  CommandLineIcon,
  SwatchIcon,
  TrashIcon,
  ArrowUturnLeftIcon,
  ArrowUturnRightIcon,
} from "@heroicons/react/24/outline";
import type { EditorState, ThemeName } from "../types";

const themes: Array<{ value: ThemeName; label: string }> = [
  { value: "light", label: "Light Academic" },
  { value: "mint", label: "Mint Lab" },
  { value: "navy", label: "Navy Focus" },
  { value: "paper", label: "Warm Paper" },
  { value: "contrast", label: "High Contrast" },
];

type ToolbarProps = {
  state: EditorState;
  slideCount: number;
  isFullscreen: boolean;
  onGoToSlide: (slide: number) => void;
  onThemeChange: (theme: ThemeName) => void;
  onAccentChange: (accent: string) => void;
  onUndo: () => void;
  onRedo: () => void;
  onOpenPalette: () => void;
  onToggleFullscreen: () => void | Promise<void>;
  onExport: () => string;
  onImport: (value: string) => void;
  onResetSlide: () => void;
  onResetAll: () => void;
};

function downloadText(filename: string, content: string) {
  const blob = new Blob([content], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

export default function Toolbar({
  state,
  slideCount,
  isFullscreen,
  onGoToSlide,
  onThemeChange,
  onAccentChange,
  onUndo,
  onRedo,
  onOpenPalette,
  onToggleFullscreen,
  onExport,
  onImport,
  onResetSlide,
  onResetAll,
}: ToolbarProps) {
  const importRef = useRef<HTMLInputElement>(null);
  const autosaveDate = new Date(state.autosavedAt);

  return (
    <header className="editor-toolbar">
      <div className="toolbar-brand">
        <span className="brand-mark">FST</span>
        <div>
          <strong>Presenter Web React</strong>
          <span>Optimasi Penjadwalan Praktikum</span>
        </div>
      </div>

      <div className="toolbar-cluster">
        <button type="button" className="icon-button" title="Slide sebelumnya" onClick={() => onGoToSlide(state.currentSlide - 1)}>
          <ArrowLeftIcon aria-hidden="true" />
        </button>
        <label className="slide-jump">
          <span>Slide</span>
          <input
            type="number"
            min={1}
            max={slideCount}
            value={state.currentSlide}
            onChange={(event) => onGoToSlide(Number(event.target.value))}
          />
          <span>/ {slideCount}</span>
        </label>
        <button type="button" className="icon-button" title="Slide berikutnya" onClick={() => onGoToSlide(state.currentSlide + 1)}>
          <ArrowRightIcon aria-hidden="true" />
        </button>
      </div>

      <div className="toolbar-cluster grow">
        <button type="button" className="tool-button" onClick={onOpenPalette}><CommandLineIcon aria-hidden="true" />Ctrl+K</button>
        <button type="button" className="tool-button" disabled={!state.history.length} onClick={onUndo}><ArrowUturnLeftIcon aria-hidden="true" />Undo</button>
        <button type="button" className="tool-button" disabled={!state.future.length} onClick={onRedo}><ArrowUturnRightIcon aria-hidden="true" />Redo</button>
        <button type="button" className="tool-button primary" onClick={() => void onToggleFullscreen()}>
          {isFullscreen ? <ArrowsPointingInIcon aria-hidden="true" /> : <ArrowsPointingOutIcon aria-hidden="true" />}
          {isFullscreen ? "Exit Fullscreen" : "Fullscreen"} <kbd>F</kbd>
        </button>
      </div>

      <div className="toolbar-cluster">
        <select value={state.theme} onChange={(event) => onThemeChange(event.target.value as ThemeName)} title="Theme">
          {themes.map((theme) => <option key={theme.value} value={theme.value}>{theme.label}</option>)}
        </select>
        <input
          className="accent-input"
          type="color"
          value={state.accent}
          title="Accent color"
          onInput={(event) => onAccentChange(event.currentTarget.value)}
          onChange={(event) => onAccentChange(event.target.value)}
        />
        <SwatchIcon className="toolbar-icon-hint" aria-hidden="true" />
      </div>

      <div className="toolbar-cluster">
        <button type="button" className="tool-button" onClick={() => downloadText("skripsi-presenter-state.json", onExport())}><ArrowDownTrayIcon aria-hidden="true" />Export</button>
        <button type="button" className="tool-button" onClick={() => importRef.current?.click()}><ArrowUpTrayIcon aria-hidden="true" />Import</button>
        <input
          ref={importRef}
          hidden
          type="file"
          accept="application/json"
          onChange={async (event) => {
            const file = event.target.files?.[0];
            if (!file) return;
            onImport(await file.text());
            event.target.value = "";
          }}
        />
        <button type="button" className="tool-button danger" onClick={() => window.confirm("Reset slide aktif?") && onResetSlide()}><TrashIcon aria-hidden="true" />Reset Slide</button>
        <button type="button" className="tool-button danger" onClick={() => window.confirm("Reset semua edit dan layer?") && onResetAll()}><TrashIcon aria-hidden="true" />Reset All</button>
      </div>

      <div className="autosave-pill" title={autosaveDate.toLocaleString("id-ID")}>
        Autosave {autosaveDate.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}
      </div>
    </header>
  );
}
