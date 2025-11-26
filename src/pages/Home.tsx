// src/pages/Home.tsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import { Header } from "../components/Header";
import { Hero } from "../components/Hero";
import { CoursesSection } from "../components/CoursesSection";
import { About } from "../components/About";
import { Testimonials } from "../components/Testimonials";
import { Contact } from "../components/Contact";
import { Footer } from "../components/Footer";
import { CourseModal } from "../components/CourseModal";

import type { Course } from "../types";
import { courseService } from "../services/courseService";

export default function Home() {
  const navigate = useNavigate();

  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function loadCourses() {
      try {
        const data = await courseService.getAll();
        if (!isMounted) return;
        setCourses(data);
      } catch (err) {
        console.error("Erro ao carregar cursos públicos:", err);
        if (!isMounted) return;
        setError("Não foi possível carregar os cursos no momento. Tente novamente mais tarde.");
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

  return (
    <>
      <Header />

      <Hero />

      {/* Seção de cursos – usa dados reais do Supabase */}
      {loading && (
        <section className="py-20 bg-gray-50">
          <div className="container mx-auto px-4 text-center">
            <p className="text-xl text-gray-600">
              Carregando cursos...
            </p>
          </div>
        </section>
      )}

      {!loading && error && (
        <section className="py-20 bg-gray-50">
          <div className="container mx-auto px-4 text-center">
            <p className="text-xl text-red-600 mb-4">
              {error}
            </p>
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-3 rounded-md bg-[#A8430F] text-white font-semibold hover:bg-orange-700 transition"
            >
              Tentar novamente
            </button>
          </div>
        </section>
      )}

      {!loading && !error && (
        <CoursesSection
          courses={courses}
          onCourseSelect={setSelectedCourse}
          onViewAll={() => navigate("/cursos")}
        />
      )}

      <About />
      <Testimonials />
      <Contact />
      <Footer />

      {selectedCourse && (
        <CourseModal
          course={selectedCourse}
          onClose={() => setSelectedCourse(null)}
        />
      )}
    </>
  );
}
