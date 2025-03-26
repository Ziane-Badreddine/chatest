import { createClient } from '@supabase/supabase-js'
import { Database } from './supabase';



const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;


if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Supabase URL et/ou clé anonyme non définis. Vérifiez vos variables d\'environnement.'
  );
}

const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey)

export default supabase;