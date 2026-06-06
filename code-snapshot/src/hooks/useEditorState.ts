import { useCallback, useEffect, useMemo, useState } from "react";
import type { AssetItem, EditorSnapshot, EditorState, SelectionTarget, SlideLayer, ThemeName } from "../types";
import { replaceElementText, replaceImageSource } from "../utils/slideDom";

const STORAGE_KEY = "skripsi-presenter-react-editor-v1";

type InitialState = Pick<EditorState, "slideHtmlByIndex" | "layers">;

function snapshot(state: EditorState): EditorSnapshot {
  return {
    slideHtmlByIndex: state.slideHtmlByIndex,
    layers: state.layers,
  };
}

function loadState(initial: InitialState): EditorState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<EditorState> & { version?: number };
      if (parsed.version === 1) {
        const storedSlides = parsed.slideHtmlByIndex && Object.keys(parsed.slideHtmlByIndex).length
          ? { ...initial.slideHtmlByIndex, ...parsed.slideHtmlByIndex }
          : initial.slideHtmlByIndex;
        return {
          currentSlide: parsed.currentSlide || 1,
          theme: parsed.theme || "light",
          accent: parsed.accent || "#14b8a6",
          selectedTarget: null,
          selectedLayerId: null,
          draftQuery: "",
          inspectorTab: "draft",
          slideHtmlByIndex: storedSlides,
          layers: parsed.layers || initial.layers,
          history: [],
          future: [],
          autosavedAt: parsed.autosavedAt || Date.now(),
        };
      }
    }
  } catch {
    localStorage.removeItem(STORAGE_KEY);
  }
  return {
    currentSlide: 1,
    theme: "light",
    accent: "#14b8a6",
    selectedTarget: null,
    selectedLayerId: null,
    draftQuery: "",
    inspectorTab: "draft",
    slideHtmlByIndex: initial.slideHtmlByIndex,
    layers: initial.layers,
    history: [],
    future: [],
    autosavedAt: Date.now(),
  };
}

export function useEditorState(slideCount: number, initialSlideHtmlByIndex: Record<number, string>) {
  const [state, setState] = useState<EditorState>(() => loadState({ slideHtmlByIndex: initialSlideHtmlByIndex, layers: [] }));

  useEffect(() => {
    const { history, future, selectedTarget, selectedLayerId, ...persisted } = state;
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...persisted, version: 1, selectedTarget: null, selectedLayerId: null }));
  }, [state]);

  const commit = useCallback((mutator: (draft: EditorState) => EditorState) => {
    setState((prev) => {
      const next = mutator(prev);
      return {
        ...next,
        history: [...prev.history.slice(-30), snapshot(prev)],
        future: [],
        autosavedAt: Date.now(),
      };
    });
  }, []);

  const goToSlide = useCallback((slide: number) => {
    setState((prev) => ({
      ...prev,
      currentSlide: Math.min(slideCount, Math.max(1, slide)),
      selectedTarget: null,
      selectedLayerId: null,
    }));
  }, [slideCount]);

  const setTheme = useCallback((theme: ThemeName) => {
    setState((prev) => ({ ...prev, theme, autosavedAt: Date.now() }));
  }, []);

  const setAccent = useCallback((accent: string) => {
    setState((prev) => ({ ...prev, accent, autosavedAt: Date.now() }));
  }, []);

  const selectTarget = useCallback((target: SelectionTarget | null) => {
    setState((prev) => ({
      ...prev,
      selectedTarget: target,
      selectedLayerId: null,
      draftQuery: target?.text.slice(0, 180) || prev.draftQuery,
    }));
  }, []);

  const selectLayer = useCallback((layerId: string | null) => {
    setState((prev) => ({ ...prev, selectedLayerId: layerId, selectedTarget: null }));
  }, []);

  const setDraftQuery = useCallback((draftQuery: string) => {
    setState((prev) => ({ ...prev, draftQuery, inspectorTab: "draft" }));
  }, []);

  const setInspectorTab = useCallback((inspectorTab: EditorState["inspectorTab"]) => {
    setState((prev) => ({ ...prev, inspectorTab }));
  }, []);

  const replaceText = useCallback((replacement: string, targetOverride?: SelectionTarget) => {
    commit((prev) => {
      const target = targetOverride || prev.selectedTarget;
      if (!target) return prev;
      const html = prev.slideHtmlByIndex[target.slideIndex] || initialSlideHtmlByIndex[target.slideIndex] || "";
      return {
        ...prev,
        slideHtmlByIndex: {
          ...prev.slideHtmlByIndex,
          [target.slideIndex]: replaceElementText(html, target.editId, replacement),
        },
      };
    });
  }, [commit]);

  const replaceImage = useCallback((asset: AssetItem) => {
    commit((prev) => {
      const target = prev.selectedTarget;
      if (!target || target.kind !== "image") return prev;
      const html = prev.slideHtmlByIndex[target.slideIndex] || initialSlideHtmlByIndex[target.slideIndex] || "";
      return {
        ...prev,
        slideHtmlByIndex: {
          ...prev.slideHtmlByIndex,
          [target.slideIndex]: replaceImageSource(html, target.editId, asset.path.replace(/^\//, "")),
        },
      };
    });
  }, [commit]);

  const addLayer = useCallback((asset: AssetItem) => {
    commit((prev) => {
      const maxZ = prev.layers.filter((layer) => layer.slideIndex === prev.currentSlide).reduce((max, layer) => Math.max(max, layer.zIndex), 20);
      const layer: SlideLayer = {
        id: `layer-${Date.now()}`,
        slideIndex: prev.currentSlide,
        assetId: asset.id,
        src: asset.path,
        name: asset.name,
        x: 58,
        y: 42,
        width: 22,
        zIndex: maxZ + 1,
        visible: true,
        locked: false,
      };
      return { ...prev, layers: [...prev.layers, layer], selectedLayerId: layer.id };
    });
  }, [commit]);

  const duplicateLayer = useCallback((layerId: string) => {
    commit((prev) => {
      const layer = prev.layers.find((item) => item.id === layerId);
      if (!layer) return prev;
      const duplicate: SlideLayer = {
        ...layer,
        id: `layer-${Date.now()}`,
        name: `${layer.name} copy`,
        x: Math.min(88, layer.x + 4),
        y: Math.min(82, layer.y + 4),
        zIndex: layer.zIndex + 1,
      };
      return { ...prev, layers: [...prev.layers, duplicate], selectedLayerId: duplicate.id };
    });
  }, [commit]);

  const updateLayer = useCallback((layerId: string, patch: Partial<SlideLayer>, saveHistory = true) => {
    const updater = (prev: EditorState) => ({
      ...prev,
      layers: prev.layers.map((layer) => layer.id === layerId ? { ...layer, ...patch } : layer),
    });
    if (saveHistory) commit(updater);
    else setState((prev) => ({ ...updater(prev), autosavedAt: Date.now() }));
  }, [commit]);

  const deleteLayer = useCallback((layerId: string) => {
    commit((prev) => ({ ...prev, layers: prev.layers.filter((layer) => layer.id !== layerId), selectedLayerId: null }));
  }, [commit]);

  const undo = useCallback(() => {
    setState((prev) => {
      const previous = prev.history.at(-1);
      if (!previous) return prev;
      return {
        ...prev,
        ...previous,
        history: prev.history.slice(0, -1),
        future: [snapshot(prev), ...prev.future],
      };
    });
  }, []);

  const redo = useCallback(() => {
    setState((prev) => {
      const next = prev.future[0];
      if (!next) return prev;
      return {
        ...prev,
        ...next,
        history: [...prev.history, snapshot(prev)],
        future: prev.future.slice(1),
      };
    });
  }, []);

  const resetSlide = useCallback((slideIndex: number) => {
    commit((prev) => {
      const nextHtml = { ...prev.slideHtmlByIndex, [slideIndex]: initialSlideHtmlByIndex[slideIndex] || "" };
      return {
        ...prev,
        slideHtmlByIndex: nextHtml,
        layers: prev.layers.filter((layer) => layer.slideIndex !== slideIndex),
        selectedLayerId: null,
        selectedTarget: null,
      };
    });
  }, [commit]);

  const exportState = useCallback(() => {
    return JSON.stringify({ version: 1, ...snapshot(state), theme: state.theme, accent: state.accent }, null, 2);
  }, [state]);

  const importState = useCallback((value: string) => {
    const parsed = JSON.parse(value) as Partial<EditorSnapshot>;
    commit((prev) => ({
      ...prev,
      slideHtmlByIndex: parsed.slideHtmlByIndex || prev.slideHtmlByIndex,
      layers: parsed.layers || prev.layers,
    }));
  }, [commit]);

  const resetAll = useCallback(() => {
    commit((prev) => ({
      ...prev,
      slideHtmlByIndex: initialSlideHtmlByIndex,
      layers: [],
      selectedLayerId: null,
      selectedTarget: null,
    }));
  }, [commit]);

  return useMemo(() => ({
    state,
    goToSlide,
    setTheme,
    setAccent,
    selectTarget,
    selectLayer,
    setDraftQuery,
    setInspectorTab,
    replaceText,
    replaceImage,
    addLayer,
    duplicateLayer,
    updateLayer,
    deleteLayer,
    undo,
    redo,
    resetSlide,
    exportState,
    importState,
    resetAll,
  }), [addLayer, deleteLayer, duplicateLayer, exportState, goToSlide, importState, redo, replaceImage, replaceText, resetAll, resetSlide, selectLayer, selectTarget, setAccent, setDraftQuery, setInspectorTab, setTheme, state, undo, updateLayer]);
}
