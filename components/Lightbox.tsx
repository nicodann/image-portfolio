'use client'

import { useEffect, useCallback } from 'react'
import Image from 'next/image'
import type { Artwork } from '@/app/page'

interface LightboxProps {
  artwork: Artwork
  onClose: () => void
}

export default function Lightbox({ artwork, onClose }: LightboxProps) {
  const handleKey = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    },
    [onClose]
  )

  useEffect(() => {
    document.addEventListener('keydown', handleKey)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', handleKey)
      document.body.style.overflow = ''
    }
  }, [handleKey])

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4 sm:p-8"
      onClick={onClose}
    >
      <button
        className="absolute top-4 right-5 text-neutral-400 hover:text-white text-3xl leading-none focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
        onClick={onClose}
        aria-label="Close"
      >
        &times;
      </button>

      <div
        className="flex flex-col lg:flex-row items-center gap-8 max-w-6xl w-full max-h-full"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="relative flex-1 w-full max-h-[75vh] flex items-center justify-center">
          <Image
            src={artwork.imageUrl}
            alt={artwork.title}
            width={1400}
            height={1000}
            className="max-w-full max-h-[75vh] w-auto h-auto object-contain rounded-sm"
            sizes="(max-width: 1024px) 100vw, 70vw"
            priority
          />
        </div>

        <div className="lg:w-64 shrink-0 text-left">
          <p className="text-xs text-neutral-500 uppercase tracking-widest mb-1">
            {artwork.year}
          </p>
          <h2 className="text-xl font-medium text-neutral-100 mb-3">
            {artwork.title}
          </h2>
          <p className="text-sm text-neutral-400 leading-relaxed">
            {artwork.description}
          </p>
        </div>
      </div>
    </div>
  )
}
