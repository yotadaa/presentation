import { useCallback, useEffect, useMemo, useState } from "react";
import type { AssetsData, SlidesData, ThesisData } from "../types";
import { slideHtmlFor } from "../utils/slideDom";
import { useEditorState } from "../hooks/useEditorState";
import Toolbar from "./Toolbar";
import SlideRail from "./SlideRail";
import SlideCanvas from "./SlideCanvas";
import Inspector from "./Inspector";
import DetailModal from "./DetailModal";
import CommandPalette from "./CommandPalette";

type AppShellProps = {
  slidesData: SlidesData;
  thesisData: ThesisData;
  assetsData: AssetsData;
};

export default function AppShell({ slidesData, thesisData, assetsData }: AppShellProps) {
  const initialSlideHtmlByIndex = useMemo(
    () => Object.fromEntries(slidesData.slides.map((slide) => [slide.index, slide.html])),
    [slidesData.slides],
  );
  const editor = useEditorState(slidesData.slides.length, initialSlideHtmlByIndex);
  const { state } = editor;
  const [modalOpen, setModalOpen] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const activeSlide = useMemo(
    () => slidesData.slides.find((slide) => slide.index === state.currentSlide) || slidesData.slides[0],
    [slidesData.slides, state.currentSlide],
  );
  const activeHtml = useMemo(
    () => slideHtmlFor(activeSlide, state.slideHtmlByIndex),
    [activeSlide, state.slideHtmlByIndex],
  );
  const activeLayers = useMemo(
    () => state.layers.filter((layer) => layer.slideIndex === activeSlide.index),
    [activeSlide.index, state.layers],
  );
  const chapterStartByName = useMemo(() => {
    const entries = new Map<string, number>();
    slidesData.slides.forEach((slide) => {
      if (!entries.has(slide.chapter)) entries.set(slide.chapter, slide.index);
    });
    return Object.fromEntries(entries);
  }, [slidesData.slides]);

  const toggleFullscreen = useCallback(async () => {
    const root = document.querySelector(".app-shell") as HTMLElement | null;
    if (!document.fullscreenElement && root) {
      await root.requestFullscreen();
    } else if (document.fullscreenElement) {
      await document.exitFullscreen();
    }
  }, []);

  useEffect(() => {
    const handler = () => setIsFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener("fullscreenchange", handler);
    return () => document.removeEventListener("fullscreenchange", handler);
  }, []);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      const editing = target?.matches("input, textarea, select, [contenteditable='true']");
      if (editing) return;
      if (event.key === "ArrowRight") editor.goToSlide(state.currentSlide + 1);
      if (event.key === "ArrowLeft") editor.goToSlide(state.currentSlide - 1);
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "z") editor.undo();
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "y") editor.redo();
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setPaletteOpen(true);
      }
      if (event.key.toLowerCase() === "f") {
        event.preventDefault();
        void toggleFullscreen();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [editor, state.currentSlide, toggleFullscreen]);

  return (
    <div className={`app-shell ${isFullscreen ? "is-presenting" : ""}`}>
      <Toolbar
        state={state}
        slideCount={slidesData.slides.length}
        isFullscreen={isFullscreen}
        onGoToSlide={editor.goToSlide}
        onThemeChange={editor.setTheme}
        onAccentChange={editor.setAccent}
        onUndo={editor.undo}
        onRedo={editor.redo}
        onOpenPalette={() => setPaletteOpen(true)}
        onToggleFullscreen={toggleFullscreen}
        onExport={editor.exportState}
        onImport={editor.importState}
        onResetSlide={() => editor.resetSlide(state.currentSlide)}
        onResetAll={editor.resetAll}
      />

      <div className="workspace-grid">
        <SlideRail
          slides={slidesData.slides}
          currentSlide={state.currentSlide}
          onSelect={editor.goToSlide}
        />
        <SlideCanvas
          slide={activeSlide}
          html={activeHtml}
          theme={state.theme}
          accent={state.accent}
          chapterStartByName={chapterStartByName}
          layers={activeLayers}
          selectedLayerId={state.selectedLayerId}
          onSelectTarget={(target) => {
            editor.selectTarget(target);
            setModalOpen(Boolean(target));
          }}
          onSelectLayer={editor.selectLayer}
          onUpdateLayer={editor.updateLayer}
          onNext={() => editor.goToSlide(state.currentSlide + 1)}
          onPrev={() => editor.goToSlide(state.currentSlide - 1)}
          onGoToSlide={editor.goToSlide}
        />
        <Inspector
          state={state}
          slidesData={slidesData}
          thesisData={thesisData}
          assetsData={assetsData}
          onSetTab={editor.setInspectorTab}
          onSetDraftQuery={editor.setDraftQuery}
          onReplaceImage={editor.replaceImage}
          onAddLayer={editor.addLayer}
          onUpdateLayer={editor.updateLayer}
          onDeleteLayer={editor.deleteLayer}
          onDuplicateLayer={editor.duplicateLayer}
          onSelectLayer={editor.selectLayer}
        />
      </div>

      {modalOpen && state.selectedTarget ? (
        <DetailModal
          slide={activeSlide}
          target={state.selectedTarget}
          references={slidesData.referencePdfs}
          thesisBlocks={thesisData.blocks}
          onClose={() => {
            setModalOpen(false);
            editor.selectTarget(null);
          }}
          onShowDraft={(query) => editor.setDraftQuery(query)}
          onReplaceText={(replacement) => editor.replaceText(replacement, state.selectedTarget ?? undefined)}
        />
      ) : null}

      {paletteOpen ? (
        <CommandPalette
          slides={slidesData.slides}
          thesisBlocks={thesisData.blocks}
          assets={assetsData.assets}
          onClose={() => setPaletteOpen(false)}
          onGoToSlide={editor.goToSlide}
          onSetDraftQuery={editor.setDraftQuery}
          onAddLayer={editor.addLayer}
          onToggleFullscreen={toggleFullscreen}
        />
      ) : null}
    </div>
  );
}
