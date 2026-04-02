'use client'

import { useState } from 'react'
import Image from 'next/image'
import type { Artwork } from '@/app/page'
import Lightbox from './Lightbox'

export default function MasonryGrid({ artworks }: { artworks: Artwork[] }) {
  const [selected, setSelected] = useState<Artwork | null>(null)

  if (artworks.length === 0) {
    return (
      <p className="text-center text-neutral-500 mt-24 text-sm tracking-widest uppercase">
        No works yet
      </p>
    )
  }

  return (
    <>
      <div className="columns-1 sm:columns-2 lg:columns-3 xl:columns-4 gap-4">
        {artworks.map((artwork) => (
          <button
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
              <p className="text-sm font-medium text-neutral-100 leading-snug">
                {artwork.title}
              </p>
              <p className="text-xs text-neutral-500">{artwork.year}</p>
            </div>
          </button>
        ))}
      </div>

      {selected && (
        <Lightbox artwork={selected} onClose={() => setSelected(null)} />
      )}
    </>
  )
}
