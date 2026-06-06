import { useMemo, useState } from "react";
import { FunnelIcon, MagnifyingGlassIcon, PhotoIcon, RectangleStackIcon } from "@heroicons/react/24/outline";
import type { AssetItem, SelectionTarget } from "../types";
import { normalizeAssetUrl } from "../utils/slideDom";

type AssetPanelProps = {
  assets: AssetItem[];
  selectedTarget: SelectionTarget | null;
  onAddLayer: (asset: AssetItem) => void;
  onReplaceImage: (asset: AssetItem) => void;
};

const filters = ["all", "isometric", "gui", "reference", "logo", "slide"] as const;

export default function AssetPanel({ assets, selectedTarget, onAddLayer, onReplaceImage }: AssetPanelProps) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<(typeof filters)[number]>("all");

  const shown = useMemo(() => {
    const q = query.toLowerCase();
    return assets
      .filter((asset) => filter === "all" || asset.kind === filter)
      .filter((asset) => !q || asset.name.toLowerCase().includes(q) || asset.kind.includes(q))
      .slice(0, 90);
  }, [assets, filter, query]);

  return (
    <section className="asset-panel">
      <div className="panel-search">
        <label>
          <span>Cari aset gambar</span>
          <MagnifyingGlassIcon aria-hidden="true" />
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="isometric, GUI, logo..." />
        </label>
      </div>
      <div className="filter-row">
        {filters.map((item) => (
          <button key={item} type="button" className={filter === item ? "active" : ""} onClick={() => setFilter(item)}>
            <FunnelIcon aria-hidden="true" />
            {item}
          </button>
        ))}
      </div>
      <div className="asset-grid">
        {shown.map((asset) => (
          <article key={asset.id} className="asset-card">
            <img src={normalizeAssetUrl(asset.path)} alt={asset.name} loading="lazy" />
            <div>
              <strong>{asset.name}</strong>
              <span>{asset.kind}</span>
            </div>
            <div className="asset-actions">
              <button type="button" onClick={() => onAddLayer(asset)}><RectangleStackIcon aria-hidden="true" />Insert layer</button>
              <button
                type="button"
                disabled={selectedTarget?.kind !== "image"}
                onClick={() => onReplaceImage(asset)}
              >
                <PhotoIcon aria-hidden="true" />
                Replace image
              </button>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
