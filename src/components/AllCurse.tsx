// src/components/AllCurse.tsx
import { useState, useMemo, useEffect } from "react";
import { Search } from "lucide-react";
import { Course } from "../types";
import { CourseCard } from "./CourseCard";

type CourseTypeFilter = "all" | "presencial" | "ead";

interface AllCurseProps {
  allCourses: Course[];
  onCourseSelect: (course: Course) => void;
  onBack: () => void;
}

const ITEMS_PER_ROW = 4;
const ROWS_PER_PAGE = 5;
const ITEMS_PER_PAGE = ITEMS_PER_ROW * ROWS_PER_PAGE;

export default function AllCurse({
  allCourses,
  onCourseSelect,
  onBack,
}: AllCurseProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [activeFilter, setActiveFilter] = useState<CourseTypeFilter>("all");
  const [currentPage, setCurrentPage] = useState(1);

  const filteredCourses = useMemo(() => {
    let list = allCourses;

    if (activeFilter !== "all") {
      list = list.filter((c) => c.type === activeFilter);
    }

    if (searchTerm.trim() !== "") {
      const lower = searchTerm.toLowerCase();
      list = list.filter(
        (c) =>
          c.name.toLowerCase().includes(lower) ||
          c.description.toLowerCase().includes(lower)
      );
    }

    return list;
  }, [activeFilter, searchTerm, allCourses]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, activeFilter]);

  const paginatedCourses = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredCourses.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredCourses, currentPage]);

  const totalPages = Math.ceil(filteredCourses.length / ITEMS_PER_PAGE);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);

    setTimeout(() => {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }, 20);
  };

  return (
    <div className="py-20">
      <div className="container mx-auto px-4">
        {/* Voltar */}
        <button
          onClick={onBack}
          className="
            mb-8 flex items-center px-6 py-3 text-lg font-semibold 
            rounded-full transition duration-300 ease-in-out
            bg-[#A8430F] text-white
            hover:bg-orange-700
            active:scale-95 shadow-md hover:shadow-lg
          "
        >
          &larr; Voltar para a Página Inicial
        </button>

        <h1 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
          Catálogo Completo de Cursos
        </h1>

        <p className="text-xl text-gray-600 max-w-3xl mb-10">
          Encontre todos os cursos disponíveis, utilizando a pesquisa e os filtros abaixo.
        </p>

        {/* Busca + Filtros */}
        <div className="bg-white p-6 rounded-lg shadow-xl mb-10 border border-gray-200">
          <div className="relative mb-6">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Pesquisar por nome do curso..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-4 border border-gray-300 rounded-lg text-lg focus:ring-[#A8430F] focus:border-[#A8430F]"
            />
          </div>

          <div className="flex space-x-4 items-center">
            <span className="text-gray-700 font-semibold mr-2">
              Filtrar por Tipo:
            </span>

            {["all", "presencial", "ead"].map((type) => (
              <button
                key={type}
                onClick={() => setActiveFilter(type as CourseTypeFilter)}
                className={`
                  px-4 py-2 rounded-full font-medium transition duration-200
                  ${
                    activeFilter === type
                      ? "bg-[#A8430F] text-white"
                      : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                  }
                `}
              >
                {type === "all"
                  ? "Todos"
                  : type === "presencial"
                  ? "Presencial"
                  : "EAD"}
              </button>
            ))}
          </div>
        </div>

        {/* Nenhum encontrado */}
        {filteredCourses.length === 0 && (
          <div className="text-center py-10 bg-gray-50 rounded-lg">
            <p className="text-2xl text-gray-500">
              Nenhum curso encontrado com os filtros e termo de pesquisa atuais.
            </p>
          </div>
        )}

        {/* GRID */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {paginatedCourses.map((course) => (
            <CourseCard
              key={course.id}
              course={course}
              onLearnMore={() => onCourseSelect(course)}
            />
          ))}
        </div>

        {/* Paginação */}
        {totalPages > 1 && (
          <div className="flex justify-center items-center space-x-2 mt-10">
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="px-4 py-2 border rounded-lg text-gray-700 hover:bg-gray-100 disabled:opacity-50"
            >
              Anterior
            </button>

            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
              <button
                key={p}
                onClick={() => handlePageChange(p)}
                className={`px-4 py-2 border rounded-lg transition duration-200 ${
                  currentPage === p
                    ? "bg-[#A8430F] text-white border-[#A8430F]"
                    : "text-gray-700 hover:bg-gray-100 border-gray-300"
                }`}
              >
                {p}
              </button>
            ))}

            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="px-4 py-2 border rounded-lg text-gray-700 hover:bg-gray-100 disabled:opacity-50"
            >
              Próximo
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
