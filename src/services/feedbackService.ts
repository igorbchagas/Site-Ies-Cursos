import { supabase } from '../lib/supabaseClient'; // Ajuste o caminho conforme sua config

export interface Feedback {
  id: string;
  name: string;
  course: string;
  rating: number;
  message: string;
  approved: boolean;
  created_at?: string;
}

export const feedbackService = {
  // Criar novo feedback (Público)
  async create(data: Omit<Feedback, 'id' | 'created_at' | 'approved'>) {
    const { error } = await supabase
      .from('feedbacks')
      .insert([{ ...data, approved: false }]); // Garante que entra como false
    
    if (error) throw error;
  },

  // Buscar aprovados (Para o site público)
  async getApproved() {
    const { data, error } = await supabase
      .from('feedbacks')
      .select('*')
      .eq('approved', true)
      .order('created_at', { ascending: false }); // Mais recentes primeiro

    if (error) throw error;
    return data as Feedback[];
  },

  // Buscar TODOS (Para o Admin)
  async getAllAdmin() {
    const { data, error } = await supabase
      .from('feedbacks')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data as Feedback[];
  },

  // Aprovar/Reprovar (Admin)
  async toggleApproval(id: string, currentStatus: boolean) {
    const { error } = await supabase
      .from('feedbacks')
      .update({ approved: !currentStatus })
      .eq('id', id);

    if (error) throw error;
  },

  // Deletar (Admin)
  async delete(id: string) {
    const { error } = await supabase
      .from('feedbacks')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }
};