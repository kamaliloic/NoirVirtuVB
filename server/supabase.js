import { createClient } from '@supabase/supabase-js';

export const SUPABASE_URL = 'https://klotxfdbhkqqgoywigue.supabase.co';
export const SUPABASE_PUBLIC_KEY = 'sb_publishable_HxgQjFEb1sGmcGJkGnAdfw_DdFwLZxG';

export const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLIC_KEY);
export default supabase;
