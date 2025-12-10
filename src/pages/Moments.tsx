import { useState, useMemo, useEffect, useRef } from 'react';
import { ArrowLeft, Image, Globe, ExternalLink, MonitorPlay, X, ChevronLeft, ChevronRight, Loader2, Play, Instagram, Youtube, Video } from 'lucide-react'; 
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

// Import da Biblioteca de Embeds
import { InstagramEmbed, TikTokEmbed, YouTubeEmbed } from 'react-social-media-embed';

import { Header } from '../components/Header'; 
import { Footer } from '../components/Footer'; 
import { MomentEvent, momentService } from '../services/momentService'; 

// =========================================================================
// CONFIGURAÇÃO
// =========================================================================
const ITEMS_PER_PAGE = 12; 
const ACCENT_COLOR = "#ff5722"; 

// Função auxiliar para identificar o tipo de mídia pela URL
const getMediaType = (url: string) => {
    if (!url) return 'internal';
    if (url.includes('youtube.com') || url.includes('youtu.be')) return 'youtube';
    if (url.includes('instagram.com')) return 'instagram';
    if (url.includes('tiktok.com')) return 'tiktok';
    return 'internal'; 
};

// Função para pegar thumbnail do Youtube
const getYoutubeThumbnailUrl = (url: string): string | null => {
    let videoId = null;
    const matchWatch = url.match(/(?:\?v=|\/embed\/|\/v\/|\/e\/|youtu\.be\/|\/watch\?v=|\/watch\?feature=player_embedded&v=|%2Fvideos%2F|embed\/|v=)([^#&?]*).*/i);
    if (matchWatch && matchWatch[1].length === 11) {
        videoId = matchWatch[1];
    }
    return videoId ? `https://img.youtube.com/vi/${videoId}/hqdefault.jpg` : null;
};

// =========================================================================
// COMPONENTE: MomentCard
// =========================================================================
function MomentCard({ moment }: { moment: MomentEvent }) { 
    const [showModal, setShowModal] = useState(false);
    const videoRef = useRef<HTMLVideoElement>(null);
    
    // Scroll Lock
    useEffect(() => {
      if (showModal) {
        document.body.style.overflow = 'hidden';
      } else {
        document.body.style.overflow = 'unset';
      }
      return () => {
        document.body.style.overflow = 'unset';
      };
    }, [showModal]);

    const formattedDate = useMemo(() => {
      try {
          const dateToFormat = moment.event_date || moment.date;
          if (!dateToFormat) return "Data não informada";
          return new Date(dateToFormat).toLocaleDateString('pt-BR', { 
              day: '2-digit', month: 'long', year: 'numeric', timeZone: 'UTC' 
          });
      } catch (e) {
          return 'Data indisponível';
      }
    }, [moment.event_date, moment.date]);

    const mediaType = useMemo(() => {
        if(moment.type === 'video') {
            return getMediaType(moment.src);
        }
        return 'image';
    }, [moment.src, moment.type]);
    
    const youtubeThumbnail = useMemo(() => getYoutubeThumbnailUrl(moment.src), [moment.src]);

    const handleOpenExternal = () => {
        let url = moment.src.split('?')[0].split('#')[0];
        window.open(url, '_blank');
    };

    // Controle de Play/Pause no Hover do Card
    const handleMouseEnter = () => {
        if (mediaType === 'internal' && videoRef.current) {
            videoRef.current.play().catch(() => {}); // Ignora erro se o navegador bloquear
        }
    };

    const handleMouseLeave = () => {
        if (mediaType === 'internal' && videoRef.current) {
            videoRef.current.pause();
            videoRef.current.currentTime = 0; // Volta para o começo (thumbnail)
        }
    };

    return (
      <> 
        {/* === CARD NA GRADE === */}
        <div 
          className="relative group bg-white rounded-xl shadow-lg overflow-hidden cursor-pointer transition-transform duration-300 hover:scale-[1.03] hover:shadow-2xl"
          onClick={() => setShowModal(true)}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
        >
          <div className="relative w-full h-60 overflow-hidden bg-gray-100">
            {moment.type === 'image' ? (
              <img 
                src={moment.src} 
                alt={moment.title} 
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" 
                loading="lazy"
              />
            ) : (
              // === ÁREA DE PREVIEW DE VÍDEO ===
              <div className="w-full h-full relative flex items-center justify-center bg-zinc-900">
                
                {/* 1. Youtube Thumbnail */}
                {mediaType === 'youtube' && youtubeThumbnail ? (
                    <img src={youtubeThumbnail} alt={moment.title} className="w-full h-full object-cover opacity-90 group-hover:opacity-100 transition-opacity" />
                ) : mediaType === 'internal' ? (
                    /* 2. Vídeo Interno (Upload) - Renderiza o próprio vídeo mudo */
                    <video
                        ref={videoRef}
                        src={moment.src}
                        className="w-full h-full object-cover"
                        muted
                        loop
                        playsInline
                        preload="metadata"
                    />
                ) : (
                    /* 3. Placeholder Bonito para Insta/TikTok (Sem API não dá pra pegar imagem) */
                    <div className={`w-full h-full flex flex-col items-center justify-center text-white relative overflow-hidden
                        ${mediaType === 'instagram' ? 'bg-gradient-to-tr from-yellow-400 via-red-500 to-purple-600' : ''}
                        ${mediaType === 'tiktok' ? 'bg-black' : ''}
                    `}>
                        {/* Efeito de fundo */}
                        <div className="absolute inset-0 bg-black/20" />
                        
                        <div className="relative z-10 flex flex-col items-center gap-2 transform group-hover:scale-110 transition-transform duration-300">
                             {mediaType === 'instagram' && <Instagram size={48} />}
                             {mediaType === 'tiktok' && (
                                <svg width="48" height="48" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M19.589 6.686a4.793 4.793 0 0 1-3.77-4.245V2h-3.445v13.672a2.896 2.896 0 0 1-5.201 1.743l-.002-.001.002.001a2.895 2.895 0 0 1 3.183-4.51v-3.5a6.394 6.394 0 0 0-5.394 9.365 6.394 6.394 0 0 0 10.864-2.828v-6.6a8.347 8.347 0 0 0 4.77 1.621v-3.913a4.793 4.793 0 0 1-1.007-.364z"/>
                                </svg>
                             )}
                             <span className="font-bold text-sm uppercase tracking-widest">{mediaType}</span>
                        </div>
                    </div>
                )}
                
                {/* Ícone de Play Overlay (Aparece em todos os vídeos) */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className={`p-4 rounded-full backdrop-blur-sm text-white transition-all duration-300 shadow-xl
                        ${mediaType === 'internal' ? 'bg-black/20 group-hover:opacity-0' : 'bg-white/20 group-hover:scale-110'}
                    `}>
                        <Play className="w-8 h-8 ml-1" fill="currentColor" />
                    </div>
                </div>
              </div>
            )}
            
            {/* Tag do Tipo de Mídia (Badge) */}
            <div className="absolute top-3 left-3 flex items-center gap-2">
               <span className={`text-[10px] font-bold uppercase tracking-wide px-2 py-1 rounded-md text-white shadow-sm backdrop-blur-md
                    ${moment.type === 'image' ? 'bg-blue-500/80' : ''}
                    ${mediaType === 'youtube' ? 'bg-red-600/90' : ''}
                    ${mediaType === 'instagram' ? 'bg-pink-600/90' : ''}
                    ${mediaType === 'tiktok' ? 'bg-black/60 border border-white/20' : ''}
                    ${mediaType === 'internal' ? 'bg-emerald-600/90' : ''}
               `}>
                    <div className="flex items-center gap-1.5">
                        {moment.type === 'image' && <><Image size={12}/> FOTO</>}
                        {mediaType === 'youtube' && <><Youtube size={12}/> YOUTUBE</>}
                        {mediaType === 'instagram' && <><Instagram size={12}/> INSTA</>}
                        {mediaType === 'tiktok' && <>TIKTOK</>}
                        {mediaType === 'internal' && <><Video size={12}/> VÍDEO</>}
                    </div>
               </span>
            </div>
          </div>

          <div className="p-4">
            <h3 className="text-xl font-bold text-gray-900 mb-2 line-clamp-1">{moment.title}</h3>
            <p className="text-gray-600 text-sm line-clamp-2">{moment.description}</p>
            <p className="text-xs text-gray-400 mt-2">{formattedDate}</p>
          </div>
        </div>

        {/* === MODAL / LIGHTBOX === */}
        {showModal && (
          <div 
            className="fixed inset-0 bg-black/95 backdrop-blur-md flex items-center justify-center z-[9999]"
            onClick={() => setShowModal(false)}
          >
            {/* Botão Fechar FIXADO na tela */}
            <button 
                onClick={(e) => { e.stopPropagation(); setShowModal(false); }}
                className="fixed top-6 right-6 z-[10000] p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors border border-white/10 hover:rotate-90 duration-300"
            >
                <X size={32} />
            </button>

            {/* Container Central */}
            <div 
                className="w-full h-full flex items-center justify-center p-4 md:p-10 overflow-auto"
                onClick={(e) => e.stopPropagation()}
            >
              <div className="w-full max-w-5xl flex flex-col items-center justify-center gap-6">
                
                {moment.type === 'image' ? (
                  <img 
                    src={moment.src} 
                    alt={moment.title} 
                    className="max-w-full max-h-[85vh] object-contain rounded-lg shadow-2xl" 
                  />
                ) : (
                  // --- ÁREA DE VÍDEOS NO MODAL ---
                  <div className="w-full flex flex-col items-center justify-center">
                      
                      {/* VÍDEO INTERNO (UPLOAD) */}
                      {mediaType === 'internal' && (
                         <div className="w-full max-w-4xl bg-black rounded-lg overflow-hidden shadow-2xl border border-white/10">
                             <video 
                                controls 
                                autoPlay 
                                className="w-full max-h-[80vh]"
                                src={moment.src}
                             >
                                Seu navegador não suporta vídeos.
                             </video>
                         </div>
                      )}

                      {/* EMBEDS EXTERNOS */}
                      {mediaType !== 'internal' && (
                        <div className="w-full max-w-[500px] shadow-2xl rounded-xl overflow-hidden bg-black flex justify-center">
                            {mediaType === 'youtube' && (
                                <div className="aspect-video w-full">
                                    <YouTubeEmbed url={moment.src} width="100%" height="100%" />
                                </div>
                            )}

                            {mediaType === 'instagram' && (
                                <div className="bg-white rounded-xl overflow-hidden">
                                    <InstagramEmbed url={moment.src} width={328} />
                                </div>
                            )}

                            {mediaType === 'tiktok' && (
                                <div className="bg-black rounded-xl overflow-hidden">
                                    <TikTokEmbed url={moment.src} width={325} />
                                </div>
                            )}
                        </div>
                      )}
                  </div>
                )}

                {/* Botão para link externo */}
                {(moment.type !== 'image' && mediaType !== 'internal') && (
                    <button
                        onClick={handleOpenExternal}
                        className="px-8 py-3 rounded-full text-white font-bold flex items-center gap-2 transition-all shadow-lg hover:brightness-110 active:scale-95 hover:shadow-orange-500/20"
                        style={{ backgroundColor: ACCENT_COLOR }}
                    >
                        <ExternalLink size={18} />
                        Abrir publicação original
                    </button>
                )}
              </div>
            </div>
          </div>
        )}
      </>
    );
}

// =========================================================================
// PÁGINA PRINCIPAL
// =========================================================================
export default function MomentsPage() {
  const navigate = useNavigate();
  const [activeCategory, setActiveCategory] = useState<string>('todos');
  const [currentPage, setCurrentPage] = useState(1);
  
  const [moments, setMoments] = useState<MomentEvent[]>([]); 
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadMoments = async () => {
    setLoading(true);
    setError(null);
    try {
        const data = await momentService.getAll();
        setMoments(data);
    } catch (e) {
        console.error("Erro ao carregar galeria:", e); 
        setError("Não foi possível carregar a galeria de momentos.");
        toast.error("Erro ao carregar galeria.");
    } finally {
        setLoading(false);
    }
  };

  useEffect(() => {
    window.scrollTo(0, 0);
    loadMoments();
  }, []); 

  const { totalPages, currentMoments } = useMemo(() => {
    let list = [...moments];
    if (activeCategory !== 'todos') {
      list = list.filter(m => m.category === activeCategory);
    }
    const totalPagesCalc = Math.ceil(list.length / ITEMS_PER_PAGE);
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    const end = start + ITEMS_PER_PAGE;
    return { totalPages: totalPagesCalc, currentMoments: list.slice(start, end) };
  }, [activeCategory, currentPage, moments]);

  useEffect(() => { setCurrentPage(1); }, [activeCategory]);
  
  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
      window.scrollTo({ top: 0, behavior: "smooth" }); 
    }
  };

  const categories = [
    { label: 'Todos', value: 'todos' },
    { label: 'Eventos', value: 'eventos' },
    { label: 'Alunos', value: 'alunos' },
    { label: 'Estrutura', value: 'estrutura' },
    { label: 'Aulas', value: 'aulas' },
    { label: 'Comunidade', value: 'comunidade' },
  ];

  return (
    <> 
      <Header />

      <section className="min-h-screen pt-32 pb-20 bg-gray-50">
        <div className="container mx-auto px-4">
          
          <div className="mb-10 flex flex-col md:flex-row justify-between items-start md:items-center">
            <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 mb-4 md:mb-0">
              Nossos Momentos
            </h1>
            <button
              onClick={() => navigate('/')}
              className={`flex items-center gap-2 text-lg font-semibold text-gray-700 hover:text-[${ACCENT_COLOR}] transition-colors`}
            >
              <ArrowLeft className="w-5 h-5" /> <span className="hidden md:inline">Voltar à Página Inicial</span> <span className="md:hidden">Voltar</span>
            </button>
          </div>

          {/* Categorias com Scroll Horizontal no Mobile */}
          <div className="flex flex-nowrap md:flex-wrap overflow-x-auto pb-2 md:pb-6 justify-start md:justify-center gap-3 mb-12 p-4 md:p-6 bg-white rounded-xl shadow-lg border border-gray-100 custom-scrollbar">
            {categories.map((cat) => (
              <button
                key={cat.value}
                onClick={() => setActiveCategory(cat.value)}
                className={`px-6 py-2.5 text-sm font-semibold rounded-full transition-all duration-200 shadow-md whitespace-nowrap flex-shrink-0 ${
                  activeCategory === cat.value
                    ? `bg-[${ACCENT_COLOR}] text-white shadow-md shadow-[${ACCENT_COLOR}]/30` 
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200" 
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {loading ? (
            <div className="text-center py-20 bg-white rounded-xl shadow-lg">
                <p className="text-xl text-gray-500 flex items-center justify-center gap-2"><Loader2 className="animate-spin"/> Carregando momentos...</p>
            </div>
          ) : error ? (
            <div className="text-center py-20 bg-white rounded-xl shadow-lg">
                <p className="text-xl text-red-500 mb-4">{error}</p>
                <button
                    onClick={loadMoments}
                    className={`px-6 py-3 rounded-md bg-[${ACCENT_COLOR}] text-white font-semibold hover:bg-orange-700 transition`}
                >
                    Tentar novamente
                </button>
            </div>
          ) : currentMoments.length > 0 ? (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
              {currentMoments.map((moment) => (
                <MomentCard key={moment.id} moment={moment} />
              ))}
            </div>
          ) : (
            <div className="text-center py-20 bg-white rounded-xl shadow-lg">
              <p className="text-xl text-gray-500">Nenhum momento encontrado para esta categoria.</p>
            </div>
          )}

          {/* === PAGINAÇÃO RESPONSIVA === */}
          {totalPages > 1 && (
            <div className="flex justify-center items-center gap-3 mt-12 select-none">
              {/* Botão Anterior */}
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="px-4 py-3 border border-gray-300 rounded-xl text-gray-700 hover:bg-gray-100 disabled:opacity-50 transition-colors flex items-center gap-1"
              >
                <ChevronLeft size={20} />
                <span className="hidden md:inline">Anterior</span>
              </button>

              {/* MOBILE: Mostra texto "Pág X de Y" */}
              <span className="md:hidden text-sm font-semibold text-gray-600">
                  {currentPage} / {totalPages}
              </span>

              {/* DESKTOP: Mostra números das páginas */}
              <div className="hidden md:flex gap-2">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                    <button
                      key={p}
                      onClick={() => handlePageChange(p)}
                      className={`w-10 h-10 border rounded-xl font-semibold transition duration-200 ${
                        currentPage === p
                          ? `bg-[${ACCENT_COLOR}] text-white border-[${ACCENT_COLOR}] shadow-md shadow-[${ACCENT_COLOR}]/30` 
                          : "text-gray-700 hover:bg-gray-100 border-gray-300" 
                      }`}
                    >
                      {p}
                    </button>
                  ))}
              </div>

              {/* Botão Próxima */}
              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="px-4 py-3 border border-gray-300 rounded-xl text-gray-700 hover:bg-gray-100 disabled:opacity-50 transition-colors flex items-center gap-1"
              >
                <span className="hidden md:inline">Próxima</span>
                <ChevronRight size={20} />
              </button>
            </div>
          )}

        </div>
      </section>
      <Footer />
    </>
  );
}