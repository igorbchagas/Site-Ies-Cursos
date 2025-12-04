// src/components/Hero.tsx

import { useState, useEffect } from 'react';
import { ArrowRight, Check, ChevronLeft, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence, PanInfo } from 'framer-motion';
import { bannerService } from '../services/bannerService';
import { Banner } from '../types';

export function Hero() {
    const [banners, setBanners] = useState<Banner[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [direction, setDirection] = useState(0); 
    const [isDesktop, setIsDesktop] = useState(false); 

    useEffect(() => {
        const loadBanners = async () => {
            const data = await bannerService.getActive();
            setBanners(data);
        };
        loadBanners();

        const checkDesktop = () => setIsDesktop(window.innerWidth >= 1024);
        checkDesktop();
        window.addEventListener('resize', checkDesktop);
        return () => window.removeEventListener('resize', checkDesktop);
    }, []);

    const totalSlides = 1 + banners.length;

    const paginate = (newDirection: number) => {
        setDirection(newDirection);
        setCurrentIndex((prev) => {
            let nextIndex = prev + newDirection;
            if (nextIndex < 0) nextIndex = totalSlides - 1;
            if (nextIndex >= totalSlides) nextIndex = 0;
            return nextIndex;
        });
    };

    useEffect(() => {
        if (totalSlides <= 1) return;
        
        const interval = setInterval(() => {
            paginate(1);
        }, 6000);

        return () => clearInterval(interval);
    }, [totalSlides, currentIndex]);

    const handleDragEnd = (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
        const offset = info.offset.x;
        const velocity = info.velocity.x;

        const swipeConfidenceThreshold = 10000;
        const swipePower = Math.abs(offset) * velocity;

        if (swipePower < -swipeConfidenceThreshold || offset < -100) {
            paginate(1);
        } 
        else if (swipePower > swipeConfidenceThreshold || offset > 100) {
            paginate(-1);
        }
    };

    const scrollToSection = (id: string) => {
        const element = document.getElementById(id);
        if (element) {
            element.scrollIntoView({ behavior: 'smooth' });
        }
    };

    const slideVariants = {
        enter: (direction: number) => ({
            x: direction > 0 ? '100%' : '-100%',
            opacity: 0,
            zIndex: 0
        }),
        center: {
            zIndex: 1,
            x: 0,
            opacity: 1
        },
        exit: (direction: number) => ({
            zIndex: 0,
            x: direction < 0 ? '100%' : '-100%',
            opacity: 0
        })
    };

    // COR PADRÃO HERO: Usando a cor original do seu gradiente
    const ORIGINAL_ACCENT_COLOR = "#ff5722"; 
    
    // Gradientes e cores para o novo visual
    const LIGHT_GRADIENT = "from-[#ff5722] to-[#FF9E40]";
    const DARK_BACKGROUND = "bg-zinc-75"; // Fundo mais escuro para maior contraste

    // URL da imagem padrão (usada tanto no desktop quanto no mobile com overlay)
    const STANDARD_IMAGE_URL = "https://images.pexels.com/photos/3184418/pexels-photo-3184418.jpeg?auto=compress&cs=tinysrgb&w=800";

    // MANTIDO: Lista com 3 benefícios 
    const BENEFITS = [
        'Certificado reconhecido e válido em todo o país', 
        'Professores altamente qualificados e experientes', 
        'Aulas práticas com foco no que o mercado precisa'
    ];


    return (
        // MANTIDO
        <section id="hero" className="relative w-full overflow-hidden bg-black text-white">
            {/* MANTIDO: lg:h-screen e h-[680px] */}
            <div className="relative h-[680px] sm:h-[650px] lg:h-screen w-full flex items-start lg:items-center bg-zinc-900 overflow-hidden">
                
                <AnimatePresence initial={false} custom={direction} mode="popLayout">
                    
                    {currentIndex === 0 ? (
                        <motion.div
                            key="hero-standard"
                            custom={direction}
                            variants={slideVariants}
                            initial="enter"
                            animate="center"
                            exit="exit"
                            transition={{
                                x: { type: "spring", stiffness: 300, damping: 30 },
                                opacity: { duration: 0.2 }
                            }}
                            drag={isDesktop ? false : "x"}
                            dragConstraints={{ left: 0, right: 0 }}
                            dragElastic={0.7}
                            dragMomentum={false}
                            onDragEnd={handleDragEnd}
                            className={`absolute inset-0 w-full h-full ${DARK_BACKGROUND} flex items-center justify-center cursor-grab active:cursor-grabbing lg:cursor-default touch-pan-y`}
                        >
                            {/* Imagem de Fundo para Mobile e Desktop (com overlay) */}
                            <div className="absolute inset-0 w-full h-full">
                                <img
                                    src={STANDARD_IMAGE_URL}
                                    alt="Estudante em destaque"
                                    className="w-full h-full object-cover opacity-10 lg:opacity-20 transition-opacity duration-500"
                                />
                                {/* Overlay de Gradiente para legibilidade do texto no mobile/desktop */}
                                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-black/20 lg:bg-gradient-to-r lg:from-black/80 lg:via-black/40 lg:to-black/20"></div>

                                {/* Efeito de Spotlight Sutil */}
                                <div className={`absolute bottom-0 left-1/2 -translate-x-1/2 w-3/4 h-3/4 lg:w-1/3 lg:h-full bg-[${ORIGINAL_ACCENT_COLOR}] opacity-5 rounded-full blur-3xl`}></div>
                            </div>


                            <div className="container mx-auto px-4 lg:px-12 pointer-events-none md:pointer-events-auto relative z-20">
                                {/* CORREÇÃO FINAL 1: Aumentado o padding inferior do desktop (lg:pb-16) para dar mais folga ao botão. */}
                                {/* MANTIDO: lg:pt-32 para compensar o header. */}
                                <div className="flex flex-col lg:grid lg:grid-cols-2 gap-8 lg:gap-16 items-center w-full py-8 lg:pt-32 lg:pb-16">
                                    
                                    {/* Texto */}
                                    <div className="space-y-3 lg:space-y-5 z-10 relative text-center lg:text-left">
                                        
                                        <motion.div 
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: 0.2 }}
                                            // NOVO AJUSTE: Oculta a tag no DESKTOP (lg:hidden) para economizar espaço e evitar corte
                                            className="inline-block lg:hidden"
                                        >
                                            <span className={`bg-[${ORIGINAL_ACCENT_COLOR}] text-white px-4 py-2 rounded-full text-xs lg:text-sm font-bold uppercase tracking-widest shadow-lg`}>
                                                🔥 O SEU PRÓXIMO NÍVEL
                                            </span>
                                        </motion.div>

                                        <motion.h1 
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: 0.3 }}
                                            // MANTIDO: lg:text-6xl
                                            className="text-4xl sm:text-5xl lg:text-6xl font-extrabold leading-tight tracking-tight max-w-xl mx-auto lg:mx-0"
                                        >
                                            O Futuro da sua Carreira Começa na{' '}
                                            <span className={`text-transparent bg-clip-text bg-gradient-to-r ${LIGHT_GRADIENT}`}>
                                                IesCursos
                                            </span>
                                        </motion.h1>

                                        <motion.p 
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: 0.4 }}
                                            className="text-base sm:text-lg lg:text-xl text-zinc-300 max-w-xl leading-relaxed mx-auto lg:mx-0 font-light"
                                        >
                                            Cursos Profissionalizantes Presenciais e EAD com a qualidade que o mercado exige e valores que cabem no seu bolso.
                                        </motion.p>

                                        {/* Lista de benefícios: MANTIDA com 3 itens e ajustes de tamanho */}
                                        <motion.ul 
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: 0.5 }}
                                            className="space-y-2 lg:space-y-2 flex flex-col items-center lg:items-start"
                                        >
                                            {BENEFITS.map((item, i) => (
                                                <li key={i} className="flex items-start gap-3 text-sm lg:text-base text-zinc-200 text-left max-w-sm">
                                                    <div className={`bg-[${ORIGINAL_ACCENT_COLOR}] p-1.5 rounded-full flex-shrink-0 mt-1 shadow-md`}>
                                                        <Check className="w-4 h-4 text-white" />
                                                    </div>
                                                    {item}
                                                </li>
                                            ))}
                                        </motion.ul>

                                        <motion.div 
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: 0.6 }}
                                            // MANTIDO: pt-4, lg:pt-3
                                            className="pt-4 lg:pt-3 flex justify-center lg:justify-start"
                                        >
                                            <button
                                                onClick={() => scrollToSection('contact')}
                                                className={`pointer-events-auto group relative inline-flex items-center justify-center gap-3 px-10 py-4 text-lg font-bold text-white transition-all duration-300 bg-[${ORIGINAL_ACCENT_COLOR}] rounded-xl hover:bg-[#d66a1f] hover:scale-[1.03] shadow-[0_0_20px_rgba(255,87,34,0.7)] hover:shadow-[0_0_30px_rgba(255,87,34,0.9)]`}
                                            >
                                                Matricule-se agora
                                                <ArrowRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
                                            </button>
                                        </motion.div>
                                    </div>

                                    {/* Conteúdo de Destaque Desktop */}
                                    <div className="relative hidden lg:block pointer-events-none">
                                        <div className="relative p-6 bg-black/50 border border-white/10 rounded-3xl shadow-2xl transform hover:scale-[1.02] transition-transform duration-500 backdrop-blur-sm">
                                            
                                            <div className="space-y-5 text-center">
                                                <h3 className={`text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r ${LIGHT_GRADIENT}`}>Por que escolher a IesCursos?</h3>
                                                <div className="grid grid-cols-2 gap-6">
                                                    <div className="flex flex-col items-center p-4 bg-zinc-800/50 rounded-xl border border-zinc-700/50">
                                                        <span className={`text-4xl font-extrabold text-[${ORIGINAL_ACCENT_COLOR}]`}>+5 Mil</span>
                                                        <p className="text-sm text-zinc-300 uppercase tracking-wider mt-1">Alunos Formados</p>
                                                    </div>
                                                    <div className="flex flex-col items-center p-4 bg-zinc-800/50 rounded-xl border border-zinc-700/50">
                                                        <span className={`text-4xl font-extrabold text-[${ORIGINAL_ACCENT_COLOR}]`}>20+</span>
                                                        <p className="text-sm text-zinc-300 uppercase tracking-wider mt-1">Áreas de Atuação</p>
                                                    </div>
                                                </div>
                                                
                                                <p className="text-zinc-300 text-base italic">O melhor custo-benefício para quem quer entrar no mercado de trabalho com o pé direito!</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    ) : (
                        /* === SLIDES DE BANNER (IMAGENS) - MANTIDOS === */
                        <motion.div
                            key={`banner-${currentIndex}`}
                            custom={direction}
                            variants={slideVariants}
                            initial="enter"
                            animate="center"
                            exit="exit"
                            transition={{
                                x: { type: "spring", stiffness: 300, damping: 30 },
                                opacity: { duration: 0.2 }
                            }}
                            drag={isDesktop ? false : "x"}
                            dragConstraints={{ left: 0, right: 0 }}
                            dragElastic={0.7}
                            dragMomentum={false}
                            onDragEnd={handleDragEnd}
                            className="absolute inset-0 w-full h-full bg-zinc-900 cursor-grab active:cursor-grabbing lg:cursor-default touch-pan-y"
                        >
                            {(() => {
                                const banner = banners[currentIndex - 1];
                                if (!banner) return null;

                                return (
                                    <>
                                        {/* Banner Mobile */}
                                        <img 
                                            src={banner.mobile_image || banner.imagem_url} 
                                            alt={banner.titulo} 
                                            className="block md:hidden w-full h-full object-cover pointer-events-none"
                                        />
                                        {/* Banner Desktop */}
                                        <img 
                                            src={banner.imagem_url} 
                                            alt={banner.titulo} 
                                            className="hidden md:block w-full h-full object-cover pointer-events-none"
                                        />
                                        {/* Garante que o texto do banner (se houver) seja legível, sem mexer no conteúdo */}
                                        <div className="absolute inset-0 bg-black/20"></div>
                                    </>
                                );
                            })()}
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* === CONTROLES (Setas e Bolinhas) - MANTIDOS === */}
                {totalSlides > 1 && (
                    <>
                        <button 
                            onClick={() => paginate(-1)}
                            className={`hidden lg:flex absolute left-8 top-1/2 -translate-y-1/2 z-20 bg-black/40 hover:bg-[${ORIGINAL_ACCENT_COLOR}] text-white p-4 rounded-full transition-all backdrop-blur-md border border-white/20 hover:border-[${ORIGINAL_ACCENT_COLOR}] group shadow-xl`}
                        >
                            <ChevronLeft size={28} className="group-hover:-translate-x-1 transition-transform" />
                        </button>
                        
                        <button 
                            onClick={() => paginate(1)}
                            className={`hidden lg:flex absolute right-8 top-1/2 -translate-y-1/2 z-20 bg-black/40 hover:bg-[${ORIGINAL_ACCENT_COLOR}] text-white p-4 rounded-full transition-all backdrop-blur-md border border-white/20 hover:border-[${ORIGINAL_ACCENT_COLOR}] group shadow-xl`}
                        >
                            <ChevronRight size={28} className="group-hover:translate-x-1 transition-transform" />
                        </button>

                        <div className="absolute bottom-6 left-0 right-0 z-20 flex justify-center gap-3 pointer-events-auto">
                            {[...Array(totalSlides)].map((_, idx) => (
                                <button
                                    key={idx}
                                    onClick={() => {
                                        const newDir = idx > currentIndex ? 1 : -1;
                                        setDirection(newDir);
                                        setCurrentIndex(idx);
                                    }}
                                    className={`h-2 rounded-full transition-all duration-300 shadow-sm ${
                                        currentIndex === idx 
                                            ? `bg-[${ORIGINAL_ACCENT_COLOR}] w-8 shadow-[0_0_10px_rgba(255,87,34,0.7)]` 
                                            : 'bg-white/40 hover:bg-white/80 w-2'
                                    }`}
                                    aria-label={`Ir para slide ${idx + 1}`}
                                />
                            ))}
                        </div>
                    </>
                )}
            </div>
        </section>
    );
}