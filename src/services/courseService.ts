import { supabase } from "../lib/supabaseClient";
import { Course } from "../types";

// ================================================
// CONFIGURAÇÃO
// ================================================
const BUCKET_NAME = "course-images";

// ================================================
// MAPEAMENTO BANCO → FRONT 
// ================================================
function mapRowToCourse(row: any): Course {
  return {
    id: row.id,
    name: row.name ?? "",
    slug: row.slug ?? "",
    type: row.type ?? "presencial",
    duration: row.duration ?? "",
    description: row.description ?? "",
    shortDescription: row.short_descript ?? "", 
    content: row.content ?? [],
    benefits: row.benefits ?? [],
    price: typeof row.price === "number" ? row.price : Number(row.price ?? 0),
    promoPrice:
      row.promo_price === null || row.promo_price === undefined
        ? null
        : Number(row.promo_price),
    imageUrl: row.image ?? "", 
    active: row.active ?? true,
    isFeatured: row.featured ?? false,
    workload: undefined,
    category: row.category ?? "",
  };
}

// ================================================
// MAPEAMENTO FRONT → BANCO
// ================================================
function mapCourseToRow(course: Partial<Course>) {
  return {
    name: course.name,
    slug: course.slug,
    type: course.type,
    duration: course.duration,
    description: course.description,
    short_descript: course.shortDescription,
    content: course.content,
    benefits: course.benefits,
    price: course.price,
    promo_price: course.promoPrice,
    image: course.imageUrl,
    active: course.active,
    featured: course.isFeatured,
    category: course.category,
  };
}

export const courseService = {
  // 🔹 Upload de Imagem
  uploadImage: async (file: File): Promise<string> => {
    // Sanitiza o nome do arquivo para evitar caracteres especiais
    const fileExt = file.name.split('.').pop();
    const cleanName = file.name.replace(/[^a-zA-Z0-9]/g, '_');
    const fileName = `${Date.now()}_${cleanName}.${fileExt}`;
    const filePath = `${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (uploadError) {
      throw new Error(`Erro no upload: ${uploadError.message}`);
    }

    const { data } = supabase.storage
      .from(BUCKET_NAME)
      .getPublicUrl(filePath);

    return data.publicUrl;
  },

  // 🔹 Deletar Imagem do Bucket
  deleteImageFromUrl: async (fullUrl: string): Promise<void> => {
    try {
      // Extrai o caminho do arquivo da URL completa
      // Ex: https://.../storage/v1/object/public/course-images/arquivo.jpg -> arquivo.jpg
      const urlParts = fullUrl.split(`/${BUCKET_NAME}/`);
      if (urlParts.length < 2) return; // Não é uma imagem do nosso bucket

      const filePath = decodeURIComponent(urlParts[1]);

      const { error } = await supabase.storage
        .from(BUCKET_NAME)
        .remove([filePath]);

      if (error) {
        console.error("Erro ao deletar imagem do storage:", error);
        throw new Error("Falha ao remover arquivo do servidor.");
      }
    } catch (error) {
      console.error("Erro ao processar exclusão de imagem:", error);
    }
  },

  // 🔹 Cursos públicos
  getAll: async (): Promise<Course[]> => {
    const { data, error } = await supabase
      .from("courses")
      .select("*")
      .eq("active", true)
      .order("created_at");

    if (error) throw new Error(error.message);
    return (data ?? []).map(mapRowToCourse);
  },

  // 🔹 Admin – listar todos
  getAdminAll: async (): Promise<Course[]> => {
    const { data, error } = await supabase
      .from("courses")
      .select("*")
      .order("created_at");

    if (error) throw new Error(error.message);
    return (data ?? []).map(mapRowToCourse);
  },

  // 🔹 Criar
  create: async (data: Partial<Course>): Promise<Course> => {
    const row = mapCourseToRow(data);
    const { data: inserted, error } = await supabase
      .from("courses")
      .insert(row)
      .select("*")
      .single();

    if (error) throw new Error(error.message);
    return mapRowToCourse(inserted);
  },

  // 🔹 Atualizar
  update: async (id: string, data: Partial<Course>): Promise<Course> => {
    const row = mapCourseToRow(data);
    const { data: updated, error } = await supabase
      .from("courses")
      .update(row)
      .eq("id", id)
      .select("*")
      .single();

    if (error) throw new Error(error.message);
    return mapRowToCourse(updated);
  },

  // 🔹 Remover Curso
  remove: async (id: string): Promise<void> => {
    // Primeiro buscamos o curso para ver se tem imagem para deletar
    const { data: course } = await supabase
      .from("courses")
      .select("image")
      .eq("id", id)
      .single();

    if (course?.image) {
       await courseService.deleteImageFromUrl(course.image);
    }

    const { error } = await supabase
      .from("courses")
      .delete()
      .eq("id", id);

    if (error) throw new Error(error.message);
  },

  // 🔹 Ativar / Desativar
  toggleActive: async (id: string): Promise<boolean> => {
    const { data, error } = await supabase
      .from("courses")
      .select("active")
      .eq("id", id)
      .single();

    if (error || !data) throw new Error("Não foi possível ler o status.");

    const newValue = !data.active;
    const { error: updateError } = await supabase
      .from("courses")
      .update({ active: newValue })
      .eq("id", id);

    if (updateError) throw new Error(updateError.message);
    return newValue;
  },

  // 🔹 Duplicar
  duplicate: async (course: Course): Promise<Course> => {
    const clone = {
      ...course,
      id: undefined,
      name: course.name + " (Cópia)",
      slug: `${course.slug}-copia-${Date.now()}`,
      // Nota: Mantemos a mesma URL de imagem. Se deletar a imagem de um, deleta do outro se for a mesma URL.
      // O ideal seria copiar o arquivo no bucket, mas para simplificar vamos manter a referência.
    };

    const row = mapCourseToRow(clone);
    const { data, error } = await supabase
      .from("courses")
      .insert(row)
      .select("*")
      .single();

    if (error) throw new Error(error.message);
    return mapRowToCourse(data);
  },
};