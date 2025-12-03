// src/components/Hero.tsx

import { useState, useEffect } from 'react';
import { ArrowRight, Check, ChevronLeft, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence, PanInfo } from 'framer-motion';
import { bannerService } from '../services/bannerService';
import { Banner } from '../types';

export function Hero() {
    const [banners, setBanners] = useState<Banner[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);

    // Carregar banners do banco
    useEffect(() => {
        const loadBanners = async () => {
            const data = await bannerService.getActive();
            setBanners(data);
        };
        loadBanners();
    }, []);

    // Slide 0 (Padrão) + Banners do Banco
    const totalSlides = 1 + banners.length;

    // Timer automático (pausa se estiver arrastando/interagindo)
    useEffect(() => {
        if (totalSlides <= 1) return;
        
        const interval = setInterval(() => {
            nextSlide();
        }, 6000); // 6 segundos

        return () => clearInterval(interval);
    }, [totalSlides, currentIndex]);

    const nextSlide = () => {
        setCurrentIndex((prev) => (prev + 1) % totalSlides);
    };

    const prevSlide = () => {
        setCurrentIndex((prev) => (prev - 1 + totalSlides) % totalSlides);
    };

    // Lógica de SWIPE (Arrastar) para Mobile
    const handleDragEnd = (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
        const offset = info.offset.x;
        const velocity = info.velocity.x;

        // Se arrastou muito para esquerda ou rápido -> Próximo
        if (offset < -50 || velocity < -500) {
            nextSlide();
        } 
        // Se arrastou muito para direita ou rápido -> Anterior
        else if (offset > 50 || velocity > 500) {
            prevSlide();
        }
    };

    const scrollToSection = (id: string) => {
        const element = document.getElementById(id);
        if (element) {
            element.scrollIntoView({ behavior: 'smooth' });
        }
    };

    // Variantes da animação de slide
    const slideVariants = {
        enter: (direction: number) => ({
            x: direction > 0 ? 1000 : -1000,
            opacity: 0
        }),
        center: {
            zIndex: 1,
            x: 0,
            opacity: 1
        },
        exit: (direction: number) => ({
            zIndex: 0,
            x: direction < 0 ? 1000 : -1000,
            opacity: 0
        })
    };

    return (
        <section id="hero" className="relative w-full overflow-hidden bg-black text-white pt-16 lg:pt-20">
            {/* Altura Responsiva: Menor no mobile (para ver conteúdo abaixo), Maior no desktop */}
            <div className="relative h-[600px] lg:h-[750px] w-full flex items-center bg-zinc-900">
                
                <AnimatePresence initial={false} mode="popLayout">
                    
                    {/* === SLIDE 0: HERO PADRÃO (CÓDIGO) === */}
                    {currentIndex === 0 ? (
                        <motion.div
                            key="hero-standard"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.5 }}
                            // Habilitar arraste também no slide padrão
                            drag="x"
                            dragConstraints={{ left: 0, right: 0 }}
                            dragElastic={0.2}
                            onDragEnd={handleDragEnd}
                            className="absolute inset-0 w-full h-full bg-gradient-to-br from-black via-[#A8430F] to-black flex items-center cursor-grab active:cursor-grabbing"
                        >
                            <div className="container mx-auto px-4 lg:px-12">
                                <div className="grid lg:grid-cols-2 gap-8 lg:gap-16 items-center">
                                    
                                    {/* Texto */}
                                    <div className="space-y-6 lg:space-y-8 z-10 relative">
                                        <motion.div 
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: 0.2 }}
                                            className="inline-block"
                                        >
                                            <span className="bg-[#A8430F] text-white px-4 py-2 rounded-full text-xs lg:text-sm font-bold uppercase tracking-wide shadow-lg">
                                                Transforme sua carreira
                                            </span>
                                        </motion.div>

                                        <motion.h1 
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: 0.3 }}
                                            className="text-4xl sm:text-5xl lg:text-7xl font-extrabold leading-tight tracking-tight"
                                        >
                                            Transforme seu futuro com a{' '}
                                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#FF6B00] to-[#FF9E40]">
                                                IesCursos
                                            </span>
                                        </motion.h1>

                                        <motion.p 
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: 0.4 }}
                                            className="text-base sm:text-lg lg:text-xl text-zinc-300 max-w-xl leading-relaxed"
                                        >
                                            Cursos Profissionalizantes Presenciais e EAD com a qualidade que o mercado exige e valores que cabem no seu bolso.
                                        </motion.p>

                                        <motion.ul 
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: 0.5 }}
                                            className="space-y-3"
                                        >
                                            {['Certificado reconhecido', 'Professores qualificados', 'Aulas práticas'].map((item, i) => (
                                                <li key={i} className="flex items-center gap-3 text-sm lg:text-base text-zinc-200">
                                                    <div className="bg-[#A8430F]/20 p-1 rounded-full">
                                                        <Check className="w-4 h-4 text-[#FF6B00]" />
                                                    </div>
                                                    {item}
                                                </li>
                                            ))}
                                        </motion.ul>

                                        <motion.div 
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: 0.6 }}
                                            className="pt-4"
                                        >
                                            <button
                                                onClick={() => scrollToSection('contact')}
                                                className="group relative inline-flex items-center justify-center gap-2 px-8 py-4 font-semibold text-white transition-all duration-200 bg-[#A8430F] rounded-full hover:bg-[#d66a1f] hover:scale-105 shadow-[0_0_20px_rgba(168,67,15,0.5)]"
                                            >
                                                Matricule-se agora
                                                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                                            </button>
                                        </motion.div>
                                    </div>

                                    {/* Imagem Hero Padrão (Desktop Only para não poluir mobile) */}
                                    <div className="relative hidden lg:block">
                                        <div className="relative rounded-3xl overflow-hidden shadow-2xl border border-white/10 transform hover:scale-[1.02] transition-transform duration-500">
                                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent z-10"></div>
                                            <img
                                                src="https://images.pexels.com/photos/3184418/pexels-photo-3184418.jpeg?auto=compress&cs=tinysrgb&w=800"
                                                alt="Estudante"
                                                className="w-full h-auto object-cover"
                                            />
                                            {/* Cards Flutuantes */}
                                            <div className="absolute bottom-8 left-8 z-20 bg-[#A8430F]/90 backdrop-blur-sm p-4 rounded-xl border border-white/20 shadow-lg">
                                                <p className="text-3xl font-bold text-white">+5k</p>
                                                <p className="text-xs text-white/80 uppercase tracking-wider">Alunos Formados</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    ) : (
                        
                        /* === SLIDES DE BANNER (IMAGENS) === */
                        <motion.div
                            key={`banner-${currentIndex}`}
                            variants={slideVariants}
                            initial="enter"
                            animate="center"
                            exit="exit"
                            transition={{
                                x: { type: "spring", stiffness: 300, damping: 30 },
                                opacity: { duration: 0.2 }
                            }}
                            // Configurações de Swipe (Arrastar)
                            drag="x"
                            dragConstraints={{ left: 0, right: 0 }}
                            dragElastic={1}
                            onDragEnd={handleDragEnd}
                            className="absolute inset-0 w-full h-full bg-zinc-900 cursor-grab active:cursor-grabbing"
                        >
                            {/* RECUPERA O BANNER CORRESPONDENTE (Índice - 1 pois o 0 é o padrão) */}
                            {(() => {
                                const banner = banners[currentIndex - 1];
                                if (!banner) return null;

                                return (
                                    <>
                                        {/* 1. IMAGEM MOBILE (Visível apenas em md:hidden) */}
                                        {/* object-cover garante que não tenha barra preta, ele preenche tudo */}
                                        <img 
                                            src={banner.mobile_image || banner.imagem_url} 
                                            alt={banner.titulo} 
                                            className="block md:hidden w-full h-full object-cover"
                                            draggable={false} // Importante para não bugar o drag do framer
                                        />

                                        {/* 2. IMAGEM DESKTOP (Visível apenas em md:block) */}
                                        <img 
                                            src={banner.imagem_url} 
                                            alt={banner.titulo} 
                                            className="hidden md:block w-full h-full object-cover"
                                            draggable={false}
                                        />

                                        {/* Overlay Opcional para garantir leitura se tiver texto por cima no futuro */}
                                        {/* <div className="absolute inset-0 bg-black/10 pointer-events-none"></div> */}
                                    </>
                                );
                            })()}
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* === CONTROLES (Setas e Bolinhas) === */}
                {totalSlides > 1 && (
                    <>
                        {/* SETAS: 'hidden lg:flex' remove elas do celular e deixa só no PC */}
                        <button 
                            onClick={prevSlide}
                            className="hidden lg:flex absolute left-4 top-1/2 -translate-y-1/2 z-20 bg-black/20 hover:bg-[#A8430F] text-white p-4 rounded-full transition-all backdrop-blur-sm border border-white/10 hover:border-[#A8430F] group"
                        >
                            <ChevronLeft size={28} className="group-hover:-translate-x-1 transition-transform" />
                        </button>
                        
                        <button 
                            onClick={nextSlide}
                            className="hidden lg:flex absolute right-4 top-1/2 -translate-y-1/2 z-20 bg-black/20 hover:bg-[#A8430F] text-white p-4 rounded-full transition-all backdrop-blur-sm border border-white/10 hover:border-[#A8430F] group"
                        >
                            <ChevronRight size={28} className="group-hover:translate-x-1 transition-transform" />
                        </button>

                        {/* INDICADORES (Bolinhas): Visíveis sempre */}
                        <div className="absolute bottom-6 left-0 right-0 z-20 flex justify-center gap-3">
                            {[...Array(totalSlides)].map((_, idx) => (
                                <button
                                    key={idx}
                                    onClick={() => setCurrentIndex(idx)}
                                    className={`h-2 rounded-full transition-all duration-300 shadow-sm ${
                                        currentIndex === idx 
                                            ? 'bg-[#A8430F] w-8' 
                                            : 'bg-white/40 hover:bg-white w-2'
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