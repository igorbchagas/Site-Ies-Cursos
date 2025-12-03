import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from "react-dom";
import { 
  Trash2, 
  Eye, 
  EyeOff, 
  Plus, 
  Loader2, 
  Image as ImageIcon, 
  GripVertical, 
  Zap,
  Smartphone,
  Monitor,
  X,
  Upload,
  Check
} from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';
import { bannerService } from '../../services/bannerService';
import { Banner } from '../../types';
import { toast } from 'sonner';
import { motion, AnimatePresence, Reorder } from 'framer-motion';

// --- Variável Global para o Storage ---
const BUCKET_NAME = 'banners'; 

// ==========================================
// COMPONENTES AUXILIARES (MODAIS)
// ==========================================

// --- 1. MODAL DE CONFIRMAÇÃO DE EXCLUSÃO ---
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
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onCancel} />
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="relative bg-zinc-900 border border-zinc-700 rounded-xl p-6 w-full max-w-sm shadow-2xl z-10"
      >
        <div className="flex flex-col items-center text-center gap-4">
          <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center text-red-500">
            <Trash2 size={24} />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-white">{title}</h2>
            <p className="text-sm text-zinc-400 mt-1">{description}</p>
          </div>
          <div className="flex gap-3 w-full mt-2">
            <button onClick={onCancel} disabled={isLoading} className="flex-1 px-4 py-2 rounded-lg border border-zinc-700 text-zinc-300 hover:bg-zinc-800 transition-colors">Cancelar</button>
            <button onClick={onConfirm} disabled={isLoading} className="flex-1 px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white flex items-center justify-center gap-2">
              {isLoading ? <Loader2 size={16} className="animate-spin" /> : 'Excluir'}
            </button>
          </div>
        </div>
      </motion.div>
    </div>,
    document.body
  );
}

// --- 2. MODAL DE CRIAÇÃO (ADD BANNER) ---
interface AddBannerModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    currentCount: number;
}

function AddBannerModal({ isOpen, onClose, onSuccess, currentCount }: AddBannerModalProps) {
    const [title, setTitle] = useState('');
    
    // Estados para os Arquivos (File) e Previews (URL local)
    const [desktopFile, setDesktopFile] = useState<File | null>(null);
    const [desktopPreview, setDesktopPreview] = useState<string | null>(null);
    
    const [mobileFile, setMobileFile] = useState<File | null>(null);
    const [mobilePreview, setMobilePreview] = useState<string | null>(null);

    const [isSubmitting, setIsSubmitting] = useState(false);

    // Refs para os inputs ocultos
    const desktopInputRef = useRef<HTMLInputElement>(null);
    const mobileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (isOpen) {
            setTitle('');
            setDesktopFile(null);
            setDesktopPreview(null);
            setMobileFile(null);
            setMobilePreview(null);
            setIsSubmitting(false);
        }
    }, [isOpen]);

    if (!isOpen) return null;

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>, type: 'desktop' | 'mobile') => {
        if (!e.target.files || e.target.files.length === 0) return;
        const file = e.target.files[0];

        if (!file.type.startsWith('image/')) {
            toast.error('Selecione apenas arquivos de imagem.');
            return;
        }

        const previewUrl = URL.createObjectURL(file);

        if (type === 'desktop') {
            setDesktopFile(file);
            setDesktopPreview(previewUrl);
        } else {
            setMobileFile(file);
            setMobilePreview(previewUrl);
        }
    };

    const handleSave = async () => {
        if (!title.trim()) {
            toast.error('Dê um título para o banner.');
            return;
        }
        if (!desktopFile) {
            toast.error('A imagem Desktop é obrigatória.');
            return;
        }

        try {
            setIsSubmitting(true);
            const toastId = toast.loading('Enviando imagens...');

            // 1. Upload Desktop
            const desktopExt = desktopFile.name.split('.').pop();
            const desktopPath = `desktop_${Date.now()}.${desktopExt}`;
            
            const { error: dtError } = await supabase.storage
                .from(BUCKET_NAME)
                .upload(desktopPath, desktopFile);
            
            if (dtError) throw dtError;

            const { data: { publicUrl: desktopUrl } } = supabase.storage
                .from(BUCKET_NAME)
                .getPublicUrl(desktopPath);

            // 2. Upload Mobile (se houver)
            let mobileUrl = null;
            if (mobileFile) {
                const mobileExt = mobileFile.name.split('.').pop();
                const mobilePath = `mobile_${Date.now()}.${mobileExt}`;

                const { error: mobError } = await supabase.storage
                    .from(BUCKET_NAME)
                    .upload(mobilePath, mobileFile);
                
                if (mobError) throw mobError;

                const { data: { publicUrl } } = supabase.storage
                    .from(BUCKET_NAME)
                    .getPublicUrl(mobilePath);
                
                mobileUrl = publicUrl;
            }

            // 3. Salvar no Banco
            await bannerService.create({
                titulo: title,
                imagem_url: desktopUrl,
                mobile_image: mobileUrl,
                ativo: true,
                ordem: currentCount
            });

            toast.success('Banner criado com sucesso!', { id: toastId });
            onSuccess(); 
            onClose();   

        } catch (error: any) {
            console.error(error);
            toast.error('Erro ao salvar banner', { description: error.message });
            setIsSubmitting(false);
        }
    };

    return createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />
            
            <motion.div 
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="relative bg-zinc-900 border border-zinc-700 rounded-xl w-full max-w-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden"
            >
                {/* Header */}
                <div className="p-5 border-b border-zinc-800 flex justify-between items-center bg-zinc-900">
                    <h2 className="text-xl font-bold text-white flex items-center gap-2">
                        <ImageIcon className="text-orange-500" /> Novo Banner
                    </h2>
                    <button onClick={onClose} className="text-zinc-400 hover:text-white transition-colors">
                        <X size={24} />
                    </button>
                </div>

                {/* Body */}
                <div className="p-6 overflow-y-auto custom-scrollbar space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-zinc-400 mb-1.5">Título do Banner</label>
                        <input 
                            type="text" 
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="Ex: Promoção de Natal..."
                            className="w-full bg-zinc-950 border border-zinc-700 rounded-lg p-3 text-zinc-200 focus:border-orange-500 outline-none transition-all placeholder:text-zinc-600"
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Slot Desktop */}
                        <div className="space-y-2">
                            <span className="text-sm font-medium text-zinc-400 flex items-center gap-2">
                                <Monitor size={16} className="text-blue-400" /> Versão Desktop <span className="text-red-500">*</span>
                            </span>
                            <div 
                                onClick={() => desktopInputRef.current?.click()}
                                className={`
                                    relative w-full aspect-video rounded-xl border-2 border-dashed flex flex-col items-center justify-center cursor-pointer transition-all group overflow-hidden
                                    ${desktopPreview ? 'border-zinc-700 bg-zinc-950' : 'border-zinc-700 bg-zinc-900/50 hover:bg-zinc-800 hover:border-zinc-500'}
                                `}
                            >
                                {desktopPreview ? (
                                    <>
                                        <img src={desktopPreview} className="w-full h-full object-cover" alt="Preview Desktop" />
                                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                                            <p className="text-white text-sm font-medium flex items-center gap-2"><Upload size={16} /> Trocar</p>
                                        </div>
                                    </>
                                ) : (
                                    <div className="text-center p-4">
                                        <Upload className="mx-auto text-zinc-500 mb-2 group-hover:text-white transition-colors" size={24} />
                                        <p className="text-xs text-zinc-400">Selecionar Imagem</p>
                                        <span className="text-[10px] text-zinc-600 mt-1 block">1920x600px</span>
                                    </div>
                                )}
                                <input ref={desktopInputRef} type="file" accept="image/*" className="hidden" onChange={(e) => handleFileSelect(e, 'desktop')} />
                            </div>
                        </div>

                        {/* Slot Mobile */}
                        <div className="space-y-2">
                            <span className="text-sm font-medium text-zinc-400 flex items-center gap-2">
                                <Smartphone size={16} className="text-purple-400" /> Versão Mobile <span className="text-[10px] text-zinc-600">(Opcional)</span>
                            </span>
                            <div 
                                onClick={() => mobileInputRef.current?.click()}
                                className={`
                                    relative w-full aspect-[9/16] md:w-2/3 mx-auto rounded-xl border-2 border-dashed flex flex-col items-center justify-center cursor-pointer transition-all group overflow-hidden
                                    ${mobilePreview ? 'border-zinc-700 bg-zinc-950' : 'border-zinc-700 bg-zinc-900/50 hover:bg-zinc-800 hover:border-zinc-500'}
                                `}
                            >
                                {mobilePreview ? (
                                    <>
                                        <img src={mobilePreview} className="w-full h-full object-cover" alt="Preview Mobile" />
                                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                                            <p className="text-white text-sm font-medium flex items-center gap-2"><Upload size={16} /> Trocar</p>
                                        </div>
                                    </>
                                ) : (
                                    <div className="text-center p-4">
                                        <Upload className="mx-auto text-zinc-500 mb-2 group-hover:text-white transition-colors" size={24} />
                                        <p className="text-xs text-zinc-400">Selecionar Imagem</p>
                                        <span className="text-[10px] text-zinc-600 mt-1 block">1080x1350px</span>
                                    </div>
                                )}
                                <input ref={mobileInputRef} type="file" accept="image/*" className="hidden" onChange={(e) => handleFileSelect(e, 'mobile')} />
                            </div>
                        </div>
                    </div>
                </div>

                <div className="p-5 border-t border-zinc-800 bg-zinc-900/50 flex justify-end gap-3">
                    <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors" disabled={isSubmitting}>Cancelar</button>
                    <button onClick={handleSave} disabled={isSubmitting} className="px-6 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg text-sm font-medium flex items-center gap-2 shadow-lg shadow-orange-900/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all">
                        {isSubmitting ? <><Loader2 size={16} className="animate-spin" /> Salvando...</> : <><Check size={16} /> Salvar Banner</>}
                    </button>
                </div>
            </motion.div>
        </div>,
        document.body
    );
}

// --- FUNÇÃO AUXILIAR PARA DELETAR DO STORAGE ---
async function deleteFileFromStorage(fileUrl: string) {
    if (!fileUrl) return;
    try {
        const filePath = fileUrl.split(`${BUCKET_NAME}/`)[1];
        if (!filePath) return;
        await supabase.storage.from(BUCKET_NAME).remove([filePath]); 
    } catch (e) {
        console.error("Erro deletar file:", e);
    }
}


// ==========================================
// COMPONENTE PRINCIPAL
// ==========================================
export function AdminBanners() {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  
  // Estados para Exclusão de Banner Completo
  const [bannerToDelete, setBannerToDelete] = useState<Banner | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Estados para Exclusão APENAS do Mobile
  const [mobileBannerToDelete, setMobileBannerToDelete] = useState<Banner | null>(null);
  const [isDeletingMobile, setIsDeletingMobile] = useState(false);

  // Estados para Upload Rápido do Mobile na lista
  const [uploadingMobileId, setUploadingMobileId] = useState<string | null>(null);

  useEffect(() => {
    loadBanners();
  }, []);

  const loadBanners = async () => {
    try {
      const data = await bannerService.getAllAdmin();
      const sorted = data.sort((a, b) => (a.ordem ?? 0) - (b.ordem ?? 0));
      setBanners(sorted);
    } catch (error) {
      toast.error('Erro ao carregar banners.');
    } finally {
      setLoading(false);
    }
  };

  // --- Ações de Lista ---
  const confirmDelete = (banner: Banner) => setBannerToDelete(banner);

  const handleDelete = async () => {
    if (!bannerToDelete) return;
    setIsDeleting(true);
    
    try {
        if (bannerToDelete.imagem_url) await deleteFileFromStorage(bannerToDelete.imagem_url);
        if (bannerToDelete.mobile_image) await deleteFileFromStorage(bannerToDelete.mobile_image);
        
        await bannerService.delete(bannerToDelete.id);
      
      const newBanners = banners
        .filter(b => b.id !== bannerToDelete.id)
        .map((b, index) => ({ ...b, ordem: index }));
        
      setBanners(newBanners);
      await updateBannerOrder(newBanners);
      
      toast.success('Banner removido.');
      setBannerToDelete(null);
    } catch (error) {
      toast.error('Erro ao excluir.');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleToggleActive = async (banner: Banner) => {
    try {
      const newStatus = await bannerService.toggleActive(banner.id);
      const updatedBanners = banners.map(b => b.id === banner.id ? { ...b, ativo: newStatus } : b);
      setBanners(updatedBanners);
      toast.success(`Banner ${newStatus ? 'ativado' : 'desativado'}.`);
    } catch (error) {
      toast.error('Erro ao atualizar status.');
    }
  };

  const updateBannerOrder = async (newOrder: Banner[]) => {
    try {
      const updates = newOrder.map((banner, index) => ({
        id: banner.id,
        ordem: index,
        titulo: banner.titulo,
        imagem_url: banner.imagem_url,
        ativo: banner.ativo
      }));
      const { error } = await supabase.from('banners').upsert(updates);
      if (error) throw error;
    } catch (error) {
      toast.error("Erro ao salvar ordem.");
    }
  };

  const handleReorder = (newOrder: Banner[]) => {
    setBanners(newOrder);
    updateBannerOrder(newOrder); 
  };

  // --- Upload Rápido de Mobile na Lista ---
  const handleQuickMobileUpload = async (event: React.ChangeEvent<HTMLInputElement>, bannerId: string) => {
    if (!event.target.files?.length) return;
    const file = event.target.files[0];
    setUploadingMobileId(bannerId);
    
    try {
        const fileExt = file.name.split('.').pop();
        const path = `mobile_${Date.now()}.${fileExt}`;
        const { error } = await supabase.storage.from(BUCKET_NAME).upload(path, file);
        if (error) throw error;
        
        const { data: { publicUrl } } = supabase.storage.from(BUCKET_NAME).getPublicUrl(path);
        await bannerService.update(bannerId, { mobile_image: publicUrl });
        await loadBanners();
        toast.success("Mobile adicionado!");
    } catch (e) {
        toast.error("Erro no upload.");
    } finally {
        setUploadingMobileId(null);
    }
  };

  // --- ABRIR MODAL DE EXCLUSÃO MOBILE ---
  const handleRemoveMobile = (banner: Banner) => {
    if (!banner.mobile_image) return;
    setMobileBannerToDelete(banner);
  };

  // --- EXECUTAR REMOÇÃO MOBILE APÓS CONFIRMAÇÃO ---
  const executeRemoveMobile = async () => {
    if (!mobileBannerToDelete) return;
    setIsDeletingMobile(true);

    try {
        // 1. Remove do storage
        await deleteFileFromStorage(mobileBannerToDelete.mobile_image!);

        // 2. Remove do banco (seta null)
        await bannerService.update(mobileBannerToDelete.id, { mobile_image: null });

        // 3. Atualiza UI
        const updatedBanners = banners.map(b => 
            b.id === mobileBannerToDelete.id ? { ...b, mobile_image: null } : b
        );
        setBanners(updatedBanners);
        toast.success("Imagem mobile removida.");
        setMobileBannerToDelete(null); // Fecha o modal

    } catch (error) {
        console.error(error);
        toast.error("Erro ao remover imagem mobile.");
    } finally {
        setIsDeletingMobile(false);
    }
  };


  return (
    <div className="p-4 md:p-6 bg-zinc-900/80 border border-zinc-800 rounded-xl shadow-xl">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <div>
           <h3 className="text-sm font-medium text-white flex items-center gap-2">
             <ImageIcon size={16} className="text-orange-500" />
             Banners ({banners.length}/5)
           </h3>
           <p className="text-xs text-zinc-400 mt-1 flex items-center gap-1">
             <Zap size={12} className="text-orange-400" />
             Arraste para ordenar.
           </p>
        </div>

        <button 
            onClick={() => {
                if(banners.length >= 5) {
                    toast.warning('Limite de 5 banners atingido.');
                    return;
                }
                setIsAddModalOpen(true);
            }}
            disabled={banners.length >= 5}
            className={`
                flex items-center gap-2 px-4 py-2 rounded-lg transition-all shadow-md font-medium text-sm
                ${banners.length >= 5 
                    ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed' 
                    : 'bg-orange-600 hover:bg-orange-700 text-white shadow-orange-500/20'}
            `}
        >
            <Plus size={18} /> Adicionar Banner
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center p-12">
          <Loader2 className="animate-spin text-orange-500" size={32} />
        </div>
      ) : (
        <Reorder.Group axis="y" values={banners} onReorder={handleReorder} className="flex flex-col gap-3">
          <AnimatePresence initial={false}>
            {banners.map((banner) => (
              <Reorder.Item 
                key={banner.id} 
                value={banner}
                className={`
                  relative group border rounded-lg transition-colors bg-zinc-950 w-full h-auto
                  flex items-center justify-between p-3
                  ${!banner.ativo ? 'border-zinc-800 opacity-60 grayscale' : 'border-zinc-700'}
                `}
              >
                <div className='flex items-center gap-4 w-full min-w-0'>
                    <div className='text-zinc-600 hover:text-zinc-400 cursor-move flex-shrink-0 p-1'>
                        <GripVertical size={20} />
                    </div>

                    <div className="flex items-end gap-2">
                        {/* Desktop Thumb */}
                        <div className="relative group/dt w-24 h-14 bg-zinc-900 rounded border border-zinc-800 overflow-hidden">
                            <img src={banner.imagem_url} className="w-full h-full object-cover" alt="DT" />
                            <div className="absolute bottom-0 right-0 bg-black/60 p-0.5 rounded-tl">
                                <Monitor size={10} className="text-white" />
                            </div>
                        </div>

                        {/* Mobile Thumb (COM BOTÃO DE EXCLUIR) */}
                        <div className="relative group/mob w-8 h-12 bg-zinc-900 rounded border border-zinc-800 overflow-hidden flex items-center justify-center">
                            {banner.mobile_image ? (
                                <>
                                    <img src={banner.mobile_image} className="w-full h-full object-cover" alt="MB" />
                                    
                                    {/* 🛑 BOTÃO DE ABRIR MODAL EXCLUIR MOBILE */}
                                    <button 
                                        onClick={() => handleRemoveMobile(banner)}
                                        className="absolute inset-0 bg-red-900/80 flex items-center justify-center opacity-0 group-hover/mob:opacity-100 transition-opacity z-10"
                                        title="Remover apenas imagem Mobile"
                                    >
                                        <X size={14} className="text-white" />
                                    </button>

                                    <div className="absolute bottom-0 right-0 bg-black/60 p-0.5 rounded-tl z-0">
                                        <Smartphone size={8} className="text-white" />
                                    </div>
                                </>
                            ) : (
                                <label className="w-full h-full flex flex-col items-center justify-center cursor-pointer hover:bg-zinc-800 text-zinc-600 hover:text-orange-500 transition-colors">
                                    {uploadingMobileId === banner.id ? <Loader2 size={10} className="animate-spin"/> : <Plus size={12} />}
                                    <input type="file" className="hidden" accept="image/*" onChange={(e) => handleQuickMobileUpload(e, banner.id)} />
                                </label>
                            )}
                        </div>
                    </div>

                    <div className='flex flex-col min-w-0 flex-1'>
                        <span className="text-sm font-semibold text-zinc-200 truncate">
                            {banner.titulo || <span className="text-zinc-500 italic">Sem título definido</span>}
                        </span>
                        <div className='flex items-center gap-2 mt-1'>
                            <span className={`text-[10px] px-1.5 py-0.5 rounded border ${banner.ativo ? 'bg-green-900/20 text-green-400 border-green-900/30' : 'bg-zinc-800 text-zinc-500 border-zinc-700'}`}>
                                {banner.ativo ? 'Publicado' : 'Rascunho'}
                            </span>
                        </div>
                    </div>
                </div>

                <div className='flex items-center gap-2 flex-shrink-0 ml-4'>
                    <button 
                        onClick={() => handleToggleActive(banner)}
                        className="p-2 bg-zinc-900 hover:bg-zinc-800 rounded-lg text-zinc-400 hover:text-white border border-zinc-800 transition-colors"
                        title={banner.ativo ? "Ocultar do site" : "Publicar no site"}
                    >
                        {banner.ativo ? <Eye size={18} /> : <EyeOff size={18} />}
                    </button>
                    <button 
                        onClick={() => confirmDelete(banner)}
                        className="p-2 bg-red-900/10 hover:bg-red-900/30 rounded-lg text-red-400 hover:text-red-200 border border-red-900/20 transition-colors"
                        title="Excluir Banner Inteiro"
                    >
                        <Trash2 size={18} />
                    </button>
                </div>
              </Reorder.Item>
            ))}
          </AnimatePresence>

          {banners.length === 0 && (
            <div className="py-12 flex flex-col items-center justify-center border-2 border-dashed border-zinc-800 rounded-xl bg-zinc-900/30 text-center">
              <ImageIcon className="text-zinc-600 mb-3" size={40} />
              <p className="text-zinc-300 font-medium">Sua galeria está vazia</p>
              <p className="text-zinc-500 text-sm mt-1 mb-4">Adicione banners para destacar seus cursos.</p>
              <button onClick={() => setIsAddModalOpen(true)} className="text-orange-500 hover:text-orange-400 text-sm font-medium">
                + Criar primeiro banner
              </button>
            </div>
          )}
        </Reorder.Group>
      )}

      {/* Modal de Exclusão do Banner Completo */}
      <DeleteModal 
        open={!!bannerToDelete}
        title="Excluir Banner"
        description="Isso removerá as imagens do servidor. A ação não pode ser desfeita."
        onCancel={() => setBannerToDelete(null)}
        onConfirm={handleDelete}
        isLoading={isDeleting}
      />

      {/* 🛑 NOVO MODAL: Exclusão apenas do Mobile */}
      <DeleteModal 
        open={!!mobileBannerToDelete}
        title="Remover Imagem Mobile"
        description="Tem certeza que deseja remover apenas a versão mobile deste banner? A versão desktop continuará ativa."
        onCancel={() => setMobileBannerToDelete(null)}
        onConfirm={executeRemoveMobile}
        isLoading={isDeletingMobile}
      />

      <AddBannerModal 
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSuccess={loadBanners}
        currentCount={banners.length}
      />
    </div>
  );
}