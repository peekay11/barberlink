'use client'

import { useState } from 'react'
import { X } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import toast from 'react-hot-toast'

interface AuthModalProps {
  onClose: () => void
}

export default function AuthModal({ onClose }: AuthModalProps) {
  const [isLogin, setIsLogin] = useState(true)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [role, setRole] = useState<'client' | 'vendor'>('client')
  const [loading, setLoading] = useState(false)

  const handleSocialLogin = async (provider: 'google' | 'github') => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${window.location.origin}/auth/callback`
        }
      })
      if (error) throw error
    } catch (error: any) {
      toast.error(`${provider} login failed: ${error.message}`)
    }
  }

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        })
        if (error) {
          toast.error(`Login failed: ${error.message}`)
          return
        }
      } else {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: fullName,
              role: role
            },
            emailRedirectTo: `${window.location.origin}/auth/callback`
          }
        })
        if (error) {
          toast.error(`Signup failed: ${error.message}`)
          return
        }
        
        if (!data.session) {
          toast.success('Please check your email and click the verification link to complete signup!')
          onClose()
          return
        }
      }
      if (isLogin) {
        toast.success('Logged in successfully!')
        onClose()
      }
    } catch (error: any) {
      toast.error(`Error: ${error.message || 'Something went wrong'}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">
            {isLogin ? 'Log in' : 'Sign up'}
          </h2>
          <button onClick={onClose}>
            <X size={24} />
          </button>
        </div>



        <form onSubmit={handleAuth} className="space-y-4">
          {!isLogin && (
            <>
              <input
                type="text"
                placeholder="Full Name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-barber-orange"
                required
              />
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as 'client' | 'vendor')}
                className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-barber-orange"
              >
                <option value="client">Client</option>
                <option value="vendor">Barber Shop Owner</option>
              </select>
            </>
          )}
          
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-barber-orange"
            required
          />
          
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-barber-orange"
            required
          />

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-barber-orange text-white py-3 rounded-lg font-medium hover:bg-orange-600 transition-colors disabled:opacity-50"
          >
            {loading ? 'Loading...' : (isLogin ? 'Log in' : 'Sign up')}
          </button>
        </form>

        <div className="mt-4 text-center">
          <button
            onClick={() => setIsLogin(!isLogin)}
            className="text-barber-orange hover:underline"
          >
            {isLogin ? "Don't have an account? Sign up" : "Already have an account? Log in"}
          </button>
        </div>
      </div>
    </div>
  )
}