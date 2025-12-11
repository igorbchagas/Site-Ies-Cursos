import { useState } from 'react';
import { Clock, Award, ArrowRight, MapPin, Monitor, Zap } from 'lucide-react'; 
import { Course } from '../types';
import { CATEGORY_IMAGES } from '../utils/categoryConstants'; // <--- IMPORTANTE

interface CourseCardProps {
  course: Course;
  onLearnMore: (course: Course) => void;
}

export function CourseCard({ course, onLearnMore }: CourseCardProps) {
  const isPresencial = course.type === 'presencial';
  const [, setHover] = useState(false);

  const ACCENT_COLOR = "#F27A24"; 
  const PROMO_COLOR = "#dc2626"; 
  
  const price = course.price ?? 0;
  const promoPrice = course.promoPrice;
  const isPromoted = promoPrice !== null && promoPrice !== undefined && promoPrice > 0 && promoPrice < price;

  // === LÓGICA INTELIGENTE DE IMAGEM ===
  // 1. Tenta imagem específica do curso
  // 2. Tenta imagem da categoria (se tiver categoria definida)
  // 3. Null (vai cair no ícone padrão)
  const categoryImage = course.category ? CATEGORY_IMAGES[course.category] : null;
  const displayImage = course.imageUrl || categoryImage;
  const hasImage = !!displayImage;

  return (
    <div
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      className="relative bg-white rounded-xl shadow-lg overflow-hidden flex flex-col h-full 
                 transition-all duration-300 ease-in-out cursor-pointer 
                 hover:shadow-2xl hover:-translate-y-1 hover:scale-[1.02]"
      onClick={() => onLearnMore(course)}
    >
      
      {/* Badge de Promoção */}
      {isPromoted && (
        <div className="absolute top-0 left-0 z-20 w-32 h-32 overflow-hidden pointer-events-none">
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

      {/* Topo (Imagem ou Ícone) */}
      <div className="h-48 relative overflow-hidden bg-zinc-100">
        {hasImage ? (
            <img 
                src={displayImage} // Usa a variável inteligente
                alt={course.name} 
                className="w-full h-full object-cover"
                loading="lazy"
            />
        ) : (
            // Fallback: Apenas se não tiver nem imagem do curso nem da categoria
            <div className="w-full h-full bg-gradient-to-br from-[#F27A24] to-[#d66a1f] flex items-center justify-center relative">
                 <div className="text-white opacity-40">
                    {isPresencial ? (
                        <MapPin className="w-24 h-24" />
                    ) : (
                        <Monitor className="w-24 h-24" />
                    )}
                 </div>
            </div>
        )}

        <span className="absolute top-4 right-4 bg-white text-[#F27A24] px-3 py-1 rounded-full text-sm font-semibold shadow z-20">
          {isPresencial ? 'Presencial' : 'EAD'}
        </span>
      </div>

      {/* Resto do card igual... */}
      <div className="p-4 sm:p-6 flex flex-col flex-grow">
        <div className="flex justify-between items-start mb-2">
            <h3 className="text-xl sm:text-2xl font-bold text-gray-900 line-clamp-2">
              {course.name}
            </h3>
        </div>
        
        {/* Mostra a categoria pequena se existir */}
        {course.category && (
            <span className="text-[10px] uppercase font-bold text-gray-400 mb-3 tracking-wider">
                {course.category}
            </span>
        )}

        <p className="text-sm sm:text-base text-gray-600 mb-4 flex-grow leading-relaxed line-clamp-3">
          {course.shortDescription}
        </p>

        {/* ... Restante do código (Duração, Preço, Botão) ... */}
        <div className="space-y-3 mb-6">
          <div className="flex items-center gap-2 text-gray-700">
            <Clock className="w-5 h-5 text-[#F27A24]" />
            <span className="text-sm"><strong>Duração:</strong> {course.duration}</span>
          </div>

          <div className="flex items-center gap-2 text-gray-700">
            <Award className="w-5 h-5 text-[#F27A24]" />
            <span className="text-sm"><strong>Carga horária:</strong> {course.workload}</span>
          </div>
        </div>

        <div className="border-t pt-4 space-y-4">
          <div className="flex items-center justify-between min-h-[50px]"> 
            {isPromoted ? (
              <div>
                <p className="text-sm text-gray-500 font-semibold mb-1">
                  DE: <span className="text-base font-medium text-gray-400 line-through">R$ {price.toFixed(2)}</span>
                </p>
                <p className="text-2xl sm:text-3xl font-bold" style={{ color: ACCENT_COLOR }}>
                  POR R$ {promoPrice!.toFixed(2)}
                </p>
              </div>
            ) : (
                <div className="flex items-center gap-2">
                    <Zap className="w-6 h-6" style={{ color: ACCENT_COLOR }} />
                    <p className="text-lg font-bold text-gray-700">Consulte Valores</p>
                </div>
            )}
          </div>

          <button
            onClick={(e) => {
              e.stopPropagation();
              onLearnMore(course);
            }}
            className="w-full bg-[#F27A24] text-white py-3 rounded-lg font-semibold hover:bg-[#d66a1f] transition-colors flex items-center justify-center gap-2 group"
          >
            {isPromoted ? 'GARANTA SUA VAGA' : 'Saiba mais'}
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
      </div>
    </div>
  );
}