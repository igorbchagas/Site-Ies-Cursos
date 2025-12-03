// src/pages/Contact.tsx

import { useState, useEffect } from 'react';
import { Send, MessageCircle, Loader2, MapPin, Phone, Mail } from 'lucide-react';
import { leadService } from '../services/leadService';
import { courseService } from '../services/courseService';
import { Course } from '../types';
import { toast } from 'sonner';
import DOMPurify from 'dompurify';

// Sanitização local (opcional, pois o service já faz, mas mal não faz)
function sanitizeInput(dirtyString: string): string {
    return DOMPurify.sanitize(dirtyString);
}

export function Contact() {
    const [formData, setFormData] = useState({
        name: '',
        phone: '',
        whatsapp: true,
        course: '',
        contactTime: ''
    });

    const [loading, setLoading] = useState(false);
    const [allCourses, setAllCourses] = useState<Course[]>([]);
    const [loadingCourses, setLoadingCourses] = useState(true);

    // Carregar cursos
    useEffect(() => {
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

    const handleChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
    ) => {
        const { name, value, type } = e.target;
        // Checkbox precisa de tratamento especial no TS
        const checked = (e.target as HTMLInputElement).checked;

        const sanitizedValue = name === "name" ? sanitizeInput(value) : value;

        setFormData(prev => ({
            ...prev,
            [name]: type === "checkbox" ? checked : sanitizedValue
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            // Validação simples
            if (!formData.name || !formData.phone || !formData.course) {
                toast.error("Por favor, preencha nome, telefone e o curso de interesse.");
                setLoading(false);
                return;
            }

            const phoneValue = formData.phone || '';

            // --- CORREÇÃO AQUI ---
            // Mapeamos os nomes do formulário (course, contactTime) 
            // para os nomes que o Banco de Dados/Service esperam (curso_interesse, horario_interesse)
            const payloadToSend = {
                nome: sanitizeInput(formData.name),
                telefone: phoneValue.replace(/\D/g, ""), // Remove tudo que não é número
                curso_interesse: sanitizeInput(formData.course),
                horario_interesse: sanitizeInput(formData.contactTime || "Não informado")
            };

            // Envia para o banco de dados
            await leadService.create(payloadToSend);

            toast.success("Dados salvos com sucesso! Redirecionando para o WhatsApp...");

            // Gera link do WhatsApp e redireciona
            const whatsappMessage = `Olá, meu nome é ${payloadToSend.nome}, gostaria de saber mais sobre o curso de ${payloadToSend.curso_interesse}. Meu telefone é ${formData.phone}.`;
            const whatsappUrl = `https://wa.me/5538988630487?text=${encodeURIComponent(whatsappMessage)}`;

            // Pequeno delay para garantir que o toast apareça antes de abrir a nova aba
            setTimeout(() => {
                window.open(whatsappUrl, '_blank');
                // Limpa o formulário após o envio bem-sucedido
                setFormData({
                    name: '',
                    phone: '',
                    whatsapp: true,
                    course: '',
                    contactTime: ''
                });
            }, 1000);

        } catch (error) {
            console.error("Erro ao salvar lead:", error);
            toast.error("Ocorreu um erro ao enviar seus dados. Tente novamente.");
        } finally {
            setLoading(false);
        }
    };

    // Estilos (mantidos)
    const sectionClasses = "py-20 bg-gray-900 text-white";
    const cardClasses = "bg-white p-8 lg:p-12 rounded-xl shadow-2xl";
    const titleClasses = "text-3xl lg:text-4xl font-bold text-gray-900 mb-6";
    const inputClasses = "w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#E45B25] focus:border-[#E45B25] transition duration-150 text-gray-800";
    const buttonClasses = "w-full bg-[#E45B25] text-white py-4 rounded-lg font-bold text-lg hover:bg-[#d66a1f] transition-colors flex items-center justify-center gap-2 shadow-lg disabled:bg-gray-500 disabled:shadow-none disabled:cursor-not-allowed";

    return (
        <section id="contact" className={sectionClasses}>
            <div className="container mx-auto px-4">
                <div className="grid lg:grid-cols-2 gap-12 items-center">

                    {/* COLUNA ESQUERDA */}
                    <div className="space-y-8">
                        <span className="text-[#E45B25] font-semibold text-lg uppercase tracking-wider">
                            Fale Conosco
                        </span>
                        <h2 className="text-4xl lg:text-5xl font-bold leading-tight text-white">
                            Vamos tirar suas dúvidas e te ajudar a escolher o curso ideal.
                        </h2>
                        <p className="text-xl text-gray-400">
                            Preencha o formulário para que um de nossos consultores entre em contato com você via WhatsApp.
                        </p>

                        <div className="space-y-4 pt-4">
                            <div className="flex items-center gap-4">
                                <MapPin className="w-7 h-7 text-[#E45B25] flex-shrink-0" />
                                <span className="text-gray-300">Rua: Canabrava, : 100 - Centro, Unaí - MG, 38610-031</span>
                            </div>
                            <div className="flex items-center gap-4">
                                <Phone className="w-7 h-7 text-[#E45B25] flex-shrink-0" />
                                <span className="text-gray-300">(38) 98863-0487</span>
                            </div>
                            <div className="flex items-center gap-4">
                                <Mail className="w-7 h-7 text-[#E45B25] flex-shrink-0" />
                                <span className="text-gray-300">iescursos@gmail.com.br</span>
                            </div>
                        </div>
                    </div>

                    {/* COLUNA DIREITA - FORMULÁRIO */}
                    <div className={cardClasses}>
                        <h3 className={titleClasses}>
                            <MessageCircle className="inline-block w-8 h-8 mr-2 text-[#E45B25]" />
                            Solicitar Contato
                        </h3>

                        <form onSubmit={handleSubmit} className="space-y-5 text-gray-800">

                            {/* Nome */}
                            <div>
                                <label htmlFor="name" className="block text-sm font-medium mb-1">Nome Completo</label>
                                <input
                                    type="text"
                                    id="name"
                                    name="name"
                                    value={formData.name}
                                    onChange={handleChange}
                                    required
                                    className={inputClasses}
                                    placeholder="Seu nome"
                                />
                            </div>

                            {/* Telefone */}
                            <div>
                                <label htmlFor="phone" className="block text-sm font-medium mb-1">Telefone (DDD + Número)</label>
                                <input
                                    type="tel"
                                    id="phone"
                                    name="phone"
                                    value={formData.phone}
                                    onChange={handleChange}
                                    required
                                    className={inputClasses}
                                    placeholder="(38) 98863-0487"
                                />
                            </div>

                            {/* Curso */}
                            <div>
                                <label htmlFor="course" className="block text-sm font-medium mb-1">Curso de Interesse</label>
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

                            {/* Horário */}
                            <div>
                                <label htmlFor="contactTime" className="block text-sm font-medium mb-1">Melhor Horário para Contato</label>
                                <select
                                    id="contactTime"
                                    name="contactTime"
                                    value={formData.contactTime}
                                    onChange={handleChange}
                                    className={inputClasses}
                                >
                                    <option value="">Qual o melhor horário para te ligarmos?</option>
                                    <option value="Manha">Manhã (08h - 12h)</option>
                                    <option value="Tarde">Tarde (12h - 18h)</option>
                                    <option value="Noite">Noite (18h - 21h)</option>
                                    <option value="Whatsapp">Prefiro contato apenas pelo WhatsApp</option>
                                </select>
                            </div>

                            {/* Checkbox */}
                            <div className="flex items-start">
                                <input
                                    type="checkbox"
                                    id="whatsappCheck"
                                    name="whatsapp"
                                    checked={formData.whatsapp}
                                    onChange={handleChange}
                                    className="mt-1 h-5 w-5 text-[#E45B25] border-gray-300 rounded focus:ring-[#E45B25]"
                                />
                                <label htmlFor="whatsappCheck" className="ml-2 block text-sm font-medium text-gray-700">
                                    Concordo em receber contato e informações do curso pelo WhatsApp.
                                </label>
                            </div>

                            {/* Botão */}
                            <button
                                type="submit"
                                disabled={loading || loadingCourses}
                                className={buttonClasses}
                            >
                                {loading ? (
                                    <>
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                        Salvando dados...
                                    </>
                                ) : (
                                    <>
                                        <Send className="w-5 h-5" />
                                        Enviar e receber contato pelo WhatsApp
                                    </>
                                )}
                            </button>

                        </form>
                    </div>

                </div>
            </div>
        </section>
    );
}