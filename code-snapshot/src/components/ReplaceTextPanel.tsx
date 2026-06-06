import { useState } from "react";
import { CheckCircleIcon, TrashIcon } from "@heroicons/react/24/outline";
import type { DraftSelection, SelectionTarget, ThesisBlock } from "../types";
import DraftPanel from "./DraftPanel";

type ReplaceTextPanelProps = {
  target: SelectionTarget;
  blocks: ThesisBlock[];
  initialQuery: string;
  onApply: (replacement: string) => void;
};

export default function ReplaceTextPanel({ target, blocks, initialQuery, onApply }: ReplaceTextPanelProps) {
  const [query, setQuery] = useState(initialQuery);
  const [joinMode, setJoinMode] = useState<"space" | "newline">("space");
  const [basket, setBasket] = useState<DraftSelection[]>([]);

  const replacement = basket.map((item) => item.text.trim()).filter(Boolean).join(joinMode === "space" ? " " : "\n");

  return (
    <section className="replace-panel">
      <div className="replace-current">
        <span>Target slide</span>
        <p>{target.text || target.editId}</p>
      </div>

      <DraftPanel
        blocks={blocks}
        query={query}
        onQueryChange={setQuery}
        limit={8}
        selectable
        onUseSelection={(block, selectedText) => {
          const text = selectedText.trim();
          if (!text) return;
          setBasket((prev) => [
            ...prev,
            { id: `${block.id}-${Date.now()}`, blockId: block.id, section: block.section, text },
          ]);
        }}
      />

      <div className="selection-basket">
        <div className="basket-head">
          <strong>Pilihan teks</strong>
          <select value={joinMode} onChange={(event) => setJoinMode(event.target.value as "space" | "newline")}>
            <option value="space">Gabung spasi</option>
            <option value="newline">Baris baru</option>
          </select>
        </div>
        {basket.length ? (
          basket.map((item) => (
            <div className="basket-item" key={item.id}>
              <span>{item.section || item.blockId}</span>
              <p>{item.text}</p>
              <button type="button" onClick={() => setBasket((prev) => prev.filter((entry) => entry.id !== item.id))}><TrashIcon aria-hidden="true" />Hapus</button>
            </div>
          ))
        ) : (
          <p className="empty-note">Seleksi teks di paragraf draft, lalu tekan "Tambah teks terseleksi".</p>
        )}
        <button
          type="button"
          className="tool-button primary wide"
          disabled={!replacement}
          onClick={() => onApply(replacement)}
        >
          <CheckCircleIcon aria-hidden="true" />
          Terapkan ke slide
        </button>
      </div>
    </section>
  );
}
