'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { Star, MapPin, Phone, Mail, Globe, MessageCircle, Facebook, Instagram, Twitter, CheckCircle, ArrowLeft } from 'lucide-react'
import Image from 'next/image'
import { supabase } from '@/lib/supabase'
import toast from 'react-hot-toast'

interface Shop {
  id: string
  shop_name: string
  description: string
  address: string
  full_address: string
  manager_name: string
  contact_number: string
  whatsapp_number?: string
  email: string
  website?: string
  facebook_url?: string
  instagram_url?: string
  twitter_url?: string
  services: string[]
  price_range: string
  image_urls: string[]
  is_verified: boolean
  avg_rating?: number
  review_count?: number
}

interface Review {
  id: string
  rating: number
  comment: string
  created_at: string
  profiles: {
    full_name: string
  }
}

export default function ShopDetail() {
  const params = useParams()
  const [shop, setShop] = useState<Shop | null>(null)
  const [reviews, setReviews] = useState<Review[]>([])
  const [loading, setLoading] = useState(true)
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [user, setUser] = useState<any>(null)
  const [userReview, setUserReview] = useState<Review | null>(null)
  const [newRating, setNewRating] = useState(0)
  const [newComment, setNewComment] = useState('')
  const [submittingReview, setSubmittingReview] = useState(false)

  useEffect(() => {
    if (params.id) {
      fetchShop(params.id as string)
      fetchReviews(params.id as string)
    }
    getUser()
  }, [params.id])

  const getUser = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    setUser(user)
  }

  const fetchShop = async (shopId: string) => {
    try {
      const { data, error } = await supabase
        .from('shops')
        .select(`
          *,
          reviews(rating)
        `)
        .eq('id', shopId)
        .single()

      if (error) throw error
      
      const shopWithRating = {
        ...data,
        avg_rating: data.reviews?.length > 0 
          ? data.reviews.reduce((sum: number, review: any) => sum + review.rating, 0) / data.reviews.length
          : 0,
        review_count: data.reviews?.length || 0
      }
      
      setShop(shopWithRating)
    } catch (error) {
      console.error('Error fetching shop:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchReviews = async (shopId: string) => {
    try {
      const { data, error } = await supabase
        .from('reviews')
        .select(`
          *,
          profiles(full_name)
        `)
        .eq('shop_id', shopId)
        .order('created_at', { ascending: false })

      if (error) throw error
      setReviews(data || [])
      
      if (user) {
        const existingReview = data?.find(review => review.user_id === user.id)
        setUserReview(existingReview || null)
      }
    } catch (error) {
      console.error('Error fetching reviews:', error)
    }
  }

  const submitReview = async () => {
    if (!user) {
      toast.error('Please login to leave a review')
      return
    }
    
    if (newRating === 0 || !newComment.trim()) {
      toast.error('Please provide both rating and comment')
      return
    }

    setSubmittingReview(true)
    
    try {
      // Ensure profile exists
      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', user.id)
        .single()
      
      if (!profile) {
        const { error: profileError } = await supabase
          .from('profiles')
          .insert({
            id: user.id,
            full_name: user.user_metadata?.full_name || 'User',
            role: 'client'
          })
        
        if (profileError) throw profileError
      }
      
      if (userReview) {
        const { error } = await supabase
          .from('reviews')
          .update({
            rating: newRating,
            comment: newComment.trim()
          })
          .eq('id', userReview.id)
        
        if (error) throw error
        toast.success('Review updated successfully!')
      } else {
        const { error } = await supabase
          .from('reviews')
          .insert({
            shop_id: params.id,
            user_id: user.id,
            rating: newRating,
            comment: newComment.trim()
          })
        
        if (error) throw error
        toast.success('Review submitted successfully!')
      }
      
      setNewRating(0)
      setNewComment('')
      fetchShop(params.id as string)
      fetchReviews(params.id as string)
    } catch (error: any) {
      toast.error(error.message || 'Failed to submit review')
    } finally {
      setSubmittingReview(false)
    }
  }

  const renderStars = (rating: number, interactive = false, onRate?: (rating: number) => void) => {
    return (
      <div className="flex space-x-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            onClick={() => interactive && onRate && onRate(star)}
            className={`${interactive ? 'cursor-pointer hover:scale-110' : 'cursor-default'} transition-transform`}
            disabled={!interactive}
          >
            <Star
              size={interactive ? 24 : 16}
              className={`${
                star <= rating
                  ? 'text-yellow-400 fill-current'
                  : 'text-gray-300'
              }`}
            />
          </button>
        ))}
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-barber-orange"></div>
      </div>
    )
  }

  if (!shop) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Shop Not Found</h1>
          <a href="/" className="text-barber-orange hover:underline">Back to Home</a>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <button
            onClick={() => window.history.back()}
            className="flex items-center text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft size={20} className="mr-2" />
            Back to listings
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            {/* Image Gallery */}
            <div className="bg-white rounded-xl shadow-sm overflow-hidden mb-8">
              <div className="relative h-96">
                {shop.image_urls && shop.image_urls.length > 0 ? (
                  <>
                    <Image
                      src={shop.image_urls[currentImageIndex]}
                      alt={shop.shop_name}
                      fill
                      className="object-cover"
                    />
                    {shop.image_urls.length > 1 && (
                      <>
                        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2">
                          {shop.image_urls.map((_, index) => (
                            <button
                              key={index}
                              onClick={() => setCurrentImageIndex(index)}
                              className={`w-3 h-3 rounded-full transition-all ${
                                index === currentImageIndex ? 'bg-white scale-110' : 'bg-white/50 hover:bg-white/75'
                              }`}
                            />
                          ))}
                        </div>
                        <div className="absolute top-4 right-4 bg-black/50 text-white px-3 py-1 rounded-full text-sm">
                          {currentImageIndex + 1} / {shop.image_urls.length}
                        </div>
                      </>
                    )}
                  </>
                ) : (
                  <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                    <span className="text-gray-500">No images available</span>
                  </div>
                )}
              </div>
              
              {/* Image Thumbnails */}
              {shop.image_urls && shop.image_urls.length > 1 && (
                <div className="p-4 flex space-x-2 overflow-x-auto">
                  {shop.image_urls.map((url, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentImageIndex(index)}
                      className={`relative w-20 h-20 rounded-lg overflow-hidden flex-shrink-0 border-2 transition-all ${
                        index === currentImageIndex ? 'border-barber-orange' : 'border-transparent hover:border-gray-300'
                      }`}
                    >
                      <Image
                        src={url}
                        alt={`${shop.shop_name} ${index + 1}`}
                        fill
                        className="object-cover"
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Shop Info */}
            <div className="bg-white rounded-xl shadow-sm p-8 mb-8">
              <div className="flex items-start justify-between mb-6">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <h1 className="text-3xl font-bold text-gray-900">{shop.shop_name}</h1>
                    {shop.is_verified && (
                      <div className="flex items-center bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
                        <CheckCircle size={16} className="mr-1" />
                        Verified
                      </div>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-4 mb-3">
                    <div className="flex items-center">
                      {renderStars(shop.avg_rating || 0)}
                      <span className="ml-2 text-sm font-medium">
                        {shop.avg_rating ? shop.avg_rating.toFixed(1) : '0.0'}
                      </span>
                    </div>
                    <span className="text-gray-500 text-sm">
                      {shop.review_count} {shop.review_count === 1 ? 'review' : 'reviews'}
                    </span>
                  </div>
                  
                  <div className="flex items-center text-gray-600 mb-2">
                    <MapPin size={16} className="mr-2" />
                    <span>{shop.full_address}, {shop.address}</span>
                  </div>
                  <p className="text-lg font-semibold text-barber-orange">{shop.price_range}</p>
                </div>
              </div>

              <div className="mb-8">
                <h2 className="text-xl font-semibold mb-4">About</h2>
                <p className="text-gray-700 leading-relaxed">{shop.description}</p>
              </div>

              <div className="mb-8">
                <h2 className="text-xl font-semibold mb-4">Services</h2>
                <div className="flex flex-wrap gap-2">
                  {shop.services.map((service, index) => (
                    <span
                      key={index}
                      className="bg-barber-orange text-white px-4 py-2 rounded-full text-sm font-medium"
                    >
                      {service}
                    </span>
                  ))}
                </div>
              </div>
            </div>
            
            {/* Reviews Section */}
            <div className="bg-white rounded-xl shadow-sm p-8">
              <h2 className="text-2xl font-semibold mb-6">Reviews</h2>
              
              {user && (
                <div className="mb-8 p-6 bg-gray-50 rounded-xl">
                  <h3 className="text-lg font-semibold mb-4">
                    {userReview ? 'Update your review' : 'Leave a review'}
                  </h3>
                  
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Rating</label>
                    {renderStars(newRating, true, setNewRating)}
                  </div>
                  
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Comment</label>
                    <textarea
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      placeholder="Share your experience..."
                      className="w-full p-3 border border-gray-300 rounded-lg h-24 resize-none"
                    />
                  </div>
                  
                  <button
                    onClick={submitReview}
                    disabled={submittingReview || newRating === 0 || !newComment.trim()}
                    className="bg-barber-orange text-white px-6 py-2 rounded-lg hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {submittingReview ? 'Submitting...' : (userReview ? 'Update Review' : 'Submit Review')}
                  </button>
                </div>
              )}
              
              <div className="space-y-6">
                {reviews.map((review) => (
                  <div key={review.id} className="border-b border-gray-200 pb-6 last:border-b-0">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <div className="flex items-center gap-3 mb-2">
                          <h4 className="font-semibold text-gray-900">{review.profiles.full_name}</h4>
                          {renderStars(review.rating)}
                        </div>
                        <p className="text-sm text-gray-500">
                          {new Date(review.created_at).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })}
                        </p>
                      </div>
                    </div>
                    <p className="text-gray-700">{review.comment}</p>
                  </div>
                ))}
                
                {reviews.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <p>No reviews yet. Be the first to leave a review!</p>
                  </div>
                )}
              </div>
            </div>
          </div>
          
          {/* Sidebar */}
          <div className="lg:col-span-1">

            <div className="bg-white rounded-xl shadow-sm p-6 sticky top-8">
              <div className="mb-6">
                <div className="flex items-center gap-2 mb-2">
                  {renderStars(shop.avg_rating || 0)}
                  <span className="font-semibold">{shop.avg_rating ? shop.avg_rating.toFixed(1) : '0.0'}</span>
                </div>
                <p className="text-sm text-gray-600">{shop.review_count} reviews</p>
              </div>
              
              <div className="border-t pt-6">
                <h3 className="text-lg font-semibold mb-4">Contact Information</h3>
                
                <div className="space-y-5">
                  <div className="flex items-center p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mr-4">
                      <Phone size={18} className="text-blue-600" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">Manager: {shop.manager_name}</p>
                      <a href={`tel:${shop.contact_number}`} className="text-barber-orange hover:underline font-medium">
                        {shop.contact_number}
                      </a>
                    </div>
                  </div>

                  {shop.whatsapp_number && (
                    <div className="flex items-center p-3 bg-green-50 rounded-lg hover:bg-green-100 transition-colors">
                      <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center mr-4">
                        <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.488"/>
                        </svg>
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">WhatsApp</p>
                        <a
                          href={`https://wa.me/${shop.whatsapp_number.replace(/[^0-9]/g, '')}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-green-600 hover:underline font-medium"
                        >
                          {shop.whatsapp_number}
                        </a>
                      </div>
                    </div>
                  )}

                  <div className="flex items-center p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                    <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center mr-4">
                      <Mail size={18} className="text-red-600" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">Email</p>
                      <a href={`mailto:${shop.email}`} className="text-barber-orange hover:underline font-medium break-all">
                        {shop.email}
                      </a>
                    </div>
                  </div>

                  {shop.website && (
                    <div className="flex items-center p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                      <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center mr-4">
                        <Globe size={18} className="text-purple-600" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">Website</p>
                        <a
                          href={shop.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-barber-orange hover:underline font-medium"
                        >
                          Visit Website
                        </a>
                      </div>
                    </div>
                  )}
                </div>

                {(shop.facebook_url || shop.instagram_url || shop.twitter_url) && (
                  <div className="mt-6 pt-6 border-t border-gray-200">
                    <h4 className="text-sm font-semibold text-gray-700 mb-4">Follow Us</h4>
                    <div className="space-y-3">
                      {shop.facebook_url && (
                        <a
                          href={shop.facebook_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center p-3 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
                        >
                          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mr-4">
                            <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                            </svg>
                          </div>
                          <span className="font-medium text-blue-700">Facebook</span>
                        </a>
                      )}
                      {shop.instagram_url && (
                        <a
                          href={shop.instagram_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center p-3 bg-pink-50 rounded-lg hover:bg-pink-100 transition-colors"
                        >
                          <div className="w-10 h-10 bg-pink-100 rounded-full flex items-center justify-center mr-4">
                            <svg className="w-5 h-5 text-pink-600" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                            </svg>
                          </div>
                          <span className="font-medium text-pink-700">Instagram</span>
                        </a>
                      )}
                      {shop.twitter_url && (
                        <a
                          href={shop.twitter_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center p-3 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
                        >
                          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mr-4">
                            <svg className="w-5 h-5 text-blue-500" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
                            </svg>
                          </div>
                          <span className="font-medium text-blue-600">Twitter</span>
                        </a>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}