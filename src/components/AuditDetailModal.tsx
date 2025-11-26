// src/components/AuditDetailModal.tsx
import { RefreshCw, TrendingUp, TrendingDown } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { createPortal } from "react-dom"; // <-- NOVO IMPORT: Para injetar no body

interface AuditDetailModalProps {
    log: any; // O objeto AuditLog completo, que agora inclui o email
    isOpen: boolean;
    onClose: () => void;
}

// Helper para verificar a igualdade, tratando objetos JSON
const deepEqual = (a: any, b: any) => JSON.stringify(a) === JSON.stringify(b);

// Helper para renderizar a diferença entre dois objetos
const renderDiff = (oldData: any, newData: any) => {
    const keys = new Set([...Object.keys(oldData || {}), ...Object.keys(newData || {})]);
    const changes: JSX.Element[] = [];

    keys.forEach(key => {
        const oldValue = oldData ? oldData[key] : 'N/A';
        const newValue = newData ? newData[key] : 'N/A';

        if (!deepEqual(oldValue, newValue)) {
            changes.push(
                <div key={key} className="py-3 border-b border-zinc-700 last:border-b-0">
                    <strong className="text-orange-400 block mb-2">{key}</strong>
                    
                    <div className="flex flex-col md:flex-row justify-between items-stretch text-sm space-y-3 md:space-y-0 md:space-x-4">
                        <div className="flex-1 p-3 rounded-lg bg-zinc-700/50">
                            <span className="text-zinc-400 block font-light mb-1">Valor Antigo:</span>
                            <span className="text-red-300 font-mono text-xs break-words whitespace-pre-wrap">
                                {typeof oldValue === 'object' && oldValue !== null ? JSON.stringify(oldValue, null, 2) : String(oldValue)}
                            </span>
                        </div>
                        <div className="flex-1 p-3 rounded-lg bg-zinc-700/50">
                            <span className="text-zinc-400 block font-light mb-1">Novo Valor:</span>
                            <span className="text-green-300 font-mono text-xs break-words whitespace-pre-wrap">
                                {typeof newValue === 'object' && newValue !== null ? JSON.stringify(newValue, null, 2) : String(newValue)}
                            </span>
                        </div>
                    </div>
                </div>
            );
        }
    });

    return changes.length > 0 ? changes : <p className="text-zinc-400 py-4 text-center">Nenhuma alteração detectada nas chaves principais.</p>;
};


function AuditDetailModalContent({ log, onClose }: AuditDetailModalProps) {
    const oldData = log.old_data || {};
    const newData = log.new_data || {};
    const isInsert = log.action_type === 'INSERT';
    const isDelete = log.action_type === 'DELETE';
    
    let ActionIcon;
    let ActionColor;

    if (isInsert) { ActionIcon = TrendingUp; ActionColor = 'text-green-400'; }
    else if (isDelete) { ActionIcon = TrendingDown; ActionColor = 'text-red-400'; }
    else { ActionIcon = RefreshCw; ActionColor = 'text-blue-400'; }

    return (
        // 🛑 CORREÇÃO: Animação de escala para entrada/saída (mantida, mas agora no portal)
        <motion.div
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.9, y: 20, opacity: 0 }}
            transition={{ duration: 0.25, type: 'tween' }}
            className="bg-zinc-900 rounded-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto shadow-2xl border border-zinc-700"
            onClick={(e) => e.stopPropagation()} 
        >
            <header className="sticky top-0 bg-zinc-900 border-b border-zinc-700 p-6 flex justify-between items-center z-10">
                <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                    <ActionIcon className={ActionColor} size={24} />
                    Detalhes da Alteração: <span className="font-light text-xl text-zinc-300">{log.action_type}</span>
                </h2>
                <button onClick={onClose} className="text-zinc-400 hover:text-white transition-colors text-3xl leading-none">
                    &times;
                </button>
            </header>

            <div className="p-6 space-y-6">
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm text-zinc-300 bg-zinc-800 p-4 rounded-lg">
                    <div>
                        <strong className="block text-zinc-400">Tabela Afetada:</strong>
                        <span className="font-semibold text-white">{log.table_name}</span>
                    </div>
                    <div>
                        <strong className="block text-zinc-400">ID do Registro:</strong>
                        <span className="font-mono text-orange-300 break-all">{log.record_id}</span>
                    </div>
                     <div>
                        <strong className="block text-zinc-400">Realizado por:</strong>
                        <span className="font-mono text-green-300 break-all">{log.changed_by_user_email || log.changed_by_user_id}</span>
                    </div>
                </div>
                
                <h3 className="text-xl font-semibold text-white mt-6">
                    {isInsert ? 'Dados Inseridos' : isDelete ? 'Dados Removidos' : 'Diferença de Campos (Diff)'}
                </h3>
                
                <div className="bg-zinc-900 border border-zinc-700 p-4 rounded-lg">
                    {isInsert && (
                        <pre className="text-sm text-green-300 whitespace-pre-wrap font-mono overflow-auto max-h-96">
                            {JSON.stringify(newData, null, 2)}
                        </pre>
                    )}
                    {isDelete && (
                        <pre className="text-sm text-red-300 whitespace-pre-wrap font-mono overflow-auto max-h-96">
                            {JSON.stringify(oldData, null, 2)}
                        </pre>
                    )}
                    {!isInsert && !isDelete && renderDiff(oldData, newData)}
                    
                    {!log.old_data && !log.new_data && (
                        <p className="text-zinc-500 text-center py-8">Detalhes de conteúdo (old/new data) não capturados pela política de auditoria.</p>
                    )}
                </div>

                <p className="text-xs text-zinc-500 pt-4 border-t border-zinc-700">
                    Registro: {log.id} | Data/Hora: {new Date(log.changed_at).toLocaleString('pt-BR')}
                </p>
            </div>
        </motion.div>
    );
}

// O componente de exportação agora usa createPortal para injetar no body
export default function AuditDetailModal({ log, isOpen, onClose }: AuditDetailModalProps) {
    if (!isOpen || !log) return null;
    
    const modalElement = (
        <AnimatePresence>
            {isOpen && (
                <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 p-4" 
                    onClick={onClose}
                >
                    <AuditDetailModalContent log={log} onClose={onClose} isOpen={isOpen} />
                </motion.div>
            )}
        </AnimatePresence>
    );

    // Injeta o modal diretamente no corpo do documento
    return createPortal(modalElement, document.body);
}