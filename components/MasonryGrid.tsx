"use client";

import { useState } from "react";
import Image from "next/image";
import Lightbox from "./Lightbox";
import { Artwork } from "@/types/types";
import { DragDropProvider, useDraggable } from "@dnd-kit/react";

function DraggableCard({
  children,
  id,
}: {
  children: React.ReactNode;
  id: number | string;
}) {
  const { ref } = useDraggable({
    id: id,
  });

  return (
    <div className="relative break-inside-avoid mb-4 ">
      <button ref={ref} className="absolute top-2 left-2 cursor-grab">
        ⠿
      </button>
      {children}
    </div>
  );
}

export default function MasonryGrid({
  artwork,
  onDelete,
  onEdit,
}: {
  artwork: Artwork[];
  onDelete?: (artwork: Artwork) => void;
  onEdit?: (artwork: Artwork) => void;
}) {
  const [selected, setSelected] = useState<Artwork | null>(null);

  if (artwork.length === 0) {
    return (
      <p className="text-center text-neutral-500 mt-24 text-sm tracking-widest uppercase">
        No works yet
      </p>
    );
  }

  return (
    <DragDropProvider
      onDragEnd={(e) => {
        if (e.canceled) return;
      }}
    >
      <div className="columns-1 sm:columns-2 lg:columns-3 xl:columns-4 gap-4 px-4 pt-4">
        {artwork.map((artwork) => (
          <DraggableCard key={artwork.id} id={artwork.id}>
            <div
              className="w-full text-left group relative block overflow-hidden rounded-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
              onClick={() => setSelected(artwork)}
            >
              <div className="relative w-full">
                <Image
                  src={artwork.imageUrl}
                  alt={artwork.title}
                  width={800}
                  height={600}
                  className="w-full h-auto object-cover transition-opacity duration-300 group-hover:opacity-80"
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                />
              </div>
              <div className="pt-2 pb-1">
                <div className="flex flex-col">
                  <div
                    id="metadata-title-delete"
                    className="flex justify-between w-full items-baseline"
                  >
                    <p className="text-sm font-medium text-neutral-100 leading-snug">
                      {artwork.title}
                    </p>
                    {onDelete && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onDelete(artwork);
                        }}
                        className="text-xs text-neutral-500 hover:text-red-400 transition-colors"
                        aria-label={`Delete ${artwork.title}`}
                      >
                        Delete
                      </button>
                    )}
                  </div>
                  <div
                    id="metadata_year_edit"
                    className="flex justify-between w-full"
                  >
                    <p className="text-xs text-neutral-500">{artwork.year}</p>
                    {onEdit && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onEdit(artwork);
                        }}
                        className="text-xs text-neutral-500 hover:text-neutral-100 transition-colors"
                        aria-label={`Edit ${artwork.title}`}
                      >
                        Edit
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </DraggableCard>
        ))}
      </div>

      {selected && (
        <Lightbox
          artwork={selected}
          onClose={() => setSelected(null)}
          onDelete={
            onDelete
              ? () => {
                  onDelete(selected);
                  setSelected(null);
                }
              : undefined
          }
          onEdit={onEdit ? () => onEdit(selected) : undefined}
        />
      )}
    </DragDropProvider>
  );
}
