import { useEffect, useState, useMemo, useCallback } from "react";
import { createPortal } from "react-dom"; 
import { Trash, Upload, Camera, RefreshCcw, MonitorPlay, Maximize, AlertTriangle, Globe, Trash2, Loader2, Calendar, Search, Filter, FileVideo } from "lucide-react"; 
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { Moment } from "../../types";
import { momentService, MomentEvent } from "../../services/momentService"; 
import { supabase } from "../../lib/supabaseClient"; 

const ACCENT_COLOR = "#F27A24"; 
const DARK_BACKGROUND = "#18181B"; 
const DARK_SHADE = "#27272A"; 
const TEXT_COLOR = "#FAFAFA"; 
const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20 MB - Ajuste conforme necessário
const BUCKET_NAME = "images"; 

// =========================================================================
// MODAL DE CONFIRMAÇÃO
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

// Opções para o Select de Upload
const uploadCategories = [
    { label: 'Selecione a Categoria', value: '' }, 
    { label: 'Eventos', value: 'eventos' },
    { label: 'Alunos', value: 'alunos' },
    { label: 'Estrutura', value: 'estrutura' },
    { label: 'Aulas', value: 'aulas' },
    { label: 'Comunidade', value: 'comunidade' },
];

// Opções para o Filtro (Inclui 'Todos')
const filterTabs = [
    { label: 'Todos', value: 'todos' },
    { label: 'Eventos', value: 'eventos' },
    { label: 'Alunos', value: 'alunos' },
    { label: 'Estrutura', value: 'estrutura' },
    { label: 'Aulas', value: 'aulas' },
    { label: 'Comunidade', value: 'comunidade' },
];

function StorageUsageBar({ used, total, percentage, isFull }: StorageState) {
    const formatSize = (sizeMB: number) => {
        if (sizeMB < 0.01 && sizeMB > 0) return "< 0.01 MB";
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
            <div className="flex flex-col sm:flex-row justify-between mb-1 text-zinc-400 gap-1">
                <span>Uso do armazenamento <span className="hidden sm:inline">- Limite de 50 MB</span></span>
                <span className="font-semibold">{percentage.toFixed(1)}% ({formatSize(used)} / {formatSize(total)})</span>
            </div>
            <div className="w-full bg-zinc-700 rounded-full h-2.5">
                <div 
                    className={`h-2.5 rounded-full transition-all duration-500 ${percentageColor}`} 
                    style={{ width: `${Math.min(percentage, 100)}%` }} 
                />
            </div>
            
            {isFull && (
                <div className="mt-3 p-2 bg-red-800/50 border border-red-700 rounded-md flex items-center gap-2 text-red-300">
                    <AlertTriangle size={16} className="flex-shrink-0" />
                    <span className="font-bold">ARMAZENAMENTO CHEIO!</span>
                </div>
            )}
            <p className="mt-2 text-yellow-400 leading-relaxed">
                DICA: Use links para mídias externas, pois não consomem espaço.
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

    // === ESTADOS PARA FILTROS E BUSCA ===
    const [searchTerm, setSearchTerm] = useState("");
    const [activeFilter, setActiveFilter] = useState("todos");

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

    // === LÓGICA DE FILTRAGEM ===
    const filteredMoments = useMemo(() => {
        return moments.filter(moment => {
            // 1. Filtro por Categoria
            const matchesCategory = activeFilter === 'todos' || moment.category === activeFilter;
            
            // 2. Filtro por Busca (Nome ou Descrição)
            const searchLower = searchTerm.toLowerCase();
            const matchesSearch = 
                moment.title.toLowerCase().includes(searchLower) || 
                moment.description.toLowerCase().includes(searchLower);

            return matchesCategory && matchesSearch;
        });
    }, [moments, activeFilter, searchTerm]);

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
            
            // Verifica se é imagem ou vídeo
            if (!file.type.startsWith('image/') && !file.type.startsWith('video/')) {
                 toast.error("Formato inválido. Apenas imagens e vídeos são permitidos.");
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
        let fileSize = 0; 
        
        if (uploadType === 'url') {
            finalType = 'video'; 
            finalSrc = newVideoUrl.trim();
            fileSize = 0; 
        }

        try {
            if (uploadType === 'file' && newFile) {
                fileSize = newFile.size;
                
                // DETECTA SE É VÍDEO
                if (newFile.type.startsWith('video/')) {
                    finalType = 'video';
                } else {
                    finalType = 'image';
                }

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
                size_bytes: fileSize,
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
    
    // --- FUNÇÃO DE DELETE REQUISITADA ---
    const requestDelete = (moment: MomentEvent) => {
        setMomentToDelete(moment);
    };

    // --- FUNÇÃO DE DELETE CORRIGIDA E ROBUSTA ---
    const handleConfirmDelete = async () => { 
        if (!momentToDelete) return;
        setIsDeleting(true);

        try {
            // 1. TENTA REMOVER DO STORAGE (Se for upload interno - imagem ou vídeo)
            // Verificamos se a URL pertence ao bucket do projeto
            if (momentToDelete.src && momentToDelete.src.includes(`/${BUCKET_NAME}/`)) {
                 try {
                    const parts = momentToDelete.src.split(`/${BUCKET_NAME}/`);
                    if (parts.length > 1) {
                        const storagePath = decodeURIComponent(parts[1]);
                        
                        const { error: storageError } = await supabase.storage
                            .from(BUCKET_NAME) 
                            .remove([storagePath]);

                        if (storageError) {
                            console.warn("Aviso: Falha ao remover do Storage (continuando com o DB):", storageError.message);
                        } else {
                            console.log("Arquivo deletado do Storage com sucesso.");
                        }
                    }
                } catch (e) {
                    console.error("Erro ao processar URL para exclusão no Storage:", e);
                }
            }
            
            // 2. Remove do Banco
            await momentService.remove(momentToDelete.id);
            
            setMoments(prev => prev.filter(m => m.id !== momentToDelete.id));
            fetchStorageUsage(); 
            toast.success("Momento removido.");

        } catch (error) {
            console.error(error);
            toast.error("Falha ao remover momento.");
        } finally {
            setIsDeleting(false);
            setMomentToDelete(null); 
        }
    };


    return (
        <div className={`space-y-6 p-4 md:p-8 bg-[${DARK_BACKGROUND}] rounded-xl text-[${TEXT_COLOR}]`}>
            {/* Título e cabeçalho */}
            <div className="flex items-center gap-3 mb-6">
                <div 
                    className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-md`}
                    style={{ background: `linear-gradient(to right, ${ACCENT_COLOR}, #d66a1f)` }}
                >
                    <Camera size={20} className="text-white" />
                </div>
                <div>
                    <h1 className={`text-xl font-bold`} style={{ color: TEXT_COLOR }}>Gerenciar Galeria</h1>
                    <span className="text-sm text-zinc-400">{moments.length} momento(s) na galeria</span>
                </div>
            </div>

            {/* === 1. CONTROLE DE SELEÇÃO INICIAL DE MÍDIA === */}
            <div className={`p-4 rounded-xl bg-[${DARK_SHADE}] border border-zinc-700 space-y-4`}>
                <h2 className="text-base font-bold text-zinc-300 flex items-center gap-2">
                    <Upload size={16} style={{ color: ACCENT_COLOR }} /> 1. Escolha o tipo de Mídia
                </h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <button
                        onClick={() => handleSetUploadType('file')}
                        className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg text-sm font-semibold transition-colors ${uploadType === 'file' ? `bg-[${ACCENT_COLOR}] text-white` : 'bg-zinc-700 text-zinc-200 hover:bg-zinc-600'}`}
                        disabled={storageUsage.isFull}
                    >
                        <Maximize size={16} /> Upload Arquivo (Foto/Vídeo)
                    </button>
                    <button
                        onClick={() => handleSetUploadType('url')}
                        className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg text-sm font-semibold transition-colors ${uploadType === 'url' ? `bg-[${ACCENT_COLOR}] text-white` : 'bg-zinc-700 text-zinc-200 hover:bg-zinc-600'}`}
                    >
                        <Globe size={16} /> Mídia Externa (Link)
                    </button>
                </div>
                
                <div className="pt-2 border-t border-zinc-700">
                    {uploadType === 'file' ? (
                        <div className="flex flex-col gap-1">
                            <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wide">
                                {newFile ? 'Arquivo selecionado' : 'Selecione Foto ou Vídeo (Obrigatório)'}
                            </label>
                            <input
                                type="file"
                                id="file-input"
                                accept="image/*,video/mp4,video/webm,video/quicktime" 
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
                                URL da Postagem (Obrigatório)
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

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                                {uploadCategories.map(cat => (
                                    <option key={cat.value} value={cat.value} disabled={cat.value === ''}>
                                        {cat.label}
                                    </option>
                                ))}
                            </select>
                            {errorCategory && <p className="text-xs text-red-400 mt-1 flex items-center gap-1"><AlertTriangle size={12} /> A categoria é obrigatória.</p>}
                        </div>

                        <div className="flex flex-col gap-1">
                            <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wide">Data (Obrigatório)</label>
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

            {/* === LISTA DE MOMENTOS (COM FILTROS) === */}
            <div className={`p-4 rounded-xl bg-[${DARK_SHADE}] border border-zinc-700`}>
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                    <h2 className="text-base font-bold text-zinc-300 flex items-center gap-2">
                        Galeria Atual
                        <button
                            onClick={() => loadMoments(true)}
                            className="ml-2 flex items-center gap-1 text-xs font-normal text-zinc-500 hover:text-white transition-colors"
                            disabled={loading}
                        >
                            <RefreshCcw size={12} /> Recarregar
                        </button>
                    </h2>
                    
                    {/* BARRA DE FILTRO E BUSCA */}
                    <div className="w-full md:w-auto flex flex-col sm:flex-row gap-3">
                        {/* Busca */}
                        <div className="relative group">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 group-focus-within:text-orange-500 transition-colors" size={16} />
                            <input 
                                type="text" 
                                placeholder="Buscar por nome..." 
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full sm:w-64 bg-zinc-900/50 border border-zinc-700 rounded-lg pl-9 pr-4 py-2 text-sm text-zinc-200 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500/50 transition-all placeholder:text-zinc-600"
                            />
                        </div>

                        {/* Filtro Dropdown Mobile / Pills Desktop (Simplificado para scroll horizontal no mobile) */}
                        <div className="flex overflow-x-auto pb-2 sm:pb-0 gap-2 no-scrollbar mask-gradient">
                            {filterTabs.map((tab) => (
                                <button
                                    key={tab.value}
                                    onClick={() => setActiveFilter(tab.value)}
                                    className={`
                                        whitespace-nowrap px-3 py-1.5 rounded-full text-xs font-medium border transition-all
                                        ${activeFilter === tab.value 
                                            ? 'bg-orange-600 border-orange-500 text-white shadow-lg shadow-orange-900/20' 
                                            : 'bg-zinc-800 border-zinc-700 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-700'}
                                    `}
                                >
                                    {tab.label}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {loading && <p className="text-center text-zinc-500 py-4 flex items-center justify-center gap-2"><Loader2 className="animate-spin" size={16}/> Carregando fotos...</p>}

                {!loading && filteredMoments.length === 0 && (
                    <div className="text-center py-12 border-2 border-dashed border-zinc-800 rounded-xl bg-zinc-900/30">
                        <Filter className="mx-auto text-zinc-600 mb-2" size={32} />
                        <p className="text-zinc-400 font-medium">Nenhum momento encontrado.</p>
                        <p className="text-zinc-600 text-xs mt-1">Tente mudar os filtros ou adicione uma nova foto.</p>
                    </div>
                )}

                {!loading && filteredMoments.length > 0 && (
                    <>
                        {/* MODO MOBILE (LAYOUT CORRIGIDO E EMPILHADO) */}
                        <div className="md:hidden space-y-4">
                            {filteredMoments.map((moment) => (
                                <div key={moment.id} className="bg-zinc-900 border border-zinc-800 rounded-lg overflow-hidden flex flex-col">
                                    <div className="relative aspect-video w-full bg-zinc-950">
                                         {moment.type === 'image' ? (
                                            <img 
                                                src={moment.src} 
                                                alt={moment.title} 
                                                className="w-full h-full object-cover"
                                                loading="lazy"
                                            />
                                         ) : (
                                            <div className="w-full h-full flex items-center justify-center text-white/50 bg-black/40">
                                                <div className="flex flex-col items-center gap-1">
                                                    <FileVideo size={32} />
                                                    <span className="text-[10px]">VÍDEO</span>
                                                </div>
                                            </div>
                                         )}
                                        <div className="absolute top-2 right-2 bg-black/60 text-white text-[10px] px-2 py-0.5 rounded capitalize">
                                            {moment.category}
                                        </div>
                                    </div>
                                    
                                    <div className="p-3 flex flex-col gap-2">
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <h3 className="font-bold text-white text-sm">{moment.title}</h3>
                                                <p className="text-xs text-zinc-400 mt-0.5 flex items-center gap-1">
                                                    <Calendar size={10} />
                                                    {moment.event_date ? new Date(moment.event_date).toLocaleDateString('pt-BR', {timeZone: 'UTC'}) : 'N/A'}
                                                </p>
                                            </div>
                                        </div>
                                        <p className="text-xs text-zinc-500 line-clamp-2">{moment.description}</p>
                                        
                                        <button 
                                            onClick={() => requestDelete(moment)}
                                            className="mt-2 w-full py-2 bg-red-900/20 text-red-400 border border-red-900/50 rounded flex items-center justify-center gap-2 text-xs font-semibold active:bg-red-900/40"
                                        >
                                            <Trash2 size={14} /> Excluir
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* MODO DESKTOP */}
                        <div className="hidden md:grid grid-cols-3 lg:grid-cols-5 gap-4">
                            <AnimatePresence>
                                {filteredMoments.map((moment) => (
                                    <motion.div
                                        key={moment.id}
                                        layout // Adiciona animação suave ao filtrar
                                        initial={{ opacity: 0, scale: 0.9 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        exit={{ opacity: 0, scale: 0.9 }}
                                        transition={{ duration: 0.2 }}
                                        className="relative group aspect-square rounded-lg overflow-hidden border border-zinc-700 bg-zinc-900"
                                    >
                                        {moment.type === 'image' ? (
                                            <img 
                                                src={moment.src} 
                                                alt={moment.title} 
                                                className="w-full h-full object-cover"
                                                loading="lazy"
                                            />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-white/50 bg-zinc-900">
                                                 <div className="flex flex-col items-center gap-2">
                                                    <FileVideo size={40} className="opacity-50" />
                                                </div>
                                            </div>
                                        )}

                                        <div className="absolute inset-0 bg-black/80 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-between p-3">
                                            <div className="flex justify-between items-start">
                                                <span className="bg-orange-600 text-white text-[10px] px-1.5 py-0.5 rounded uppercase font-bold tracking-wider">
                                                    {moment.category}
                                                </span>
                                                <button
                                                    onClick={() => requestDelete(moment)}
                                                    className="p-1.5 bg-red-600 rounded-full text-white hover:bg-red-700 transition shadow-lg"
                                                    title="Excluir"
                                                >
                                                    <Trash size={14} />
                                                </button>
                                            </div>
                                            
                                            <div className="text-white text-xs">
                                                <p className="font-bold truncate text-sm mb-1">{moment.title}</p>
                                                <p className="text-zinc-300 text-[10px] line-clamp-2 leading-relaxed">{moment.description}</p>
                                                <p className="text-zinc-500 text-[10px] mt-2 flex items-center gap-1">
                                                    <Calendar size={10} />
                                                    {moment.event_date ? new Date(moment.event_date).toLocaleDateString('pt-BR', {timeZone: 'UTC'}) : 'N/A'}
                                                </p>
                                            </div>
                                        </div>
                                    </motion.div>
                                ))}
                            </AnimatePresence>
                        </div>
                    </>
                )}
            </div>

            <DeleteModal 
                open={!!momentToDelete}
                title="Excluir Momento"
                description="Tem certeza que deseja remover este momento? O arquivo será permanentemente apagado do servidor."
                onCancel={() => setMomentToDelete(null)}
                onConfirm={handleConfirmDelete}
                isLoading={isDeleting}
            />
        </div>
    );
}