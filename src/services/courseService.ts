// src/services/courseService.ts

import { supabase } from "../lib/supabaseClient"; // Importação ÚNICA e correta
import { Course } from "../types";

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
  };
}

export const courseService = {
  // 🔹 Cursos públicos (Home, EAD, etc)
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

  // 🔹 Remover
  remove: async (id: string): Promise<void> => {
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