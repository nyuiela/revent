"use client";

import React from 'react';
import Image from 'next/image';

export type GalleryItem = {
  id: string;
  url: string;
  title: string;
  price?: number;
  isVideo?: boolean;
};

type GalleryGridProps = {
  items: GalleryItem[];
  onClickItem?: (item: GalleryItem) => void;
};

export default function GalleryGrid({ items, onClickItem }: GalleryGridProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 2xl:grid-cols-4 gap-6">
      {items.map((item) => (
        <div
          key={item.id}
          className="relative bg-white dark:bg-gray-800 rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700 cursor-pointer hover:shadow-xl transition-all duration-200 group"
          onClick={() => onClickItem?.(item)}
        >
          <div className="relative aspect-[4/3] overflow-hidden">
            {item.isVideo ? (
              <video
                src={item.url || '/stream.jpg'}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
              />
            ) : (
              <Image
                src={item.url || '/stream.jpg'}
                alt={item.title}
                width={100}
                height={100}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                loading="eager"
                decoding="async"
              />
            )}
          </div>

          {/* Hover Overlay */}
          <div className="absolute inset-0 bg-transparent group-hover:bg-black/50 transition-all duration-200 flex items-center justify-center">
            {typeof item.price === 'number' && (
              <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 text-center">
                <div className="text-white font-semibold mb-2">{item.price} ETH</div>
              </div>
            )}
          </div>

          {/* Type Badge */}
          <div className="absolute top-3 left-3">
            <span className={`px-2 py-1 text-xs rounded-full ${
              item.isVideo ? 'bg-red-500 text-white' : 'bg-green-500 text-white'
            }`}>
              {item.isVideo ? 'Video' : 'Image'}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}


