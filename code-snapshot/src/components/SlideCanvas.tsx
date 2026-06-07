import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowDownIcon,
  ArrowUpIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  DocumentDuplicateIcon,
  EyeSlashIcon,
  LockClosedIcon,
  LockOpenIcon,
  PhotoIcon,
  TrashIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import type { CSSProperties } from "react";
import type { AssetItem, BaseImageLayer, SelectionTarget, Slide, SlideLayer } from "../types";
import { normalizeAssetUrl, targetFromElement } from "../utils/slideDom";
import { AppButton, IconButton } from "./ui/controls";

const SLIDE_WIDTH = 1536;
const SLIDE_HEIGHT = 864;

type SlideCanvasProps = {
  slide: Slide;
  html: string;
  theme: string;
  accent: string;
  chapterStartByName: Record<string, number>;
  layers: SlideLayer[];
  baseImages: BaseImageLayer[];
  selectedLayerId: string | null;
  onSelectTarget: (target: SelectionTarget | null) => void;
  onSelectLayer: (layerId: string | null) => void;
  onUpdateLayer: (layerId: string, patch: Partial<SlideLayer>, saveHistory?: boolean) => void;
  onDeleteLayer: (layerId: string) => void;
  onDuplicateLayer: (layerId: string) => void;
  onAddLayer: (asset: AssetItem, position?: { x: number; y: number; width?: number }) => void;
  onGoToSlide: (slide: number) => void;
  onNext: () => void;
  onPrev: () => void;
};

export default function SlideCanvas({
  slide,
  html,
  theme,
  accent,
  chapterStartByName,
  layers,
  baseImages,
  selectedLayerId,
  onSelectTarget,
  onSelectLayer,
  onUpdateLayer,
  onDeleteLayer,
  onDuplicateLayer,
  onAddLayer,
  onGoToSlide,
  onNext,
  onPrev,
}: SlideCanvasProps) {
  const viewportRef = useRef<HTMLDivElement>(null);
  const frameRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const previousSlideIndexRef = useRef(slide.index);
  const dragRef = useRef<{ id: string; startX: number; startY: number; x: number; y: number } | null>(null);
  const gestureRef = useRef<{ pointerId: number; startX: number; startY: number; startTime: number } | null>(null);
  const [imageTip, setImageTip] = useState<
    | { kind: "base"; target: SelectionTarget; title: string; x: number; y: number }
    | { kind: "layer"; layerId: string; title: string; x: number; y: number }
    | null
  >(null);
  const transitionDirection = slide.index >= previousSlideIndexRef.current ? "forward" : "backward";
  const imageTipPosition = useMemo(() => {
    if (!imageTip) return null;
    const minX = imageTip.kind === "base" ? 32 : 30;
    const maxX = imageTip.kind === "base" ? 68 : 70;

    return {
      left: `${Math.max(minX, Math.min(maxX, imageTip.x))}%`,
      top: `${Math.max(14, Math.min(80, imageTip.y))}%`,
    } satisfies CSSProperties;
  }, [imageTip]);

  useEffect(() => {
    const resize = () => {
      const viewport = viewportRef.current;
      if (!viewport) return;
      const rect = viewport.getBoundingClientRect();
      const styles = window.getComputedStyle(viewport);
      const horizontalPadding = parseFloat(styles.paddingLeft) + parseFloat(styles.paddingRight);
      const verticalPadding = parseFloat(styles.paddingTop) + parseFloat(styles.paddingBottom);
      const availableWidth = Math.max(0, rect.width - horizontalPadding);
      const availableHeight = Math.max(0, rect.height - verticalPadding);
      setScale(Math.min(availableWidth / SLIDE_WIDTH, availableHeight / SLIDE_HEIGHT));
    };
    resize();
    const observer = new ResizeObserver(resize);
    if (viewportRef.current) observer.observe(viewportRef.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    previousSlideIndexRef.current = slide.index;
    setImageTip(null);
  }, [slide.index]);

  const slideProgress = useMemo(() => `${slide.index} / 45`, [slide.index]);

  return (
    <main className="canvas-panel">
      <div className="canvas-meta">
        <div>
          <span className="chapter-pill">{slide.chapter}</span>
          <strong>{slide.title}</strong>
        </div>
        <span>{slideProgress}</span>
      </div>

      <div
        className="slide-viewport"
        ref={viewportRef}
        onPointerDown={(event) => {
          if (!isPresentationGestureEnabled()) return;
          gestureRef.current = {
            pointerId: event.pointerId,
            startX: event.clientX,
            startY: event.clientY,
            startTime: Date.now(),
          };
        }}
        onPointerUp={(event) => {
          const gesture = gestureRef.current;
          gestureRef.current = null;
          if (!gesture || gesture.pointerId !== event.pointerId || !isPresentationGestureEnabled()) return;

          const deltaX = event.clientX - gesture.startX;
          const deltaY = event.clientY - gesture.startY;
          const elapsed = Date.now() - gesture.startTime;
          const viewport = viewportRef.current;
          const rect = viewport?.getBoundingClientRect();
          const absX = Math.abs(deltaX);
          const absY = Math.abs(deltaY);
          const isSwipe = absX >= 54 && absX > absY * 1.35 && elapsed < 900;

          if (isSwipe) {
            event.preventDefault();
            if (deltaX < 0) onNext();
            else onPrev();
            return;
          }

          if (!rect || absX > 12 || absY > 12) return;
          const edgeWidth = Math.max(44, rect.width * 0.16);
          const localX = event.clientX - rect.left;
          const interactive = (event.target as HTMLElement).closest(".chapter .chip, button, input, select, textarea, a, [contenteditable='true']");
          if (interactive) return;

          if (localX <= edgeWidth) {
            event.preventDefault();
            onPrev();
          } else if (localX >= rect.width - edgeWidth) {
            event.preventDefault();
            onNext();
          }
        }}
        onPointerCancel={() => {
          gestureRef.current = null;
        }}
        onDragOver={(event) => {
          if (event.dataTransfer.types.includes("application/x-skripsi-asset")) {
            event.preventDefault();
            event.dataTransfer.dropEffect = "copy";
          }
        }}
        onDrop={(event) => {
          const raw = event.dataTransfer.getData("application/x-skripsi-asset");
          if (!raw) return;
          event.preventDefault();
          const asset = JSON.parse(raw) as AssetItem;
          const shell = frameRef.current?.getBoundingClientRect();
          if (!shell) return;
          const x = Math.max(4, Math.min(96, ((event.clientX - shell.left) / shell.width) * 100));
          const y = Math.max(4, Math.min(94, ((event.clientY - shell.top) / shell.height) * 100));
          onAddLayer(asset, { x, y, width: 20 });
        }}
      >
        <IconButton className="nav-hit left" label="Slide sebelumnya" icon={<ChevronLeftIcon aria-hidden="true" />} onClick={onPrev} />
          <div
            key={slide.index}
            className={`slide-scale-shell slide-enter-${transitionDirection}`}
            style={{
              width: SLIDE_WIDTH * scale,
              height: SLIDE_HEIGHT * scale,
          }}
        >
          <div
            ref={frameRef}
            className="react-slide-frame"
            data-slide-theme={theme}
            style={{ transform: `scale(${scale})`, "--slide-accent": accent } as CSSProperties}
            onClick={(event) => {
              const target = event.target as HTMLElement;
              const chapterChip = target.closest(".chapter .chip") as HTMLElement | null;
              if (chapterChip) {
                event.preventDefault();
                event.stopPropagation();
                const chapter = chapterChip.textContent?.trim();
                const targetSlide = chapter ? chapterStartByName[chapter] : undefined;
                if (targetSlide) onGoToSlide(targetSlide);
                return;
              }
              const layerHit = target.closest(".slide-layer");
              if (layerHit) return;
              const selected = targetFromElement(target, slide.index);
              const selectedNode = (target.closest("[data-edit-id]") || target.closest("img")) as HTMLElement | null;
              onSelectLayer(null);
              onSelectTarget(selected);
              if (selected?.kind === "image" && selectedNode && frameRef.current) {
                const imageRect = selectedNode.getBoundingClientRect();
                const frameRect = frameRef.current.getBoundingClientRect();
                const baseImage = baseImages.find((item) => item.editId === selected.editId);
                setImageTip({
                  kind: "base",
                  target: selected,
                  title: baseImage?.name || selected.text || "Gambar slide",
                  x: ((imageRect.left + imageRect.width / 2 - frameRect.left) / frameRect.width) * 100,
                  y: ((imageRect.top - frameRect.top) / frameRect.height) * 100,
                });
              } else {
                setImageTip(null);
              }
            }}
            dangerouslySetInnerHTML={{ __html: html }}
          />

          <div className="layer-stage" aria-label="Layer gambar tambahan">
            {layers.map((layer) => {
              if (!layer.visible) return null;
              return (
                <div
                  key={layer.id}
                  className={`slide-layer ${selectedLayerId === layer.id ? "selected" : ""} ${layer.locked ? "locked" : ""}`}
                  style={{
                    left: `${layer.x}%`,
                    top: `${layer.y}%`,
                    width: `${layer.width}%`,
                    zIndex: layer.zIndex,
                  }}
                  onPointerDown={(event) => {
                    if (layer.locked) return;
                    event.preventDefault();
                    onSelectTarget(null);
                    onSelectLayer(layer.id);
                    setImageTip({ kind: "layer", layerId: layer.id, title: layer.name, x: layer.x, y: layer.y });
                    dragRef.current = {
                      id: layer.id,
                      startX: event.clientX,
                      startY: event.clientY,
                      x: layer.x,
                      y: layer.y,
                    };
                    window.addEventListener("pointermove", pointerMove);
                    window.addEventListener("pointerup", pointerUp);
                  }}
                >
                  <img src={normalizeAssetUrl(layer.src)} alt={layer.name} draggable={false} />
                </div>
              );
            })}
          </div>

          {imageTip ? (
            <div
              className={`image-layer-tooltip ${imageTip.kind === "base" ? "base-tip" : "overlay-tip"}`}
              style={imageTipPosition || undefined}
            >
              <div className="image-tip-head">
                <PhotoIcon aria-hidden="true" />
                <strong>{imageTip.title}</strong>
                <IconButton compact label="Tutup kontrol gambar" icon={<XMarkIcon aria-hidden="true" />} onClick={() => setImageTip(null)} />
              </div>
              {imageTip.kind === "base" ? (
                <p>Gambar bawaan slide. Pilih aset di panel kanan untuk mengganti gambar yang sedang dipilih.</p>
              ) : (
                <div className="image-tip-actions">
                  {(() => {
                    const layer = layers.find((item) => item.id === imageTip.layerId);
                    if (!layer) return null;
                    return (
                      <>
                        <AppButton size="sm" icon={layer.locked ? <LockOpenIcon aria-hidden="true" /> : <LockClosedIcon aria-hidden="true" />} onClick={() => onUpdateLayer(layer.id, { locked: !layer.locked })}>{layer.locked ? "Unlock" : "Lock"}</AppButton>
                        <AppButton size="sm" icon={<EyeSlashIcon aria-hidden="true" />} onClick={() => onUpdateLayer(layer.id, { visible: false })}>Hide</AppButton>
                        <AppButton size="sm" icon={<ArrowUpIcon aria-hidden="true" />} onClick={() => onUpdateLayer(layer.id, { zIndex: layer.zIndex + 1 })}>Front</AppButton>
                        <AppButton size="sm" icon={<ArrowDownIcon aria-hidden="true" />} onClick={() => onUpdateLayer(layer.id, { zIndex: layer.zIndex - 1 })}>Back</AppButton>
                        <AppButton size="sm" icon={<DocumentDuplicateIcon aria-hidden="true" />} onClick={() => onDuplicateLayer(layer.id)}>Duplicate</AppButton>
                        <AppButton size="sm" variant="danger" icon={<TrashIcon aria-hidden="true" />} onClick={() => { onDeleteLayer(layer.id); setImageTip(null); }}>Delete</AppButton>
                      </>
                    );
                  })()}
                </div>
              )}
            </div>
          ) : null}
        </div>
        <IconButton className="nav-hit right" label="Slide berikutnya" icon={<ChevronRightIcon aria-hidden="true" />} onClick={onNext} />
      </div>
    </main>
  );

  function pointerMove(event: PointerEvent) {
    const drag = dragRef.current;
    const viewport = viewportRef.current;
    if (!drag || !viewport) return;
    const rect = viewport.getBoundingClientRect();
    const nextX = drag.x + ((event.clientX - drag.startX) / rect.width) * 100;
    const nextY = drag.y + ((event.clientY - drag.startY) / rect.height) * 100;
    onUpdateLayer(drag.id, { x: Math.max(0, Math.min(95, nextX)), y: Math.max(0, Math.min(92, nextY)) }, false);
  }

  function pointerUp() {
    const drag = dragRef.current;
    if (drag) {
      onUpdateLayer(drag.id, {}, true);
    }
    dragRef.current = null;
    window.removeEventListener("pointermove", pointerMove);
    window.removeEventListener("pointerup", pointerUp);
  }

  function isPresentationGestureEnabled() {
    const viewport = viewportRef.current;
    return Boolean(document.fullscreenElement || viewport?.closest(".app-shell.is-presenting"));
  }
}
