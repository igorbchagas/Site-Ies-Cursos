// src/services/momentService.ts

import { supabase } from "../lib/supabaseClient";
import { Moment } from "../types";

// Nome da tabela no Supabase
const MOMENTS_TABLE = "momentos";
// Nome do Bucket no Supabase Storage
const STORAGE_BUCKET = "images";

export interface StorageUsage {
    total: number;
    used: number; // Em MB
    percentage: number;
    isFull: boolean;
}

// Extende a interface Moment para incluir a data específica do evento
export interface MomentEvent extends Moment {
    event_date: string;
}

export const momentService = {
    /**
     * Carrega todos os momentos do banco de dados.
     */
    async getAll(): Promise<MomentEvent[]> {
        // Seleciona explicitamente as colunas para evitar erros de retorno
        const { data, error } = await supabase
            .from(MOMENTS_TABLE)
            .select('*') // Pega tudo para garantir, ou especifique: id, title, description, category, type, imagem_url, data_upload, event_date
            .order('data_upload', { ascending: false });

        if (error) {
            console.error("Erro ao buscar momentos:", error);
            throw new Error("Falha ao carregar galeria.");
        }

        // Mapeia os dados do banco (snake_case) para a interface da aplicação
        return (data || []).map((item: any) => ({
            id: item.id,
            title: item.title ?? "",
            description: item.description ?? "",
            category: (item.category as Moment['category']) ?? "eventos",
            type: (item.type as Moment['type']) ?? "image",
            src: item.imagem_url, // Mapeia imagem_url do banco para src
            date: item.data_upload,
            event_date: item.event_date || item.data_upload, // Fallback se não tiver data do evento
        }));
    },

    /**
     * Adiciona um novo momento.
     */
    async create(momentData: Omit<Moment, 'id' | 'date'> & { event_date: string }): Promise<MomentEvent> {
        // Prepara o objeto para inserção no banco
        const dbPayload = {
            title: momentData.title,
            description: momentData.description,
            category: momentData.category,
            type: momentData.type,
            imagem_url: momentData.src, // Salva no banco como imagem_url
            event_date: momentData.event_date,
            // O campo data_upload geralmente é gerado automaticamente (default now()), mas se precisar enviar:
            // data_upload: new Date().toISOString() 
        };

        const { data, error } = await supabase
            .from(MOMENTS_TABLE)
            .insert([dbPayload])
            .select()
            .single();

        if (error) {
            console.error("Erro ao criar momento:", error);
            throw new Error(`Falha ao salvar o momento: ${error.message}`);
        }

        return {
            id: data.id,
            title: data.title,
            description: data.description,
            category: data.category,
            type: data.type,
            src: data.imagem_url,
            date: data.data_upload,
            event_date: data.event_date,
        };
    },

    /**
     * Remove um momento pelo ID.
     */
    async remove(id: string): Promise<void> {
        const { error } = await supabase
            .from(MOMENTS_TABLE)
            .delete()
            .eq('id', id);

        if (error) {
            console.error("Erro ao remover momento:", error);
            throw new Error("Falha ao remover o registro do banco de dados.");
        }
    },

    /**
     * Simulação do uso do Storage (Baseado na contagem de imagens).
     */
    async getStorageUsage(): Promise<StorageUsage> {
        const total = 50; // Limite simulado de 50 MB

        try {
            const { count, error } = await supabase
                .from(MOMENTS_TABLE)
                .select('*', { count: 'exact', head: true })
                .eq('type', 'image');

            if (error) {
                console.warn("WARN: Falha ao contar imagens para simular uso.");
                return { total: 50, used: 0, percentage: 0, isFull: false };
            }

            const imageCount = count || 0;
            const averageImageSizeMB = 1.5; // Estimativa média por foto
            const simulatedUsedMB = imageCount * averageImageSizeMB;

            const used = Math.min(simulatedUsedMB, total);
            const percentage = (used / total) * 100;
            const isFull = percentage >= 95;

            return { total, used, percentage, isFull };

        } catch (error) {
            console.warn("WARN: Erro inesperado ao simular uso do storage.", error);
            return { total: 50, used: 0, percentage: 0, isFull: false };
        }
    }
};