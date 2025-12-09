import { useEffect, useState, useMemo } from 'react';
import { createPortal } from "react-dom"; 
import { motion, AnimatePresence } from 'framer-motion';
import { 
    MessageSquareQuote, 
    Eye, 
    EyeOff, 
    Trash2, 
    Star, 
    Calendar,
    Loader2,
    RefreshCcw,
    AlertTriangle,
    CheckCircle2,
    LayoutList,
    Maximize2,
    X,
    Quote
} from 'lucide-react';
import { toast } from 'sonner';
import { feedbackService, Feedback } from '../../services/feedbackService';

// ==========================================
// CONFIGURAÇÕES
// ==========================================
const MAX_VISIBLE = 3; 

// ==========================================
// UTILS
// ==========================================
const formatDate = (dateString: string | undefined) => {
    if (!dateString) return "Data desconhecida";
    try {
        return new Date(dateString).toLocaleString('pt-BR', { 
            dateStyle: 'long', 
            timeStyle: 'short' 
        });
    } catch (e) {
        return "Data inválida";
    }
};

const scrollbarStyle = `
  .custom-scrollbar::-webkit-scrollbar { width: 5px; }
  .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
  .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 10px; }
  .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.2); }
`;

// ==========================================
// 1. MODAL DE VISUALIZAÇÃO (PERFORMANCE OTIMIZADA)
// ==========================================
function ViewModal({ feedback, onClose }: { feedback: Feedback | null, onClose: () => void }) {
    useEffect(() => {
        if (feedback) {
            const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
            document.body.style.overflow = 'hidden';
            document.body.style.paddingRight = `${scrollbarWidth}px`;
        }
        return () => { 
            document.body.style.overflow = 'unset'; 
            document.body.style.paddingRight = '0px';
        };
    }, [feedback]);

    if (!feedback) return null;

    return createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6">
            <style>{scrollbarStyle}</style>
            
            <motion.div 
                initial={{ opacity: 0 }} 
                animate={{ opacity: 1 }} 
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-black/80 backdrop-blur-sm" 
                onClick={onClose} 
            />
            
            <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 10 }}
                transition={{ duration: 0.2 }}
                className="relative bg-zinc-900 border border-zinc-700 rounded-2xl w-full max-w-lg shadow-2xl z-10 flex flex-col max-h-[85vh] overflow-hidden"
            >
                <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-orange-500/10 to-transparent pointer-events-none" />

                <button 
                    onClick={onClose} 
                    className="absolute top-4 right-4 text-zinc-400 hover:text-white bg-black/20 hover:bg-black/50 transition-all p-2 rounded-full z-20 backdrop-blur-md outline-none focus:outline-none"
                >
                    <X size={20}/>
                </button>
                
                <div className="p-6 sm:p-8 overflow-y-auto custom-scrollbar relative z-10">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-4 border-b border-white/5 pb-6 mb-6">
                        <div className="w-16 h-16 rounded-full bg-zinc-800 border-2 border-zinc-700/50 flex items-center justify-center text-orange-500 shadow-lg shrink-0">
                            <span className="font-bold text-2xl">
                                {feedback.name ? feedback.name.charAt(0).toUpperCase() : "?"}
                            </span>
                        </div>
                        <div>
                            <h3 className="text-xl font-bold text-white truncate">{feedback.name}</h3>
                            <p className="text-orange-400 text-xs font-bold uppercase tracking-wider mt-1 flex items-center gap-2">
                                <CheckCircle2 size={12} /> {feedback.course}
                            </p>
                            
                            <div className="flex gap-1 mt-2">
                                {[...Array(5)].map((_, i) => (
                                    <Star 
                                        key={i} 
                                        size={14} 
                                        className={i < feedback.rating ? "fill-orange-500 text-orange-500" : "text-zinc-700"} 
                                    />
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="relative bg-zinc-950/50 p-6 rounded-xl border border-white/5 shadow-inner">
                        <Quote className="absolute top-4 left-4 text-zinc-700/50 rotate-180" size={24} />
                        <p className="text-zinc-300 text-base leading-relaxed whitespace-pre-wrap break-words font-light pt-2 px-2">
                            {feedback.message}
                        </p>
                        <Quote className="absolute bottom-4 right-4 text-zinc-700/50" size={24} />
                    </div>

                    <div className="text-zinc-500 text-xs font-medium flex items-center justify-end gap-2 mt-6 pt-4 border-t border-white/5">
                        <Calendar size={14} /> 
                        Enviado em: {formatDate(feedback.created_at)}
                    </div>
                </div>
            </motion.div>
        </div>,
        document.body
    );
}

// ==========================================
// 2. MODAL DE EXCLUSÃO (PERFORMANCE OTIMIZADA)
// ==========================================
interface ConfirmModalProps {
  open: boolean;
  onCancel: () => void;
  onConfirm: () => void;
  isLoading?: boolean;
}

function DeleteModal({ open, onCancel, onConfirm, isLoading }: ConfirmModalProps) {
  useEffect(() => {
    if (open) {
        const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
        document.body.style.overflow = 'hidden';
        document.body.style.paddingRight = `${scrollbarWidth}px`;
    }
    return () => { 
        document.body.style.overflow = 'unset'; 
        document.body.style.paddingRight = '0px';
    };
  }, [open]);

  if (!open) return null;

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/80 backdrop-blur-sm" 
        onClick={onCancel} 
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        className="relative bg-zinc-900 border border-zinc-700 rounded-2xl p-6 w-full max-w-sm shadow-2xl z-10"
      >
        <div className="flex flex-col items-center text-center gap-4">
          <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center text-red-500 ring-4 ring-red-500/5">
            <Trash2 size={24} />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">Excluir Feedback</h2>
            <p className="text-sm text-zinc-400 mt-2">
              Esta ação não pode ser desfeita.
            </p>
          </div>
          <div className="flex gap-3 w-full mt-2">
            <button onClick={onCancel} disabled={isLoading} className="flex-1 px-4 py-2.5 rounded-lg border border-zinc-700 text-zinc-300 hover:bg-zinc-800 transition-colors text-sm font-medium outline-none focus:outline-none">Cancelar</button>
            <button onClick={onConfirm} disabled={isLoading} className="flex-1 px-4 py-2.5 rounded-lg bg-red-600 hover:bg-red-700 text-white flex items-center justify-center gap-2 text-sm font-medium transition-all shadow-lg shadow-red-900/20 outline-none focus:outline-none">
              {isLoading ? <Loader2 size={16} className="animate-spin" /> : 'Sim, Excluir'}
            </button>
          </div>
        </div>
      </motion.div>
    </div>,
    document.body
  );
}

// ==========================================
// COMPONENTE PRINCIPAL
// ==========================================
export default function AdminFeedbacks() {
    const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
    const [loading, setLoading] = useState(true);
    
    const [activeTab, setActiveTab] = useState<'visible' | 'hidden'>('visible');
    const [deleteId, setDeleteId] = useState<string | null>(null);
    const [viewFeedback, setViewFeedback] = useState<Feedback | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    const visibleFeedbacks = useMemo(() => feedbacks.filter(f => f.approved), [feedbacks]);
    const hiddenFeedbacks = useMemo(() => feedbacks.filter(f => !f.approved), [feedbacks]);
    const isLimitReached = visibleFeedbacks.length >= MAX_VISIBLE;

    useEffect(() => { loadFeedbacks(); }, []);

    async function loadFeedbacks(isRefresh = false) {
        try {
            if(!isRefresh) setLoading(true); 
            const data = await feedbackService.getAllAdmin();
            setFeedbacks(data);
            if (isRefresh) toast.success("Atualizado!");
        } catch (error) {
            toast.error("Erro ao carregar feedbacks.");
        } finally {
            setLoading(false);
        }
    }

    async function handleToggleVisibility(id: string, currentStatus: boolean) {
        if (!currentStatus && isLimitReached) {
            toast.warning("Limite atingido!", { description: `Máximo de ${MAX_VISIBLE} depoimentos visíveis.` });
            return; 
        }

        try {
            await feedbackService.toggleApproval(id, currentStatus);
            toast.success(currentStatus ? "Ocultado" : "Publicado!");
            setFeedbacks(prev => prev.map(f => f.id === id ? { ...f, approved: !currentStatus } : f));
        } catch (error) {
            toast.error("Erro ao atualizar.");
        }
    }

    const executeDelete = async () => {
        if (!deleteId) return;
        setIsDeleting(true);
        try {
            await feedbackService.delete(deleteId);
            toast.success("Feedback excluído.");
            setFeedbacks(prev => prev.filter(f => f.id !== deleteId));
            setDeleteId(null);
        } catch (error) {
            toast.error("Erro ao excluir.");
        } finally {
            setIsDeleting(false);
        }
    };

    const currentList = activeTab === 'visible' ? visibleFeedbacks : hiddenFeedbacks;

    return (
        <div className="space-y-8 max-w-7xl mx-auto p-2">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-zinc-800 pb-6">
                <div>
                    <h2 className="text-3xl font-bold text-white flex items-center gap-3">
                        Depoimentos <span className="text-zinc-600 text-lg font-normal hidden sm:inline">| Painel</span>
                    </h2>
                    <p className="text-zinc-400 text-sm mt-2">Gerencie o feedback dos alunos.</p>
                </div>

                <div className="flex items-center gap-3">
                    <div className={`px-4 py-2 rounded-lg border text-sm font-medium flex items-center gap-2 transition-colors ${isLimitReached ? 'bg-orange-500/10 border-orange-500/30 text-orange-400' : 'bg-zinc-900 border-zinc-700 text-zinc-300'}`}>
                        {isLimitReached ? <AlertTriangle size={16} /> : <CheckCircle2 size={16} />}
                        <span>Visíveis: {visibleFeedbacks.length} / {MAX_VISIBLE}</span>
                    </div>
                    <button onClick={() => loadFeedbacks(true)} className="p-2.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white rounded-lg border border-zinc-700 transition-colors outline-none focus:outline-none">
                        <RefreshCcw size={18} className={loading ? "animate-spin" : ""} />
                    </button>
                </div>
            </div>

            {/* Abas */}
            <div className="flex p-1.5 bg-zinc-900 border border-zinc-800 rounded-xl w-full md:w-fit overflow-x-auto shadow-sm">
                <button 
                    onClick={() => setActiveTab('visible')} 
                    className={`flex-1 md:flex-none whitespace-nowrap px-6 py-2 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2 outline-none focus:outline-none ring-0
                        ${activeTab === 'visible' 
                            ? 'bg-zinc-800 text-white shadow border border-zinc-700' 
                            : 'text-zinc-500 hover:text-zinc-300 border border-transparent'}`}
                >
                    <Eye size={16} className={activeTab === 'visible' ? 'text-green-500' : ''} /> No Ar
                </button>
                <button 
                    onClick={() => setActiveTab('hidden')} 
                    className={`flex-1 md:flex-none whitespace-nowrap px-6 py-2 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2 outline-none focus:outline-none ring-0
                        ${activeTab === 'hidden' 
                            ? 'bg-zinc-800 text-white shadow border border-zinc-700' 
                            : 'text-zinc-500 hover:text-zinc-300 border border-transparent'}`}
                >
                    <LayoutList size={16} /> Ocultos ({hiddenFeedbacks.length})
                </button>
            </div>

            {/* Lista com Animação OTIMIZADA (Igual AdminMoments) */}
            {loading ? (
                <div className="flex flex-col items-center justify-center h-64 text-zinc-500 gap-3">
                    <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
                    <span>Carregando...</span>
                </div>
            ) : (
                <div className="min-h-[300px]">
                    <AnimatePresence>
                        {currentList.length === 0 ? (
                            <motion.div 
                                key="empty"
                                initial={{ opacity: 0 }} 
                                animate={{ opacity: 1 }} 
                                exit={{ opacity: 0 }}
                                className="flex flex-col items-center justify-center py-20 bg-zinc-900/30 rounded-2xl border border-zinc-800 border-dashed w-full"
                            >
                                <div className="w-16 h-16 bg-zinc-900 rounded-full flex items-center justify-center mb-4">
                                    {activeTab === 'visible' ? <EyeOff className="text-zinc-600" /> : <MessageSquareQuote className="text-zinc-600" />}
                                </div>
                                <p className="text-zinc-500 font-medium">Nenhum depoimento aqui.</p>
                            </motion.div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 w-full">
                                {currentList.map((item) => (
                                    <motion.div 
                                        key={item.id}
                                        layout
                                        initial={{ opacity: 0, scale: 0.9 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        exit={{ opacity: 0, scale: 0.9 }}
                                        transition={{ duration: 0.2 }}
                                        className={`group relative p-6 rounded-2xl border flex flex-col justify-between h-full transition-shadow hover:shadow-xl ${item.approved ? 'bg-zinc-900/80 border-green-500/20' : 'bg-zinc-900/50 border-zinc-800'}`}
                                    >
                                        <div className="absolute top-5 right-5 z-10">
                                            {item.approved 
                                                ? <span className="flex items-center gap-1.5 px-2 py-0.5 bg-green-500/10 text-green-400 text-[10px] uppercase font-bold rounded-full border border-green-500/20"><div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" /> Visível</span>
                                                : <span className="flex items-center gap-1.5 px-2 py-0.5 bg-zinc-500/10 text-zinc-500 text-[10px] uppercase font-bold rounded-full border border-zinc-500/20">Oculto</span>
                                            }
                                        </div>

                                        <div className="mb-4 pr-16">
                                            <div className="flex gap-0.5 mb-2.5">
                                                {[...Array(5)].map((_, i) => (
                                                    <Star key={i} size={14} className={i < item.rating ? "fill-orange-500 text-orange-500" : "text-zinc-800"} />
                                                ))}
                                            </div>
                                            <h3 className="text-white font-bold text-lg truncate">{item.name}</h3>
                                            <p className="text-orange-500/80 text-xs uppercase font-bold mb-4">{item.course}</p>
                                            
                                            <div 
                                                className="bg-black/20 p-4 rounded-xl border border-white/5 relative group/card cursor-pointer hover:bg-black/40 transition-colors"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setViewFeedback(item);
                                                }}
                                            >
                                                <p className="text-zinc-400 text-sm italic leading-relaxed line-clamp-3 break-words">"{item.message}"</p>
                                                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover/card:opacity-100 transition-opacity bg-zinc-900/80 rounded-xl backdrop-blur-[2px]">
                                                    <span className="text-white text-xs font-bold flex items-center gap-1.5 bg-white/10 px-3 py-1.5 rounded-full border border-white/10">
                                                        <Maximize2 size={12}/> Ler tudo
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex items-center justify-between mt-auto pt-4 border-t border-white/5">
                                            <div className="flex items-center gap-1.5 text-zinc-500 text-xs font-medium">
                                                <Calendar size={12} /> {formatDate(item.created_at)}
                                            </div>

                                            <div className="flex gap-2">
                                                <button 
                                                    onClick={() => handleToggleVisibility(item.id, item.approved)} 
                                                    className={`p-2 rounded-lg transition-all border flex items-center justify-center shadow-lg outline-none focus:outline-none
                                                        ${item.approved 
                                                            ? "bg-zinc-800 text-zinc-400 border-zinc-700 hover:bg-zinc-700 hover:text-white" 
                                                            : isLimitReached 
                                                                ? "bg-zinc-800/50 text-zinc-600 border-zinc-800 cursor-not-allowed opacity-50" 
                                                                : "bg-green-600 text-white border-green-500 hover:bg-green-500"}`}
                                                >
                                                    {item.approved ? <EyeOff size={16} /> : <Eye size={16} />}
                                                </button>
                                                
                                                <button 
                                                    onClick={() => setDeleteId(item.id)} 
                                                    className="p-2 rounded-lg bg-red-500/5 text-red-500 hover:bg-red-500 hover:text-white border border-red-500/20 hover:border-red-500 transition-all shadow-lg outline-none focus:outline-none"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        )}
                    </AnimatePresence>
                </div>
            )}

            <AnimatePresence>
                {deleteId && (
                    <DeleteModal 
                        open={!!deleteId} 
                        onCancel={() => setDeleteId(null)} 
                        onConfirm={executeDelete} 
                        isLoading={isDeleting} 
                    />
                )}
            </AnimatePresence>

            <AnimatePresence>
                {viewFeedback && (
                    <ViewModal 
                        feedback={viewFeedback} 
                        onClose={() => setViewFeedback(null)} 
                    />
                )}
            </AnimatePresence>
        </div>
    );
}