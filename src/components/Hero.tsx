import { useState, useEffect } from 'react';
import { ArrowRight, Check, ChevronLeft, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
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

  // O total de slides é: 1 (Layout Padrão) + Quantidade de Banners
  const totalSlides = 1 + banners.length;

  // Timer automático
  useEffect(() => {
    if (totalSlides <= 1) return; // Se não tem banners extras, não roda
    
    const interval = setInterval(() => {
      nextSlide();
    }, 6000); // 6 segundos por slide

    return () => clearInterval(interval);
  }, [totalSlides, currentIndex]); // Dependência atualizada

  const nextSlide = () => {
    setCurrentIndex((prev) => (prev + 1) % totalSlides);
  };

  const prevSlide = () => {
    setCurrentIndex((prev) => (prev - 1 + totalSlides) % totalSlides);
  };

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <section id="hero" className="relative w-full overflow-hidden bg-black text-white">
      {/* Container Principal que define a altura */}
      {/* min-h-screen ou uma altura fixa garantem que o layout não pule */}
      <div className="relative min-h-[600px] lg:min-h-[700px] flex items-center">
        
        <AnimatePresence mode="wait">
          
          {/* === SLIDE 0: LAYOUT PADRÃO (TEXTO + FOTO) === */}
          {currentIndex === 0 ? (
            <motion.div
              key="standard-hero"
              initial={{ opacity: 0, x: 100 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -100 }}
              transition={{ duration: 0.5 }}
              className="absolute inset-0 bg-gradient-to-br from-black via-[#A8430F] to-black w-full h-full flex items-center"
            >
              <div className="container mx-auto px-4 py-20">
                <div className="grid lg:grid-cols-2 gap-12 items-center">
                  
                  {/* Coluna Esquerda (Texto) */}
                  <div className="space-y-8">
                    <motion.div 
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.2 }}
                      className="inline-block"
                    >
                      <span className="bg-[#A8430F] text-white px-4 py-2 rounded-full text-sm font-semibold">
                        Transforme sua carreira
                      </span>
                    </motion.div>

                    <motion.h1 
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.3 }}
                      className="text-4xl lg:text-6xl font-bold leading-tight"
                    >
                      Transforme seu futuro com a{' '}
                      <span className="text-[#A8430F]">IesCursos</span>
                    </motion.h1>

                    <motion.p 
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.4 }}
                      className="text-xl lg:text-2xl text-gray-300 leading-relaxed"
                    >
                      Cursos Profissionalizantes Presenciais e EAD com valores acessíveis
                    </motion.p>

                    <motion.ul 
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.5 }}
                      className="space-y-3"
                    >
                      <li className="flex items-center gap-3 text-lg">
                        <Check className="w-6 h-6 text-[#A8430F]" />
                        <span>Certificado reconhecido no mercado</span>
                      </li>
                      <li className="flex items-center gap-3 text-lg">
                        <Check className="w-6 h-6 text-[#A8430F]" />
                        <span>Professores experientes e qualificados</span>
                      </li>
                      <li className="flex items-center gap-3 text-lg">
                        <Check className="w-6 h-6 text-[#A8430F]" />
                        <span>Aulas práticas e material completo</span>
                      </li>
                    </motion.ul>

                    <motion.div 
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.6 }}
                      className="flex flex-col sm:flex-row gap-4 pt-4"
                    >
                      <button
                        onClick={() => scrollToSection('contact')}
                        className="group bg-[#A8430F] text-white px-8 py-4 rounded-full font-semibold text-lg 
                                   hover:bg-[#d66a1f] transition-all flex items-center justify-center gap-2 shadow-lg"
                      >
                        Matricule-se agora
                        <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                      </button>
                    </motion.div>
                  </div>

                  {/* Coluna Direita (Foto Original) */}
                  <div className="relative hidden lg:block">
                    <div className="relative rounded-2xl overflow-hidden shadow-2xl">
                      <img
                        src="https://images.pexels.com/photos/3184418/pexels-photo-3184418.jpeg?auto=compress&cs=tinysrgb&w=800"
                        alt="Estudante sorrindo"
                        className="w-full h-auto object-cover"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>
                    </div>
                    {/* Cards Flutuantes */}
                    <div className="absolute -bottom-6 -left-6 bg-[#A8430F] text-white p-6 rounded-xl shadow-xl">
                      <p className="text-4xl font-bold">+5.000</p>
                      <p className="text-sm">Alunos formados</p>
                    </div>
                    <div className="absolute -top-6 -right-6 bg-white text-black p-6 rounded-xl shadow-xl">
                      <p className="text-4xl font-bold text-[#A8430F]">15+</p>
                      <p className="text-sm font-semibold">XP no Mercado</p>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          ) : (
            
          /* === SLIDES EXTRAS: BANNERS DO ADMIN === */
            <motion.div
              key={`banner-${currentIndex}`}
              initial={{ opacity: 0, x: 100 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -100 }}
              transition={{ duration: 0.5 }}
              className="absolute inset-0 w-full h-full"
            >
              {/* O Banner ocupa tudo */}
              <img 
                src={banners[currentIndex - 1]?.imagem_url} 
                alt="Promoção" 
                className="w-full h-full object-cover object-center" // object-cover garante que preencha sem distorcer
              />
              {/* Overlay suave para garantir que setas fiquem visíveis se a imagem for clara */}
              <div className="absolute inset-0 bg-black/10"></div>
            </motion.div>
          )}

        </AnimatePresence>

        {/* === CONTROLES DO CARROSSEL (Só aparecem se tiver banners) === */}
        {totalSlides > 1 && (
          <>
            <button 
              onClick={prevSlide}
              className="absolute left-4 top-1/2 -translate-y-1/2 z-20 bg-black/30 hover:bg-[#A8430F] text-white p-3 rounded-full transition-colors backdrop-blur-sm"
            >
              <ChevronLeft size={30} />
            </button>
            
            <button 
              onClick={nextSlide}
              className="absolute right-4 top-1/2 -translate-y-1/2 z-20 bg-black/30 hover:bg-[#A8430F] text-white p-3 rounded-full transition-colors backdrop-blur-sm"
            >
              <ChevronRight size={30} />
            </button>

            {/* Bolinhas indicadoras */}
            <div className="absolute bottom-6 left-0 right-0 z-20 flex justify-center gap-3">
              {[...Array(totalSlides)].map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrentIndex(idx)}
                  className={`w-3 h-3 rounded-full transition-all ${
                    currentIndex === idx 
                      ? 'bg-[#A8430F] w-8' 
                      : 'bg-white/50 hover:bg-white'
                  }`}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </section>
  );
}