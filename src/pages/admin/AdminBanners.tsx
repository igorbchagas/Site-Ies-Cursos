import React, { useState, useEffect } from 'react';
import { createPortal } from "react-dom";
import { 
  Trash2, 
  Eye, 
  EyeOff, 
  Plus, 
  Loader2, 
  Image as ImageIcon, 
  GripVertical, 
  Zap 
} from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';
import { bannerService } from '../../services/bannerService';
import { Banner } from '../../types';
import { toast } from 'sonner';
import { motion, AnimatePresence, Reorder } from 'framer-motion';

// --- Variável Global para o Storage ---
const BUCKET_NAME = 'banners'; 

// --- MODAL DE CONFIRMAÇÃO (MANTIDO) ---
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

// --- FUNÇÃO AUXILIAR PARA DELETAR DO STORAGE ---
async function deleteFileFromStorage(fileUrl: string) {
    if (!fileUrl) return;

    try {
        // Extrai o caminho do arquivo (tudo que vem depois de 'banners/')
        const filePath = fileUrl.split(`${BUCKET_NAME}/`)[1];
        
        if (!filePath) {
            console.error("Não foi possível extrair o caminho do arquivo do Storage.");
            return;
        }

        // 1. Remove o arquivo do Supabase Storage
        const { error: storageError } = await supabase.storage
            .from(BUCKET_NAME)
            .remove([filePath]); 

        if (storageError) {
            // Em caso de erro (ex: arquivo já foi deletado), apenas logamos e continuamos
            console.error("Erro ao deletar arquivo do Storage. Continuando com a exclusão do DB:", storageError);
        } else {
            console.log(`Arquivo deletado do Storage com sucesso: ${filePath}`);
        }
    } catch (e) {
        console.error("Erro fatal ao processar a URL do arquivo:", e);
    }
}

// --- COMPONENTE PRINCIPAL ---
export function AdminBanners() {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  
  const [bannerToDelete, setBannerToDelete] = useState<Banner | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

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

  const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      if (!event.target.files || event.target.files.length === 0) return;
      const file = event.target.files[0];

      if (!file.type.startsWith('image/')) {
        toast.error("Formato inválido!", {
          description: "Por favor, selecione apenas arquivos de imagem (PNG, JPG, WEBP)."
        });
        return;
      }

      if (banners.length >= 5) {
        toast.warning("Limite atingido", {
          description: "Você já possui 5 banners ativos. Remova um para adicionar outro."
        });
        return;
      }

      if (file.size > 5 * 1024 * 1024) {
        toast.error("Arquivo muito grande", {
          description: "O tamanho máximo permitido é de 5MB."
        });
        return;
      }

      setUploading(true);
      const toastId = toast.loading("Enviando imagem...");
      
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from(BUCKET_NAME)
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from(BUCKET_NAME)
        .getPublicUrl(filePath);

      await bannerService.create({
        titulo: file.name,
        imagem_url: publicUrl,
        ativo: true,
        ordem: banners.length 
      });

      await loadBanners();
      toast.success('Banner adicionado com sucesso!', { id: toastId });

    } catch (error: any) {
      console.error(error);
      toast.error('Falha no upload', { description: error.message });
    } finally {
      setUploading(false);
      event.target.value = '';
    }
  };

  const confirmDelete = (banner: Banner) => {
    setBannerToDelete(banner);
  };

  const handleDelete = async () => {
    if (!bannerToDelete) return;
    setIsDeleting(true);
    
    try {
        // 🛑 NOVO: Primeiro, deleta o arquivo do Supabase Storage
        if (bannerToDelete.imagem_url) {
            await deleteFileFromStorage(bannerToDelete.imagem_url);
        }
        
        // 2. Depois, deleta o registro do banco de dados (usando o service)
        await bannerService.delete(bannerToDelete.id);
      
      const newBanners = banners
        .filter(b => b.id !== bannerToDelete.id)
        .map((b, index) => ({ ...b, ordem: index }));
        
      setBanners(newBanners);
      await updateBannerOrder(newBanners);
      
      toast.success('Banner removido com sucesso.');
      setBannerToDelete(null);
    } catch (error) {
      toast.error('Erro ao excluir o banner.');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleToggleActive = async (banner: Banner) => {
    const originalBanners = [...banners];
    
    try {
      const newStatus = await bannerService.toggleActive(banner.id);
      
      const updatedBanners = banners.map(b => 
        b.id === banner.id ? { ...b, ativo: newStatus } : b
      );
      
      setBanners(updatedBanners);
      toast.success(`Banner ${newStatus ? 'ativado' : 'desativado'} com sucesso.`);
      
    } catch (error) {
      setBanners(originalBanners);
      toast.error('Erro ao atualizar status.');
      console.error(error);
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
      console.error("Erro ao salvar ordem", error);
      toast.error("Erro ao salvar a nova ordem dos banners.");
    }
  };

  const handleReorder = (newOrder: Banner[]) => {
    setBanners(newOrder);
    updateBannerOrder(newOrder); 
  };

  return (
    <div className="p-4 md:p-6 bg-zinc-900/80 border border-zinc-800 rounded-xl shadow-xl">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <div>
           <h3 className="text-sm font-medium text-white flex items-center gap-2">
             <ImageIcon size={16} className="text-orange-500" />
             Banners ({banners.length}/5) {/* Texto levemente encurtado no mobile */}
           </h3>
           <p className="text-xs text-zinc-400 mt-1 flex items-center gap-1">
             <Zap size={12} className="text-orange-400" />
             Arraste para ordenar.
           </p>
        </div>

        <label className={`
          flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer transition-all shadow-md w-full sm:w-auto justify-center
          ${uploading || banners.length >= 5 
            ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed' 
            : 'bg-orange-500 hover:bg-orange-600 text-white shadow-orange-500/20'}
        `}>
          {uploading ? <Loader2 className="animate-spin" size={16} /> : <Plus size={16} />}
          <span className="text-xs font-medium">
            {/* Texto curto no mobile, completo no desktop */}
            {uploading ? 'Enviando...' : banners.length >= 5 ? 'Limite Atingido' : (
                <>
                    <span className="sm:hidden">Adicionar</span>
                    <span className="hidden sm:inline">Adicionar Banner</span>
                </>
            )}
          </span>
          <input 
            type="file" 
            accept="image/png, image/jpeg, image/webp" 
            onChange={handleUpload} 
            disabled={uploading || banners.length >= 5}
            className="hidden" 
          />
        </label>
      </div>

      {loading ? (
        <div className="flex justify-center p-12">
          <Loader2 className="animate-spin text-orange-500" size={32} />
        </div>
      ) : (
        <Reorder.Group 
          axis="y" 
          values={banners} 
          onReorder={handleReorder}
          className="flex flex-col gap-3" 
        >
          <AnimatePresence initial={false}>
            {banners.map((banner, index) => (
              <Reorder.Item 
                key={banner.id} 
                value={banner}
                layout 
                dragElastic={0.01} 
                className={`
                  relative group border rounded-lg transition-colors bg-zinc-950 w-full h-auto cursor-grab active:cursor-grabbing
                  flex items-center justify-between p-2 
                  ${!banner.ativo ? 'border-zinc-800 opacity-60 grayscale' : 'border-zinc-700'}
                `}
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                whileDrag={{ scale: 1.01, zIndex: 50, boxShadow: "0 10px 15px -3px rgb(0 0 0 / 0.5)" }}
                transition={{ type: "spring", stiffness: 300, damping: 25 }}
              >
                
                <div className='flex items-center gap-3 w-full min-w-0'> {/* min-w-0 evita overflow de texto */}
                    <div className='text-zinc-500 opacity-70 cursor-move flex-shrink-0'>
                        <GripVertical size={20} />
                    </div>

                    {/* Imagem: w-14 no mobile (menor), sm:w-20 no desktop (original) */}
                    <div className="w-14 h-10 sm:w-20 sm:h-12 flex-shrink-0 rounded overflow-hidden bg-zinc-800 relative">
                        <img 
                          src={banner.imagem_url} 
                          alt="Banner Preview" 
                          className="w-full h-full object-cover pointer-events-none" 
                        />
                         <span className='absolute bottom-0 right-0 text-[8px] font-mono bg-black/60 text-white px-1'>
                             #{index + 1}
                        </span>
                    </div>

                    <div className='flex flex-col justify-center flex-1 min-w-0'>
                        <span className="text-sm text-zinc-300 truncate font-medium">
                            {banner.titulo || 'Banner sem título'}
                        </span>
                        <div className='flex items-center gap-2 text-xs text-zinc-400'>
                            {/* Texto 'Ativo/Inativo' escondido no mobile, aparece no desktop */}
                            <span className="hidden sm:inline-block text-[10px] text-zinc-500 font-mono bg-zinc-950 px-1.5 py-0.5 rounded border border-zinc-800">
                                {banner.ativo ? 'Ativo' : 'Inativo'}
                            </span>
                            {/* Bolinha indicadora sempre visível */}
                            <span className={`w-2 h-2 rounded-full flex-shrink-0 ${banner.ativo ? 'bg-green-500' : 'bg-zinc-700'}`}></span>
                        </div>
                    </div>
                </div>

                <div className='flex items-center gap-2 flex-shrink-0 ml-2'>
                    <button 
                        onClick={() => handleToggleActive(banner)}
                        // Padding reduzido no mobile (p-1.5), normal no desktop (sm:p-2)
                        className="p-1.5 sm:p-2 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-white transition-colors border border-zinc-600 shadow-sm"
                        title={banner.ativo ? "Desativar" : "Ativar"}
                    >
                        {banner.ativo ? <Eye size={18} /> : <EyeOff size={18} />}
                    </button>
                    <button 
                        onClick={() => confirmDelete(banner)}
                        // Padding reduzido no mobile (p-1.5), normal no desktop (sm:p-2)
                        className="p-1.5 sm:p-2 bg-red-500/20 hover:bg-red-600 rounded-lg text-red-200 hover:text-white transition-colors border border-red-500/50 shadow-sm"
                        title="Excluir"
                    >
                        <Trash2 size={18} />
                    </button>
                </div>
              </Reorder.Item>
            ))}
          </AnimatePresence>
          
          {banners.length === 0 && (
            <div className="w-full py-8 flex flex-col items-center justify-center border-2 border-dashed border-zinc-800 rounded-xl bg-zinc-900/30">
              <div className="w-16 h-16 bg-zinc-800 rounded-full flex items-center justify-center mb-4">
                <ImageIcon className="text-zinc-500" size={32} />
              </div>
              <p className="text-zinc-400 font-medium">Nenhum banner cadastrado</p>
              <p className="text-zinc-600 text-sm mt-1">Faça upload de imagens para começar</p>
            </div>
          )}
        </Reorder.Group>
      )}

      <DeleteModal 
        open={!!bannerToDelete}
        title="Excluir Banner"
        description="Tem certeza que deseja remover este banner? Ele deixará de aparecer no site imediatamente."
        onCancel={() => setBannerToDelete(null)}
        onConfirm={handleDelete}
        isLoading={isDeleting}
      />
    </div>
  );
}