// src/services/bannerService.ts
import { supabase } from "../lib/supabaseClient";
import { Banner } from "../types";

export const bannerService = {
  // Pega apenas os ativos para o Hero (Público)
  getActive: async (): Promise<Banner[]> => {
    const { data, error } = await supabase
      .from('banners')
      .select('*')
      .eq('ativo', true)
      .order('ordem', { ascending: true });
    
    if (error) {
      console.error('Erro ao buscar banners:', error);
      return [];
    }
    return data || [];
  },

  // Pega todos para o Admin
  getAllAdmin: async (): Promise<Banner[]> => {
    const { data, error } = await supabase
      .from('banners')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  // Adicionar novo banner (Dados + Storage é feito no front, aqui salvamos a ref no banco)
  create: async (banner: Partial<Banner>): Promise<Banner> => {
    const { data, error } = await supabase
      .from('banners')
      .insert([banner])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Deletar
  delete: async (id: string): Promise<void> => {
    const { error } = await supabase.from('banners').delete().eq('id', id);
    if (error) throw error;
  },

// Alternar status
  toggleActive: async (id: string): Promise<boolean> => { // <--- Retorna Promise<boolean>
    // 1. OBTÉM o status atual do banco
    const { data, error: fetchError } = await supabase
        .from('banners')
        .select('ativo') 
        .eq('id', id)
        .single();
    
    if (fetchError || !data) throw new Error('Não foi possível ler o status do banner.');
    
    // 2. INVERTE a lógica
    const newStatus = !data.ativo;
    
    // 3. ATUALIZA o banco de dados
    const { error } = await supabase
      .from('banners')
      .update({ ativo: newStatus })
      .eq('id', id);
    
    if (error) throw error;

    // 4. RETORNA o NOVO status (true ou false)
    return newStatus;
  }
};