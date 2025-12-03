// src/pages/admin/AdminMoments.tsx

import { useEffect, useState, useMemo, useCallback } from "react";
import { createPortal } from "react-dom"; // Import necessário para a Modal
import { Trash, Upload, Camera, RefreshCcw, MonitorPlay, Maximize, AlertTriangle, Globe, Trash2, Loader2 } from "lucide-react"; 
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { Moment } from "../../types";
import { momentService, MomentEvent } from "../../services/momentService"; 
import { supabase } from "../../lib/supabaseClient"; 

const ACCENT_COLOR = "#E45B25"; 
const DARK_BACKGROUND = "#18181B"; 
const DARK_SHADE = "#27272A"; 
const TEXT_COLOR = "#FAFAFA"; 
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB
const BUCKET_NAME = "images"; 

// =========================================================================
// MODAL DE CONFIRMAÇÃO (IDÊNTICA AO CÓDIGO FORNECIDO)
// =========================================================================
interface ConfirmModalProps {
  open: boolean;
  title: string;
  description: string;
  onCancel: () => void;
  onConfirm: () => void;
  isLoading?: boolean;
}

function DeleteModal({ open, title, description, onCancel, onConfirm, isLoading }: ConfirmModalProps) {
  if (!open) return null;

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onCancel}
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        className="relative bg-zinc-900 border border-zinc-700 rounded-xl p-6 w-full max-w-sm shadow-2xl z-10"
      >
        <div className="flex flex-col items-center text-center gap-4">
          <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center text-red-500">
            <Trash2 size={24} />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-white">{title}</h2>
            <p className="text-sm text-zinc-400 mt-1 leading-relaxed">{description}</p>
          </div>
          <div className="flex gap-3 w-full mt-2">
            <button
              onClick={onCancel}
              disabled={isLoading}
              className="flex-1 px-4 py-2.5 rounded-lg border border-zinc-700 text-sm font-medium text-zinc-300 hover:bg-zinc-800 transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={onConfirm}
              disabled={isLoading}
              className="flex-1 px-4 py-2.5 rounded-lg bg-red-600 hover:bg-red-700 text-sm font-medium text-white shadow-lg shadow-red-900/20 transition-all flex items-center justify-center gap-2"
            >
              {isLoading ? <Loader2 size={16} className="animate-spin" /> : 'Excluir'}
            </button>
          </div>
        </div>
      </motion.div>
    </div>,
    document.body
  );
}

// -------------------------------------------------------------
// COMPONENTES AUXILIARES (STORAGE BAR)
// -------------------------------------------------------------

interface StorageState {
    total: number;
    used: number; // Em MB
    percentage: number;
    isFull: boolean;
}

const categories = [
    { label: 'Selecione a Categoria', value: '' }, 
    { label: 'Eventos', value: 'eventos' },
    { label: 'Alunos', value: 'alunos' },
    { label: 'Estrutura', value: 'estrutura' },
    { label: 'Aulas', value: 'aulas' },
    { label: 'Comunidade', value: 'comunidade' },
];

function StorageUsageBar({ used, total, percentage, isFull }: StorageState) {
    const formatSize = (sizeMB: number) => {
        if (sizeMB > 1000) return `${(sizeMB / 1024).toFixed(2)} GB`;
        return `${sizeMB.toFixed(2)} MB`;
    };

    const percentageColor = useMemo(() => {
        if (percentage >= 95) return 'bg-red-600';
        if (percentage >= 50) return 'bg-yellow-500';
        return 'bg-green-500';
    }, [percentage]);

    return (
        <div className="mt-4 p-4 bg-zinc-800 rounded-lg text-xs">
            <div className="flex justify-between mb-1 text-zinc-400">
                <span>Uso do Storage (Imagens) - Limite de 50 MB para uploads diretos (Simulação)</span>
                <span className="font-semibold">{percentage.toFixed(1)}%</span>
            </div>
            <div className="w-full bg-zinc-700 rounded-full h-2.5">
                <div 
                    className={`h-2.5 rounded-full transition-all duration-500 ${percentageColor}`} 
                    style={{ width: `${Math.min(percentage, 100)}%` }} 
                />
            </div>
            <p className="text-right text-zinc-500 mt-1">
                {formatSize(used)} / {formatSize(total)}
            </p>
            
            {isFull && (
                <div className="mt-3 p-2 bg-red-800/50 border border-red-700 rounded-md flex items-center gap-2 text-red-300">
                    <AlertTriangle size={16} />
                    <span className="font-bold">ARMAZENAMENTO CHEIO! Uploads de arquivos bloqueados.</span>
                </div>
            )}
            <p className="mt-2 text-yellow-400">
                **DICA:** Use YouTube/Vimeo/Instagram para mídias externas (URL), pois não consomem seu espaço no Supabase.
            </p>
        </div>
    );
}

// -------------------------------------------------------------
// COMPONENTE PRINCIPAL
// -------------------------------------------------------------

export default function AdminMoments() {
    const [moments, setMoments] = useState<MomentEvent[]>([]); 
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    
    // Estados do Formulário
    const [newTitle, setNewTitle] = useState("");
    const [newDescription, setNewDescription] = useState("");
    const [newCategory, setNewCategory] = useState<Moment['category'] | ''>(""); 
    const [newDate, setNewDate] = useState(""); 
    const [newFile, setNewFile] = useState<File | null>(null);
    const [newVideoUrl, setNewVideoUrl] = useState(""); 
    const [uploadType, setUploadType] = useState<'file' | 'url'>('file');

    // Estados de erro para validação visual
    const [errorTitle, setErrorTitle] = useState(false);
    const [errorDescription, setErrorDescription] = useState(false);
    const [errorCategory, setErrorCategory] = useState(false);
    const [errorDate, setErrorDate] = useState(false); 
    const [errorFileOrUrl, setErrorFileOrUrl] = useState(false);

    // Estado de uso do Storage
    const [storageUsage, setStorageUsage] = useState<StorageState>({ total: 0, used: 0, percentage: 0, isFull: false });

    // === ESTADOS PARA O DELETE MODAL ===
    const [momentToDelete, setMomentToDelete] = useState<MomentEvent | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    // --- FUNÇÕES DE LOAD E UPDATE ---
    
    const fetchStorageUsage = useCallback(async () => {
        try {
            const usage = await momentService.getStorageUsage();
            setStorageUsage(usage);
        } catch (e) {
            console.error("Erro ao carregar uso do storage:", e);
        }
    }, []);

    const loadMoments = useCallback(async (showToast = false) => {
        setLoading(true);
        try {
            const data = await momentService.getAll(); 
            setMoments(data); 
            if (showToast) toast.success("Galeria atualizada.");
        } catch (error) {
            console.error("Erro ao carregar galeria:", error);
            toast.error("Erro ao carregar galeria.");
            setMoments([]); 
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { 
        loadMoments(); 
        fetchStorageUsage(); 
    }, [loadMoments, fetchStorageUsage]);


    // Helper para checar validação
    const isFormValid = useMemo(() => {
        return newTitle.trim() && newDescription.trim() && newCategory && newDate;
    }, [newTitle, newDescription, newCategory, newDate]);

    // Helper para checar se o upload pode ser feito
    const canUpload = useMemo(() => {
        const mediaSelected = (uploadType === 'file' && newFile) || (uploadType === 'url' && newVideoUrl.trim());
        
        if (uploadType === 'file' && storageUsage.isFull) {
            return false;
        }

        return isFormValid && mediaSelected;
    }, [isFormValid, uploadType, newFile, newVideoUrl, storageUsage.isFull]);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];

        if (storageUsage.isFull && file) {
            toast.error("Armazenamento cheio! Não é possível fazer upload de arquivos.");
            e.target.value = '';
            setNewFile(null);
            return;
        }

        if (file) {
            if (file.size > MAX_FILE_SIZE) {
                toast.error(`Arquivo muito grande! O limite de upload direto é ${MAX_FILE_SIZE / 1024 / 1024}MB.`);
                setNewFile(null);
                e.target.value = '';
                return;
            }
            
            setNewFile(file);
            setNewVideoUrl('');
            setErrorFileOrUrl(false);
        } else {
            setNewFile(null);
        }
    };
    
    // Reset dos erros de validação
    useEffect(() => { setErrorTitle(!newTitle.trim() && errorTitle); }, [newTitle, errorTitle]);
    useEffect(() => { setErrorDescription(!newDescription.trim() && errorDescription); }, [newDescription, errorDescription]);
    useEffect(() => { setErrorCategory(!newCategory && errorCategory); }, [newCategory, errorCategory]);
    useEffect(() => { setErrorDate(!newDate && errorDate); }, [newDate, errorDate]);

    const handleSetUploadType = (type: 'file' | 'url') => {
        setUploadType(type);
        setNewFile(null);
        setNewVideoUrl('');
        setErrorFileOrUrl(false);
    };


    const handleUpload = async () => {
        const isTitleValid = !!newTitle.trim();
        const isDescriptionValid = !!newDescription.trim();
        const isCategoryValid = !!newCategory;
        const isDateValid = !!newDate; 
        const isMediaValid = (uploadType === 'file' && newFile) || (uploadType === 'url' && newVideoUrl.trim());

        if (!isTitleValid || !isDescriptionValid || !isCategoryValid || !isDateValid || !isMediaValid) {
            setErrorTitle(!isTitleValid);
            setErrorDescription(!isDescriptionValid);
            setErrorCategory(!isCategoryValid);
            setErrorDate(!isDateValid); 
            setErrorFileOrUrl(!isMediaValid);
            toast.error("Preencha todos os campos obrigatórios e selecione a mídia.");
            return;
        }

        setUploading(true);
        let finalSrc = "";
        let finalType: Moment['type'] = uploadType === 'url' ? 'video' : 'image';
        
        if (uploadType === 'url') {
            finalType = 'video'; 
            finalSrc = newVideoUrl.trim();
        }

        try {
            if (uploadType === 'file' && newFile) {
                const fileExt = newFile.name.split('.').pop();
                const cleanName = newFile.name.replace(/[^a-zA-Z0-9]/g, '_');
                const fileName = `${Date.now()}_${cleanName}.${fileExt}`;
                const filePath = `momentos/${fileName}`;
                
                const { error: uploadError } = await supabase.storage
                    .from(BUCKET_NAME) 
                    .upload(filePath, newFile, { cacheControl: '3600', upsert: false });

                if (uploadError) throw new Error(`Falha no Upload: ${uploadError.message}`);

                const { data: publicUrlData } = supabase.storage
                    .from(BUCKET_NAME)
                    .getPublicUrl(filePath);
                
                finalSrc = publicUrlData.publicUrl;
            }

            const newMoment = await momentService.create({ 
                title: newTitle.trim(), 
                description: newDescription.trim(),
                category: newCategory as Moment['category'], 
                type: finalType,
                src: finalSrc,
                event_date: newDate, 
            }); 

            setMoments(prev => [newMoment, ...prev]);
            setNewTitle("");
            setNewDescription("");
            setNewCategory("");
            setNewDate(""); 
            setNewFile(null);
            setNewVideoUrl("");
            setErrorFileOrUrl(false);
            setUploadType('file');
            
            const fileInput = document.getElementById('file-input') as HTMLInputElement;
            if (fileInput) fileInput.value = ''; 
            
            fetchStorageUsage(); 
            toast.success("Momento adicionado com sucesso!");

        } catch (error: any) {
            console.error("Erro no upload ou banco:", error.message);
            toast.error(error.message || "Falha ao adicionar momento.");
        } finally {
            setUploading(false);
        }
    };
    
    // --- FUNÇÃO DE DELETE CORRIGIDA COM MODAL ---
    const requestDelete = (moment: MomentEvent) => {
        setMomentToDelete(moment);
    };

    const handleConfirmDelete = async () => { 
        if (!momentToDelete) return;
        setIsDeleting(true);

        let storagePath = null;

        // Tenta obter caminho do storage se for imagem
        if (momentToDelete.type === 'image' && momentToDelete.src) {
             try {
                if (momentToDelete.src.includes(`/storage/v1/object/public/${BUCKET_NAME}/`)) {
                    const parts = momentToDelete.src.split(`/${BUCKET_NAME}/`);
                    if (parts.length > 1) {
                        storagePath = decodeURIComponent(parts[1]);
                    }
                }
            } catch (e) {
                console.error("Erro ao analisar URL para exclusão:", e);
                storagePath = null;
            }
        }

        // 1. Remove do Storage
        if (storagePath) { 
             try {
                const { error: storageError } = await supabase.storage
                    .from(BUCKET_NAME) 
                    .remove([storagePath]);

                if (storageError) {
                    console.warn("Aviso: Falha ao remover arquivo do Storage:", storageError.message);
                }
             } catch (e) {
                console.error("Erro no Supabase Storage durante a remoção:", e);
             }
        }
        
        try {
            // 2. Remove do Banco
            await momentService.remove(momentToDelete.id);
            
            setMoments(prev => prev.filter(m => m.id !== momentToDelete.id));
            fetchStorageUsage(); 
            toast.success("Momento removido.");
        } catch (error) {
            toast.error("Falha ao remover momento do banco de dados.");
        } finally {
            setIsDeleting(false);
            setMomentToDelete(null); // Fecha o modal
        }
    };


    return (
        <div className={`space-y-6 p-6 md:p-8 bg-[${DARK_BACKGROUND}] rounded-xl text-[${TEXT_COLOR}]`}>
            {/* Título e cabeçalho */}
            <div className="flex items-center gap-3 mb-6">
                <div 
                    className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-md`}
                    style={{ background: `linear-gradient(to right, ${ACCENT_COLOR}, #d66a1f)` }}
                >
                    <Camera size={20} className="text-white" />
                </div>
                <div>
                    <h1 className={`text-xl font-bold`} style={{ color: TEXT_COLOR }}>Gerenciar Galeria de Momentos</h1>
                    <span className="text-sm text-zinc-400">{moments.length} foto(s) na galeria</span>
                </div>
            </div>

            {/* === 1. CONTROLE DE SELEÇÃO INICIAL DE MÍDIA === */}
            <div className={`p-4 rounded-xl bg-[${DARK_SHADE}] border border-zinc-700 space-y-4`}>
                <h2 className="text-base font-bold text-zinc-300 flex items-center gap-2">
                    <Upload size={16} style={{ color: ACCENT_COLOR }} /> 1. Escolha o tipo de Mídia
                </h2>
                
                <div className="grid md:grid-cols-2 gap-4">
                    <button
                        onClick={() => handleSetUploadType('file')}
                        className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg text-sm font-semibold transition-colors ${uploadType === 'file' ? `bg-[${ACCENT_COLOR}] text-white` : 'bg-zinc-700 text-zinc-200 hover:bg-zinc-600'}`}
                        disabled={storageUsage.isFull}
                    >
                        <Maximize size={16} /> Upload de Imagem (max 5MB)
                    </button>
                    <button
                        onClick={() => handleSetUploadType('url')}
                        className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg text-sm font-semibold transition-colors ${uploadType === 'url' ? `bg-[${ACCENT_COLOR}] text-white` : 'bg-zinc-700 text-zinc-200 hover:bg-zinc-600'}`}
                    >
                        <Globe size={16} /> Mídia Externa (Link da Postagem)
                    </button>
                </div>
                
                <div className="pt-2 border-t border-zinc-700">
                    {uploadType === 'file' ? (
                        <div className="flex flex-col gap-1">
                            <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wide">
                                {newFile ? 'Arquivo selecionado' : 'Selecione a Imagem (Obrigatório)'}
                            </label>
                            <input
                                type="file"
                                id="file-input"
                                accept="image/*" 
                                onChange={handleFileChange}
                                disabled={storageUsage.isFull}
                                className={`w-full text-sm text-[${TEXT_COLOR}] file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-zinc-700 file:text-white hover:file:bg-zinc-600 ${storageUsage.isFull ? 'cursor-not-allowed' : ''}`}
                            />
                            {newFile && <span className="text-xs text-zinc-500 truncate">{newFile.name}</span>}
                            {errorFileOrUrl && uploadType === 'file' && (
                                <p className="text-xs text-red-400 mt-1 flex items-center gap-1"><AlertTriangle size={12} /> É obrigatório selecionar um arquivo.</p>
                            )}
                        </div>
                    ) : (
                        <div className="flex flex-col gap-1">
                            <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wide">
                                URL da Postagem (Instagram/YouTube) (Obrigatório)
                            </label>
                            <input
                                type="url"
                                value={newVideoUrl}
                                onChange={(e) => setNewVideoUrl(e.target.value)}
                                className={`px-3 py-2 rounded-lg border text-sm text-[${TEXT_COLOR}] border-zinc-700 bg-zinc-900/60 focus:ring-2 focus:ring-[${ACCENT_COLOR}] ${errorFileOrUrl ? 'border-red-500' : ''}`}
                                placeholder="Ex: https://www.instagram.com/p/..."
                            />
                            {errorFileOrUrl && uploadType === 'url' && (
                                <p className="text-xs text-red-400 mt-1 flex items-center gap-1"><AlertTriangle size={12} /> É obrigatório informar a URL da postagem.</p>
                            )}
                            <p className="text-xs text-zinc-500 mt-1">
                                **Dica:** Insira o link da postagem (ex: instagram.com/p/...), e não um código iframe.
                            </p>
                        </div>
                    )}
                </div>
            </div>

            {/* === 2. FORMULÁRIO DE METADADOS === */}
            <AnimatePresence>
            { (newFile || newVideoUrl.trim()) && (
                <motion.div
                    key="metadata-form"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.3 }}
                    className={`p-4 rounded-xl bg-[${DARK_SHADE}] border border-zinc-700 space-y-4 overflow-hidden`}
                >
                    <h2 className="text-base font-bold text-zinc-300 flex items-center gap-2">
                        <Camera size={16} style={{ color: ACCENT_COLOR }} /> 2. Informações do Momento
                    </h2>

                    <div className="grid md:grid-cols-3 gap-4">
                        <div className="flex flex-col gap-1">
                            <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wide">Título (Obrigatório)</label>
                            <input
                                type="text"
                                value={newTitle}
                                onChange={(e) => setNewTitle(e.target.value)}
                                className={`px-3 py-2 rounded-lg border text-sm text-[${TEXT_COLOR}] border-zinc-700 bg-zinc-900/60 focus:ring-2 focus:ring-[${ACCENT_COLOR}] ${errorTitle ? 'border-red-500' : ''}`}
                                placeholder="Ex: Formatura Turma 2024"
                            />
                            {errorTitle && <p className="text-xs text-red-400 mt-1 flex items-center gap-1"><AlertTriangle size={12} /> O título é obrigatório.</p>}
                        </div>

                        <div className="flex flex-col gap-1">
                            <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wide">Categoria (Obrigatório)</label>
                            <select
                                value={newCategory}
                                onChange={(e) => setNewCategory(e.target.value as Moment['category'])}
                                className={`px-3 py-2 rounded-lg border text-sm text-[${TEXT_COLOR}] border-zinc-700 bg-zinc-900/60 focus:ring-2 focus:ring-[${ACCENT_COLOR}] appearance-none cursor-pointer ${errorCategory ? 'border-red-500' : ''}`}
                            >
                                {categories.map(cat => (
                                    <option key={cat.value} value={cat.value} disabled={cat.value === ''}>
                                        {cat.label}
                                    </option>
                                ))}
                            </select>
                            {errorCategory && <p className="text-xs text-red-400 mt-1 flex items-center gap-1"><AlertTriangle size={12} /> A categoria é obrigatória.</p>}
                        </div>

                        <div className="flex flex-col gap-1">
                            <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wide">Data do Evento (Obrigatório)</label>
                            <input
                                type="date"
                                value={newDate}
                                onChange={(e) => setNewDate(e.target.value)}
                                className={`px-3 py-2 rounded-lg border text-sm text-[${TEXT_COLOR}] border-zinc-700 bg-zinc-900/60 focus:ring-2 focus:ring-[${ACCENT_COLOR}] ${errorDate ? 'border-red-500' : ''}`}
                            />
                            {errorDate && <p className="text-xs text-red-400 mt-1 flex items-center gap-1"><AlertTriangle size={12} /> A data é obrigatória.</p>}
                        </div>
                    </div>

                    <div className="flex flex-col gap-1">
                        <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wide">Descrição Detalhada (Obrigatório, Máx. 100 caracteres)</label>
                        <textarea
                            value={newDescription}
                            onChange={(e) => setNewDescription(e.target.value)}
                            className={`px-3 py-2 rounded-lg border text-sm text-[${TEXT_COLOR}] border-zinc-700 bg-zinc-900/60 focus:ring-2 focus:ring-[${ACCENT_COLOR}] resize-none h-20 ${errorDescription ? 'border-red-500' : ''}`}
                            placeholder="Descreva o que está acontecendo na foto/vídeo."
                            maxLength={100}
                        />
                        {errorDescription && <p className="text-xs text-red-400 mt-1 flex items-center gap-1"><AlertTriangle size={12} /> A descrição é obrigatória.</p>}
                    </div>

                    <div className="pt-2">
                        <button
                            onClick={handleUpload}
                            disabled={!canUpload || uploading}
                            className={`w-full py-3 rounded-lg text-lg text-white font-bold flex items-center justify-center gap-2 disabled:opacity-60 transition-colors hover:bg-[#d66a1f]`}
                            style={{ backgroundColor: ACCENT_COLOR }}
                        >
                            {uploading ? "Salvando Momento..." : <><Upload size={20} /> FINALIZAR UPLOAD</>}
                        </button>
                    </div>
                </motion.div>
            )}
            </AnimatePresence>

            {/* === BARRA DE USO DO STORAGE === */}
            <StorageUsageBar 
                used={storageUsage.used} 
                total={storageUsage.total} 
                percentage={storageUsage.percentage} 
                isFull={storageUsage.isFull}
            />

            {/* === LISTA DE MOMENTOS === */}
            <div className={`p-4 rounded-xl bg-[${DARK_SHADE}] border border-zinc-700`}>
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-base font-bold text-zinc-300">Fotos Atuais</h2>
                    <button
                        onClick={() => loadMoments(true)}
                        className="flex items-center gap-1 text-xs text-zinc-400 hover:text-white transition-colors"
                        disabled={loading}
                    >
                        <RefreshCcw size={14} /> Recarregar
                    </button>
                </div>

                {loading && <p className="text-center text-zinc-500 py-4">Carregando fotos...</p>}

                {!loading && moments.length > 0 && (
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
                        <AnimatePresence>
                            {moments.map((moment) => (
                                <motion.div
                                    key={moment.id}
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.9 }}
                                    transition={{ duration: 0.2 }}
                                    className="relative group aspect-square rounded-lg overflow-hidden border border-zinc-700"
                                >
                                    {moment.type === 'image' ? (
                                        <img 
                                            src={moment.src} 
                                            alt={moment.title} 
                                            className="w-full h-full object-cover"
                                            loading="lazy"
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center bg-gray-900 text-white/50">
                                            <MonitorPlay size={32} />
                                        </div>
                                    )}

                                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-between p-2">
                                        <button
                                            onClick={() => requestDelete(moment)}
                                            className="self-end p-1 bg-red-600 rounded-full text-white hover:bg-red-700 transition"
                                            title="Excluir Foto"
                                        >
                                            <Trash size={14} />
                                        </button>
                                        <div className="text-white text-xs">
                                            <p className="font-bold truncate">{moment.title}</p>
                                            <p className="text-zinc-300 text-[10px]">{moment.description}</p>
                                            <p className="text-zinc-400 text-[10px] mt-1">
                                                Data: {moment.event_date ? new Date(moment.event_date).toLocaleDateString('pt-BR', {timeZone: 'UTC'}) : 'N/A'}
                                            </p>
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </div>
                )}
                {!loading && moments.length === 0 && (
                    <p className="text-center text-zinc-500 py-4">Nenhuma foto na galeria.</p>
                )}
            </div>

            {/* === RENDERIZAÇÃO DA MODAL NO FIM DA PÁGINA === */}
            <DeleteModal 
                open={!!momentToDelete}
                title="Excluir Momento"
                description="Tem certeza que deseja remover este momento? Ele deixará de aparecer no site imediatamente."
                onCancel={() => setMomentToDelete(null)}
                onConfirm={handleConfirmDelete}
                isLoading={isDeleting}
            />
        </div>
    );
}