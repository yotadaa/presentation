import { useMemo, useState } from "react";
import { BoltIcon, MagnifyingGlassIcon } from "@heroicons/react/24/outline";
import type { AssetItem, Slide, ThesisBlock } from "../types";

type CommandPaletteProps = {
  slides: Slide[];
  thesisBlocks: ThesisBlock[];
  assets: AssetItem[];
  onClose: () => void;
  onGoToSlide: (slide: number) => void;
  onSetDraftQuery: (query: string) => void;
  onAddLayer: (asset: AssetItem) => void;
  onToggleFullscreen: () => void | Promise<void>;
};

export default function CommandPalette({
  slides,
  thesisBlocks,
  assets,
  onClose,
  onGoToSlide,
  onSetDraftQuery,
  onAddLayer,
  onToggleFullscreen,
}: CommandPaletteProps) {
  const [query, setQuery] = useState("");
  const q = query.toLowerCase();

  const matches = useMemo(() => {
    const slideMatches = slides
      .filter((slide) => !q || slide.title.toLowerCase().includes(q) || String(slide.index).includes(q))
      .slice(0, 8)
      .map((slide) => ({
        id: `slide-${slide.index}`,
        type: "Slide",
        title: `${String(slide.index).padStart(2, "0")} - ${slide.title}`,
        action: () => onGoToSlide(slide.index),
      }));
    const draftMatches = thesisBlocks
      .filter((block) => q && block.searchText.toLowerCase().includes(q))
      .slice(0, 5)
      .map((block) => ({
        id: block.id,
        type: "Draft",
        title: `${block.section || "Draft"} - ${block.text.slice(0, 90)}`,
        action: () => onSetDraftQuery(block.text.slice(0, 160)),
      }));
    const assetMatches = assets
      .filter((asset) => q && asset.name.toLowerCase().includes(q))
      .slice(0, 5)
      .map((asset) => ({
        id: asset.id,
        type: "Asset",
        title: asset.name,
        action: () => onAddLayer(asset),
      }));
    const fixed = [
      { id: "fullscreen", type: "Action", title: "Toggle Fullscreen (F / Shift+F)", action: onToggleFullscreen },
    ];
    return [...fixed, ...slideMatches, ...draftMatches, ...assetMatches];
  }, [assets, onAddLayer, onGoToSlide, onSetDraftQuery, onToggleFullscreen, q, slides, thesisBlocks]);

  return (
    <div className="palette-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <section className="command-palette" role="dialog" aria-modal="true" aria-label="Command palette">
        <input
          autoFocus
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Escape") onClose();
          }}
          placeholder="Cari slide, draft, asset, atau command..."
        />
        <MagnifyingGlassIcon className="palette-search-icon" aria-hidden="true" />
        <div className="command-list">
          {matches.map((match) => (
            <button
              key={match.id}
              type="button"
              onClick={() => {
                void match.action();
                onClose();
              }}
            >
              <BoltIcon aria-hidden="true" />
              <span>{match.type}</span>
              <strong>{match.title}</strong>
            </button>
          ))}
        </div>
      </section>
    </div>
  );
}
