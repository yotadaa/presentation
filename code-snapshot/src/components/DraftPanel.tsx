import { MagnifyingGlassIcon, PlusCircleIcon } from "@heroicons/react/24/outline";
import type { ThesisBlock } from "../types";
import { highlightText, useDraftSearch } from "../hooks/useDraftSearch";

type DraftPanelProps = {
  blocks: ThesisBlock[];
  query: string;
  onQueryChange: (query: string) => void;
  limit?: number;
  selectable?: boolean;
  onUseSelection?: (block: ThesisBlock, selectedText: string) => void;
};

export default function DraftPanel({
  blocks,
  query,
  onQueryChange,
  limit = 12,
  selectable = false,
  onUseSelection,
}: DraftPanelProps) {
  const results = useDraftSearch(blocks, query, limit);

  return (
    <section className="draft-panel">
      <div className="panel-search">
        <label>
          <span>Cari di draft skripsi</span>
          <MagnifyingGlassIcon aria-hidden="true" />
          <input
            value={query}
            onChange={(event) => onQueryChange(event.target.value)}
            placeholder="Cari paragraf, fuzzy, greedy, penalti..."
          />
        </label>
      </div>
      <div className="draft-results">
        {results.map((block) => (
          <article key={block.id} className="draft-card">
            <div className="draft-meta">
              <span>{block.section || "Draft"}</span>
              <span>Par. {block.index}</span>
            </div>
            <p>
              {highlightText(block.text, query).map((part) => (
                <mark key={part.index} className={part.hit ? "hit" : ""}>{part.text}</mark>
              ))}
            </p>
            {selectable ? (
              <button
                type="button"
                className="tool-button"
                onClick={() => {
                  const selected = window.getSelection()?.toString().trim();
                  onUseSelection?.(block, selected || block.text);
                }}
              >
                <PlusCircleIcon aria-hidden="true" />
                Tambah teks terseleksi
              </button>
            ) : null}
          </article>
        ))}
      </div>
    </section>
  );
}
