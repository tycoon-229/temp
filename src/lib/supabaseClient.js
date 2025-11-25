import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

// Tạo bộ nhớ Custom để sử dụng SessionStorage thay vì LocalStorage
const customStorage = {
  getItem: (key) => {
    if (typeof window !== 'undefined') {
      return window.sessionStorage.getItem(key)
    }
    return null
  },
  setItem: (key, value) => {
    if (typeof window !== 'undefined') {
      window.sessionStorage.setItem(key, value)
    }
  },
  removeItem: (key) => {
    if (typeof window !== 'undefined') {
      window.sessionStorage.removeItem(key)
    }
  },
}

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    storage: customStorage, // Ép buộc dùng SessionStorage
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  },
})