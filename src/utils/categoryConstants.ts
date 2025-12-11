// src/utils/categoryConstants.ts

// Defina aqui suas categorias e as URLs das imagens padrão
export const COURSE_CATEGORIES = {
  TECNOLOGIA: "Tecnologia e TI",
  SAUDE: "Saúde e Bem-estar",
  NEGOCIOS: "Negócios e Gestão",
  IDIOMAS: "Idiomas",
  INDUSTRIA: "Indústria e Mecânica",
  BELEZA: "Beleza e Estética",
  OUTROS: "Outros"
} as const;

// Cole aqui os links das imagens que você subiu no Supabase
export const CATEGORY_IMAGES: Record<string, string> = {
  [COURSE_CATEGORIES.TECNOLOGIA]: "https://dylryiartsqsayuathei.supabase.co/storage/v1/object/public/course-images/Tecnologia.jpg",
  [COURSE_CATEGORIES.SAUDE]: "https://dylryiartsqsayuathei.supabase.co/storage/v1/object/public/course-images/Saude.jpg",
  [COURSE_CATEGORIES.NEGOCIOS]: "https://dylryiartsqsayuathei.supabase.co/storage/v1/object/public/course-images/Negocios.jpg",
  [COURSE_CATEGORIES.IDIOMAS]: "https://dylryiartsqsayuathei.supabase.co/storage/v1/object/public/course-images/Idiomas.jpg",
  [COURSE_CATEGORIES.INDUSTRIA]: "https://dylryiartsqsayuathei.supabase.co/storage/v1/object/public/course-images/Industria.jpg",
  [COURSE_CATEGORIES.BELEZA]: "https://dylryiartsqsayuathei.supabase.co/storage/v1/object/public/course-images/Beleza.jpg",
  [COURSE_CATEGORIES.OUTROS]: "https://dylryiartsqsayuathei.supabase.co/storage/v1/object/public/course-images/Outros.jpg",
};

export type CourseCategory = typeof COURSE_CATEGORIES[keyof typeof COURSE_CATEGORIES];