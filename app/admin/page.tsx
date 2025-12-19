'use client'

import { useEffect, useState } from 'react'
import { CheckCircle, XCircle, Eye } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import toast from 'react-hot-toast'

interface Shop {
  id: string
  shop_name: string
  address: string
  manager_name: string
  email: string
  description: string
  is_verified: boolean
  created_at: string
  profiles: {
    full_name: string
  }
}

export default function AdminPage() {
  const [shops, setShops] = useState<Shop[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'pending'>('pending')

  useEffect(() => {
    fetchShops()
  }, [])

  const fetchShops = async () => {
    try {
      const { data, error } = await supabase
        .from('shops')
        .select(`
          *,
          profiles(full_name)
        `)
        .eq('is_verified', false)
        .order('created_at', { ascending: false })

      if (error) throw error
      setShops(data || [])
    } catch (error) {
      console.error('Error fetching shops:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleApprove = async (shopId: string) => {
    try {
      const { error } = await supabase
        .from('shops')
        .update({ is_verified: true })
        .eq('id', shopId)

      if (error) throw error
      
      toast.success('Shop approved!')
      fetchShops()
    } catch (error) {
      toast.error('Failed to approve shop')
    }
  }

  const handleReject = async (shopId: string) => {
    if (!confirm('Delete this shop application?')) return

    try {
      const { error } = await supabase
        .from('shops')
        .delete()
        .eq('id', shopId)

      if (error) throw error
      
      toast.success('Shop rejected')
      fetchShops()
    } catch (error) {
      toast.error('Failed to reject shop')
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <h1 className="text-2xl font-bold">Admin - Shop Applications</h1>
          <p className="text-gray-600">Approve or reject shop applications</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-barber-orange mx-auto"></div>
          </div>
        ) : shops.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-600">No pending applications</p>
          </div>
        ) : (
          <div className="space-y-6">
            {shops.map((shop) => (
              <div key={shop.id} className="bg-white rounded-lg shadow p-6">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold mb-2">{shop.shop_name}</h3>
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div>
                        <p className="text-sm text-gray-600">Owner: {shop.profiles?.full_name}</p>
                        <p className="text-sm text-gray-600">Manager: {shop.manager_name}</p>
                        <p className="text-sm text-gray-600">Email: {shop.email}</p>
                        <p className="text-sm text-gray-600">Location: {shop.address}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Applied: {new Date(shop.created_at).toLocaleDateString()}</p>
                      </div>
                    </div>
                    <div className="mb-4">
                      <h4 className="text-sm font-medium mb-2">Description:</h4>
                      <p className="text-sm text-gray-600">{shop.description}</p>
                    </div>
                  </div>
                  
                  <div className="flex space-x-2 ml-4">
                    <button
                      onClick={() => handleApprove(shop.id)}
                      className="flex items-center px-3 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                    >
                      <CheckCircle size={16} className="mr-1" />
                      Approve
                    </button>
                    
                    <button
                      onClick={() => handleReject(shop.id)}
                      className="flex items-center px-3 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
                    >
                      <XCircle size={16} className="mr-1" />
                      Reject
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}