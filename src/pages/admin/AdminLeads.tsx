// src/pages/admin/AdminLeads.tsx
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Users, Phone, Clock, Layers, MessageCircle, CheckCircle, XCircle, Loader2, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { leadService } from "../../services/leadService";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";

// Interface local (ou pode importar do types.ts se preferir)
interface Lead {
    id: string;
    nome: string;
    telefone: string;
    curso_interesse: string;
    horario_interesse: string;
    data_registro: string;
    contatado: boolean;
}

// ------------------------
// MODAL DE VISUALIZAÇÃO E WHATSAPP
// ------------------------

interface LeadModalProps {
    lead: Lead | null;
    onClose: () => void;
    onMarkContatado: (id: string, status: boolean) => void;
}

function LeadModal({ lead, onClose, onMarkContatado }: LeadModalProps) {
    if (!lead) return null;

    // Função para gerar o link do WhatsApp
    const generateWhatsappLink = () => {
        const numero = lead.telefone.replace(/\D/g, ''); 
        const msg = encodeURIComponent(
            `Olá ${lead.nome}, vi que você demonstrou interesse no curso "${lead.curso_interesse}" (${lead.horario_interesse}). Posso te ajudar com a inscrição?`
        );
        return `https://wa.me/55${numero}?text=${msg}`;
    };
    
    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('pt-BR', {
            day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit'
        });
    };

    return createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={onClose}
                className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />
            <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 15 }}
                transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                className="relative bg-zinc-900 border border-zinc-700 rounded-xl p-6 w-full max-w-lg shadow-2xl z-10"
            >
                <div className="flex items-center justify-between border-b border-zinc-800 pb-3 mb-4">
                    <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                        <Users size={20} className="text-orange-400" /> Detalhes do Lead
                    </h2>
                    <button onClick={onClose} className="text-zinc-400 hover:text-white transition">
                        <XCircle size={20} />
                    </button>
                </div>
                
                <div className="space-y-4">
                    <div className="p-3 bg-zinc-950 rounded-lg border border-zinc-700">
                        <p className="text-xs text-zinc-400">Nome do Lead</p>
                        <p className="font-bold text-white text-lg">{lead.nome}</p>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div className="flex flex-col gap-1 p-3 bg-zinc-950 rounded-lg border border-zinc-700">
                            <p className="text-xs text-zinc-400 flex items-center gap-1"><Phone size={14} className="text-green-500" /> Telefone</p>
                            <p className="font-medium text-white">{lead.telefone}</p>
                        </div>
                        <div className="flex flex-col gap-1 p-3 bg-zinc-950 rounded-lg border border-zinc-700">
                            <p className="text-xs text-zinc-400 flex items-center gap-1"><Clock size={14} /> Registro</p>
                            <p className="font-medium text-white">{formatDate(lead.data_registro)}</p>
                        </div>
                    </div>
                    
                    <div className="flex flex-col gap-1 p-3 bg-zinc-950 rounded-lg border border-zinc-700">
                        <p className="text-xs text-zinc-400 flex items-center gap-1"><Layers size={14} className="text-orange-400" /> Curso de Interesse</p>
                        <p className="font-bold text-white">
                            {lead.curso_interesse} 
                            <span className="text-sm text-zinc-400"> ({lead.horario_interesse})</span>
                        </p>
                    </div>
                </div>

                <div className="flex justify-between items-center mt-6 pt-4 border-t border-zinc-800">
                    <button 
                        onClick={() => onMarkContatado(lead.id, !lead.contatado)}
                        className={`text-xs font-semibold px-4 py-2 rounded-lg transition-colors flex items-center gap-2 ${
                            lead.contatado 
                            ? 'bg-red-600/30 text-red-400 border border-red-600 hover:bg-red-600 hover:text-white' 
                            : 'bg-green-600/30 text-green-400 border border-green-600 hover:bg-green-600 hover:text-white'
                        }`}
                    >
                        {lead.contatado ? <XCircle size={16} /> : <CheckCircle size={16} />}
                        {lead.contatado ? 'Marcar como PENDENTE' : 'Marcar como CONTATADO'}
                    </button>
                    
                    <a
                        href={generateWhatsappLink()}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg text-sm font-medium flex items-center gap-2 transition-colors shadow-lg shadow-green-500/30"
                    >
                        <MessageCircle size={16} />
                        Enviar Mensagem
                    </a>
                </div>
            </motion.div>
        </div>,
        document.body
    );
}


// ------------------------
// PÁGINA PRINCIPAL ADMIN LEADS
// ------------------------

export default function AdminLeads() {
    const [leads, setLeads] = useState<Lead[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
    const navigate = useNavigate();

    useEffect(() => {
        loadLeads();
    }, []);

    const loadLeads = async (showToast = false) => {
        try {
            setLoading(true);
            const fetchedLeads = await leadService.getAll();
            setLeads(fetchedLeads);
            if (showToast) toast.success("Lista de leads atualizada.");
        } catch (error) {
            toast.error("Erro ao carregar lista de leads.");
            console.error(error);
        } finally {
            setLoading(false);
        }
    };
    
    const handleMarkContatado = async (id: string, status: boolean) => {
        try {
            await leadService.updateContatado(id, status);
            // Atualiza o estado local
            setLeads(prev => prev.map(lead => 
                lead.id === id ? { ...lead, contatado: status } : lead
            ));
            setSelectedLead(prev => prev ? { ...prev, contatado: status } : null);
            toast.success(`Lead marcado como ${status ? 'CONTATADO' : 'PENDENTE'}.`);
        } catch (error) {
            toast.error("Erro ao atualizar status do lead.");
            console.error(error);
        }
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center h-full text-zinc-300 gap-3">
                <Loader2 className="animate-spin text-orange-500" size={32} />
                <span className="text-sm">Carregando leads...</span>
            </div>
        );
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="space-y-6"
        >
            {/* Cabeçalho */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-green-500 to-green-700 flex items-center justify-center shadow-lg shadow-green-500/20">
                        <Users size={18} className="text-white" />
                    </div>
                    <div className="flex flex-col">
                        <h1 className="text-lg font-semibold text-white">Gerenciar Leads</h1>
                        <p className="text-xs text-zinc-400">
                            Lista de interessados que clicaram no link do WhatsApp.
                        </p>
                    </div>
                </div>

                <div className="flex flex-wrap gap-2 justify-end">
                    <button
                        type="button"
                        onClick={() => navigate("/")}
                        className="flex items-center gap-2 px-3 py-2 rounded-lg border border-zinc-700 text-xs text-zinc-200 hover:bg-zinc-800 transition-colors"
                    >
                        <ExternalLink size={14} />
                        Voltar ao site
                    </button>

                    <button
                        onClick={() => loadLeads(true)}
                        className="flex items-center gap-2 px-3 py-2 rounded-lg border border-zinc-700 text-xs text-zinc-200 hover:bg-zinc-800 transition-colors"
                    >
                        <Loader2 size={14} />
                        Atualizar Lista
                    </button>
                </div>
            </div>
            
            <hr className="border-zinc-800" />

            {/* Lista de Leads */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ staggerChildren: 0.05 }}
                className="space-y-3"
            >
                <div className="grid grid-cols-12 text-xs text-zinc-400 font-medium uppercase px-4 py-2 border-b border-zinc-800">
                    <span className="col-span-4">Nome</span>
                    <span className="col-span-3">Curso / Horário</span>
                    <span className="col-span-3">Registro</span>
                    <span className="col-span-2 text-center">Status</span>
                </div>
                
                <AnimatePresence>
                    {leads.length > 0 ? leads.map((lead) => (
                        <motion.div
                            key={lead.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, height: 0 }}
                            transition={{ duration: 0.2 }}
                            onClick={() => setSelectedLead(lead)}
                            className="grid grid-cols-12 items-center px-4 py-3 bg-zinc-900/80 border border-zinc-800 rounded-lg hover:bg-zinc-800/70 cursor-pointer transition-colors"
                        >
                            <span className="col-span-4 text-sm font-medium text-white truncate">
                                {lead.nome}
                            </span>
                            <span className="col-span-3 text-xs text-zinc-300 truncate">
                                {lead.curso_interesse}
                            </span>
                             <span className="col-span-3 text-xs text-zinc-400">
                                {new Date(lead.data_registro).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                            </span>
                            <div className="col-span-2 flex justify-center">
                                <span className={`text-[10px] font-bold px-2 py-1 rounded-full ${
                                    lead.contatado 
                                    ? 'bg-green-500/20 text-green-400' 
                                    : 'bg-orange-500/20 text-orange-400'
                                }`}>
                                    {lead.contatado ? 'Contatado' : 'Pendente'}
                                </span>
                            </div>
                        </motion.div>
                    )) : (
                        <div className="text-center py-10 bg-zinc-900/80 border border-zinc-800 rounded-lg text-zinc-500">
                            Nenhum novo lead registrado.
                        </div>
                    )}
                </AnimatePresence>
            </motion.div>

            {/* Modal de Detalhes */}
            <LeadModal 
                lead={selectedLead} 
                onClose={() => setSelectedLead(null)}
                onMarkContatado={handleMarkContatado}
            />
        </motion.div>
    );
}