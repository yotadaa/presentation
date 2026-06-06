import { ArrowDownIcon, ArrowUpIcon, DocumentDuplicateIcon, EyeIcon, EyeSlashIcon, LockClosedIcon, LockOpenIcon, TrashIcon } from "@heroicons/react/24/outline";
import type { SlideLayer } from "../types";
import { normalizeAssetUrl } from "../utils/slideDom";

type LayerPanelProps = {
  layers: SlideLayer[];
  selectedLayerId: string | null;
  onSelectLayer: (id: string | null) => void;
  onUpdateLayer: (id: string, patch: Partial<SlideLayer>, saveHistory?: boolean) => void;
  onDeleteLayer: (id: string) => void;
  onDuplicateLayer: (id: string) => void;
};

export default function LayerPanel({
  layers,
  selectedLayerId,
  onSelectLayer,
  onUpdateLayer,
  onDeleteLayer,
  onDuplicateLayer,
}: LayerPanelProps) {
  if (!layers.length) {
    return <p className="empty-note">Belum ada layer tambahan di slide ini. Insert gambar dari tab Assets.</p>;
  }

  return (
    <section className="layer-panel">
      {layers
        .slice()
        .sort((a, b) => b.zIndex - a.zIndex)
        .map((layer) => (
          <article key={layer.id} className={`layer-row ${selectedLayerId === layer.id ? "active" : ""}`}>
            <button type="button" className="layer-thumb" onClick={() => onSelectLayer(layer.id)}>
              <img src={normalizeAssetUrl(layer.src)} alt={layer.name} />
            </button>
            <div className="layer-main">
              <button type="button" className="layer-title" onClick={() => onSelectLayer(layer.id)}>{layer.name}</button>
              <div className="layer-fields">
                <label>X <input type="number" value={Math.round(layer.x)} onChange={(event) => onUpdateLayer(layer.id, { x: Number(event.target.value) })} /></label>
                <label>Y <input type="number" value={Math.round(layer.y)} onChange={(event) => onUpdateLayer(layer.id, { y: Number(event.target.value) })} /></label>
                <label>W <input type="number" value={Math.round(layer.width)} onChange={(event) => onUpdateLayer(layer.id, { width: Number(event.target.value) })} /></label>
                <label>Z <input type="number" value={layer.zIndex} onChange={(event) => onUpdateLayer(layer.id, { zIndex: Number(event.target.value) })} /></label>
              </div>
              <div className="layer-actions">
                <button type="button" onClick={() => onUpdateLayer(layer.id, { visible: !layer.visible })}>{layer.visible ? <EyeSlashIcon aria-hidden="true" /> : <EyeIcon aria-hidden="true" />}{layer.visible ? "Hide" : "Show"}</button>
                <button type="button" onClick={() => onUpdateLayer(layer.id, { locked: !layer.locked })}>{layer.locked ? <LockOpenIcon aria-hidden="true" /> : <LockClosedIcon aria-hidden="true" />}{layer.locked ? "Unlock" : "Lock"}</button>
                <button type="button" onClick={() => onUpdateLayer(layer.id, { zIndex: layer.zIndex + 1 })}><ArrowUpIcon aria-hidden="true" />Front</button>
                <button type="button" onClick={() => onUpdateLayer(layer.id, { zIndex: layer.zIndex - 1 })}><ArrowDownIcon aria-hidden="true" />Back</button>
                <button type="button" onClick={() => onDuplicateLayer(layer.id)}><DocumentDuplicateIcon aria-hidden="true" />Duplicate</button>
                <button type="button" className="danger-text" onClick={() => onDeleteLayer(layer.id)}><TrashIcon aria-hidden="true" />Delete</button>
              </div>
            </div>
          </article>
        ))}
    </section>
  );
}
