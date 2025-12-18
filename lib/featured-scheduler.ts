// Featured shops scheduler for BarberLink

import { supabase } from './supabase'
import { selectFeaturedShops, ShopMetrics } from './featured-algorithm'

export async function updateFeaturedShops(): Promise<void> {
  try {
    // Get all shops with their metrics
    const { data: shops, error } = await supabase
      .from('shops')
      .select(`
        id,
        is_verified,
        view_count,
        created_at,
        last_featured_at,
        reviews(rating)
      `)
    
    if (error) throw error

    // Calculate metrics for each shop
    const shopMetrics: ShopMetrics[] = shops.map(shop => ({
      id: shop.id,
      avg_rating: shop.reviews?.length > 0 
        ? shop.reviews.reduce((sum: number, review: any) => sum + review.rating, 0) / shop.reviews.length
        : 0,
      review_count: shop.reviews?.length || 0,
      view_count: shop.view_count || 0,
      is_verified: shop.is_verified,
      created_at: shop.created_at,
      last_featured_at: shop.last_featured_at
    }))

    // Get featured shop IDs using algorithm
    const featuredShopIds = selectFeaturedShops(shopMetrics)

    // Unfeatured all current featured shops
    await supabase
      .from('shops')
      .update({ is_featured: false })
      .eq('is_featured', true)

    // Feature selected shops
    if (featuredShopIds.length > 0) {
      await supabase
        .from('shops')
        .update({ 
          is_featured: true,
          last_featured_at: new Date().toISOString()
        })
        .in('id', featuredShopIds)
    }

    console.log(`Featured shops updated: ${featuredShopIds.length} shops`)
  } catch (error) {
    console.error('Error updating featured shops:', error)
  }
}

// Run every 24 hours
export function startFeaturedScheduler(): void {
  // Run immediately on start
  updateFeaturedShops()
  
  // Then run every week (7 days)
  setInterval(updateFeaturedShops, 7 * 24 * 60 * 60 * 1000)
}