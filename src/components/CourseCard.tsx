// src/components/CourseCard.tsx

import { useState } from 'react';
import { Clock, Award, ArrowRight, MapPin, Monitor, Zap } from 'lucide-react'; // Adicionando Zap para o CTA
// IMPORTANTE: Removendo o motion do framer-motion para otimização
import { Course } from '../types';

interface CourseCardProps {
  course: Course;
  onLearnMore: (course: Course) => void;
}

export function CourseCard({ course, onLearnMore }: CourseCardProps) {
  const isPresencial = course.type === 'presencial';
  const [, setHover] = useState(false);

  // Cores padronizadas e Lógica de Promoção
  const ACCENT_COLOR = "#E45B25"; 
  const PROMO_COLOR = "#dc2626"; // Vermelho forte (Red 600)
  
  const price = course.price ?? 0;
  const promoPrice = course.promoPrice;
  const isPromoted = promoPrice !== null && promoPrice !== undefined && promoPrice > 0 && promoPrice < price;

  return (
    <div
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      // Transições CSS leves
      className="relative bg-white rounded-xl shadow-lg overflow-hidden flex flex-col h-full 
                 transition-all duration-300 ease-in-out cursor-pointer 
                 hover:shadow-2xl hover:-translate-y-1 hover:scale-[1.02]"
      onClick={() => onLearnMore(course)}
    >
      
      {/* ===== BADGE DE PROMOÇÃO (FAIXA DIAGONAL GRANDE) ===== */}
      {isPromoted && (
        <div 
          className="absolute top-0 left-0 z-10 w-32 h-32 overflow-hidden pointer-events-none"
        >
          <div 
            className={`absolute transform -rotate-45 text-center text-white font-extrabold py-2 left-[-45px] top-[18px] w-[160px] shadow-xl`}
            style={{ 
              backgroundColor: PROMO_COLOR, 
              fontSize: '12px', 
              textShadow: '0 1px 2px rgba(0,0,0,0.4)'
            }}
          >
            PROMOÇÃO
          </div>
        </div>
      )}

      {/* Topo colorido */}
      <div className="h-48 bg-gradient-to-br from-[#A8430F] to-[#d66a1f] relative overflow-hidden">
        <div
          className="absolute inset-0 flex items-center justify-center opacity-30"
        >
          {isPresencial ? (
            <MapPin className="w-20 h-20 text-white" />
          ) : (
            <Monitor className="w-20 h-20 text-white" />
          )}
        </div>

        {/* Badge de modalidade */}
        <span
          className="absolute top-4 right-4 bg-white text-[#A8430F] px-3 py-1 rounded-full text-sm font-semibold shadow z-20"
        >
          {isPresencial ? 'Presencial' : 'EAD'}
        </span>
      </div>

      {/* Conteúdo */}
      <div className="p-4 sm:p-6 flex flex-col flex-grow">
        <h3
          className="text-xl sm:text-2xl font-bold text-gray-900 mb-3"
        >
          {course.name}
        </h3>

        <p
          className="text-sm sm:text-base text-gray-600 mb-4 flex-grow leading-relaxed"
        >
          {course.shortDescription}
        </p>

        <div
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
        </div>

        <div
          className="border-t pt-4 space-y-4"
        >
          {/* Lógica de Preço CONDICIONAL: Mostra PROMOÇÃO ou CTA */}
          <div className="flex items-center justify-between min-h-[50px]"> 
            {isPromoted ? (
              // Exibe preço promocional
              <div>
                <p className="text-sm text-gray-500 font-semibold mb-1">
                  DE: <span className="text-base font-medium text-gray-400 line-through">R$ {price.toFixed(2)}</span>
                </p>
                <p className="text-2xl sm:text-3xl font-bold" style={{ color: PROMO_COLOR }}>
                  POR R$ {promoPrice!.toFixed(2)}
                </p>
              </div>
            ) : (
                // NOVO: Exibe CTA "Consulte Valores" ou "Fale com Consultor"
                <div className="flex items-center gap-2">
                    <Zap className="w-6 h-6" style={{ color: ACCENT_COLOR }} />
                    <p className="text-lg font-bold text-gray-700">
                        Consulte Valores
                    </p>
                </div>
            )}
          </div>

          <button
            onClick={(e) => {
              e.stopPropagation(); // Evita que o click suba para o card pai
              onLearnMore(course);
            }}
            className="w-full bg-[#A8430F] text-white py-3 rounded-lg font-semibold hover:bg-[#d66a1f] transition-colors flex items-center justify-center gap-2 group"
          >
            {isPromoted ? 'GARANTA SUA VAGA' : 'Saiba mais'}
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
      </div>
    </div>
  );
}