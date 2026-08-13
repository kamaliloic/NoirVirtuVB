import { createClient } from '@supabase/supabase-js';

export const SUPABASE_UPL = 'https://klotxfdbhkqqgoywigue.supabase.co/rest/v1/';
export const SUPABASE_PUBLIC_KEY = 'sb_publishable_HxgQjFEb1sGmcGJkGnAdfw_DdFwLZxG';

// Extract base Supabase URL for createClient initialization
const BASE_URL = SUPABASE_UPL.split('/rest/v1')[0] || 'https://klotxfdbhkqqgoywigue.supabase.co';

export const supabase = createClient(BASE_URL, SUPABASE_PUBLIC_KEY);

export default supabase;
