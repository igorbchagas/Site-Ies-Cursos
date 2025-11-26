// src/services/auditService.ts
import { supabase } from '../lib/supabaseClient';

// =======================================
// INTERFACES
// =======================================

interface AuditLog {
    id: string;
    table_name: string;
    action_type: 'INSERT' | 'UPDATE' | 'DELETE';
    record_id: string;
    changed_by_user_id: string;
    changed_at: string;
    old_data: any;
    new_data: any;
}

interface LoginAttempt {
    id: string;
    attempted_username: string;
    attempt_ip: string;
    attempt_at: string;
    success: boolean;
    user_agent: string;
}

interface UserMap {
    [userId: string]: string; // Mapeia UUID do usuário para seu Email
}

// =======================================
// SERVIÇO
// =======================================

export const auditService = {
    
    async getAuditLogs(): Promise<AuditLog[]> {
        // ... (Implementação existente para logs de auditoria)
        const { data, error } = await supabase
            .from('audit_log')
            .select('*')
            .order('changed_at', { ascending: false });

        if (error) {
            console.error("Erro Supabase AuditLog:", error);
            throw new Error('Erro ao buscar logs de auditoria: ' + error.message);
        }
        return (data as AuditLog[]) || [];
    },

    async getLoginAttempts(): Promise<LoginAttempt[]> {
        // ... (Implementação existente para logs de login)
        const { data, error } = await supabase
            .from('login_attempts')
            .select('*')
            .order('attempt_at', { ascending: false });

        if (error) {
            console.error("Erro Supabase LoginAttempts:", error);
            throw new Error('Erro ao buscar logs de login: ' + error.message);
        }
        return (data as LoginAttempt[]) || [];
    },

    /**
     * Busca os emails dos usuários Admin pelos IDs usando a função RPC.
     */
    async getAdminUserEmails(userIds: string[]): Promise<UserMap> {
        // Remove duplicatas e IDs vazios
        const uniqueUserIds = Array.from(new Set(userIds.filter(id => id)));
        
        if (uniqueUserIds.length === 0) return {};

        // Chama a função RPC criada no Supabase
        const { data, error } = await supabase.rpc('get_admin_user_emails', { user_ids: uniqueUserIds });

        if (error) {
            console.error("Erro Supabase ao buscar emails de Admin:", error);
            return {};
        }

        const userMap: UserMap = {};
        // O Supabase retorna a resposta como data
        (data as { id: string, email: string }[]).forEach(user => {
            userMap[user.id] = user.email;
        });

        return userMap;
    },
};