// src/pages/AllCourses.tsx
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

// IMPORTAÇÕES ESSENCIAIS DE LAYOUT
import { Header } from "../components/Header"; // Importado
import { Footer } from "../components/Footer"; // Importado

import AllCurse from "../components/AllCurse";
import { CourseModal } from "../components/CourseModal";
import type { Course } from "../types";
import { courseService } from "../services/courseService";

export default function AllCourses() {
  const navigate = useNavigate();

  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Lógica para carregar cursos
  useEffect(() => {
    window.scrollTo(0, 0);

    let isMounted = true;

    async function loadCourses() {
      try {
        const data = await courseService.getAll();
        if (!isMounted) return;
        setCourses(data);
      } catch (err) {
        console.error("Erro ao carregar cursos públicos:", err);
        if (!isMounted) return;
        setError("Não foi possível carregar os cursos. Tente novamente mais tarde.");
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    loadCourses();

    return () => {
      isMounted = false;
    };
  }, []);

  const handleCourseSelect = (course: Course) => setSelectedCourse(course);
  const handleCloseModal = () => setSelectedCourse(null);

  // =========================================================================
  // Renderização do Estado de Carregamento
  // =========================================================================
  if (loading) {
    // Adicionamos o Header e Footer também nos estados de loading/erro para manter a consistência
    return (
      <>
        <Header />
        <div className="min-h-screen pt-24 flex items-center justify-center bg-gray-50">
          <p className="text-xl text-gray-600">Carregando cursos...</p>
        </div>
        <Footer />
      </>
    );
  }

  // =========================================================================
  // Renderização do Estado de Erro
  // =========================================================================
  if (error) {
    return (
      <>
        <Header />
        <div className="min-h-screen pt-24 flex flex-col items-center justify-center bg-gray-50 px-4">
          <p className="text-xl text-red-600 mb-4 text-center">
            {error}
          </p>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-3 rounded-md bg-[#E45B25] text-white font-semibold hover:bg-[#d66a1f] transition mb-2"
          >
            Tentar novamente
          </button>
          <button
            onClick={() => navigate("/")}
            className="px-6 py-3 rounded-md border border-gray-300 text-gray-700 font-semibold hover:bg-gray-100 transition"
          >
            Voltar para a página inicial
          </button>
        </div>
        <Footer />
      </>
    );
  }

  // =========================================================================
  // Renderização Principal
  // =========================================================================
  return (
    <>
      <Header /> {/* ⬅️ Header Adicionado */}
      <main className="min-h-screen pt-20"> {/* ⬅️ Main e padding para o Header fixo */}
        <AllCurse
          allCourses={courses}
          onCourseSelect={handleCourseSelect}
          onBack={() => navigate("/")}
        />
        {/* Modal de Detalhes (Permanece fora do <main> para sobrepor o layout) */}
        {selectedCourse && (
          <CourseModal
            course={selectedCourse}
            onClose={handleCloseModal}
          />
        )}
      </main>
      <Footer /> {/* ⬅️ Footer Adicionado */}
    </>
  );
}