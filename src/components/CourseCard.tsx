import { useState } from 'react';
import { Clock, Award, ArrowRight, MapPin, Monitor } from 'lucide-react';
import { motion } from 'framer-motion';
import { Course } from '../types';

interface CourseCardProps {
  course: Course;
  onLearnMore: (course: Course) => void;
}

export function CourseCard({ course, onLearnMore }: CourseCardProps) {
  const isPresencial = course.type === 'presencial';
  const [hover, setHover] = useState(false);

  return (
    <motion.div
      layoutId={`course-card-${course.id}`} // 🔥 base da transição card → modal
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      initial={{
        opacity: 0,
        y: 40,
        scale: 0.9,
        filter: 'blur(12px)',
      }}
      whileInView={{
        opacity: 1,
        y: 0,
        scale: 1,
        filter: 'blur(0px)',
      }}
      viewport={{ once: false, amount: 0.25 }}
      whileHover={{
        y: -10,
        scale: 1.04,
        boxShadow: '0 35px 65px -15px rgba(0,0,0,0.35)',
      }}
      transition={{
        duration: 0.6,
        ease: [0.19, 1, 0.22, 1], // ease premium
      }}
      style={{ perspective: 1200 }}
      className="relative bg-white rounded-xl shadow-lg overflow-hidden flex flex-col h-full"
    >
      {/* Topo colorido */}
      <div className="h-48 bg-gradient-to-br from-[#A8430F] to-[#d66a1f] relative overflow-hidden">
        {/* Ícone com animação suave no hover */}
        <motion.div
          initial={{ scale: 1.2, opacity: 0.3 }}
          animate={{
            scale: hover ? 1.4 : 1.2,
            opacity: hover ? 0.45 : 0.3,
          }}
          transition={{ duration: 0.6 }}
          className="absolute inset-0 flex items-center justify-center"
        >
          {isPresencial ? (
            <MapPin className="w-20 h-20 text-white/30" />
          ) : (
            <Monitor className="w-20 h-20 text-white/30" />
          )}
        </motion.div>

        {/* Shimmer suave no topo, sem mudar a cor geral */}
        <motion.div
          aria-hidden
          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
          style={{ mixBlendMode: 'screen' }}
          initial={{ x: '-160%' }}
          animate={hover ? { x: ['-160%', '160%'] } : { x: '-160%' }}
          transition={
            hover
              ? { duration: 1.1, repeat: Infinity, ease: 'easeInOut' }
              : { duration: 0.4 }
          }
        />

        {/* Badge de modalidade */}
        <motion.span
          initial={{ y: -14, opacity: 0 }}
          whileInView={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.12, duration: 0.4 }}
          className="absolute top-4 right-4 bg-white text-[#A8430F] px-3 py-1 rounded-full text-sm font-semibold shadow"
        >
          {isPresencial ? 'Presencial' : 'EAD'}
        </motion.span>
      </div>

      {/* Conteúdo */}
      <div className="p-6 flex flex-col flex-grow">
        <motion.h3
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.4 }}
          className="text-2xl font-bold text-gray-900 mb-3"
        >
          {course.name}
        </motion.h3>

        <motion.p
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.4 }}
          className="text-gray-600 mb-4 flex-grow leading-relaxed"
        >
          {course.shortDescription}
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25, duration: 0.4 }}
          className="space-y-3 mb-6"
        >
          <div className="flex items-center gap-2 text-gray-700">
            <Clock className="w-5 h-5 text-[#A8430F]" />
            <span className="text-sm">
              <strong>Duração:</strong> {course.duration}
            </span>
          </div>

          <div className="flex items-center gap-2 text-gray-700">
            <Award className="w-5 h-5 text-[#A8430F]" />
            <span className="text-sm">
              <strong>Carga horária:</strong> {course.workload}
            </span>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 14 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.4 }}
          className="border-t pt-4 space-y-4"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">A partir de</p>
              <p className="text-3xl font-bold text-[#A8430F]">
                R$ {course.price.toFixed(2)}
              </p>
            </div>
          </div>

          <motion.button
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => onLearnMore(course)}
            className="w-full bg-[#A8430F] text-white py-3 rounded-lg font-semibold hover:bg-[#d66a1f] transition-colors flex items-center justify-center gap-2 group"
          >
            Saiba mais
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </motion.button>
        </motion.div>
      </div>
    </motion.div>
  );
}
