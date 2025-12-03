// src/pages/MomentsPage.tsx

import { useState, useMemo, useEffect } from 'react';
import { ArrowLeft, Image, X, Globe, ExternalLink, MonitorPlay } from 'lucide-react'; 
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
const ACCENT_COLOR = "#E45B25"; 

// Função auxiliar para identificar o tipo de mídia pela URL
const getMediaType = (url: string) => {
    if (url.includes('youtube.com') || url.includes('youtu.be')) return 'youtube';
    if (url.includes('instagram.com')) return 'instagram';
    if (url.includes('tiktok.com')) return 'tiktok';
    return 'other';
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
    
    // --- CORREÇÃO: SCROLL LOCK ---
    // Impede que o site role quando o modal estiver aberto
    useEffect(() => {
      if (showModal) {
        document.body.style.overflow = 'hidden';
      } else {
        document.body.style.overflow = 'unset';
      }
      // Limpeza ao desmontar
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

    const mediaType = useMemo(() => getMediaType(moment.src), [moment.src]);
    const youtubeThumbnail = useMemo(() => getYoutubeThumbnailUrl(moment.src), [moment.src]);

    const handleOpenExternal = () => {
        let url = moment.src.split('?')[0].split('#')[0];
        window.open(url, '_blank');
    };

    return (
      <> 
        {/* === CARD NA GRADE === */}
        <div 
          className="relative group bg-white rounded-xl shadow-lg overflow-hidden cursor-pointer transition-transform duration-300 hover:scale-[1.03] hover:shadow-2xl"
          onClick={() => setShowModal(true)}
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
              // Preview para Vídeos
              <div className="w-full h-full relative flex items-center justify-center">
                {mediaType === 'youtube' && youtubeThumbnail ? (
                    <img src={youtubeThumbnail} alt={moment.title} className="w-full h-full object-cover" />
                ) : (
                    <div className={`w-full h-full flex flex-col items-center justify-center text-white/80 gap-2
                        ${mediaType === 'instagram' ? 'bg-gradient-to-tr from-yellow-400 via-red-500 to-purple-500' : ''}
                        ${mediaType === 'tiktok' ? 'bg-black' : ''}
                        ${mediaType === 'other' ? 'bg-gray-800' : ''}
                    `}>
                        <MonitorPlay size={48} />
                        <span className="font-bold text-sm uppercase tracking-wider">{mediaType}</span>
                    </div>
                )}
                
                {/* Ícone de Play Overlay */}
                <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition-colors flex items-center justify-center">
                    <div className="p-4 rounded-full bg-white/20 backdrop-blur-sm text-white group-hover:scale-110 transition-transform shadow-lg">
                        <MonitorPlay className="w-8 h-8" fill="currentColor" />
                    </div>
                </div>
              </div>
            )}
            
            {/* Tag do Tipo de Mídia */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex items-end p-4 pointer-events-none">
              <div className="flex items-center gap-2 text-white text-xs font-bold uppercase tracking-wide">
                {moment.type === 'image' ? <Image className="w-4 h-4" /> : <Globe className="w-4 h-4" />}
                {moment.type === 'image' ? 'Foto' : mediaType}
              </div>
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
            className="fixed inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center z-[9999] p-4 md:p-8"
            onClick={() => setShowModal(false)}
          >
            {/* Container Central com Scroll Próprio */}
            <div 
                className="w-full max-w-5xl max-h-[95vh] flex flex-col items-center relative overflow-y-auto no-scrollbar"
                onClick={(e) => e.stopPropagation()}
            >
              {/* Botão Fechar (Posicionado fora do conteúdo rolável ou fixo no topo) */}
              <button 
                onClick={() => setShowModal(false)} 
                className="absolute top-0 right-0 md:-right-4 md:top-0 text-white hover:text-gray-300 z-50 p-2 transition-colors bg-black/50 rounded-full md:bg-transparent"
              >
                <X size={32} />
              </button>
              
              {/* Espaçamento para o botão fechar não sobrepor conteúdo em mobile */}
              <div className="mt-10 md:mt-0 w-full flex flex-col items-center justify-center">
                
                {moment.type === 'image' ? (
                  <img 
                    src={moment.src} 
                    alt={moment.title} 
                    className="max-w-full max-h-[80vh] object-contain rounded-lg shadow-2xl" 
                  />
                ) : (
                  // --- AREA DOS EMBEDS ---
                  <div className="w-full flex flex-col items-center justify-center">
                      <div className="w-full max-w-[500px] shadow-2xl rounded-xl overflow-hidden bg-black">
                        
                        {mediaType === 'youtube' && (
                            <div className="aspect-video w-full">
                                <YouTubeEmbed url={moment.src} width="100%" height="100%" />
                            </div>
                        )}

                        {mediaType === 'instagram' && (
                            <div className="flex justify-center bg-white">
                                <InstagramEmbed url={moment.src} width={328} />
                            </div>
                        )}

                        {mediaType === 'tiktok' && (
                            <div className="flex justify-center bg-black">
                                <TikTokEmbed url={moment.src} width={325} />
                            </div>
                        )}

                        {mediaType === 'other' && (
                             <div className="p-10 text-white text-center">
                                <Globe size={48} className="mx-auto mb-4 opacity-50"/>
                                <p>Conteúdo externo não incorporável.</p>
                             </div>
                        )}
                      </div>
                  </div>
                )}

                {/* Botão para Link Externo (Estilo Laranja Solicitado) */}
                {moment.type !== 'image' && (
                    <button
                        onClick={handleOpenExternal}
                        className="mt-6 px-6 py-3 rounded-full text-white font-bold flex items-center gap-2 transition-transform shadow-lg hover:brightness-110 active:scale-95"
                        style={{ backgroundColor: ACCENT_COLOR }}
                    >
                        <ExternalLink size={18} />
                        Ir para a publicação original
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
// PÁGINA PRINCIPAL (Sem alterações na lógica)
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
            <h1 className="text-5xl font-extrabold text-gray-900 mb-4 md:mb-0">
              Nossos Momentos
            </h1>
            <button
              onClick={() => navigate('/')}
              className={`flex items-center gap-2 text-lg font-semibold text-gray-700 hover:text-[${ACCENT_COLOR}] transition-colors`}
            >
              <ArrowLeft className="w-5 h-5" /> Voltar à Página Inicial
            </button>
          </div>

          <div className="flex flex-wrap justify-center gap-3 mb-12 p-4 bg-white rounded-xl shadow-lg border border-gray-100">
            {categories.map((cat) => (
              <button
                key={cat.value}
                onClick={() => setActiveCategory(cat.value)}
                className={`px-6 py-2.5 text-sm font-semibold rounded-full transition-all duration-200 shadow-md ${
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
                <p className="text-xl text-gray-500">Carregando momentos...</p>
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

          {totalPages > 1 && (
            <div className="flex justify-center items-center space-x-2 mt-12">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="px-5 py-3 border border-gray-300 rounded-xl text-gray-700 hover:bg-gray-100 disabled:opacity-50 transition-colors"
              >
                Anterior
              </button>
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
              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="px-5 py-3 border border-gray-300 rounded-xl text-gray-700 hover:bg-gray-100 disabled:opacity-50 transition-colors"
              >
                Próxima
              </button>
            </div>
          )}

        </div>
      </section>
      <Footer />
    </>
  );
}