'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Edit, Trash2 } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { shopSchema } from '@/lib/validations'
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
}

export default function Dashboard() {
  const [user, setUser] = useState<any>(null)
  const [shops, setShops] = useState<Shop[]>([])
  const [showForm, setShowForm] = useState(false)
  const [editingShop, setEditingShop] = useState<Shop | null>(null)
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    shop_name: '',
    description: '',
    address: '',
    full_address: '',
    manager_name: '',
    contact_number: '',
    whatsapp_number: '',
    email: '',
    website: '',
    facebook_url: '',
    instagram_url: '',
    twitter_url: '',
    services: [] as string[],
    price_range: '',
  })
  const [imageUrls, setImageUrls] = useState<string[]>([])
  const [newService, setNewService] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [uploadingImages, setUploadingImages] = useState(false)
  const [imageFiles, setImageFiles] = useState<File[]>([])
  const router = useRouter()

  useEffect(() => {
    checkUser()
  }, [])

  const checkUser = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      router.push('/')
      return
    }
    setUser(user)
    fetchUserShops(user.id)
  }

  const fetchUserShops = async (userId: string) => {
    const { data, error } = await supabase
      .from('shops')
      .select('*')
      .eq('owner_id', userId)
    
    if (error) {
      console.error('Error fetching shops:', error)
      return
    }
    
    setShops(data || [])
  }

  const uploadImages = async () => {
    if (imageFiles.length === 0) return imageUrls
    
    const totalImages = imageUrls.length + imageFiles.length
    if (totalImages > 5) {
      throw new Error('Maximum 5 images allowed')
    }
    
    setUploadingImages(true)
    const uploadedUrls: string[] = [...imageUrls]
    
    try {
      for (const file of imageFiles) {
        const fileExt = file.name.split('.').pop()
        const fileName = `${user.id}/${Date.now()}.${fileExt}`
        
        const { data, error } = await supabase.storage
          .from('shop-images')
          .upload(fileName, file)
        
        if (error) throw error
        
        const { data: { publicUrl } } = supabase.storage
          .from('shop-images')
          .getPublicUrl(fileName)
        
        uploadedUrls.push(publicUrl)
      }
    } catch (error) {
      console.error('Error uploading images:', error)
      throw new Error('Failed to upload images')
    } finally {
      setUploadingImages(false)
    }
    
    return uploadedUrls
  }

  const validateForm = () => {
    const newErrors: Record<string, string> = {}
    
    if (!formData.shop_name.trim()) newErrors.shop_name = 'Shop name is required'
    if (!formData.description.trim() || formData.description.length < 20) newErrors.description = 'Description must be at least 20 characters'
    if (!formData.address) newErrors.address = 'Area selection is required'
    if (!formData.full_address.trim()) newErrors.full_address = 'Full address is required'
    if (!formData.manager_name.trim()) newErrors.manager_name = 'Manager name is required'
    if (!formData.contact_number.trim() || formData.contact_number.length < 10) newErrors.contact_number = 'Valid contact number is required'
    if (!formData.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) newErrors.email = 'Valid email is required'
    if (formData.website && !/^https?:\/\/.+/.test(formData.website)) newErrors.website = 'Valid website URL is required'
    if (!formData.price_range) newErrors.price_range = 'Price range is required'
    if (formData.services.length === 0) newErrors.services = 'At least one service is required'
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) {
      toast.error('Please fix the errors below')
      return
    }
    
    setLoading(true)
    setErrors({})
    
    try {
      // Ensure user profile exists
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', user.id)
        .single()
      
      if (profileError || !profile) {
        // Create profile if it doesn't exist
        const { error: createProfileError } = await supabase
          .from('profiles')
          .insert({
            id: user.id,
            full_name: user.user_metadata?.full_name || 'User',
            role: 'vendor'
          })
        
        if (createProfileError) {
          throw new Error('Failed to create user profile')
        }
      }
      
      const validatedData = shopSchema.parse(formData)
      const finalImageUrls = await uploadImages()
      
      if (editingShop) {
        const { error } = await supabase
          .from('shops')
          .update({
            ...validatedData,
            image_urls: finalImageUrls
          })
          .eq('id', editingShop.id)
        
        if (error) throw error
        toast.success('Shop updated successfully!')
      } else {
        const { error } = await supabase
          .from('shops')
          .insert({
            ...validatedData,
            owner_id: user.id,
            image_urls: finalImageUrls,
            is_verified: false
          })
        
        if (error) throw error
        toast.success('Shop created successfully!')
      }
      
      setShowForm(false)
      setEditingShop(null)
      setFormData({
        shop_name: '',
        description: '',
        address: '',
        full_address: '',
        manager_name: '',
        contact_number: '',
        whatsapp_number: '',
        email: '',
        website: '',
        facebook_url: '',
        instagram_url: '',
        twitter_url: '',
        services: [],
        price_range: '',
      })
      setImageUrls([])
      setImageFiles([])
      setImageUrls([])
      setImageFiles([])
      await fetchUserShops(user.id)
    } catch (error: any) {
      console.error('Error saving shop:', error)
      if (error.name === 'ZodError') {
        const fieldErrors: Record<string, string> = {}
        error.errors.forEach((err: any) => {
          fieldErrors[err.path[0]] = err.message
        })
        setErrors(fieldErrors)
        toast.error('Please check the form for errors')
      } else {
        toast.error(error.message || 'Failed to save shop')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = (shop: Shop) => {
    setEditingShop(shop)
    setFormData({
      shop_name: shop.shop_name,
      description: shop.description,
      address: shop.address,
      full_address: shop.full_address,
      manager_name: shop.manager_name,
      contact_number: shop.contact_number,
      whatsapp_number: shop.whatsapp_number || '',
      email: shop.email,
      website: shop.website || '',
      facebook_url: shop.facebook_url || '',
      instagram_url: shop.instagram_url || '',
      twitter_url: shop.twitter_url || '',
      services: shop.services || [],
      price_range: shop.price_range,
    })
    setImageUrls(shop.image_urls || [])
    setShowForm(true)
  }

  const handleDelete = async (shopId: string) => {
    if (!confirm('Are you sure you want to delete this shop?')) return
    
    const { error } = await supabase
      .from('shops')
      .delete()
      .eq('id', shopId)
    
    if (error) {
      console.error('Error deleting shop:', error)
      return
    }
    
    await fetchUserShops(user.id)
  }

  if (!user) return null

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-gray-900">Vendor Dashboard</h1>
            <button
              onClick={() => supabase.auth.signOut()}
              className="text-gray-600 hover:text-gray-900"
            >
              Sign Out
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-xl font-semibold">Your Shops</h2>
          <button
            onClick={() => setShowForm(true)}
            className="bg-barber-orange text-white px-4 py-2 rounded-lg flex items-center space-x-2 hover:bg-orange-600"
          >
            <Plus size={20} />
            <span>Add Shop</span>
          </button>
        </div>

        {showForm && (
          <div className="bg-white rounded-lg shadow p-6 mb-8">
            <h3 className="text-lg font-semibold mb-4">
              {editingShop ? 'Edit Shop' : 'Add New Shop'}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <input
                    type="text"
                    placeholder="Shop Name"
                    value={formData.shop_name}
                    onChange={(e) => setFormData({...formData, shop_name: e.target.value})}
                    className={`w-full p-3 border rounded-lg ${errors.shop_name ? 'border-red-500' : 'border-gray-300'}`}
                    required
                  />
                  {errors.shop_name && <p className="text-red-500 text-sm mt-1">{errors.shop_name}</p>}
                </div>
                <div>
                  <input
                    type="email"
                    placeholder="Email Address"
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    className={`w-full p-3 border rounded-lg ${errors.email ? 'border-red-500' : 'border-gray-300'}`}
                    required
                  />
                  {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
                </div>
              </div>
              
              <div>
                <textarea
                  placeholder="Detailed Description (services, atmosphere, specialties)"
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  className={`w-full p-3 border rounded-lg h-32 ${errors.description ? 'border-red-500' : 'border-gray-300'}`}
                  required
                />
                <div className="flex justify-between text-sm mt-1">
                  {errors.description && <p className="text-red-500">{errors.description}</p>}
                  <p className={`${formData.description.length < 20 ? 'text-red-500' : 'text-gray-500'}`}>
                    {formData.description.length}/20 min
                  </p>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <select
                    value={formData.address}
                    onChange={(e) => setFormData({...formData, address: e.target.value})}
                    className={`w-full p-3 border rounded-lg ${errors.address ? 'border-red-500' : 'border-gray-300'}`}
                    required
                  >
                    <option value="">Select JHB Area</option>
                    <option value="Sandton">Sandton</option>
                    <option value="Rosebank">Rosebank</option>
                    <option value="Braamfontein">Braamfontein</option>
                    <option value="Melville">Melville</option>
                    <option value="Parkhurst">Parkhurst</option>
                    <option value="Greenside">Greenside</option>
                    <option value="Randburg">Randburg</option>
                    <option value="Fourways">Fourways</option>
                    <option value="Midrand">Midrand</option>
                    <option value="Centurion">Centurion</option>
                  </select>
                  {errors.address && <p className="text-red-500 text-sm mt-1">{errors.address}</p>}
                </div>
                
                <div>
                  <input
                    type="text"
                    placeholder="Full Street Address"
                    value={formData.full_address}
                    onChange={(e) => setFormData({...formData, full_address: e.target.value})}
                    className={`w-full p-3 border rounded-lg ${errors.full_address ? 'border-red-500' : 'border-gray-300'}`}
                    required
                  />
                  {errors.full_address && <p className="text-red-500 text-sm mt-1">{errors.full_address}</p>}
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input
                  type="text"
                  placeholder="Manager Name"
                  value={formData.manager_name}
                  onChange={(e) => setFormData({...formData, manager_name: e.target.value})}
                  className="w-full p-3 border border-gray-300 rounded-lg"
                  required
                />
                <input
                  type="tel"
                  placeholder="Contact Number"
                  value={formData.contact_number}
                  onChange={(e) => setFormData({...formData, contact_number: e.target.value})}
                  className="w-full p-3 border border-gray-300 rounded-lg"
                  required
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input
                  type="url"
                  placeholder="Website (optional)"
                  value={formData.website}
                  onChange={(e) => setFormData({...formData, website: e.target.value})}
                  className="w-full p-3 border border-gray-300 rounded-lg"
                />
                <select
                  value={formData.price_range}
                  onChange={(e) => setFormData({...formData, price_range: e.target.value})}
                  className="w-full p-3 border border-gray-300 rounded-lg"
                  required
                >
                  <option value="">Select Price Range</option>
                  <option value="Budget (R50-R100)">Budget (R50-R100)</option>
                  <option value="Mid-range (R100-R200)">Mid-range (R100-R200)</option>
                  <option value="Premium (R200-R350)">Premium (R200-R350)</option>
                  <option value="Luxury (R350+)">Luxury (R350+)</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Services Offered</label>
                <div className="flex gap-2 mb-2">
                  <input
                    type="text"
                    placeholder="Add service (e.g., Haircut, Beard trim)"
                    value={newService}
                    onChange={(e) => setNewService(e.target.value)}
                    className="flex-1 p-2 border border-gray-300 rounded-lg"
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault()
                        if (newService.trim()) {
                          setFormData({...formData, services: [...formData.services, newService.trim()]})
                          setNewService('')
                        }
                      }
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (newService.trim()) {
                        setFormData({...formData, services: [...formData.services, newService.trim()]})
                        setNewService('')
                      }
                    }}
                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                  >
                    Add
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {formData.services.map((service, index) => (
                    <span key={index} className="bg-barber-orange text-white px-3 py-1 rounded-full text-sm flex items-center gap-2">
                      {service}
                      <button
                        type="button"
                        onClick={() => {
                          const newServices = formData.services.filter((_, i) => i !== index)
                          setFormData({...formData, services: newServices})
                        }}
                        className="text-white hover:text-gray-200"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
                {errors.services && <p className="text-red-500 text-sm mt-1">{errors.services}</p>}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Shop Images</label>
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={(e) => {
                    const files = Array.from(e.target.files || [])
                    if (imageUrls.length + files.length > 5) {
                      alert('Maximum 5 images allowed')
                      return
                    }
                    setImageFiles(files)
                  }}
                  className="w-full p-3 border border-gray-300 rounded-lg"
                />
                <p className="text-sm text-gray-500 mt-1">Select up to 5 images for your shop ({imageUrls.length + imageFiles.length}/5)</p>
                
                {/* Show existing images */}
                {imageUrls.length > 0 && (
                  <div className="mt-3">
                    <p className="text-sm font-medium text-gray-700 mb-2">Current Images:</p>
                    <div className="grid grid-cols-3 gap-2">
                      {imageUrls.map((url, index) => (
                        <div key={index} className="relative">
                          <img src={url} alt={`Shop ${index + 1}`} className="w-full h-20 object-cover rounded" />
                          <button
                            type="button"
                            onClick={() => {
                              const newUrls = imageUrls.filter((_, i) => i !== index)
                              setImageUrls(newUrls)
                            }}
                            className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs"
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* Show selected files */}
                {imageFiles.length > 0 && (
                  <div className="mt-3">
                    <p className="text-sm font-medium text-gray-700 mb-2">Selected Files:</p>
                    <div className="space-y-1">
                      {imageFiles.map((file, index) => (
                        <div key={index} className="flex items-center justify-between bg-gray-50 p-2 rounded">
                          <span className="text-sm text-gray-700">{file.name}</span>
                          <button
                            type="button"
                            onClick={() => {
                              const newFiles = imageFiles.filter((_, i) => i !== index)
                              setImageFiles(newFiles)
                            }}
                            className="text-red-500 hover:text-red-700"
                          >
                            Remove
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              <div className="flex space-x-4 pt-4">
                <button
                  type="submit"
                  disabled={loading || uploadingImages}
                  className="bg-barber-orange text-white px-6 py-3 rounded-lg hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {uploadingImages ? 'Uploading Images...' : loading ? 'Saving...' : (editingShop ? 'Update Shop' : 'Create Shop')}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false)
                    setEditingShop(null)
                    setFormData({
                      shop_name: '',
                      description: '',
                      address: '',
                      full_address: '',
                      manager_name: '',
                      contact_number: '',
                      whatsapp_number: '',
                      email: '',
                      website: '',
                      facebook_url: '',
                      instagram_url: '',
                      twitter_url: '',
                      services: [],
                      price_range: '',
                    })
                  }}
                  className="bg-gray-300 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-400"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {shops.map((shop) => (
            <div key={shop.id} className="bg-white rounded-lg shadow p-6">
              <div className="flex justify-between items-start mb-4">
                <h3 className="font-semibold text-lg">{shop.shop_name}</h3>
                <div className="flex space-x-2">
                  <button
                    onClick={() => handleEdit(shop)}
                    className="text-blue-600 hover:text-blue-800"
                  >
                    <Edit size={16} />
                  </button>
                  <button
                    onClick={() => handleDelete(shop.id)}
                    className="text-red-600 hover:text-red-800"
                    title="Delete Shop"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
              <p className="text-gray-600 text-sm mb-2">{shop.description}</p>
              <p className="text-gray-600 text-sm mb-1">{shop.address} - {shop.full_address}</p>
              <p className="text-gray-600 text-sm mb-1">Manager: {shop.manager_name}</p>
              <p className="text-gray-600 text-sm mb-1">Price: {shop.price_range}</p>
              {shop.services && shop.services.length > 0 && (
                <div className="mb-2">
                  <p className="text-xs text-gray-500 mb-1">Services:</p>
                  <div className="flex flex-wrap gap-1">
                    {shop.services.slice(0, 3).map((service, index) => (
                      <span key={index} className="bg-gray-100 text-gray-700 px-2 py-1 rounded text-xs">
                        {service}
                      </span>
                    ))}
                    {shop.services.length > 3 && (
                      <span className="text-xs text-gray-500">+{shop.services.length - 3} more</span>
                    )}
                  </div>
                </div>
              )}
              <div className="mt-4">
                <span className={`inline-block px-2 py-1 rounded-full text-xs ${
                  shop.is_verified 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-yellow-100 text-yellow-800'
                }`}>
                  {shop.is_verified ? 'Verified' : 'Pending Verification'}
                </span>
              </div>
            </div>
          ))}
        </div>

        {shops.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-600">No shops yet. Add your first shop to get started!</p>
          </div>
        )}
      </div>
    </div>
  )
}