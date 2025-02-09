
import { createClient } from '@supabase/supabase-js'
import type { Database } from './types'

const supabaseUrl = 'https://jzwhciinudtuqsdssqmn.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp6d2hjaWludWR0dXFzZHNzcW1uIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzkxMTYxMjAsImV4cCI6MjA1NDY5MjEyMH0.WoSbR1k0loyT2mKJwhQY1GwjuBFjl-O199Mf8ZIBFfM'

export const supabase = createClient<Database>(supabaseUrl, supabaseKey)
