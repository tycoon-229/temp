import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

// Quay về mặc định (Sử dụng LocalStorage) để đồng bộ các tab
export const supabase = createClient(supabaseUrl, supabaseKey)