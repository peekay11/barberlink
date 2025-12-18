'use client'

import { useState } from 'react'
import { X, AlertTriangle } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import toast from 'react-hot-toast'

interface DeleteAccountModalProps {
  onClose: () => void
  onConfirm: () => void
}

export default function DeleteAccountModal({ onClose, onConfirm }: DeleteAccountModalProps) {
  const [confirmText, setConfirmText] = useState('')
  const [loading, setLoading] = useState(false)

  const handleDelete = async () => {
    if (confirmText !== 'DELETE') {
      toast.error('Please type DELETE to confirm')
      return
    }

    setLoading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('No user found')
      
      // Call the delete function
      const { error } = await supabase.rpc('delete_user_account', {
        user_uuid: user.id
      })
      
      if (error) throw error
      
      // Sign out the user
      await supabase.auth.signOut()
      
      toast.success('Account deleted successfully')
      onConfirm()
    } catch (error: any) {
      console.error('Delete error:', error)
      toast.error('Failed to delete account')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center">
            <AlertTriangle className="text-red-500 mr-3" size={24} />
            <h2 className="text-xl font-bold text-red-600">Delete Account</h2>
          </div>
          <button onClick={onClose}>
            <X size={24} />
          </button>
        </div>

        <div className="mb-6">
          <p className="text-gray-700 mb-4">
            This action cannot be undone. This will permanently delete your account and all associated data including:
          </p>
          <ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
            <li>Your profile information</li>
            <li>All your shop listings</li>
            <li>All reviews you've written</li>
            <li>All uploaded images</li>
          </ul>
        </div>

        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Type <strong>DELETE</strong> to confirm:
          </label>
          <input
            type="text"
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
            placeholder="DELETE"
          />
        </div>

        <div className="flex space-x-4">
          <button
            onClick={handleDelete}
            disabled={loading || confirmText !== 'DELETE'}
            className="flex-1 bg-red-600 text-white py-3 rounded-lg font-medium hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Deleting...' : 'Delete Account'}
          </button>
          <button
            onClick={onClose}
            className="flex-1 bg-gray-300 text-gray-700 py-3 rounded-lg font-medium hover:bg-gray-400"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}