import { supabase } from "../lib/supabaseClient";
import { Course } from "../types";

// ================================================
// CONFIGURAÇÃO
// ================================================
// ATENÇÃO: O nome deve ser IDÊNTICO ao do seu bucket no Supabase
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
    workload: row.workload ?? "", // Corrigido para pegar workload se existir
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
    workload: course.workload,
  };
}

export const courseService = {
  // 🔹 Upload de Imagem
  uploadImage: async (file: File): Promise<string> => {
    // Sanitiza o nome do arquivo
    const fileExt = file.name.split('.').pop();
    const cleanName = file.name.replace(/[^a-zA-Z0-9]/g, '_');
    const fileName = `${Date.now()}_${cleanName}.${fileExt}`;
    // Podemos usar pastas se quiser organizar melhor: `cursos/${fileName}`
    const filePath = fileName; 

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

  // 🔹 Deletar Imagem do Bucket (Função Melhorada)
  deleteImageFromUrl: async (fullUrl: string): Promise<void> => {
    if (!fullUrl) return;

    try {
      // 1. Verifica se a imagem pertence ao nosso bucket
      if (!fullUrl.includes(`/${BUCKET_NAME}/`)) {
          console.warn("Tentativa de deletar imagem externa ou de outro bucket:", fullUrl);
          return;
      }

      // 2. Extrai o caminho relativo (após o nome do bucket)
      const urlParts = fullUrl.split(`/${BUCKET_NAME}/`);
      if (urlParts.length < 2) return;

      // 3. Limpa query params (ex: ?t=123) e decodifica espaços (%20)
      // Isso é crucial, senão o Supabase não acha o arquivo
      let filePath = urlParts[1].split('?')[0]; 
      filePath = decodeURIComponent(filePath);

      console.log(`Tentando deletar arquivo: ${filePath} do bucket: ${BUCKET_NAME}`);

      const { error } = await supabase.storage
        .from(BUCKET_NAME)
        .remove([filePath]);

      if (error) {
        console.error("Erro Supabase Storage:", error);
        throw new Error("Falha ao remover arquivo do servidor.");
      }
      
      console.log("Arquivo removido com sucesso do bucket.");
    } catch (error) {
      console.error("Erro ao processar exclusão de imagem:", error);
      // Não damos throw aqui para não travar a UI se a imagem já não existia
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

  // 🔹 Remover Curso (E sua imagem)
  remove: async (id: string): Promise<void> => {
    // 1. Busca o curso para pegar a URL da imagem antes de deletar o registro
    const { data: course } = await supabase
      .from("courses")
      .select("image")
      .eq("id", id)
      .single();

    // 2. Se tiver imagem, deleta do bucket
    if (course?.image) {
       await courseService.deleteImageFromUrl(course.image);
    }

    // 3. Deleta o registro do banco
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
      // Nota: Mantém a mesma URL. Não duplicamos o arquivo físico para economizar espaço.
      // Se um for deletado, o ideal seria não deletar a imagem se ela for usada por outro, 
      // mas para este sistema simples, assumimos gestão manual.
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