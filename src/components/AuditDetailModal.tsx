import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion } from 'framer-motion';
import { X, TrendingUp, TrendingDown, RefreshCw, ArrowRight } from 'lucide-react';

// Tipagem simplificada baseada no que você usa
interface AuditDetailModalProps {
    log: any | null; // Pode tipar melhor se quiser (AugmentedAuditLog)
    isOpen: boolean;
    onClose: () => void;
}

export default function AuditDetailModal({ log, isOpen, onClose }: AuditDetailModalProps) {
    
    // 1. TRAVAR O SCROLL DO FUNDO
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden'; // Trava
        } else {
            document.body.style.overflow = 'unset'; // Destrava
        }
        return () => {
            document.body.style.overflow = 'unset'; // Garante destrava ao desmontar
        };
    }, [isOpen]);

    if (!isOpen || !log) return null;

    // Helper para formatar valores nulos ou objetos
    const formatValue = (val: any) => {
        if (val === null || val === undefined) return <span className="text-zinc-600 italic">null</span>;
        if (typeof val === 'object') return <pre className="text-xs whitespace-pre-wrap">{JSON.stringify(val, null, 2)}</pre>;
        if (val === true) return "true";
        if (val === false) return "false";
        return String(val);
    };

    // Identificar campos alterados
    const getChangedFields = () => {
        if (log.action_type === 'INSERT') return log.new_data || {};
        if (log.action_type === 'DELETE') return log.old_data || {};
        
        // Para UPDATE, comparamos chaves
        const oldD = log.old_data || {};
        const newD = log.new_data || {};
        const allKeys = Array.from(new Set([...Object.keys(oldD), ...Object.keys(newD)]));
        
        const changes: Record<string, { old: any, new: any }> = {};
        
        allKeys.forEach(key => {
            if (JSON.stringify(oldD[key]) !== JSON.stringify(newD[key])) {
                changes[key] = { old: oldD[key], new: newD[key] };
            }
        });
        
        return changes;
    };

    const changes = getChangedFields();
    const actionColor = 
        log.action_type === 'DELETE' ? 'bg-red-500/10 text-red-400 border-red-500/20' :
        log.action_type === 'INSERT' ? 'bg-green-500/10 text-green-400 border-green-500/20' :
        'bg-blue-500/10 text-blue-400 border-blue-500/20';

    const ActionIcon = 
        log.action_type === 'DELETE' ? TrendingDown :
        log.action_type === 'INSERT' ? TrendingUp : RefreshCw;

    return createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
            {/* Backdrop Escuro */}
            <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={onClose}
                className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />

            {/* Container do Modal */}
            <motion.div 
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                // Altura máxima de 85vh e overflow-y-auto permitem rolar DENTRO do modal se for grande
                className="relative bg-zinc-900 border border-zinc-700 rounded-xl w-full max-w-lg shadow-2xl flex flex-col max-h-[85vh]"
            >
                {/* === HEADER FIXO (Não rola) === */}
                <div className="flex items-start justify-between p-5 border-b border-zinc-800 bg-zinc-900 rounded-t-xl z-10 flex-shrink-0">
                    <div>
                        <h2 className="text-lg font-bold text-white leading-tight">Detalhes da Alteração</h2>
                        <div className={`mt-2 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md border text-xs font-bold uppercase tracking-wider ${actionColor}`}>
                            <ActionIcon size={14} />
                            {log.action_type}
                        </div>
                    </div>
                    
                    <button 
                        onClick={onClose}
                        className="p-2 -mr-2 -mt-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* === CONTEÚDO COM SCROLL === */}
                <div className="p-5 overflow-y-auto custom-scrollbar space-y-6">
                    
                    {/* Metadados */}
                    <div className="grid grid-cols-2 gap-4 bg-zinc-950/50 p-4 rounded-lg border border-zinc-800">
                        <div>
                            <span className="text-[10px] uppercase text-zinc-500 font-bold">Tabela Afetada</span>
                            <p className="text-sm text-zinc-200 font-mono mt-0.5">{log.table_name}</p>
                        </div>
                        <div>
                            <span className="text-[10px] uppercase text-zinc-500 font-bold">ID do Registro</span>
                            <p className="text-sm text-zinc-200 font-mono mt-0.5 truncate" title={log.record_id}>
                                {log.record_id}
                            </p>
                        </div>
                        <div className="col-span-2">
                            <span className="text-[10px] uppercase text-zinc-500 font-bold">Realizado por</span>
                            <p className="text-sm text-orange-400 font-medium mt-0.5 break-all">
                                {log.changed_by_user_email || log.changed_by_user_id}
                            </p>
                        </div>
                    </div>

                    {/* Diff (Diferenças) */}
                    <div>
                        <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
                            Diferença de Campos (Diff)
                        </h3>
                        
                        <div className="space-y-3">
                            {log.action_type === 'UPDATE' ? (
                                Object.entries(changes).map(([key, val]: any) => (
                                    <div key={key} className="bg-zinc-800/30 rounded-lg border border-zinc-700/50 overflow-hidden">
                                        <div className="px-3 py-2 bg-zinc-800/50 border-b border-zinc-700/50 text-xs font-mono text-orange-300 font-semibold">
                                            {key}
                                        </div>
                                        <div className="p-3 grid grid-cols-1 gap-2">
                                            <div className="space-y-1">
                                                <span className="text-[10px] text-red-400 uppercase font-bold">Valor Antigo</span>
                                                <div className="text-sm text-zinc-300 bg-red-900/10 p-2 rounded border border-red-900/20 break-words font-mono">
                                                    {formatValue(val.old)}
                                                </div>
                                            </div>
                                            
                                            {/* Seta visual apenas indicativa */}
                                            <div className="flex justify-center text-zinc-600 py-1">
                                                <ArrowRight size={14} className="rotate-90 md:rotate-0" />
                                            </div>

                                            <div className="space-y-1">
                                                <span className="text-[10px] text-green-400 uppercase font-bold">Novo Valor</span>
                                                <div className="text-sm text-zinc-300 bg-green-900/10 p-2 rounded border border-green-900/20 break-words font-mono">
                                                    {formatValue(val.new)}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                // Para INSERT ou DELETE mostramos apenas uma lista JSON bonita
                                <div className="bg-zinc-950 p-4 rounded-lg border border-zinc-800 font-mono text-xs text-zinc-300 overflow-x-auto">
                                    <pre>{JSON.stringify(changes, null, 2)}</pre>
                                </div>
                            )}

                            {Object.keys(changes).length === 0 && (
                                <p className="text-center text-zinc-500 text-sm py-4 italic">
                                    Nenhuma alteração específica detectada ou dados brutos não disponíveis.
                                </p>
                            )}
                        </div>
                    </div>
                </div>

                {/* === FOOTER (Opcional, só para fechar visualmente) === */}
                <div className="p-4 border-t border-zinc-800 bg-zinc-900 rounded-b-xl flex justify-end flex-shrink-0">
                     <button
                        onClick={onClose}
                        className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white text-sm rounded-lg transition-colors border border-zinc-700"
                     >
                        Fechar
                     </button>
                </div>
            </motion.div>
        </div>,
        document.body
    );
}