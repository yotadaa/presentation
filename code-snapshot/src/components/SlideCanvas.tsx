import { useEffect, useMemo, useRef, useState } from "react";
import { ChevronLeftIcon, ChevronRightIcon } from "@heroicons/react/24/outline";
import type { CSSProperties } from "react";
import type { SelectionTarget, Slide, SlideLayer } from "../types";
import { normalizeAssetUrl, targetFromElement } from "../utils/slideDom";

const SLIDE_WIDTH = 1536;
const SLIDE_HEIGHT = 864;

type SlideCanvasProps = {
  slide: Slide;
  html: string;
  theme: string;
  accent: string;
  chapterStartByName: Record<string, number>;
  layers: SlideLayer[];
  selectedLayerId: string | null;
  onSelectTarget: (target: SelectionTarget | null) => void;
  onSelectLayer: (layerId: string | null) => void;
  onUpdateLayer: (layerId: string, patch: Partial<SlideLayer>, saveHistory?: boolean) => void;
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
  selectedLayerId,
  onSelectTarget,
  onSelectLayer,
  onUpdateLayer,
  onGoToSlide,
  onNext,
  onPrev,
}: SlideCanvasProps) {
  const viewportRef = useRef<HTMLDivElement>(null);
  const frameRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const previousSlideIndexRef = useRef(slide.index);
  const dragRef = useRef<{ id: string; startX: number; startY: number; x: number; y: number } | null>(null);
  const transitionDirection = slide.index >= previousSlideIndexRef.current ? "forward" : "backward";

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

      <div className="slide-viewport" ref={viewportRef}>
        <button type="button" className="nav-hit left" aria-label="Slide sebelumnya" onClick={onPrev}>
          <ChevronLeftIcon aria-hidden="true" />
        </button>
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
              onSelectLayer(null);
              onSelectTarget(selected);
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
        </div>
        <button type="button" className="nav-hit right" aria-label="Slide berikutnya" onClick={onNext}>
          <ChevronRightIcon aria-hidden="true" />
        </button>
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
}
