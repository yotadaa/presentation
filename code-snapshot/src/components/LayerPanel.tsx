import { ArrowDownIcon, ArrowUpIcon, DocumentDuplicateIcon, EyeIcon, EyeSlashIcon, LockClosedIcon, LockOpenIcon, TrashIcon } from "@heroicons/react/24/outline";
import type { BaseImageLayer, SlideLayer } from "../types";
import { normalizeAssetUrl } from "../utils/slideDom";
import { AppButton, IconButton, NumberStepper } from "./ui/controls";

type LayerPanelProps = {
  layers: SlideLayer[];
  baseImages: BaseImageLayer[];
  selectedLayerId: string | null;
  onSelectLayer: (id: string | null) => void;
  onUpdateLayer: (id: string, patch: Partial<SlideLayer>, saveHistory?: boolean) => void;
  onDeleteLayer: (id: string) => void;
  onDuplicateLayer: (id: string) => void;
};

export default function LayerPanel({
  layers,
  baseImages,
  selectedLayerId,
  onSelectLayer,
  onUpdateLayer,
  onDeleteLayer,
  onDuplicateLayer,
}: LayerPanelProps) {
  if (!layers.length && !baseImages.length) {
    return <p className="empty-note">Belum ada layer tambahan di slide ini. Insert gambar dari tab Assets.</p>;
  }

  return (
    <section className="layer-panel">
      {baseImages.length ? (
        <div className="base-layer-group">
          <h3>Gambar bawaan slide</h3>
          {baseImages.map((image) => (
            <article key={image.id} className="layer-row base-layer-row">
              <span className="layer-thumb">
                <img src={normalizeAssetUrl(image.src)} alt={image.alt || image.name} />
              </span>
              <div className="layer-main">
                <strong className="layer-title">{image.name}</strong>
                <p>Base image terkunci dari HTML slide. Klik gambar di canvas untuk kontrol cepat.</p>
              </div>
            </article>
          ))}
        </div>
      ) : null}

      {layers
        .slice()
        .sort((a, b) => b.zIndex - a.zIndex)
        .map((layer) => (
          <article key={layer.id} className={`layer-row ${selectedLayerId === layer.id ? "active" : ""}`}>
            <IconButton
              label={`Pilih layer ${layer.name}`}
              className="layer-thumb"
              icon={<img src={normalizeAssetUrl(layer.src)} alt={layer.name} />}
              onClick={() => onSelectLayer(layer.id)}
            />
            <div className="layer-main">
              <AppButton variant="ghost" size="sm" className="layer-title" onClick={() => onSelectLayer(layer.id)}>
                {layer.name}
              </AppButton>
              <div className="layer-fields">
                <NumberStepper label="X" min={0} max={95} value={Math.round(layer.x)} onChange={(value) => onUpdateLayer(layer.id, { x: value })} />
                <NumberStepper label="Y" min={0} max={92} value={Math.round(layer.y)} onChange={(value) => onUpdateLayer(layer.id, { y: value })} />
                <NumberStepper label="W" min={4} max={95} value={Math.round(layer.width)} onChange={(value) => onUpdateLayer(layer.id, { width: value })} />
                <NumberStepper label="Z" min={1} max={999} value={layer.zIndex} onChange={(value) => onUpdateLayer(layer.id, { zIndex: value })} />
              </div>
              <div className="layer-actions">
                <AppButton size="sm" icon={layer.visible ? <EyeSlashIcon aria-hidden="true" /> : <EyeIcon aria-hidden="true" />} onClick={() => onUpdateLayer(layer.id, { visible: !layer.visible })}>{layer.visible ? "Hide" : "Show"}</AppButton>
                <AppButton size="sm" icon={layer.locked ? <LockOpenIcon aria-hidden="true" /> : <LockClosedIcon aria-hidden="true" />} onClick={() => onUpdateLayer(layer.id, { locked: !layer.locked })}>{layer.locked ? "Unlock" : "Lock"}</AppButton>
                <AppButton size="sm" icon={<ArrowUpIcon aria-hidden="true" />} onClick={() => onUpdateLayer(layer.id, { zIndex: layer.zIndex + 1 })}>Front</AppButton>
                <AppButton size="sm" icon={<ArrowDownIcon aria-hidden="true" />} onClick={() => onUpdateLayer(layer.id, { zIndex: layer.zIndex - 1 })}>Back</AppButton>
                <AppButton size="sm" icon={<DocumentDuplicateIcon aria-hidden="true" />} onClick={() => onDuplicateLayer(layer.id)}>Duplicate</AppButton>
                <AppButton size="sm" variant="danger" className="danger-text" icon={<TrashIcon aria-hidden="true" />} onClick={() => onDeleteLayer(layer.id)}>Delete</AppButton>
              </div>
            </div>
          </article>
        ))}
    </section>
  );
}
