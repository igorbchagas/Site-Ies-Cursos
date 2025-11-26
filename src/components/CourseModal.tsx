import { X, Check, Clock, Award, MapPin, Monitor, DollarSign } from 'lucide-react';
import { Course } from '../types';
import { motion } from 'framer-motion';

interface CourseModalProps {
  course: Course | null;
  onClose: () => void;
}

export function CourseModal({ course, onClose }: CourseModalProps) {
  if (!course) return null;

  const handleEnroll = () => {
    const message = `Olá! Gostaria de me matricular no curso:

Curso: ${course.name}
Modalidade: ${course.type === 'presencial' ? 'Presencial' : 'EAD'}
Valor: R$ ${course.price.toFixed(2)}

Gostaria de mais informações sobre matrícula e formas de pagamento.`;

    const whatsappUrl = `https://wa.me/5511999999999?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  };

  const isPresencial = course.type === 'presencial';

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      {/* Overlay escuro */}
      <motion.div
        className="absolute inset-0 bg-black/60"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      />

      {/* Wrapper com perspectiva 3D */}
      <div
        className="relative w-full max-w-4xl my-8 max-h-[90vh]"
        style={{ perspective: 1400 }}
      >
        {/* Morph card → posição do modal */}
        <motion.div
          layoutId={`course-card-${course.id}`} // mesmo id do CourseCard
          className="w-full h-full"
        >
          {/* Animação de entrada do modal (mantida) */}
          <motion.div
            initial={{
              scale: 0.9,
              opacity: 0,
              rotateY: -80,
              y: 20,
            }}
            animate={{
              scale: 1,
              opacity: 1,
              rotateY: 0,
              y: 0,
            }}
            exit={{
              scale: 0.9,
              opacity: 0,
              rotateY: 80,
              y: 20,
            }}
            transition={{
              duration: 0.5,
              ease: [0.22, 0.8, 0.3, 1],
            }}
            style={{
              transformStyle: 'preserve-3d',
              transformOrigin: 'center center',
            }}
            className="bg-white rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
          >
            {/* Cabeçalho fixo */}
            <div className="sticky top-0 bg-gradient-to-r from-[#F27A24] to-[#d66a1f] text-white p-6 flex justify-between items-center rounded-t-2xl z-10">
              <div>
                <motion.h2
                  initial={{ opacity: 0, y: 10, filter: 'blur(6px)' }}
                  animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                  transition={{ delay: 0.08, duration: 0.4, ease: [0.19, 1, 0.22, 1] }}
                  className="text-3xl font-bold mb-2"
                >
                  {course.name}
                </motion.h2>
                <motion.div
                  initial={{ opacity: 0, y: 10, filter: 'blur(6px)' }}
                  animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                  transition={{ delay: 0.14, duration: 0.4, ease: [0.19, 1, 0.22, 1] }}
                  className="flex items-center gap-2"
                >
                  {isPresencial ? (
                    <MapPin className="w-5 h-5" />
                  ) : (
                    <Monitor className="w-5 h-5" />
                  )}
                  <span className="font-semibold">
                    {isPresencial ? 'Presencial' : 'EAD'}
                  </span>
                </motion.div>
              </div>
              <motion.button
                initial={{ opacity: 0, scale: 0.8, filter: 'blur(4px)' }}
                animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
                transition={{ delay: 0.18, duration: 0.35, ease: [0.19, 1, 0.22, 1] }}
                onClick={onClose}
                className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center hover:bg-white/30 transition-colors"
              >
                <X className="w-6 h-6" />
              </motion.button>
            </div>

            {/* Conteúdo rolável */}
            <div className="p-8 overflow-y-auto">
              {/* Cards de info rápida */}
              <motion.div
                initial={{ opacity: 0, y: 18, filter: 'blur(10px)' }}
                whileInView={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                viewport={{ once: false, amount: 0.3 }}
                transition={{ duration: 0.55, ease: [0.19, 1, 0.22, 1] }}
                className="grid md:grid-cols-3 gap-6 mb-8"
              >
                <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
                  <Clock className="w-8 h-8 text-[#F27A24]" />
                  <div>
                    <p className="text-sm text-gray-600">Duração</p>
                    <p className="font-semibold">{course.duration}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
                  <Award className="w-8 h-8 text-[#F27A24]" />
                  <div>
                    <p className="text-sm text-gray-600">Carga horária</p>
                    <p className="font-semibold">{course.workload}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
                  <DollarSign className="w-8 h-8 text-[#F27A24]" />
                  <div>
                    <p className="text-sm text-gray-600">Investimento</p>
                    <p className="font-semibold text-[#F27A24]">
                      R$ {course.price.toFixed(2)}
                    </p>
                  </div>
                </div>
              </motion.div>

              {/* Sobre o curso */}
              <motion.div
                initial={{ opacity: 0, y: 18, filter: 'blur(10px)' }}
                whileInView={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                viewport={{ once: false, amount: 0.3 }}
                transition={{ duration: 0.55, ease: [0.19, 1, 0.22, 1] }}
                className="mb-8"
              >
                <h3 className="text-2xl font-bold text-gray-900 mb-4">
                  Sobre o curso
                </h3>
                <p className="text-gray-700 leading-relaxed">
                  {course.description}
                </p>
              </motion.div>

              {/* O que você vai aprender */}
              <motion.div
                initial={{ opacity: 0, y: 20, filter: 'blur(10px)' }}
                whileInView={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                viewport={{ once: false, amount: 0.3 }}
                transition={{ duration: 0.55, ease: [0.19, 1, 0.22, 1] }}
                className="mb-8"
              >
                <h3 className="text-2xl font-bold text-gray-900 mb-4">
                  O que você vai aprender
                </h3>
                <div className="grid md:grid-cols-2 gap-3">
                  {course.content.map((item, index) => (
                    <div key={index} className="flex items-start gap-2">
                      <Check className="w-5 h-5 text-[#F27A24] flex-shrink-0 mt-0.5" />
                      <span className="text-gray-700">{item}</span>
                    </div>
                  ))}
                </div>
              </motion.div>

              {/* Benefícios */}
              <motion.div
                initial={{ opacity: 0, y: 22, filter: 'blur(12px)' }}
                whileInView={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                viewport={{ once: false, amount: 0.3 }}
                transition={{ duration: 0.55, ease: [0.19, 1, 0.22, 1] }}
                className="mb-8"
              >
                <h3 className="text-2xl font-bold text-gray-900 mb-4">
                  Benefícios do curso
                </h3>
                <div className="grid md:grid-cols-2 gap-3">
                  {course.benefits.map((benefit, index) => (
                    <div key={index} className="flex items-start gap-2">
                      <Check className="w-5 h-5 text-[#F27A24] flex-shrink-0 mt-0.5" />
                      <span className="text-gray-700">{benefit}</span>
                    </div>
                  ))}
                </div>
              </motion.div>

              {/* FAQ */}
              <motion.div
                initial={{ opacity: 0, y: 24, filter: 'blur(12px)' }}
                whileInView={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                viewport={{ once: false, amount: 0.3 }}
                transition={{ duration: 0.55, ease: [0.19, 1, 0.22, 1] }}
                className="bg-gray-50 rounded-xl p-6 mb-8"
              >
                <h3 className="text-xl font-bold text-gray-900 mb-4">
                  Perguntas Frequentes
                </h3>
                <div className="space-y-4">
                  <div>
                    <p className="font-semibold text-gray-900 mb-1">
                      Preciso ter conhecimento prévio?
                    </p>
                    <p className="text-gray-700 text-sm">
                      {course.slug.includes('basica') || course.slug.includes('auxiliar')
                        ? 'Não, o curso é voltado para iniciantes e não requer conhecimento prévio.'
                        : 'É recomendado ter conhecimentos básicos, mas não é obrigatório.'}
                    </p>
                  </div>

                  <div>
                    <p className="font-semibold text-gray-900 mb-1">
                      Recebo certificado?
                    </p>
                    <p className="text-gray-700 text-sm">
                      Sim, ao concluir o curso você receberá certificado reconhecido válido em todo território nacional.
                    </p>
                  </div>

                  <div>
                    <p className="font-semibold text-gray-900 mb-1">
                      Como funciona o pagamento?
                    </p>
                    <p className="text-gray-700 text-sm">
                      Oferecemos diversas formas de pagamento: cartão de crédito, PIX, boleto e parcelamento. Entre em contato para conhecer as condições.
                    </p>
                  </div>

                  <div>
                    <p className="font-semibold text-gray-900 mb-1">
                      Quando começam as turmas?
                    </p>
                    <p className="text-gray-700 text-sm">
                      Temos turmas iniciando mensalmente. Entre em contato para saber a próxima turma disponível.
                    </p>
                  </div>
                </div>
              </motion.div>

              {/* Botões finais */}
              <motion.div
                initial={{ opacity: 0, y: 26, filter: 'blur(10px)' }}
                whileInView={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                viewport={{ once: false, amount: 0.3 }}
                transition={{ duration: 0.55, ease: [0.19, 1, 0.22, 1] }}
                className="flex flex-col sm:flex-row gap-4"
              >
                <button
                  onClick={handleEnroll}
                  className="flex-1 bg-[#F27A24] text-white py-4 rounded-lg font-bold text-lg hover:bg-[#d66a1f] transition-all hover:scale-105 shadow-lg"
                >
                  Quero me matricular
                </button>
                <button
                  onClick={onClose}
                  className="px-8 py-4 border-2 border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
                >
                  Fechar
                </button>
              </motion.div>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </motion.div>
  );
}

/*import { X, Check, Clock, Award, MapPin, Monitor, DollarSign } from 'lucide-react';
import { Course } from '../types';

interface CourseModalProps {
  course: Course | null;
  onClose: () => void;
}

export function CourseModal({ course, onClose }: CourseModalProps) {
  if (!course) return null;

  const handleEnroll = () => {
    const message = `Olá! Gostaria de me matricular no curso:

Curso: ${course.name}
Modalidade: ${course.type === 'presencial' ? 'Presencial' : 'EAD'}
Valor: R$ ${course.price.toFixed(2)}

Gostaria de mais informações sobre matrícula e formas de pagamento.`;

    const whatsappUrl = `https://wa.me/5511999999999?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto my-8">
        <div className="sticky top-0 bg-gradient-to-r from-[#A8430F] to-[#d66a1f] text-white p-6 flex justify-between items-center rounded-t-2xl">
          <div>
            <h2 className="text-3xl font-bold mb-2">{course.name}</h2>
            <div className="flex items-center gap-2">
              {course.type === 'presencial' ? (
                <MapPin className="w-5 h-5" />
              ) : (
                <Monitor className="w-5 h-5" />
              )}
              <span className="font-semibold">
                {course.type === 'presencial' ? 'Presencial' : 'EAD'}
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center hover:bg-white/30 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-8">
          <div className="grid md:grid-cols-3 gap-6 mb-8">
            <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
              <Clock className="w-8 h-8 text-[#A8430F]" />
              <div>
                <p className="text-sm text-gray-600">Duração</p>
                <p className="font-semibold">{course.duration}</p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
              <Award className="w-8 h-8 text-[#A8430F]" />
              <div>
                <p className="text-sm text-gray-600">Carga horária</p>
                <p className="font-semibold">{course.workload}</p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
              <DollarSign className="w-8 h-8 text-[#A8430F]" />
              <div>
                <p className="text-sm text-gray-600">Investimento</p>
                <p className="font-semibold text-[#A8430F]">R$ {course.price.toFixed(2)}</p>
              </div>
            </div>
          </div>

          <div className="mb-8">
            <h3 className="text-2xl font-bold text-gray-900 mb-4">Sobre o curso</h3>
            <p className="text-gray-700 leading-relaxed">{course.description}</p>
          </div>

          <div className="mb-8">
            <h3 className="text-2xl font-bold text-gray-900 mb-4">O que você vai aprender</h3>
            <div className="grid md:grid-cols-2 gap-3">
              {course.content.map((item, index) => (
                <div key={index} className="flex items-start gap-2">
                  <Check className="w-5 h-5 text-[#A8430F] flex-shrink-0 mt-0.5" />
                  <span className="text-gray-700">{item}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="mb-8">
            <h3 className="text-2xl font-bold text-gray-900 mb-4">Benefícios do curso</h3>
            <div className="grid md:grid-cols-2 gap-3">
              {course.benefits.map((benefit, index) => (
                <div key={index} className="flex items-start gap-2">
                  <Check className="w-5 h-5 text-[#A8430F] flex-shrink-0 mt-0.5" />
                  <span className="text-gray-700">{benefit}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-gray-50 rounded-xl p-6 mb-8">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Perguntas Frequentes</h3>
            <div className="space-y-4">
              <div>
                <p className="font-semibold text-gray-900 mb-1">Preciso ter conhecimento prévio?</p>
                <p className="text-gray-700 text-sm">
                  {course.slug.includes('basica') || course.slug.includes('auxiliar')
                    ? 'Não, o curso é voltado para iniciantes e não requer conhecimento prévio.'
                    : 'É recomendado ter conhecimentos básicos, mas não é obrigatório.'}
                </p>
              </div>

              <div>
                <p className="font-semibold text-gray-900 mb-1">Recebo certificado?</p>
                <p className="text-gray-700 text-sm">
                  Sim, ao concluir o curso você receberá certificado reconhecido válido em todo território nacional.
                </p>
              </div>

              <div>
                <p className="font-semibold text-gray-900 mb-1">Como funciona o pagamento?</p>
                <p className="text-gray-700 text-sm">
                  Oferecemos diversas formas de pagamento: cartão de crédito, PIX, boleto e parcelamento. Entre em contato para conhecer as condições.
                </p>
              </div>

              <div>
                <p className="font-semibold text-gray-900 mb-1">Quando começam as turmas?</p>
                <p className="text-gray-700 text-sm">
                  Temos turmas iniciando mensalmente. Entre em contato para saber a próxima turma disponível.
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4">
            <button
              onClick={handleEnroll}
              className="flex-1 bg-[#A8430F] text-white py-4 rounded-lg font-bold text-lg hover:bg-[#d66a1f] transition-all hover:scale-105 shadow-lg"
            >
              Quero me matricular
            </button>
            <button
              onClick={onClose}
              className="px-8 py-4 border-2 border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
            >
              Fechar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}*/
