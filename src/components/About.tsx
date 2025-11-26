import { Users, Award, BookOpen, Clock, HeartHandshake, Target } from 'lucide-react';
import { motion } from 'framer-motion';

export function About() {
  const features = [
    {
      icon: Users,
      title: 'Professores capacitados',
      description: 'Equipe experiente e qualificada para o melhor aprendizado'
    },
    {
      icon: Award,
      title: 'Certificado reconhecido',
      description: 'Certificação válida em todo território nacional'
    },
    {
      icon: BookOpen,
      title: 'Aulas práticas',
      description: 'Aprenda fazendo com exercícios reais do mercado'
    },
    {
      icon: Target,
      title: 'Material didático atualizado',
      description: 'Conteúdo sempre atualizado com as tendências do mercado'
    },
    {
      icon: HeartHandshake,
      title: 'Suporte ao aluno',
      description: 'Acompanhamento completo durante todo o curso'
    },
    {
      icon: Clock,
      title: 'Flexibilidade de horários',
      description: 'Turmas em diversos horários para sua comodidade'
    }
  ];

  return (
    <section id="about" className="py-20 bg-[#EFE6DD]">
      <div className="container mx-auto px-4">

        {/* Título / topo */}
        <motion.div
          initial={{ opacity: 0, y: 40, scale: 0.9, filter: 'blur(12px)' }}
          whileInView={{ opacity: 1, y: 0, scale: 1, filter: 'blur(0px)' }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.55, ease: [0.19, 1, 0.22, 1] }}
          className="text-center mb-16"
        >
          <div>
            <span className="text-[#A8430F] font-semibold text-lg">Diferenciais</span>
            <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 mt-2 mb-4">
              Por que estudar na IesCursos?
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Oferecemos mais que cursos, oferecemos transformação profissional
            </p>
          </div>
        </motion.div>

        {/* Grid de diferenciais */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 40, scale: 0.9, filter: 'blur(10px)' }}
              whileInView={{ opacity: 1, y: 0, scale: 1, filter: 'blur(0px)' }}
              viewport={{ once: false, amount: 0.2 }}
              transition={{
                duration: 0.55,
                ease: [0.19, 1, 0.22, 1],
                delay: index * 0.06, // efeito "onda" leve
              }}
              whileHover={{
                y: -10,
                scale: 1.04,
                boxShadow: '0 25px 50px -15px rgba(0,0,0,0.25)',
                transition: { duration: 0.18, ease: 'easeOut' }, // hover rápido
              }}
              className="bg-gray-50 rounded-xl p-8 cursor-default"
            >
              <motion.div
                whileHover={{ scale: 1.08 }}
                transition={{ duration: 0.18, ease: 'easeOut' }}
                className="bg-[#A8430F] w-16 h-16 rounded-full flex items-center justify-center mb-6"
              >
                <feature.icon className="w-8 h-8 text-white" />
              </motion.div>

              <h3 className="text-xl font-bold text-gray-900 mb-3">
                {feature.title}
              </h3>
              <p className="text-gray-600 leading-relaxed">
                {feature.description}
              </p>
            </motion.div>
          ))}
        </div>

        {/* Bloco de números */}
        <motion.div
          initial={{ opacity: 0, y: 40, scale: 0.9, filter: 'blur(10px)' }}
          whileInView={{ opacity: 1, y: 0, scale: 1, filter: 'blur(0px)' }}
          viewport={{ once: false, amount: 0.25 }}
          transition={{ duration: 0.6, ease: [0.19, 1, 0.22, 1] }}
          className="mt-16 bg-gradient-to-br from-black to-gray-900 rounded-2xl p-12 text-white"
        >
          <div className="grid lg:grid-cols-3 gap-8 text-center">
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ delay: 0.1, duration: 0.45 }}
            >
              <p className="text-5xl font-bold text-[#A8430F] mb-2">15+</p>
              <p className="text-xl">Anos de experiência</p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ delay: 0.16, duration: 0.45 }}
            >
              <p className="text-5xl font-bold text-[#A8430F] mb-2">5.000+</p>
              <p className="text-xl">Alunos formados</p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ delay: 0.22, duration: 0.45 }}
            >
              <p className="text-5xl font-bold text-[#A8430F] mb-2">98%</p>
              <p className="text-xl">Satisfação dos alunos</p>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
