// src/components/CoursesSection.tsx

import { Course } from "../types";
import { CourseCard } from "./CourseCard";
import { motion } from "framer-motion";

interface CoursesSectionProps {
  courses: Course[];
  onCourseSelect: (course: Course) => void;
  onViewAll: () => void;
}

// Helper para checar se o curso está em promoção (igual ao CourseCard)
const isCoursePromoted = (course: Course) => {
    const price = course.price ?? 0;
    const promoPrice = course.promoPrice;
    return promoPrice !== null && promoPrice !== undefined && promoPrice > 0 && promoPrice < price;
};


export function CoursesSection({
  courses,
  onCourseSelect,
  onViewAll,
}: CoursesSectionProps) {
  
  // 1. Cursos em PROMOÇÃO (TODAS as modalidades)
  const promotedCourses = courses.filter(isCoursePromoted);

  // 2. Cursos Presenciais NÃO Promocionais (para preencher o grid principal)
  const nonPromotedPresenciais = courses.filter(c => 
      c.type === "presencial" && !isCoursePromoted(c)
  ).slice(0, 3 - promotedCourses.length > 0 ? 3 - promotedCourses.length : 0); // Limita o preenchimento

  // 3. COMBINAÇÃO: Destaques = Promoções + Presenciais de Preenchimento (máx 3)
  const mainFeaturedCourses = [...promotedCourses, ...nonPromotedPresenciais].slice(0, 3);


  // 4. Cursos EAD (somente os que NÃO estão em promoção, pois os promovidos estão na seção principal)
  const eadCourses = courses.filter(c => 
      c.type === "ead" && !isCoursePromoted(c)
  ).slice(0, 4);

  const buttonClasses =
    "inline-flex items-center justify-center px-6 py-3 border border-[#ff5722] text-base font-medium " +
    "rounded-md text-[#ff5722] bg-white hover:bg-[#ff5722] hover:text-white " +
    "sm:py-4 sm:text-lg sm:px-10 transition duration-150";

  return (
    <>
      {/* ================================
          CURSOS PRINCIPAIS (DESTAQUE/PROMOÇÕES)
      ================================= */}
      <section id="courses" className="py-12 sm:py-20 bg-gray-50"> 
        <div className="container mx-auto px-4">
          {/* TÍTULO */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.55, ease: [0.19, 1, 0.22, 1] }}
            className="text-center mb-8 sm:mb-12"
          >
            <span className="text-[#ff5722] font-semibold text-base sm:text-lg">
              Cursos em Destaque
            </span>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mt-2 mb-4">
              Nossos Principais Cursos
            </h2>
            <p className="text-base sm:text-xl text-gray-600 max-w-3xl mx-auto">
              Veja nossas promoções e cursos mais procurados.
            </p>
          </motion.div>

          {/* GRID: alterado para 1 coluna em mobile, 2 em tablet, 3 em desktop */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {mainFeaturedCourses.map((course) => (
              <div 
                key={course.id} 
              >
                <CourseCard course={course} onLearnMore={onCourseSelect} />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ================================
          CURSOS EAD (NÃO PROMOVIDOS)
      ================================= */}
      {eadCourses.length > 0 && (
        <section id="ead-courses" className="py-12 sm:py-20 bg-white"> 
          <div className="container mx-auto px-4">
            {/* TÍTULO */}
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 0.55, ease: [0.19, 1, 0.22, 1] }}
              className="text-center mb-8 sm:mb-12"
            >
              <span className="text-[#ff5722] font-semibold text-base sm:text-lg">
                Cursos Profissionalizantes EAD
              </span>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mt-2 mb-4">
                Estude de Onde Estiver
              </h2>
              <p className="text-base sm:text-xl text-gray-600 max-w-3xl mx-auto">
                Flexibilidade para aprender no seu ritmo, com qualidade e
                certificado reconhecido
              </p>
            </motion.div>

            {/* GRID: alterado para 1 coluna em mobile, 2 em tablet, 4 em desktop */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
              {eadCourses.map((course) => (
                <div 
                  key={course.id}
                >
                  <CourseCard course={course} onLearnMore={onCourseSelect} />
                </div>
              ))}
            </div>

            {/* BOTÃO EAD */}
            <div className="text-center mt-8 sm:mt-12">
              <motion.button
                onClick={onViewAll}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                transition={{ duration: 0.12 }}
                className={buttonClasses}
              >
                Ver todos os Cursos
              </motion.button>
            </div>
          </div>
        </section>
      )}
      
      {/* Se não houver cursos EAD e nem presenciais fora das 3 vagas */}
      {!mainFeaturedCourses.length && !eadCourses.length && (
          <section className="py-20 bg-gray-50 text-center">
              <p className="text-xl text-gray-500">Nenhum curso disponível no momento.</p>
          </section>
      )}
    </>
  );
}