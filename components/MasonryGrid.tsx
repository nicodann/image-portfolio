"use client";

import { useState } from "react";
import Image from "next/image";
// import type { Artwork } from '@/app/page'
import Lightbox from "./Lightbox";
import { Artwork } from "@/types/types";

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
    <>
      <div className="columns-1 sm:columns-2 lg:columns-3 xl:columns-4 gap-4 px-4">
        {artwork.map((artwork) => (
          <div
            key={artwork.id}
            className="break-inside-avoid mb-4 w-full text-left group relative block overflow-hidden rounded-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
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
    </>
  );
}
