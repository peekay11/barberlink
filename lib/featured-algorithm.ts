// Auto-featured shop algorithm for BarberLink

export interface ShopMetrics {
  id: string
  avg_rating: number
  review_count: number
  view_count: number
  is_verified: boolean
  created_at: string
  last_featured_at?: string
}

export const FEATURED_CRITERIA = {
  MIN_RATING: 4.2,
  MIN_REVIEWS: 10,
  MIN_VIEWS: 100,
  MUST_BE_VERIFIED: true,
  MIN_DAYS_SINCE_LAST_FEATURED: 7,
  MAX_FEATURED_SHOPS: 12
}

export function calculateFeaturedScore(shop: ShopMetrics): number {
  let score = 0
  
  // Rating weight (40%)
  if (shop.avg_rating >= FEATURED_CRITERIA.MIN_RATING) {
    score += (shop.avg_rating / 5) * 40
  }
  
  // Review count weight (25%)
  const reviewScore = Math.min(shop.review_count / 50, 1) * 25
  score += reviewScore
  
  // View count weight (20%)
  const viewScore = Math.min(shop.view_count / 1000, 1) * 20
  score += viewScore
  
  // Verification bonus (10%)
  if (shop.is_verified) {
    score += 10
  }
  
  // Recency bonus (5%)
  const daysSinceCreated = (Date.now() - new Date(shop.created_at).getTime()) / (1000 * 60 * 60 * 24)
  if (daysSinceCreated <= 90) {
    score += 5
  }
  
  return Math.round(score)
}

export function isEligibleForFeatured(shop: ShopMetrics): boolean {
  // Check minimum requirements
  if (shop.avg_rating < FEATURED_CRITERIA.MIN_RATING) return false
  if (shop.review_count < FEATURED_CRITERIA.MIN_REVIEWS) return false
  if (shop.view_count < FEATURED_CRITERIA.MIN_VIEWS) return false
  if (!shop.is_verified && FEATURED_CRITERIA.MUST_BE_VERIFIED) return false
  
  // Check if enough time has passed since last featured
  if (shop.last_featured_at) {
    const daysSinceLastFeatured = (Date.now() - new Date(shop.last_featured_at).getTime()) / (1000 * 60 * 60 * 24)
    if (daysSinceLastFeatured < FEATURED_CRITERIA.MIN_DAYS_SINCE_LAST_FEATURED) return false
  }
  
  return true
}

export function selectFeaturedShops(shops: ShopMetrics[]): string[] {
  // Filter eligible shops
  const eligibleShops = shops.filter(isEligibleForFeatured)
  
  // Calculate scores and sort
  const shopsWithScores = eligibleShops.map(shop => ({
    ...shop,
    featuredScore: calculateFeaturedScore(shop)
  })).sort((a, b) => b.featuredScore - a.featuredScore)
  
  // Return top shops up to max limit
  return shopsWithScores
    .slice(0, FEATURED_CRITERIA.MAX_FEATURED_SHOPS)
    .map(shop => shop.id)
}