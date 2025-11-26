// src/components/CoursesSection.tsx
import { Course } from "../types";
import { CourseCard } from "./CourseCard";
import { motion } from "framer-motion";

interface CoursesSectionProps {
  courses: Course[];
  onCourseSelect: (course: Course) => void;
  onViewAll: () => void;
}

export function CoursesSection({
  courses,
  onCourseSelect,
  onViewAll,
}: CoursesSectionProps) {
  // 3 cursos presenciais destacados (principais)
  const presencialCourses = courses
    .filter((c) => c.type === "presencial" && c.isFeatured)
    .slice(0, 3);

  // 8 cursos EAD destacados
  const eadCourses = courses.filter((c) => c.type === "ead").slice(0, 8);

  const buttonClasses =
    "inline-flex items-center justify-center px-8 py-3 border border-[#A8430F] text-base font-medium " +
    "rounded-md text-[#A8430F] bg-white hover:bg-[#A8430F] hover:text-white " +
    "md:py-4 md:text-lg md:px-10 transition duration-150";

  return (
    <>
      {/* ================================
          CURSOS PRESENCIAIS
      ================================= */}
      <section id="courses" className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          {/* TÍTULO */}
          <motion.div
            initial={{ opacity: 0, y: 40, scale: 0.9, filter: "blur(12px)" }}
            whileInView={{ opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }}
            viewport={{ once: false, amount: 0.3 }}
            transition={{ duration: 0.55, ease: [0.19, 1, 0.22, 1] }}
            className="text-center mb-12"
          >
            <span className="text-[#A8430F] font-semibold text-lg">
              Cursos Presenciais
            </span>
            <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 mt-2 mb-4">
              Nossos Principais Cursos
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Aprenda com aulas práticas e professores experientes em nossa
              unidade
            </p>
          </motion.div>

          {/* GRID */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {presencialCourses.map((course, index) => (
              <motion.div
                key={course.id}
                initial={{
                  opacity: 0,
                  y: 40,
                  scale: 0.9,
                  filter: "blur(10px)",
                }}
                whileInView={{
                  opacity: 1,
                  y: 0,
                  scale: 1,
                  filter: "blur(0px)",
                }}
                viewport={{ once: false, amount: 0.15 }}
                transition={{
                  duration: 0.55,
                  ease: [0.19, 1, 0.22, 1],
                  delay: index * 0.08,
                }}
              >
                <CourseCard course={course} onLearnMore={onCourseSelect} />
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ================================
          CURSOS EAD
      ================================= */}
      <section id="ead-courses" className="py-20 bg-white">
        <div className="container mx-auto px-4">
          {/* TÍTULO */}
          <motion.div
            initial={{ opacity: 0, y: 40, scale: 0.9, filter: "blur(12px)" }}
            whileInView={{ opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }}
            viewport={{ once: false, amount: 0.3 }}
            transition={{ duration: 0.55, ease: [0.19, 1, 0.22, 1] }}
            className="text-center mb-12"
          >
            <span className="text-[#A8430F] font-semibold text-lg">
              Cursos EAD
            </span>
            <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 mt-2 mb-4">
              Estude de Onde Estiver
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Flexibilidade para aprender no seu ritmo, com qualidade e
              certificado reconhecido
            </p>
          </motion.div>

          {/* GRID */}
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {eadCourses.map((course, index) => (
              <motion.div
                key={course.id}
                initial={{
                  opacity: 0,
                  y: 40,
                  scale: 0.9,
                  filter: "blur(10px)",
                }}
                whileInView={{
                  opacity: 1,
                  y: 0,
                  scale: 1,
                  filter: "blur(0px)",
                }}
                viewport={{ once: false, amount: 0.15 }}
                transition={{
                  duration: 0.55,
                  ease: [0.19, 1, 0.22, 1],
                  delay: index * 0.08,
                }}
              >
                <CourseCard course={course} onLearnMore={onCourseSelect} />
              </motion.div>
            ))}
          </div>

          {/* BOTÃO EAD */}
          {eadCourses.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 25 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: false, amount: 0.2 }}
              transition={{
                duration: 0.45,
                ease: [0.19, 1, 0.22, 1],
                delay: 0.25,
              }}
              className="text-center mt-12"
            >
              <motion.button
                onClick={onViewAll}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                transition={{ duration: 0.12 }}
                className={buttonClasses}
              >
                Ver todos
              </motion.button>
            </motion.div>
          )}
        </div>
      </section>
    </>
  );
}
