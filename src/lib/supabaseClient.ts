import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
    // Este erro será lançado se as variáveis não estiverem no arquivo .env
    // ou não forem configuradas no painel da hospedagem.
    throw new Error("As chaves SUPABASE_URL e SUPABASE_ANON_KEY não estão definidas no ambiente (.env).");
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true
    }
});