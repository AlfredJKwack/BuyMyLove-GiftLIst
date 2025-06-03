import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Admin authentication
export const isAdmin = () => {
  const adminSecret = localStorage.getItem('admin_secret')
  return adminSecret === import.meta.env.VITE_ADMIN_SECRET
}

export const loginAdmin = (secret) => {
  if (secret === import.meta.env.VITE_ADMIN_SECRET) {
    localStorage.setItem('admin_secret', secret)
    return true
  }
  return false
}

export const logoutAdmin = () => {
  localStorage.removeItem('admin_secret')
}
