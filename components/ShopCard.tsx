'use client'

import { Star, MapPin, CheckCircle } from 'lucide-react'
import Image from 'next/image'

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

interface ShopCardProps {
  shop: Shop
  onShopClick?: (shopId: string) => void
}

export default function ShopCard({ shop, onShopClick }: ShopCardProps) {
  const handleClick = () => {
    if (onShopClick) {
      onShopClick(shop.id)
    }
  }
  
  return (
    <a 
      href={`/shop/${shop.id}`} 
      onClick={handleClick}
      className="bg-white rounded-xl overflow-hidden hover:shadow-xl transition-all duration-300 cursor-pointer block transform hover:-translate-y-1 w-full h-full flex flex-col"
    >
      <div className="relative h-40 flex-shrink-0">
        <Image
          src={shop.image_urls[0] || 'https://images.unsplash.com/photo-1585747860715-2ba37e788b70?w=500'}
          alt={shop.shop_name}
          fill
          className="object-cover"
        />
        <div className="absolute top-3 right-3 flex space-x-2">
          {shop.is_verified && (
            <div className="bg-white rounded-full p-1 shadow-md">
              <CheckCircle size={14} className="text-blue-500" />
            </div>
          )}
        </div>
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/50 to-transparent h-16"></div>
      </div>
      
      <div className="p-3 flex-1 flex flex-col justify-between">
        <div>
          <div className="flex items-start justify-between mb-1">
            <h3 className="font-semibold text-sm text-gray-900 line-clamp-1 pr-1">{shop.shop_name}</h3>
            <div className="flex items-center space-x-1">
              <Star size={12} className={`${shop.avg_rating > 0 ? 'text-yellow-400 fill-current' : 'text-gray-300'}`} />
              <span className="text-xs font-medium">
                {shop.avg_rating > 0 ? shop.avg_rating.toFixed(1) : '0.0'}
              </span>
            </div>
          </div>
          
          <div className="flex items-center text-gray-600 text-xs mb-1">
            <MapPin size={10} className="mr-1 flex-shrink-0" />
            <span className="line-clamp-1">{shop.address}</span>
          </div>
          
          <p className="text-xs text-gray-600 line-clamp-1">
            {shop.manager_name}
          </p>
        </div>
        
        <div className="text-xs text-gray-500">
          <span>{shop.review_count || 0} reviews</span>
        </div>
      </div>
    </a>
  )
}