import { Star, Quote } from 'lucide-react';
import { testimonials } from '../data/testimonials';
import { motion } from 'framer-motion';

export function Testimonials() {
  return (
    <section className="py-20 bg-gray-50">
      <div className="container mx-auto px-4">
        {/* Cabeçalho */}
        <motion.div
          initial={{ opacity: 0, y: 40, scale: 0.9, filter: 'blur(12px)' }}
          whileInView={{ opacity: 1, y: 0, scale: 1, filter: 'blur(0px)' }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.55, ease: [0.19, 1, 0.22, 1] }}
          className="text-center mb-12"
        >
          <span className="text-[#A8430F] font-semibold text-lg">Depoimentos</span>
          <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 mt-2 mb-4">
            O que nossos alunos dizem
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Histórias reais de transformação profissional
          </p>
        </motion.div>

        {/* Cards de depoimentos */}
        <div className="grid md:grid-cols-3 gap-8">
          {testimonials.map((testimonial, index) => (
            <motion.div
              key={testimonial.id}
              initial={{ opacity: 0, y: 40, scale: 0.9, filter: 'blur(10px)' }}
              whileInView={{ opacity: 1, y: 0, scale: 1, filter: 'blur(0px)' }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{
                duration: 0.55,
                ease: [0.19, 1, 0.22, 1],
                delay: index * 0.08, // leve "onda" nos cards
              }}
              whileHover={{
                y: -10,
                scale: 1.04,
                boxShadow: '0 25px 50px -15px rgba(0,0,0,0.25)',
                transition: { duration: 0.18, ease: 'easeOut' },
              }}
              className="bg-white rounded-xl p-8 shadow-lg cursor-default"
            >
              <Quote className="w-10 h-10 text-[#A8430F] mb-4" />

              <div className="flex gap-1 mb-4">
                {[...Array(testimonial.rating)].map((_, i) => (
                  <Star
                    key={i}
                    className="w-5 h-5 fill-[#A8430F] text-[#A8430F]"
                  />
                ))}
              </div>

              <p className="text-gray-700 mb-6 leading-relaxed italic">
                "{testimonial.testimonial}"
              </p>

              <div className="border-t pt-4">
                <p className="font-bold text-gray-900">
                  {testimonial.studentName}
                </p>
                <p className="text-sm text-gray-600">
                  {testimonial.courseTaken}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
