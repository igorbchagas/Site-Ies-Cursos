// src/components/AllCurse.tsx - Versão Moderna e com Cores Atualizadas

import { useState, useMemo, useEffect } from "react";
import { Search, ArrowLeft } from "lucide-react";
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

// Cor de Destaque
const ACCENT_COLOR = "#E45B25"; // Laranja forte

// Helper para checar se o curso está em promoção (Usado para ordenação)
const isCoursePromoted = (course: Course) => {
    const price = course.price ?? 0;
    const promoPrice = course.promoPrice;
    return promoPrice !== null && promoPrice !== undefined && promoPrice > 0 && promoPrice < price;
};


export default function AllCurse({
    allCourses,
    onCourseSelect,
    onBack,
}: AllCurseProps) {
    const [searchTerm, setSearchTerm] = useState("");
    const [activeFilter, setActiveFilter] = useState<CourseTypeFilter>("all");
    const [currentPage, setCurrentPage] = useState(1);

    const filteredCourses = useMemo(() => {
        let list = [...allCourses]; // Usar cópia para permitir ordenação

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
        
        // 1. ORDENAÇÃO: Prioriza cursos em promoção (Mantido, mas confirmado)
        list.sort((a, b) => {
            const aIsPromoted = isCoursePromoted(a);
            const bIsPromoted = isCoursePromoted(b);

            if (aIsPromoted && !bIsPromoted) return -1; // Promovido vem primeiro
            if (!aIsPromoted && bIsPromoted) return 1;  // Promovido vem primeiro
            return 0; // Mantém a ordem original ou aplica o próximo critério (se houver)
        });


        return list;
    }, [allCourses, activeFilter, searchTerm]);

    const totalPages = Math.ceil(filteredCourses.length / ITEMS_PER_PAGE);
    const currentCourses = filteredCourses.slice(
        (currentPage - 1) * ITEMS_PER_PAGE,
        currentPage * ITEMS_PER_PAGE
    );

    useEffect(() => {
        setCurrentPage(1);
    }, [activeFilter, searchTerm]);

    const handlePageChange = (page: number) => {
        if (page >= 1 && page <= totalPages) {
            setCurrentPage(page);
            window.scrollTo({ top: 0, behavior: "smooth" });
        }
    };

    const filterOptions: { label: string; value: CourseTypeFilter }[] = [
        { label: "Todos os Cursos", value: "all" },
        { label: "Presenciais", value: "presencial" },
        { label: "EAD (Online)", value: "ead" },
    ];

    return (
        <section className="min-h-screen pt-32 pb-20 bg-gray-50"> {/* Fundo leve, moderno */}
            <div className="container mx-auto px-4">
                
                {/* === TÍTULO E BOTÃO VOLTAR === */}
                <div className="mb-10 flex flex-col md:flex-row justify-between items-start md:items-center">
                    <h1 className="text-5xl font-extrabold text-gray-900 mb-4 md:mb-0">
                        Catálogo Completo
                    </h1>
                    <button
                        onClick={onBack}
                        className={`flex items-center gap-2 text-lg font-semibold text-gray-700 hover:text-[${ACCENT_COLOR}] transition-colors`}
                    >
                        <ArrowLeft className="w-5 h-5" /> Voltar à Página Inicial
                    </button>
                </div>

                {/* === FILTROS E PESQUISA - Estilo de Card Moderno === */}
                <div className="flex flex-col lg:flex-row justify-between items-center gap-6 mb-12 p-6 bg-white rounded-xl shadow-lg border border-gray-100">
                    
                    {/* Pesquisa */}
                    <div className="relative w-full lg:w-1/3">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Buscar por curso ou palavra-chave..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className={`w-full py-3 pl-12 pr-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[${ACCENT_COLOR}] focus:border-[${ACCENT_COLOR}] transition-all text-gray-800`}
                        />
                    </div>

                    {/* Filtros de Tipo */}
                    <div className="flex flex-wrap gap-3 w-full lg:w-2/3 lg:justify-end">
                        {filterOptions.map((filter) => (
                            <button
                                key={filter.value}
                                onClick={() => setActiveFilter(filter.value)}
                                className={`px-6 py-2.5 text-sm font-semibold rounded-full transition-all duration-200 shadow-md ${
                                    activeFilter === filter.value
                                        ? `bg-[${ACCENT_COLOR}] text-white shadow-md shadow-[${ACCENT_COLOR}]/30` // Active: Laranja
                                        : "bg-gray-100 text-gray-700 hover:bg-gray-200" // Inactive: Limpo
                                }`}
                            >
                                {filter.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* === LISTA DE CURSOS === */}
                {currentCourses.length > 0 ? (
                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                        {currentCourses.map((course) => (
                            // Hover e transição adicionados para o toque moderno
                            <div
                                key={course.id}
                                className="transition-all duration-300 hover:scale-[1.02] hover:shadow-xl rounded-xl"
                            >
                                <CourseCard
                                    course={course}
                                    onLearnMore={() => onCourseSelect(course)}
                                />
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-20 bg-white rounded-xl shadow-lg">
                        <p className="text-xl text-gray-500">Nenhum curso encontrado com os filtros aplicados.</p>
                    </div>
                )}

                {/* === Paginação - Estilo Moderno === */}
                {totalPages > 1 && (
                    <div className="flex justify-center items-center space-x-2 mt-12">
                        {/* Botão Anterior */}
                        <button
                            onClick={() => handlePageChange(currentPage - 1)}
                            disabled={currentPage === 1}
                            className="px-5 py-3 border border-gray-300 rounded-xl text-gray-700 hover:bg-gray-100 disabled:opacity-50 transition-colors"
                        >
                            Anterior
                        </button>

                        {/* Números da Página */}
                        {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                            <button
                                key={p}
                                onClick={() => handlePageChange(p)}
                                className={`w-10 h-10 border rounded-xl font-semibold transition duration-200 ${
                                    currentPage === p
                                        ? `bg-[${ACCENT_COLOR}] text-white border-[${ACCENT_COLOR}] shadow-md shadow-[${ACCENT_COLOR}]/30` // Active: Laranja
                                        : "text-gray-700 hover:bg-gray-100 border-gray-300" // Inactive: Limpo
                                }`}
                            >
                                {p}
                            </button>
                        ))}

                        {/* Botão Próxima */}
                        <button
                            onClick={() => handlePageChange(currentPage + 1)}
                            disabled={currentPage === totalPages}
                            className="px-5 py-3 border border-gray-300 rounded-xl text-gray-700 hover:bg-gray-100 disabled:opacity-50 transition-colors"
                        >
                            Próxima
                        </button>
                    </div>
                )}
            </div>
        </section>
    );
}