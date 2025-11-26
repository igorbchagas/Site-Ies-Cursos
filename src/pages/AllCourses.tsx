// src/pages/AllCourses.tsx
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

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

  // Sempre abrir no topo + carregar cursos do Supabase
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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-xl text-gray-600">Carregando cursos...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 px-4">
        <p className="text-xl text-red-600 mb-4 text-center">
          {error}
        </p>
        <button
          onClick={() => window.location.reload()}
          className="px-6 py-3 rounded-md bg-[#A8430F] text-white font-semibold hover:bg-orange-700 transition mb-2"
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
    );
  }

  return (
    <>
      <AllCurse
        allCourses={courses}
        onBack={() => navigate("/")}
        onCourseSelect={(course: Course) => setSelectedCourse(course)}
      />

      {selectedCourse && (
        <CourseModal
          course={selectedCourse}
          onClose={() => setSelectedCourse(null)}
        />
      )}
    </>
  );
}
