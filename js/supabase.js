const SUPABASE_URL = 'https://qyhvdjrogavlidrttpkl.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_ovfY_ucMva4nO-GdOWMurA_yJgXCuWK';

const { createClient } = supabase;
const db = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);