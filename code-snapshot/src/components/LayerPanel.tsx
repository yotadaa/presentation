import { ArrowDownIcon, ArrowUpIcon, DocumentDuplicateIcon, EyeIcon, EyeSlashIcon, LockClosedIcon, LockOpenIcon, TrashIcon } from "@heroicons/react/24/outline";
import type { BaseImageLayer, BaseImageOverride, SlideLayer } from "../types";
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
  onUpdateBaseImage: (id: string, patch: Partial<BaseImageOverride>, saveHistory?: boolean) => void;
  onDuplicateBaseImage: (id: string) => void;
};

export default function LayerPanel({
  layers,
  baseImages,
  selectedLayerId,
  onSelectLayer,
  onUpdateLayer,
  onDeleteLayer,
  onDuplicateLayer,
  onUpdateBaseImage,
  onDuplicateBaseImage,
}: LayerPanelProps) {
  if (!layers.length && !baseImages.length) {
    return <p className="empty-note">Belum ada layer tambahan di slide ini. Insert gambar dari tab Assets.</p>;
  }

  return (
    <section className="layer-panel">
      {baseImages.length ? (
        <div className="base-layer-group">
          <h3>Gambar bawaan slide</h3>
          {baseImages
            .slice()
            .sort((a, b) => (b.zIndex ?? 0) - (a.zIndex ?? 0))
            .map((image) => {
              const visible = image.visible !== false;
              const locked = image.locked === true;
              const hasRect = image.x != null && image.y != null && image.width != null;
              return (
                <article key={image.id} className={`layer-row base-layer-row ${selectedLayerId === image.id ? "active" : ""} ${visible ? "" : "is-hidden"}`}>
                  <IconButton
                    label={`Pilih gambar ${image.name}`}
                    className="layer-thumb"
                    icon={<img src={normalizeAssetUrl(image.src)} alt={image.alt || image.name} />}
                    onClick={() => onSelectLayer(image.id)}
                  />
                  <div className="layer-main">
                    <AppButton variant="ghost" size="sm" className="layer-title" onClick={() => onSelectLayer(image.id)}>
                      {image.name}
                    </AppButton>
                    <p>{hasRect ? "Gambar bawaan sudah menjadi layer terkelola." : "Posisi gambar sedang dibaca dari slide."}</p>
                    {hasRect ? (
                      <div className="layer-fields">
                        <NumberStepper label="X" min={0} max={95} value={Math.round(image.x ?? 0)} onChange={(value) => onUpdateBaseImage(image.id, { x: value })} />
                        <NumberStepper label="Y" min={0} max={92} value={Math.round(image.y ?? 0)} onChange={(value) => onUpdateBaseImage(image.id, { y: value })} />
                        <NumberStepper label="W" min={4} max={95} value={Math.round(image.width ?? 12)} onChange={(value) => onUpdateBaseImage(image.id, { width: value })} />
                        <NumberStepper label="Z" min={1} max={999} value={image.zIndex ?? 12} onChange={(value) => onUpdateBaseImage(image.id, { zIndex: value })} />
                      </div>
                    ) : null}
                    <div className="layer-actions">
                      <AppButton size="sm" icon={visible ? <EyeSlashIcon aria-hidden="true" /> : <EyeIcon aria-hidden="true" />} onClick={() => onUpdateBaseImage(image.id, { visible: !visible })}>{visible ? "Hide" : "Show"}</AppButton>
                      <AppButton size="sm" icon={locked ? <LockOpenIcon aria-hidden="true" /> : <LockClosedIcon aria-hidden="true" />} onClick={() => onUpdateBaseImage(image.id, { locked: !locked })}>{locked ? "Unlock" : "Lock"}</AppButton>
                      <AppButton size="sm" icon={<ArrowUpIcon aria-hidden="true" />} onClick={() => onUpdateBaseImage(image.id, { zIndex: (image.zIndex ?? 12) + 1 })}>Front</AppButton>
                      <AppButton size="sm" icon={<ArrowDownIcon aria-hidden="true" />} onClick={() => onUpdateBaseImage(image.id, { zIndex: Math.max(1, (image.zIndex ?? 12) - 1) })}>Back</AppButton>
                      <AppButton size="sm" icon={<DocumentDuplicateIcon aria-hidden="true" />} onClick={() => onDuplicateBaseImage(image.id)}>Duplicate</AppButton>
                    </div>
                  </div>
                </article>
              );
            })}
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
