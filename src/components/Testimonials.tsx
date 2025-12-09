import { useEffect, useState } from 'react';
import { createPortal } from "react-dom";
import { Star, Quote, Loader2, X, Maximize2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { feedbackService, Feedback } from '../services/feedbackService';

// ==========================================
// MODAL DE LEITURA (CORRIGIDO)
// ==========================================
interface ReadMoreModalProps {
    feedback: Feedback;
    onClose: () => void;
}

function ReadMoreModal({ feedback, onClose }: ReadMoreModalProps) {
    useEffect(() => {
        document.body.style.overflow = 'hidden'; // Trava o scroll do site
        return () => { document.body.style.overflow = 'unset'; };
    }, []);

    return createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
            {/* Backdrop Escuro */}
            <motion.div 
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="absolute inset-0 bg-black/70 backdrop-blur-sm"
                onClick={onClose}
            />
            
            {/* Conteúdo do Modal */}
            <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="relative bg-white rounded-2xl p-6 w-full max-w-lg shadow-2xl z-10 flex flex-col max-h-[90vh]"
            >
                <button 
                    onClick={onClose}
                    className="absolute top-4 right-4 p-2 bg-gray-100 rounded-full hover:bg-gray-200 transition-colors text-gray-500 z-20"
                >
                    <X size={20} />
                </button>

                <div className="overflow-y-auto custom-scrollbar pr-2">
                    <div className="flex flex-col items-center text-center mt-2">
                        <div className="w-14 h-14 bg-[#ff5722]/10 rounded-full flex items-center justify-center mb-4">
                            <Quote className="w-7 h-7 text-[#ff5722]" />
                        </div>

                        <div className="flex gap-1 mb-3">
                            {[...Array(5)].map((_, i) => (
                                <Star key={i} size={18} className={i < feedback.rating ? "fill-[#ff5722] text-[#ff5722]" : "text-gray-300"} />
                            ))}
                        </div>

                        <h3 className="text-xl font-bold text-gray-900">{feedback.name}</h3>
                        <p className="text-[#ff5722] font-semibold text-xs uppercase tracking-wide mb-6">{feedback.course}</p>

                        <div className="w-full h-px bg-gray-100 mb-6"></div>

                        {/* CORREÇÃO DO TEXTO: break-words e whitespace-pre-wrap */}
                        <p className="text-gray-700 text-base leading-relaxed text-justify whitespace-pre-wrap break-words break-all">
                            "{feedback.message}"
                        </p>
                    </div>
                </div>
            </motion.div>
        </div>,
        document.body
    );
}

// ==========================================
// COMPONENTE PRINCIPAL
// ==========================================
export function Testimonials() {
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedFeedback, setSelectedFeedback] = useState<Feedback | null>(null);

  useEffect(() => {
    async function fetchFeedbacks() {
      try {
        const data = await feedbackService.getApproved();
        setFeedbacks(data.slice(0, 3)); 
      } catch (error) {
        console.error("Erro ao carregar depoimentos", error);
      } finally {
        setLoading(false);
      }
    }
    fetchFeedbacks();
  }, []);

  return (
    <section id="depoimentos" className="py-20 bg-gray-50 scroll-mt-32">
      <div className="container mx-auto px-4">
        {/* Cabeçalho */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-12"
        >
          <span className="text-[#ff5722] font-semibold text-lg">Depoimentos</span>
          <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 mt-2 mb-4">
            O que nossos alunos dizem
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8">
            Histórias reais de transformação profissional
          </p>

          <Link 
            to="/feedback"
            className="inline-flex items-center gap-2 text-sm font-semibold text-[#ff5722] bg-[#ff5722]/10 px-6 py-3 rounded-full hover:bg-[#ff5722]/20 transition-colors"
          >
            <Star size={16} className="fill-[#ff5722]" />
            Deixar minha avaliação
          </Link>
        </motion.div>

        {loading && (
          <div className="flex justify-center items-center py-20">
             <Loader2 className="w-10 h-10 animate-spin text-[#ff5722]" />
          </div>
        )}

        {!loading && (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {feedbacks.length > 0 ? (
                feedbacks.map((testimonial, index) => (
                <motion.div
                    key={testimonial.id}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.4, delay: index * 0.1 }}
                    whileHover={{ y: -5 }}
                    className="bg-white rounded-xl p-8 shadow-lg cursor-default border border-gray-100 flex flex-col h-full"
                >
                    <div className="flex-1">
                        <Quote className="w-8 h-8 text-[#ff5722] mb-4" />

                        <div className="flex gap-1 mb-4">
                            {[...Array(5)].map((_, i) => (
                                <Star key={i} className={`w-4 h-4 ${i < testimonial.rating ? "fill-[#ff5722] text-[#ff5722]" : "text-gray-300"}`} />
                            ))}
                        </div>

                        {/* LINE CLAMP + BREAK ALL para evitar quebra de layout */}
                        <p className="text-gray-700 mb-2 leading-relaxed italic line-clamp-4 break-words break-all">
                            "{testimonial.message}"
                        </p>
                        
                        {/* Botão Ler Mais */}
                        <button 
                            onClick={() => setSelectedFeedback(testimonial)}
                            className="text-xs font-bold text-[#ff5722] hover:underline mb-6 flex items-center gap-1 uppercase tracking-wide"
                        >
                            <Maximize2 size={12} /> Ler completo
                        </button>
                    </div>

                    <div className="border-t pt-4 mt-auto">
                        <p className="font-bold text-gray-900 truncate">
                            {testimonial.name}
                        </p>
                        <p className="text-sm text-gray-600 truncate">
                            {testimonial.course}
                        </p>
                    </div>
                </motion.div>
                ))
            ) : (
                <div className="col-span-full text-center py-10 text-gray-500">
                    Ainda não temos depoimentos registrados.
                </div>
            )}
          </div>
        )}
      </div>

      <AnimatePresence>
        {selectedFeedback && (
            <ReadMoreModal 
                feedback={selectedFeedback} 
                onClose={() => setSelectedFeedback(null)} 
            />
        )}
      </AnimatePresence>
    </section>
  );
}