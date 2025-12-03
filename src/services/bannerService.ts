import { supabase } from "../lib/supabaseClient";
import { Banner } from "../types";

export const bannerService = {
  // Pega apenas os ativos para o Hero (Público)
  getActive: async (): Promise<Banner[]> => {
    // O select('*') já traz a coluna mobile_image automaticamente se ela existir no banco
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

  // Adicionar novo banner
  create: async (banner: Partial<Banner>): Promise<Banner> => {
    const { data, error } = await supabase
      .from('banners')
      .insert([banner])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // --- NOVO: Função para Editar dados do banner (Imagem, Título, Link) ---
  update: async (id: string, banner: Partial<Banner>): Promise<Banner> => {
    const { data, error } = await supabase
      .from('banners')
      .update(banner) // Aqui ele vai aceitar o campo mobile_image se estiver no objeto
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },
  // -----------------------------------------------------------------------

  // Deletar
  delete: async (id: string): Promise<void> => {
    const { error } = await supabase.from('banners').delete().eq('id', id);
    if (error) throw error;
  },

  // Alternar status (Ativo/Inativo)
  toggleActive: async (id: string): Promise<boolean> => {
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

    // 4. RETORNA o NOVO status
    return newStatus;
  }
};