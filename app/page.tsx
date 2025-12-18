'use client'

import { useEffect, useState } from 'react'
import { ChevronLeft, ChevronRight, Star, TrendingUp, Clock, Award, MapPin, Scissors } from 'lucide-react'
import Header from '@/components/Header'
import SearchBar from '@/components/SearchBar'
import ShopCard from '@/components/ShopCard'
import MobileShopGrid from '@/components/MobileShopGrid'
import { supabase } from '@/lib/supabase'

interface Shop {
  id: string
  shop_name: string
  address: string
  manager_name: string
  image_urls: string[]
  services?: string[]
  is_verified: boolean
  is_featured: boolean
  view_count: number
  created_at: string
  avg_rating?: number
  review_count?: number
}

export default function Home() {
  const [shops, setShops] = useState<Shop[]>([])
  const [featuredShops, setFeaturedShops] = useState<Shop[]>([])
  const [loading, setLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [sortBy, setSortBy] = useState('newest')
  const [searchLocation, setSearchLocation] = useState('')
  const [searchService, setSearchService] = useState('')
  const shopsPerPage = 18

  useEffect(() => {
    fetchShops()
    fetchFeaturedShops()
  }, [currentPage, sortBy, searchLocation, searchService])

  const fetchShops = async () => {
    try {
      let query = supabase
        .from('shops')
        .select(`
          *,
          reviews(rating)
        `, { count: 'exact' })
        .eq('is_featured', false)
        .gte('image_urls->0', '')
        .gte('image_urls->1', '')
        .gte('image_urls->2', '')
      
      // Apply location filter
      if (searchLocation) {
        query = query.eq('address', searchLocation)
      }
      

      
      // Apply sorting (except rating which is done after fetching)
      switch (sortBy) {
        case 'rating':
          // Will sort by calculated avg_rating after fetching
          break
        case 'popular':
          query = query.order('view_count', { ascending: false })
          break
        case 'newest':
        default:
          query = query.order('created_at', { ascending: false })
          break
      }
      
      const { data, error, count } = await query
        .range((currentPage - 1) * shopsPerPage, currentPage * shopsPerPage - 1)
      
      if (error) {
        console.error('Supabase error:', error)
        setShops([])
        return
      }

      let shopsWithRatings = data?.map(shop => ({
        ...shop,
        avg_rating: shop.reviews?.length > 0 
          ? shop.reviews.reduce((sum: number, review: any) => sum + review.rating, 0) / shop.reviews.length
          : 0,
        review_count: shop.reviews?.length || 0
      })) || []
      
      // Apply service filter client-side for better partial matching
      if (searchService) {
        shopsWithRatings = shopsWithRatings.filter(shop => 
          shop.services?.some((service: string) => 
            service.toLowerCase().includes(searchService.toLowerCase())
          )
        )
      }
      
      // Sort by rating if selected (client-side for accurate calculation)
      if (sortBy === 'rating') {
        shopsWithRatings.sort((a, b) => {
          // Prioritize shops with reviews, then by rating
          if (a.review_count === 0 && b.review_count === 0) return 0
          if (a.review_count === 0) return 1
          if (b.review_count === 0) return -1
          return (b.avg_rating || 0) - (a.avg_rating || 0)
        })
      }

      setShops(shopsWithRatings)
      setTotalPages(Math.ceil((count || 0) / shopsPerPage))
    } catch (error) {
      console.error('Error fetching shops:', error)
      setShops([])
    } finally {
      setLoading(false)
    }
  }
  
  const fetchFeaturedShops = async () => {
    try {
      const { data, error } = await supabase
        .from('shops')
        .select(`
          *,
          reviews(rating)
        `)
        .eq('is_featured', true)
        .gte('image_urls->0', '')
        .gte('image_urls->1', '')
        .gte('image_urls->2', '')
        .limit(6)
      
      if (error) throw error

      const shopsWithRatings = data?.map(shop => ({
        ...shop,
        avg_rating: shop.reviews?.length > 0 
          ? shop.reviews.reduce((sum: number, review: any) => sum + review.rating, 0) / shop.reviews.length
          : 0,
        review_count: shop.reviews?.length || 0
      })) || []

      setFeaturedShops(shopsWithRatings)
    } catch (error) {
      console.error('Error fetching featured shops:', error)
    }
  }

  // Real-time subscription for shops
  useEffect(() => {
    const subscription = supabase
      .channel('shops')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'shops' }, () => {
        fetchShops()
        fetchFeaturedShops()
      })
      .subscribe()

    return () => {
      subscription.unsubscribe()
    }
  }, [])


  
  const handleShopClick = async (shopId: string) => {
    // Increment view count
    await supabase
      .from('shops')
      .update({ view_count: supabase.sql`view_count + 1` })
      .eq('id', shopId)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      {/* Hero Section */}
      <section className="bg-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              Find Premium Barber Shops in Johannesburg
            </h1>
            <p className="text-xl text-gray-600">
              Discover verified barber shops with professional managers
            </p>
          </div>
          
          <SearchBar onSearch={(location, service) => {
            setSearchLocation(location)
            setSearchService(service)
            setCurrentPage(1)
          }} />
        </div>
      </section>

      {/* Featured Shops */}
      {featuredShops.length > 0 && (
        <section className="py-8 bg-gradient-to-r from-barber-orange to-orange-600">
          <div className="max-w-7xl mx-auto">
            {/* Mobile Layout */}
            <div className="block md:hidden">
              <div className="flex items-center mb-4 px-4">
                <Award className="text-white mr-3" size={20} />
                <h2 className="text-xl font-bold text-white">Featured</h2>
              </div>
              <MobileShopGrid 
                title="" 
                shops={featuredShops} 
                onShopClick={handleShopClick} 
              />
            </div>
            
            {/* Desktop Layout */}
            <div className="hidden md:block px-4 sm:px-6 lg:px-8">
              <div className="flex items-center mb-6">
                <Award className="text-white mr-3" size={24} />
                <h2 className="text-2xl font-bold text-white">Featured Shops</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
                {featuredShops.map((shop) => (
                  <div key={shop.id} className="relative">
                    <div className="absolute top-2 left-2 bg-gold text-black px-2 py-1 rounded-full text-xs font-bold z-10">
                      FEATURED
                    </div>
                    <ShopCard shop={shop} onShopClick={handleShopClick} />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Shops Grid */}
      <section className="py-12">
        <div className="max-w-7xl mx-auto">
          {/* Mobile Layout */}
          <div className="block md:hidden">
            {loading ? (
              <div className="px-4">
                <div className="h-6 bg-gray-200 rounded mb-4 w-32 animate-pulse"></div>
                <div className="flex space-x-3 overflow-x-hidden">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="flex-none w-36">
                      <div className="bg-white rounded-xl overflow-hidden shadow-sm animate-pulse">
                        <div className="h-32 bg-gray-200"></div>
                        <div className="p-3">
                          <div className="h-3 bg-gray-200 rounded mb-2"></div>
                          <div className="h-2 bg-gray-200 rounded w-3/4"></div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <MobileShopGrid 
                title="All Shops" 
                shops={shops} 
                onShopClick={handleShopClick} 
              />
            )}
          </div>
          
          {/* Desktop Layout */}
          <div className="hidden md:block px-4 sm:px-6 lg:px-8">
            {/* Sort and Filter */}
            <div className="flex justify-between items-center mb-8">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">All Shops</h2>
                {(searchLocation || searchService) && (
                  <div className="flex items-center mt-2 space-x-2">
                    {searchLocation && (
                      <span className="bg-barber-orange text-white px-3 py-1 rounded-full text-sm flex items-center gap-1">
                        <MapPin size={12} />
                        {searchLocation}
                      </span>
                    )}
                    {searchService && (
                      <span className="bg-blue-500 text-white px-3 py-1 rounded-full text-sm flex items-center gap-1">
                        <Scissors size={12} />
                        {searchService}
                      </span>
                    )}
                    <button
                      onClick={() => {
                        setSearchLocation('')
                        setSearchService('')
                        setCurrentPage(1)
                      }}
                      className="text-gray-500 hover:text-gray-700 text-sm underline"
                    >
                      Clear filters
                    </button>
                  </div>
                )}
              </div>
              <div className="flex items-center space-x-4">
                <select
                  value={sortBy}
                  onChange={(e) => {
                    setSortBy(e.target.value)
                    setCurrentPage(1)
                  }}
                  className="border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-barber-orange">
                >
                  <option value="newest">Newest First</option>
                  <option value="rating">Highest Rated</option>
                  <option value="popular">Most Popular</option>
                </select>
              </div>
            </div>
            
            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
                {Array.from({ length: 12 }).map((_, i) => (
                  <div key={i} className="bg-white rounded-xl overflow-hidden shadow-sm animate-pulse">
                    <div className="h-40 bg-gray-200"></div>
                    <div className="p-3">
                      <div className="h-3 bg-gray-200 rounded mb-1"></div>
                      <div className="h-2 bg-gray-200 rounded mb-1 w-3/4"></div>
                      <div className="h-2 bg-gray-200 rounded w-1/2"></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
                  {shops.map((shop) => (
                    <ShopCard key={shop.id} shop={shop} onShopClick={handleShopClick} />
                  ))}
                </div>
                
                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex justify-center items-center mt-12 space-x-2">
                    <button
                      onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                      disabled={currentPage === 1}
                      className="flex items-center px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <ChevronLeft size={16} className="mr-1" />
                      Previous
                    </button>
                    
                    <div className="flex space-x-1">
                      {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                        const pageNum = Math.max(1, Math.min(totalPages - 4, currentPage - 2)) + i
                        return (
                          <button
                            key={pageNum}
                            onClick={() => setCurrentPage(pageNum)}
                            className={`px-4 py-2 rounded-lg ${
                              pageNum === currentPage
                                ? 'bg-barber-orange text-white'
                                : 'border border-gray-300 hover:bg-gray-50'
                            }`}
                          >
                            {pageNum}
                          </button>
                        )
                      })}
                    </div>
                    
                    <button
                      onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                      disabled={currentPage === totalPages}
                      className="flex items-center px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Next
                      <ChevronRight size={16} className="ml-1" />
                    </button>
                  </div>
                )}
              </>
            )}
            
            {!loading && shops.length === 0 && (
              <div className="text-center py-12">
                <p className="text-gray-600">
                  {searchLocation || searchService 
                    ? 'No shops found matching your search criteria. Try adjusting your filters.'
                    : 'No shops found. Be the first to add your barber shop!'
                  }
                </p>
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  )
}