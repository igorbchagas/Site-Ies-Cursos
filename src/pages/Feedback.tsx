import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Star, Send, MessageSquare, Loader2, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import DOMPurify from 'dompurify';
import { motion } from 'framer-motion';

import { feedbackService } from '../services/feedbackService';
import { courseService } from '../services/courseService'; 
import { Course } from '../types'; 

import { Header } from '../components/Header';
import { Footer } from '../components/Footer';

// Configurações
const ACCENT_COLOR = "#ff5722";
const MAX_CHARS = 400; // 🆕 Limite de caracteres

// Sanitização local
function sanitizeInput(dirtyString: string): string {
    return DOMPurify.sanitize(dirtyString);
}

export default function Feedback() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    
    // Estados para Cursos
    const [allCourses, setAllCourses] = useState<Course[]>([]);
    const [loadingCourses, setLoadingCourses] = useState(true);

    // Estado do formulário
    const [formData, setFormData] = useState({
        name: '',
        course: '',
        message: ''
    });
    
    // Estado das estrelas
    const [rating, setRating] = useState(0);
    const [hoverRating, setHoverRating] = useState(0);

    // Scroll Top ao abrir
    useEffect(() => {
        window.scrollTo(0, 0);
        
        const fetchCourses = async () => {
            try {
                const coursesData = await courseService.getAll();
                setAllCourses(coursesData);
            } catch (error) {
                console.error("Erro ao carregar cursos:", error);
                setAllCourses([]);
            } finally {
                setLoadingCourses(false);
            }
        };
        fetchCourses();
    }, []);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;

        // 🆕 Lógica de Limite de Caracteres
        if (name === 'message' && value.length > MAX_CHARS) {
            return; // Impede a digitação se passar do limite
        }

        setFormData(prev => ({
            ...prev,
            [name]: sanitizeInput(value)
        }));
    };

    // FUNÇÃO DE SCROLL ROBUSTA
    const scrollToTestimonials = () => {
        setTimeout(() => {
            const section = document.getElementById('depoimentos');
            if (section) {
                section.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        }, 300); 
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (rating === 0) {
            toast.error("Por favor, selecione uma nota de 1 a 5 estrelas.");
            return;
        }

        if (!formData.name || !formData.course || !formData.message) {
            toast.error("Por favor, preencha todos os campos.");
            return;
        }

        setLoading(true);

        try {
            await feedbackService.create({
                name: formData.name,
                course: formData.course,
                message: formData.message,
                rating: rating
            });

            toast.success("Obrigado pelo seu feedback! Sua opinião é muito importante para nós.");
            
            // Resetar
            setFormData({ name: '', course: '', message: '' });
            setRating(0);
            
            // Voltar para Home e Rolar
            setTimeout(() => {
                navigate('/');
                scrollToTestimonials();
            }, 1500);

        } catch (error) {
            console.error("Erro ao enviar feedback:", error);
            toast.error("Erro ao enviar avaliação. Tente novamente.");
        } finally {
            setLoading(false);
        }
    };

    const handleBack = () => {
        navigate('/');
        scrollToTestimonials();
    };

    const inputClasses = "w-full p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#ff5722] focus:border-[#ff5722] transition duration-150 text-gray-800 bg-white";
    const labelClasses = "block text-sm font-medium mb-2 text-gray-700";

    return (
        <>
            <Header />
            <motion.main 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="min-h-screen pt-32 pb-20 bg-gray-50"
            >
                <div className="container mx-auto px-4">
                    
                    {/* Botão Voltar */}
                    <div className="mb-8">
                        <button
                            onClick={handleBack}
                            className={`flex items-center gap-2 text-lg font-semibold text-gray-700 hover:text-[${ACCENT_COLOR}] transition-colors`}
                        >
                            <ArrowLeft className="w-5 h-5" /> 
                            <span>Voltar para Depoimentos</span>
                        </button>
                    </div>

                    <div className="max-w-2xl mx-auto bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100">
                        
                        <div className="bg-gray-900 p-8 text-center">
                            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-[#ff5722]/10 mb-4">
                                <MessageSquare className="w-8 h-8 text-[#ff5722]" />
                            </div>
                            <h1 className="text-3xl font-bold text-white mb-2">Sua Opinião Importa</h1>
                            <p className="text-gray-400">
                                Conte como foi sua experiência na IESCursos.
                            </p>
                        </div>

                        <form onSubmit={handleSubmit} className="p-8 space-y-6">
                            
                            <div className="flex flex-col items-center justify-center mb-6">
                                <span className={labelClasses}>Qual sua nota para nós?</span>
                                <div className="flex gap-2">
                                    {[1, 2, 3, 4, 5].map((star) => (
                                        <button
                                            key={star}
                                            type="button"
                                            onClick={() => setRating(star)}
                                            onMouseEnter={() => setHoverRating(star)}
                                            onMouseLeave={() => setHoverRating(0)}
                                            className="focus:outline-none transition-transform hover:scale-110 p-1"
                                        >
                                            <Star
                                                size={32}
                                                className={`${
                                                    star <= (hoverRating || rating)
                                                        ? "fill-[#ff5722] text-[#ff5722]"
                                                        : "text-gray-300"
                                                } transition-colors duration-200`}
                                            />
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="grid md:grid-cols-2 gap-6">
                                <div>
                                    <label htmlFor="name" className={labelClasses}>Seu Nome</label>
                                    <input
                                        type="text"
                                        id="name"
                                        name="name"
                                        value={formData.name}
                                        onChange={handleChange}
                                        required
                                        placeholder="Ex: João Silva"
                                        className={inputClasses}
                                    />
                                </div>
                                
                                <div>
                                    <label htmlFor="course" className={labelClasses}>Curso Realizado</label>
                                    <div className="relative">
                                        <select
                                            id="course"
                                            name="course"
                                            value={formData.course}
                                            onChange={handleChange}
                                            required
                                            disabled={loadingCourses}
                                            className={inputClasses}
                                        >
                                            <option value="">
                                                {loadingCourses ? "Carregando cursos..." : "Selecione o curso"}
                                            </option>
                                            {allCourses.map(course => (
                                                <option key={course.id} value={course.name}>
                                                    {course.name} ({course.type === 'presencial' ? 'Presencial' : 'EAD'})
                                                </option>
                                            ))}
                                        </select>
                                        {loadingCourses && (
                                            <Loader2 className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 animate-spin text-gray-500" />
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div>
                                <label htmlFor="message" className={labelClasses}>Seu Depoimento</label>
                                <textarea
                                    id="message"
                                    name="message"
                                    value={formData.message}
                                    onChange={handleChange}
                                    required
                                    rows={4}
                                    placeholder="Conte como o curso ajudou na sua carreira..."
                                    className={`${inputClasses} resize-none`}
                                />
                                {/* 🆕 Contador de Caracteres */}
                                <div className="flex justify-end mt-1">
                                    <span className={`text-xs font-medium ${
                                        formData.message.length >= MAX_CHARS ? 'text-red-500' : 'text-gray-400'
                                    }`}>
                                        {formData.message.length}/{MAX_CHARS}
                                    </span>
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full bg-[#ff5722] text-white py-4 rounded-lg font-bold text-lg hover:bg-[#d66a1f] transition-all transform hover:-translate-y-1 shadow-lg hover:shadow-orange-500/30 flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed disabled:transform-none"
                            >
                                {loading ? (
                                    <>
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                        Enviando...
                                    </>
                                ) : (
                                    <>
                                        <Send className="w-5 h-5" />
                                        Enviar Avaliação
                                    </>
                                )}
                            </button>
                        </form>
                    </div>
                </div>
            </motion.main>
            <Footer />
        </>
    );
}