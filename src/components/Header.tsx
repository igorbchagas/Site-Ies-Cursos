// Header.tsx – Versão restaurada + adaptada para React Router
// Mantém 100% do visual e animações do Header original

import { useState, useEffect } from "react";
import { Menu, X, GraduationCap, Camera } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate, useLocation } from "react-router-dom";

export function Header() {
  const navigate = useNavigate();
  const location = useLocation();

  // Detecta se está na Home
  const isHomePage = location.pathname === "/";

  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isCoursesOpen, setIsCoursesOpen] = useState(false);
  const [hidden, setHidden] = useState(false);

  // Scroll para seções da Home
  const scrollToSection = (id: string) => {
    // Se NÃO estiver na home → navega para home e scrolla depois
    if (!isHomePage) {
      navigate("/");
      setTimeout(() => {
        const el = document.getElementById(id);
        if (el) el.scrollIntoView({ behavior: "smooth" });
      }, 150);

      setIsMenuOpen(false);
      setIsCoursesOpen(false);
      return;
    }

    // Se já está na home, scrolla normalmente
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: "smooth" });
    }

    setIsMenuOpen(false);
    setIsCoursesOpen(false);
  };

  const goToAllCourses = () => {
    navigate("/cursos");
    setIsCoursesOpen(false);
    setIsMenuOpen(false);
  };

  const goToMoments = () => {
    navigate("/momentos");
    setIsCoursesOpen(false);
    setIsMenuOpen(false);
  };

  // HEADER SOME AO DESCER / APARECE AO SUBIR
  useEffect(() => {
    let lastY = window.scrollY;

    const update = () => {
      const currentY = window.scrollY;

      if (currentY > lastY && currentY > 70) {
        setHidden(true);
      } else {
        setHidden(false);
      }

      lastY = currentY;
    };

    window.addEventListener("scroll", update);
    return () => window.removeEventListener("scroll", update);
  }, []);

  return (
    <motion.header
      initial={{ y: -60, opacity: 0 }}
      animate={{
        y: hidden ? -80 : 0,
        opacity: 1,
      }}
      transition={{ duration: 0.35, ease: [0.19, 1, 0.22, 1] }}
      className="fixed top-0 left-0 w-full z-50 bg-black text-white shadow-xl"
    >
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between h-17">
          {/* LOGO */}
          <div
            className="flex items-center gap-2 cursor-pointer"
            onClick={() => scrollToSection("hero")}
          >
            <GraduationCap className="w-8 h-8 text-[#E45B25]" />
            <span className="text-2xl font-bold text-white">
              Ies<span className="text-[#E45B25]">Cursos</span>
            </span>
          </div>

          {/* MENU DESKTOP */}
          <nav className="hidden lg:flex items-center gap-8">
            <button
              onClick={() => scrollToSection("hero")}
              className="hover:text-[#E45B25] transition-colors"
            >
              Início
            </button>

            <button
              onClick={goToMoments}
              className="hover:text-[#A8430F] transition-colors flex items-center gap-1"
            >
              <Camera className="w-4 h-4" /> Momentos
            </button>

            {/* DROPDOWN CURSOS */}
            <div
              className="relative"
              onMouseEnter={() => setIsCoursesOpen(true)}
              onMouseLeave={() => setIsCoursesOpen(false)}
            >
              <button className="hover:text-[#A8430F] transition-colors">
                Cursos
              </button>

              <AnimatePresence>
                {isCoursesOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                    className="absolute left-0 top-full w-64 bg-white text-black rounded-lg shadow-xl py-2"
                  >
                    {["Informática Básica", "Informática Avançada", "Gestão Empresarial", "Inglês"].map(
                      (curso) => (
                        <button
                          key={curso}
                          onClick={() => scrollToSection("courses")}
                          className="block w-full text-left px-4 py-2 hover:bg-gray-100"
                        >
                          {curso}
                        </button>
                      )
                    )}

                    <div className="border-t my-2" />

                    <button
                      onClick={goToAllCourses}
                      className="block w-full text-left px-4 py-2 hover:bg-gray-100 font-semibold text-[#E45B25]"
                    >
                      Ver Todos os Cursos
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <button
              onClick={() => scrollToSection("about")}
              className="hover:text-[#A8430F] transition-colors"
            >
              Sobre a IesCursos
            </button>

            <button
              onClick={() => scrollToSection("contact")}
              className="hover:text-[#A8430F] transition-colors"
            >
              Fale Conosco
            </button>

            <motion.button
              onClick={() => scrollToSection("simulator")}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="bg-[#E45B25] px-6 py-2.5 rounded-full font-semibold shadow-lg hover:bg-[#d66a1f]"
            >
              Matricule-se
            </motion.button>
          </nav>

          {/* MOBILE BUTTON */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="lg:hidden"
          >
            {isMenuOpen ? <X /> : <Menu />}
          </button>
        </div>

        {/* MENU MOBILE */}
        <AnimatePresence>
          {isMenuOpen && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.25 }}
              className="lg:hidden pb-4 space-y-3"
            >
              <button onClick={() => scrollToSection("hero")} className="block py-2">
                Início
              </button>

              <button onClick={() => scrollToSection("courses")} className="block py-2">
                Cursos Presenciais
              </button>

              <button onClick={() => scrollToSection("ead-courses")} className="block py-2">
                Cursos EAD
              </button>

              <button
                onClick={goToMoments}
                className="block py-2 font-bold text-[#A8430F] flex items-center gap-2"
              >
                <Camera className="w-4 h-4" /> Momentos
              </button>

              <button
                onClick={goToAllCourses}
                className="block py-2 font-bold text-[#A8430F]"
              >
                Ver Todos os Cursos
              </button>

              <button onClick={() => scrollToSection("about")} className="block py-2">
                Sobre a IesCursos
              </button>

              <button onClick={() => scrollToSection("contact")} className="block py-2">
                Fale Conosco
              </button>

              <button
                onClick={() => scrollToSection("simulator")}
                className="bg-[#A8430F] w-full py-2.5 rounded-full font-bold text-white"
              >
                Matricule-se
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.header>
  );
}
