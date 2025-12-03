// src/services/leadService.ts
import { supabase } from '../lib/supabaseClient';
import { Lead } from '../types'; 
import DOMPurify from 'dompurify'; 

// Tipo para o dado a ser inserido (sem ID e data)
export interface LeadPayload {
    nome: string;
    telefone: string;
    curso_interesse: string;
    horario_interesse: string;
}

/**
 * Função de segurança para remover códigos HTML e scripts maliciosos (XSS).
 */
function sanitizeInput(dirtyString: string): string {
    if (!dirtyString) return "";
    return DOMPurify.sanitize(dirtyString);
}


export const leadService = {
    /**
     * Registra um novo lead, usando RPC e Rate Limiter, após sanitizar os dados.
     * @param payload Dados do formulário.
     */
    async create(payload: LeadPayload) {
        
        // 1. SANITIZAÇÃO DE DADOS e Fallback de erro
        const sanitizedPayload = {
            nome: sanitizeInput(payload.nome),
            telefone: sanitizeInput(payload.telefone),
            curso_interesse: sanitizeInput(payload.curso_interesse),
            horario_interesse: sanitizeInput(payload.horario_interesse),
        };

        // 2. Chamada da Função RPC
        const { data, error } = await supabase.rpc('submit_lead', {
            // Nomes dos parâmetros da função SQL:
            nome_lead: sanitizedPayload.nome,
            telefone_lead: sanitizedPayload.telefone,
            curso_interesse_lead: sanitizedPayload.curso_interesse,
            horario_interesse_lead: sanitizedPayload.horario_interesse
        });

        if (error) {
            // Se o código de erro 42900 for disparado (Rate Limit)
            if (error.code === '42900') {
                throw new Error('RATE_LIMIT_EXCEEDED');
            }
            // Outros erros na execução da função SQL
            throw new Error('Erro ao registrar lead: ' + error.message);
        }
        
        return data as unknown as Lead;
    },

    /**
     * Busca todos os leads, ordenados do mais recente para o mais antigo.
     */
    async getAll() {
        const { data, error } = await supabase
            .from('leads')
            .select('*')
            .order('data_registro', { ascending: false }); 

        if (error) throw new Error('Erro ao buscar leads: ' + error.message);
        return data as Lead[];
    },

    /**
     * Atualiza o status 'contatado' de um lead específico.
     */
    async updateContatado(id: string, contatado: boolean) {
        const { data, error } = await supabase
            .from('leads')
            .update({ contatado })
            .eq('id', id)
            .select() 
            .single(); 
            
        if (error) throw new Error('Erro ao atualizar lead: ' + error.message);
        return data as Lead;
    }
};