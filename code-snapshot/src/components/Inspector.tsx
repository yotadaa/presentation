import { DocumentTextIcon, PhotoIcon, RectangleStackIcon, BookOpenIcon } from "@heroicons/react/24/outline";
import type { AssetItem, AssetsData, EditorState, ReferenceEntry, SlidesData, ThesisData, SlideLayer } from "../types";
import DraftPanel from "./DraftPanel";
import AssetPanel from "./AssetPanel";
import LayerPanel from "./LayerPanel";
import ReferencePreview from "./ReferencePreview";

type InspectorProps = {
  state: EditorState;
  slidesData: SlidesData;
  thesisData: ThesisData;
  assetsData: AssetsData;
  onSetTab: (tab: EditorState["inspectorTab"]) => void;
  onSetDraftQuery: (query: string) => void;
  onReplaceImage: (asset: AssetItem) => void;
  onAddLayer: (asset: AssetItem) => void;
  onUpdateLayer: (id: string, patch: Partial<SlideLayer>, saveHistory?: boolean) => void;
  onDeleteLayer: (id: string) => void;
  onDuplicateLayer: (id: string) => void;
  onSelectLayer: (id: string | null) => void;
};

const tabs: Array<{ id: EditorState["inspectorTab"]; label: string; Icon: typeof DocumentTextIcon }> = [
  { id: "draft", label: "Draft", Icon: DocumentTextIcon },
  { id: "assets", label: "Assets", Icon: PhotoIcon },
  { id: "layers", label: "Layers", Icon: RectangleStackIcon },
  { id: "references", label: "Refs", Icon: BookOpenIcon },
];

export default function Inspector({
  state,
  slidesData,
  thesisData,
  assetsData,
  onSetTab,
  onSetDraftQuery,
  onReplaceImage,
  onAddLayer,
  onUpdateLayer,
  onDeleteLayer,
  onDuplicateLayer,
  onSelectLayer,
}: InspectorProps) {
  const slide = slidesData.slides.find((item) => item.index === state.currentSlide) || slidesData.slides[0];
  const layers = state.layers.filter((layer) => layer.slideIndex === state.currentSlide);

  return (
    <aside className="inspector">
      <div className="inspector-tabs">
        {tabs.map((tab) => (
          <button key={tab.id} type="button" className={state.inspectorTab === tab.id ? "active" : ""} onClick={() => onSetTab(tab.id)}>
            <tab.Icon aria-hidden="true" />
            {tab.label}
          </button>
        ))}
      </div>

      <div className="inspector-body">
        {state.inspectorTab === "draft" ? (
          <DraftPanel
            blocks={thesisData.blocks}
            query={state.draftQuery || slide.title}
            onQueryChange={onSetDraftQuery}
          />
        ) : null}

        {state.inspectorTab === "assets" ? (
          <AssetPanel
            assets={assetsData.assets}
            selectedTarget={state.selectedTarget}
            onAddLayer={onAddLayer}
            onReplaceImage={onReplaceImage}
          />
        ) : null}

        {state.inspectorTab === "layers" ? (
          <LayerPanel
            layers={layers}
            selectedLayerId={state.selectedLayerId}
            onSelectLayer={onSelectLayer}
            onUpdateLayer={onUpdateLayer}
            onDeleteLayer={onDeleteLayer}
            onDuplicateLayer={onDuplicateLayer}
          />
        ) : null}

        {state.inspectorTab === "references" ? (
          <div className="references-panel">
            <ReferencePreview slide={slide} references={slidesData.referencePdfs as Record<string, ReferenceEntry>} limit={2} />
          </div>
        ) : null}
      </div>
    </aside>
  );
}
