// src/services/momentService.ts

import { supabase } from "../lib/supabaseClient";
import { Moment } from "../types";

const MOMENTS_TABLE = "momentos";

export interface StorageUsage {
    total: number;
    used: number; // Em MB
    percentage: number;
    isFull: boolean;
}

export interface MomentEvent extends Moment {
    event_date: string;
    size_bytes?: number; // Novo campo opcional
}

export const momentService = {
    /**
     * Carrega todos os momentos
     */
    async getAll(): Promise<MomentEvent[]> {
        const { data, error } = await supabase
            .from(MOMENTS_TABLE)
            .select('*')
            .order('data_upload', { ascending: false });

        if (error) {
            console.error("Erro ao buscar momentos:", error);
            throw new Error("Falha ao carregar galeria.");
        }

        return (data || []).map((item: any) => ({
            id: item.id,
            title: item.title ?? "",
            description: item.description ?? "",
            category: (item.category as Moment['category']) ?? "eventos",
            type: (item.type as Moment['type']) ?? "image",
            src: item.imagem_url, 
            date: item.data_upload,
            event_date: item.event_date || item.data_upload,
            size_bytes: item.size_bytes || 0, // Carrega o tamanho se existir
        }));
    },

    /**
     * Adiciona um novo momento com tamanho do arquivo
     */
    async create(momentData: Omit<Moment, 'id' | 'date'> & { event_date: string, size_bytes?: number }): Promise<MomentEvent> {
        const dbPayload = {
            title: momentData.title,
            description: momentData.description,
            category: momentData.category,
            type: momentData.type,
            imagem_url: momentData.src,
            event_date: momentData.event_date,
            size_bytes: momentData.size_bytes || 0 // Salva o tamanho real
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
            size_bytes: data.size_bytes
        };
    },

    /**
     * Remove um momento
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
     * CÁLCULO REAL DO STORAGE
     * Soma a coluna 'size_bytes' de todas as imagens.
     */
    async getStorageUsage(): Promise<StorageUsage> {
        const total = 50; // Limite de 50 MB

        try {
            // Busca apenas a coluna de tamanho para imagens
            const { data, error } = await supabase
                .from(MOMENTS_TABLE)
                .select('size_bytes')
                .eq('type', 'image');

            if (error) {
                console.warn("WARN: Falha ao calcular uso do storage.");
                return { total, used: 0, percentage: 0, isFull: false };
            }

            // Soma todos os bytes
            const totalBytes = data.reduce((acc, curr) => acc + (curr.size_bytes || 0), 0);
            
            // Converte Bytes para Megabytes (Bytes / 1024 / 1024)
            const usedMB = totalBytes / (1024 * 1024);

            const used = Math.min(usedMB, total);
            const percentage = (used / total) * 100;
            const isFull = percentage >= 95;

            return { total, used, percentage, isFull };

        } catch (error) {
            console.warn("WARN: Erro inesperado no cálculo de storage.", error);
            return { total, used: 0, percentage: 0, isFull: false };
        }
    }
};