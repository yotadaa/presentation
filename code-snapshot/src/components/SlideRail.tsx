import { RectangleStackIcon, Squares2X2Icon } from "@heroicons/react/24/outline";
import type { Slide } from "../types";

type SlideRailProps = {
  slides: Slide[];
  currentSlide: number;
  onSelect: (slide: number) => void;
};

export default function SlideRail({ slides, currentSlide, onSelect }: SlideRailProps) {
  return (
    <aside className="slide-rail" aria-label="Daftar slide">
      <div className="rail-header">
        <strong><RectangleStackIcon aria-hidden="true" />Slides</strong>
        <span>{slides.length}</span>
      </div>
      <div className="rail-list">
        {slides.map((slide) => (
          <button
            type="button"
            key={slide.index}
            className={`rail-item ${slide.index === currentSlide ? "active" : ""}`}
            onClick={() => onSelect(slide.index)}
          >
            <Squares2X2Icon className="rail-item-icon" aria-hidden="true" />
            <span className="rail-number">{String(slide.index).padStart(2, "0")}</span>
            <span className="rail-copy">
              <strong>{slide.title}</strong>
              <small>{slide.chapter}</small>
            </span>
          </button>
        ))}
      </div>
    </aside>
  );
}
