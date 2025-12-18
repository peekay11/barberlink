'use client'

import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useRef } from 'react'
import ShopCard from './ShopCard'

interface Shop {
  id: string
  shop_name: string
  address: string
  manager_name: string
  image_urls: string[]
  is_verified: boolean
  avg_rating?: number
  review_count?: number
}

interface MobileShopGridProps {
  title: string
  shops: Shop[]
  onShopClick?: (shopId: string) => void
}

export default function MobileShopGrid({ title, shops, onShopClick }: MobileShopGridProps) {
  const scrollRef = useRef<HTMLDivElement>(null)

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const scrollAmount = 320 // Width of 2 cards + gap
      scrollRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      })
    }
  }

  if (shops.length === 0) return null

  return (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-4 px-4">
        <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
        <div className="flex space-x-2">
          <button
            onClick={() => scroll('left')}
            className="p-2 rounded-full bg-white shadow-md hover:shadow-lg transition-shadow"
          >
            <ChevronLeft size={16} className="text-gray-600" />
          </button>
          <button
            onClick={() => scroll('right')}
            className="p-2 rounded-full bg-white shadow-md hover:shadow-lg transition-shadow"
          >
            <ChevronRight size={16} className="text-gray-600" />
          </button>
        </div>
      </div>
      
      <div
        ref={scrollRef}
        className="flex overflow-x-auto scrollbar-hide space-x-3 px-4 pb-2"
        style={{ scrollSnapType: 'x mandatory' }}
      >
        {shops.map((shop) => (
          <div
            key={shop.id}
            className="flex-none w-[calc(50vw-24px)] max-w-[160px]"
            style={{ scrollSnapAlign: 'start' }}
          >
            <ShopCard shop={shop} onShopClick={onShopClick} />
          </div>
        ))}
      </div>
    </div>
  )
}