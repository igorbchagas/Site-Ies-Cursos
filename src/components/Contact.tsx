import { useState, useEffect } from 'react';
import { Send, MessageCircle, Loader2 } from 'lucide-react';
// REMOVIDA A IMPORTAÇÃO DE 'courses' LOCAL
import { motion } from 'framer-motion';
import { leadService } from '../services/leadService'; 
import { courseService } from '../services/courseService'; 
import { Course } from '../types'; 
import { toast } from 'sonner'; 
import DOMPurify from 'dompurify'; // Necessário para a sanitização de dados

// --- FUNÇÃO DE SANITIZAÇÃO ---
function sanitizeInput(dirtyString: string): string {
    // Sanitiza a string, removendo códigos maliciosos (XSS)
    return DOMPurify.sanitize(dirtyString);
}
// ----------------------------

export function Contact() {
    const [formData, setFormData] = useState({
        name: '',
        phone: '',
        whatsapp: '',
        course: '',
        contactTime: ''
    });
    
    const [loading, setLoading] = useState(false); 
    const [allCourses, setAllCourses] = useState<Course[]>([]); 
    const [loadingCourses, setLoadingCourses] = useState(true); 

    // EFEITO: Carrega a lista de cursos ativos para o seletor
    useEffect(() => {
        const fetchCourses = async () => {
            try {
                // Busca cursos do Supabase (via courseService.getAll, que chama a API pública)
                const coursesData = await courseService.getAll(); 
                setAllCourses(coursesData);
            } catch (error) {
                console.error("Erro ao carregar lista de cursos:", error);
                toast.error("Erro ao carregar cursos. Tente novamente mais tarde.");
            } finally {
                setLoadingCourses(false);
            }
        };
        fetchCourses();
    }, []);


    const handleSaveLead = async () => {
        // Encontra o curso pelo slug no estado de allCourses
        const selectedCourse = allCourses.find(c => c.slug === formData.course);

        // Prepara o payload, aplicando sanitização em todos os campos
        const payload = {
            nome: sanitizeInput(formData.name),
            telefone: sanitizeInput(formData.phone),
            curso_interesse: sanitizeInput(selectedCourse?.name || 'Não especificado'),
            horario_interesse: sanitizeInput(formData.contactTime || 'Qualquer horário')
        };

        try {
            await leadService.create(payload);
            return true; 
        } catch (error: any) {
            console.error("Erro ao salvar lead:", error);

            if (error.message === 'RATE_LIMIT_EXCEEDED') {
                toast.warning("Aguarde um momento!", {
                    description: "Você só pode enviar o formulário uma vez por minuto. Tente novamente em breve."
                });
            } else {
                toast.error("Erro ao salvar contato.", {
                    description: "Ocorreu uma falha no registro dos seus dados. Tente novamente mais tarde."
                });
            }
            return false;
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        // Validação de campos obrigatórios
        if (!formData.name || !formData.phone || !formData.whatsapp) {
            toast.error("Preenchimento obrigatório.", {
                description: "Por favor, preencha nome, telefone e WhatsApp."
            });
            return;
        }
        
        // Validação da Checkbox de LGPD
        const lgpdChecked = (document.getElementById('lgpd-consent') as HTMLInputElement)?.checked;
        if (!lgpdChecked) {
             toast.error("Consentimento LGPD necessário.", {
                description: "É obrigatório concordar com o uso dos dados para contato."
            });
            return;
        }


        setLoading(true);
        const savedSuccessfully = await handleSaveLead();

        if (savedSuccessfully) {
            const selectedCourse = allCourses.find(c => c.slug === formData.course);
            
            // Mensagem de WhatsApp
            const message = `Olá! Gostaria de mais informações sobre os cursos da IesCursos.

Nome: ${formData.name}
Telefone: ${formData.phone}
WhatsApp: ${formData.whatsapp}
Curso de Interesse: ${selectedCourse?.name || 'Não especificado'}
Melhor horário para contato: ${formData.contactTime || 'Qualquer horário'}

Aguardo retorno. Obrigado!`;

            const whatsappUrl = `https://wa.me/5538988630487?text=${encodeURIComponent(message)}`;
            
            window.open(whatsappUrl, '_blank');
            
            toast.success("Dados enviados!", {
                description: "Redirecionando você para o WhatsApp. Seus dados foram salvos para contato."
            });

            setFormData({ name: '', phone: '', whatsapp: '', course: '', contactTime: '' });
        }
        
        setLoading(false);
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };


    return (
        <section id="contact" className="py-20 bg-[#343A40]">
            <div className="container mx-auto px-4">
                <motion.div
                    initial={{ opacity: 0, y: 40, scale: 0.9, filter: 'blur(12px)' }}
                    whileInView={{ opacity: 1, y: 0, scale: 1, filter: 'blur(0px)' }}
                    viewport={{ once: false, amount: 0.3 }}
                    transition={{ duration: 0.55, ease: [0.19, 1, 0.22, 1] }}
                    className="max-w-4xl mx-auto"
                >
                    {/* CABEÇALHO RESTAURADO */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: false, amount: 0.4 }}
                        transition={{ duration: 0.5, ease: [0.19, 1, 0.22, 1] }}
                        className="text-center mb-12"
                    >
                        <motion.div
                            initial={{ opacity: 0, y: 12 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: false, amount: 0.4 }}
                            transition={{ delay: 0.05, duration: 0.45 }}
                        >
                            <MessageCircle className="w-16 h-16 text-white mx-auto mb-4" />
                        </motion.div>

                        <motion.h2
                            initial={{ opacity: 0, y: 12 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: false, amount: 0.4 }}
                            transition={{ delay: 0.1, duration: 0.5 }}
                            className="text-4xl lg:text-5xl font-bold text-white mb-4"
                        >
                            Entre em Contato
                        </motion.h2>

                        <motion.p
                            initial={{ opacity: 0, y: 12 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: false, amount: 0.4 }}
                            transition={{ delay: 0.15, duration: 0.5 }}
                            className="text-xl text-white"
                        >
                            Preencha o formulário e entraremos em contato pelo WhatsApp
                        </motion.p>
                    </motion.div>


                    {/* Card do formulário */}
                    <motion.div
                        initial={{ opacity: 0, y: 40, scale: 0.9, filter: 'blur(10px)' }}
                        whileInView={{ opacity: 1, y: 0, scale: 1, filter: 'blur(0px)' }}
                        viewport={{ once: false, amount: 0.3 }}
                        transition={{ duration: 0.6, ease: [0.19, 1, 0.22, 1] }}
                        className="bg-gray-50 rounded-2xl shadow-xl p-8"
                    >
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="grid md:grid-cols-2 gap-6">
                                <div>
                                    <label htmlFor="name" className="block text-gray-700 font-semibold mb-2">
                                        Nome completo
                                    </label>
                                    <input
                                        type="text"
                                        id="name"
                                        name="name"
                                        required
                                        value={formData.name}
                                        onChange={handleChange}
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#A8430F] focus:border-transparent outline-none transition bg-white"
                                        placeholder="Seu nome completo"
                                    />
                                </div>

                                <div>
                                    <label htmlFor="phone" className="block text-gray-700 font-semibold mb-2">
                                        Telefone (para contato)
                                    </label>
                                    <input
                                        type="tel"
                                        id="phone"
                                        name="phone"
                                        required
                                        value={formData.phone}
                                        onChange={handleChange}
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#A8430F] focus:border-transparent outline-none transition bg-white"
                                        placeholder="(11) 99999-9999"
                                    />
                                </div>
                            </div>

                            <div>
                                <label htmlFor="whatsapp" className="block text-gray-700 font-semibold mb-2">
                                    WhatsApp (para redirecionamento)
                                </label>
                                <input
                                    type="tel"
                                    id="whatsapp"
                                    name="whatsapp"
                                    required
                                    value={formData.whatsapp}
                                    onChange={handleChange}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#A8430F] focus:border-transparent outline-none transition bg-white"
                                    placeholder="(11) 99999-9999"
                                />
                            </div>

                            <div>
                                <label htmlFor="course" className="block text-gray-700 font-semibold mb-2">
                                    Curso de interesse
                                </label>
                                {loadingCourses ? (
                                    <div className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-white flex items-center gap-2 text-gray-500">
                                        <Loader2 className="w-4 h-4 animate-spin" /> Carregando cursos...
                                    </div>
                                ) : (
                                    <select
                                        id="course"
                                        name="course"
                                        value={formData.course}
                                        onChange={handleChange}
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#A8430F] focus:border-transparent outline-none transition bg-white"
                                        disabled={loadingCourses}
                                    >
                                        <option value="">Selecione um curso</option>
                                        {allCourses.map(course => ( // <-- USANDO O ESTADO AGORA
                                            <option key={course.id} value={course.slug}>
                                                {course.name}
                                            </option>
                                        ))}
                                    </select>
                                )}
                            </div>

                            <div>
                                <label htmlFor="contactTime" className="block text-gray-700 font-semibold mb-2">
                                    Melhor horário para contato
                                </label>
                                <select
                                    id="contactTime"
                                    name="contactTime"
                                    value={formData.contactTime}
                                    onChange={handleChange}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#A8430F] focus:border-transparent outline-none transition bg-white"
                                >
                                    <option value="">Selecione um horário</option>
                                    <option value="Manhã (08h às 11h)">Manhã (08h às 11h)</option>
                                    <option value="Tarde (13h às 18h)">Tarde (13h às 18h)</option>
                                    <option value="Noite (18h às 21h)">Noite (18h às 21h)</option>
                                    <option value="Qualquer horário">Qualquer horário</option>
                                </select>
                            </div>
                            
                            {/* Checkbox de Consentimento LGPD */}
                            <div className='flex items-start gap-3 pt-2'>
                                <input type="checkbox" id="lgpd-consent" name="lgpd-consent" required className='mt-1 w-4 h-4 text-[#A8430F] bg-gray-100 border-gray-300 rounded focus:ring-[#A8430F]' />
                                <label htmlFor="lgpd-consent" className="text-sm text-gray-600">
                                    Ao clicar, você concorda com o uso de seus dados para que um de nossos consultores entre em contato via WhatsApp e telefone.
                                </label>
                            </div>


                            <motion.button
                                type="submit"
                                disabled={loading || loadingCourses}
                                whileHover={{ scale: loading || loadingCourses ? 1 : 1.02 }}
                                whileTap={{ scale: loading || loadingCourses ? 1 : 0.98 }}
                                transition={{ duration: 0.15, ease: 'easeOut' }}
                                className="w-full bg-[#A8430F] text-white py-4 rounded-lg font-bold text-lg hover:bg-[#d66a1f] transition-colors flex items-center justify-center gap-2 shadow-lg disabled:bg-gray-500 disabled:shadow-none disabled:cursor-not-allowed"
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
                            </motion.button>
                        </form>
                    </motion.div>
                </motion.div>
            </div>
        </section>
    );
}