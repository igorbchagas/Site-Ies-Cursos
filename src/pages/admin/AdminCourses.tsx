import { useEffect, useMemo, useState, FormEvent, HTMLProps } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus,
  Edit,
  Trash,
  Copy,
  Eye,
  EyeOff,
  Filter,
  Layers,
  PackageSearch,
  Save,
  X,
  RotateCw,
  Tag,
  Upload,
  Image as ImageIcon,
  Loader2,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { Course } from "../../types";
import { courseService } from "../../services/courseService";
import { COURSE_CATEGORIES } from "../../utils/categoryConstants";


// Cores Padronizadas (Tema Escuro)
const ACCENT_COLOR = "#F27A24";
const DARK_BACKGROUND = "#18181B";
const DARK_SHADE = "#27272A";
const TEXT_COLOR = "#FAFAFA";
const INPUT_BG = "#0A0A0A";
const MAX_FILE_SIZE = 20 * 1024 * 1024; // 5 MB para imagens

type AdminCourse = Omit<Course, "isFeatured">;
type CourseErrors = Partial<Record<keyof AdminCourse | "promoPrice", string>>;

interface CourseFormProps {
  initialCourse: AdminCourse;
  isCreating: boolean;
  saving: boolean;
  onCancel: () => void;
  onSubmit: (course: AdminCourse, imageFile: File | null) => void;
  onDeleteImage: (imageUrl: string) => Promise<void>;
}

interface ConfirmModalProps {
  open: boolean;
  actionType: "delete" | "toggle" | "delete-image" | null;
  courseName?: string;
  password?: string;
  error?: string;
  onPasswordChange?: (value: string) => void;
  onCancel: () => void;
  onConfirm: () => void;
  isLoading?: boolean;
}

const ADMIN_CONFIRM_PASSWORD = "admin";
const categoryOptions = Object.values(COURSE_CATEGORIES);

// ------------------------
// HELPERS
// ------------------------

function normalizeCourse(course: any): AdminCourse {
  return {
    id: course.id,
    name: course.name ?? "",
    slug: course.slug ?? "",
    type: course.type ?? "presencial",
    duration: course.duration ?? "",
    description: course.description ?? "",
    shortDescription: course.shortDescription ?? course.short_descript ?? "",
    content: Array.isArray(course.content) ? course.content : [],
    benefits: Array.isArray(course.benefits) ? course.benefits : [],
    price: typeof course.price === "number" ? course.price : Number(course.price ?? 0),
    promoPrice:
      course.promoPrice !== undefined && course.promoPrice !== null
        ? Number(course.promoPrice)
        : course.promo_price !== undefined && course.promo_price !== null
        ? Number(course.promo_price)
        : null,
    workload: course.workload ?? "",
    imageUrl: course.imageUrl ?? course.image ?? "",
    active: course.active ?? true,
    // === ADICIONADO AQUI ===
    category: course.category ?? "", 
  };
}

function slugify(text: string) {
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

function validateCourse(course: AdminCourse): CourseErrors {
  const errors: CourseErrors = {};
  if (!course.name?.trim()) errors.name = "Informe o nome do curso.";
  if (!course.slug?.trim()) errors.slug = "Informe o slug (URL amigável).";
  const priceNumber = Number(course.price ?? NaN);
  if (Number.isNaN(priceNumber) || priceNumber < 0)
    errors.price = "Informe um preço base válido.";
  const promoPriceNumber =
    course.promoPrice !== null && course.promoPrice !== undefined
      ? Number(course.promoPrice)
      : null;
  if (promoPriceNumber !== null) {
    if (Number.isNaN(promoPriceNumber) || promoPriceNumber < 0)
      errors.promoPrice = "Preço promocional inválido.";
    else if (promoPriceNumber >= priceNumber)
      errors.promoPrice =
        "O preço promocional deve ser menor que o preço base.";
  }
  return errors;
}

function hasErrors(errors: CourseErrors) {
  return Object.values(errors).some(Boolean);
}

function isCoursePromoted(course: AdminCourse) {
  const price = course.price ?? 0;
  const promoPrice = course.promoPrice;
  return (
    promoPrice !== null &&
    promoPrice !== undefined &&
    promoPrice > 0 &&
    promoPrice < price
  );
}

// ------------------------
// TOGGLE SWITCH
// ------------------------
interface ToggleSwitchProps extends HTMLProps<HTMLInputElement> {
  checked: boolean;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  label: string;
}

const ToggleSwitch = ({
  checked,
  onChange,
  label,
  ...rest
}: ToggleSwitchProps) => {
  const trackColor = checked ? ACCENT_COLOR : "#3F3F46";
  return (
    <label className="flex items-center cursor-pointer select-none">
      <span
        className={`mr-3 text-sm font-medium`}
        style={{ color: TEXT_COLOR }}
      >
        {label}
      </span>
      <div className="relative">
        <input
          type="checkbox"
          checked={checked}
          onChange={onChange}
          className="sr-only"
          {...rest}
        />
        <motion.div
          className="w-10 h-6 rounded-full shadow-inner"
          style={{ backgroundColor: trackColor }}
          initial={false}
          animate={{ backgroundColor: checked ? ACCENT_COLOR : "#3F3F46" }}
          transition={{ duration: 0.2 }}
        />
        <motion.div
          className="absolute w-4 h-4 bg-white rounded-full shadow-md top-1"
          initial={false}
          animate={{ x: checked ? 20 : 2 }}
          transition={{ duration: 0.2 }}
        />
      </div>
    </label>
  );
};

// ------------------------
// FORM COMPONENT
// ------------------------

function CourseForm({
  initialCourse,
  isCreating,
  saving,
  onCancel,
  onSubmit,
  onDeleteImage,
}: CourseFormProps) {
  const [form, setForm] = useState<AdminCourse>(initialCourse);
  const [errors, setErrors] = useState<CourseErrors>({});
  const [newContent, setNewContent] = useState("");
  const [newBenefit, setNewBenefit] = useState("");

  // Estados para Upload de Imagem
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(
    initialCourse.imageUrl || null
  );

  // Modal de confirmação exclusivo para imagem
  const [showDeleteImageModal, setShowDeleteImageModal] = useState(false);
  const [deletingImage, setDeletingImage] = useState(false);

  const isPromoChecked =
    form.promoPrice !== null && form.promoPrice !== undefined;

  useEffect(() => {
    // Garante que o formulário seja reiniciado corretamente ao trocar de curso ou criar novo
    setForm(initialCourse);
    setErrors({});
    setNewContent("");
    setNewBenefit("");
    setImageFile(null);
    setPreviewUrl(initialCourse.imageUrl || null);
  }, [initialCourse]);

  // Cleanup da URL de preview (para links locais 'blob:')
  useEffect(() => {
    return () => {
      if (previewUrl && previewUrl.startsWith("blob:")) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  function updateField(field: keyof AdminCourse, value: any) {
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: undefined }));
  }

  function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith("image/")) {
        toast.error("Apenas arquivos de imagem são permitidos.");
        return;
      }
      if (file.size > MAX_FILE_SIZE) {
        toast.error(
          `A imagem deve ter no máximo ${MAX_FILE_SIZE / 1024 / 1024}MB.`
        );
        return;
      }
      setImageFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  }

  function handleRemoveClick() {
    // Se for um arquivo local que ainda não foi salvo, limpa localmente
    if (imageFile) {
      clearLocalImage();
      return;
    }
    // Se for uma imagem salva com URL, dispara o modal de exclusão do servidor
    if (form.imageUrl) {
      setShowDeleteImageModal(true);
    }
  }

  function clearLocalImage() {
    setImageFile(null);
    setPreviewUrl(null);
    const fileInput = document.getElementById(
      "course-image-input"
    ) as HTMLInputElement;
    if (fileInput) fileInput.value = "";
  }

  async function confirmDeleteImageFromBucket() {
    if (!form.imageUrl) return;
    setDeletingImage(true);
    try {
      await onDeleteImage(form.imageUrl);
      updateField("imageUrl", ""); // Limpa a URL no formulário (e no banco ao salvar)
      setPreviewUrl(null);
      toast.success("Imagem removida do servidor.");
    } catch (error) {
      toast.error("Erro ao remover imagem.");
    } finally {
      setDeletingImage(false);
      setShowDeleteImageModal(false);
    }
  }

  function handleNameChange(value: string) {
    updateField("name", value);
    if (!form.slug || form.slug === slugify(form.name ?? "")) {
      const autoSlug = slugify(value);
      setForm((prev) => ({ ...prev, slug: autoSlug }));
      setErrors((prev) => ({ ...prev, slug: undefined }));
    }
  }

  function handleTogglePromo(e: React.ChangeEvent<HTMLInputElement>) {
    const isChecked = e.target.checked;
    if (isChecked) {
      const defaultPromo =
        form.promoPrice && form.promoPrice > 0
          ? form.promoPrice
          : form.price ?? 0;
      updateField("promoPrice", defaultPromo);
    } else {
      updateField("promoPrice", null);
      setErrors((prev) => ({ ...prev, promoPrice: undefined }));
    }
  }

  function handleAddContent() {
    if (!newContent.trim()) return;
    setForm((prev) => ({
      ...prev,
      content: [...(prev.content ?? []), newContent.trim()],
    }));
    setNewContent("");
  }
  function handleRemoveContent(index: number) {
    setForm((prev) => ({
      ...prev,
      content: (prev.content ?? []).filter((_, i) => i !== index),
    }));
  }
  function handleAddBenefit() {
    if (!newBenefit.trim()) return;
    setForm((prev) => ({
      ...prev,
      benefits: [...(prev.benefits ?? []), newBenefit.trim()],
    }));
    setNewBenefit("");
  }
  function handleRemoveBenefit(index: number) {
    setForm((prev) => ({
      ...prev,
      benefits: (prev.benefits ?? []).filter((_, i) => i !== index),
    }));
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const normalized: AdminCourse = {
      ...form,
      price:
        form.price === undefined || form.price === null
          ? 0
          : Number(form.price),
      promoPrice: isPromoChecked ? Number(form.promoPrice) : null,
    };

    const validation = validateCourse(normalized);
    if (hasErrors(validation)) {
      setErrors(validation);
      toast.error("Verifique os campos destacados.");
      return;
    }

    onSubmit({ ...normalized, isFeatured: false } as any, imageFile);
  }

  const priceValue =
    form.price === undefined || form.price === null ? "" : String(form.price);
  const promoPriceValue =
    form.promoPrice === undefined || form.promoPrice === null
      ? ""
      : String(form.promoPrice);
  const inputClass = (fieldError: string | undefined) =>
    `px-3 py-2 rounded-lg border text-sm text-[${TEXT_COLOR}] ${
      fieldError ? "border-red-500" : "border-zinc-700"
    } bg-zinc-900/60 focus:outline-none focus:ring-2 focus:ring-[${ACCENT_COLOR}] appearance-none`;
  const labelClass =
    "text-xs font-semibold text-zinc-400 uppercase tracking-wide";

  // Obtenha a lista de categorias do helper (depende do import)
  // Certifique-se que 'COURSE_CATEGORIES' está acessível no escopo do AdminCourses.tsx
  const categoryOptions = Object.values(COURSE_CATEGORIES);


  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className={`bg-[${DARK_SHADE}] border border-zinc-700 rounded-xl p-4 md:p-8 shadow-xl text-[${TEXT_COLOR}]`}
      >
        <div className="flex items-start justify-between mb-6 border-b border-zinc-700 pb-4">
          <div>
            <h2 className={`text-xl font-bold`} style={{ color: TEXT_COLOR }}>
              {isCreating ? "Adicionar Novo Curso" : "Editar Curso"}
            </h2>
            <p className="text-sm text-zinc-400">
              Gerencie as informações e a visibilidade no site.
            </p>
          </div>
          <button
            type="button"
            onClick={onCancel}
            className="flex items-center gap-1 text-sm text-zinc-400 hover:text-red-400 transition-colors"
          >
            <X size={18} />
            <span className="hidden sm:inline">Fechar</span>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* === GRUPO 1: INFORMAÇÕES BÁSICAS === */}
          <div
            className={`space-y-4 border p-4 rounded-lg bg-[${INPUT_BG}] border-zinc-800`}
          >
            <h3 className="text-base font-bold text-zinc-300 flex items-center gap-2">
              <Layers size={16} style={{ color: ACCENT_COLOR }} /> Detalhes do
              Curso
            </h3>
            <div className="grid md:grid-cols-3 gap-4">
              <div className="flex flex-col gap-1">
                <label className={labelClass}>
                  Nome do curso <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  className={inputClass(errors.name)}
                />
                {errors.name && (
                  <span className="text-[11px] text-red-500">
                    {errors.name}
                  </span>
                )}
              </div>
              <div className="flex flex-col gap-1">
                <label className={labelClass}>
                  Slug (URL) <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={form.slug}
                  onChange={(e) => updateField("slug", slugify(e.target.value))}
                  className={inputClass(errors.slug)}
                />
                {errors.slug && (
                  <span className="text-[11px] text-red-500">
                    {errors.slug}
                  </span>
                )}
              </div>
              
              {/* === NOVO: CATEGORIA VISUAL === */}
              <div className="flex flex-col gap-1">
                <label className={labelClass}>Categoria Visual</label>
                <select
                  value={form.category ?? ""}
                  onChange={(e) => updateField("category", e.target.value)}
                  className={`${inputClass(errors.category)} cursor-pointer`}
                >
                  <option value="">Nenhuma (Usar ícone padrão)</option>
                  {categoryOptions.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
                <p className="text-[10px] text-zinc-500 mt-1">
                  Define a imagem padrão do card (fallback).
                </p>
              </div>

              <div className="flex flex-col gap-1">
                <label className={labelClass}>
                  Modalidade <span className="text-red-500">*</span>
                </label>
                <select
                  value={form.type}
                  onChange={(e) =>
                    updateField(
                      "type",
                      e.target.value === "ead" ? "ead" : "presencial"
                    )
                  }
                  className={`${inputClass(errors.type)} cursor-pointer`}
                >
                  <option value="presencial">Presencial</option>
                  <option value="ead">EAD</option>
                </select>
              </div>
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1">
                <label className={labelClass}>Duração</label>
                <input
                  type="text"
                  value={form.duration ?? ""}
                  onChange={(e) => updateField("duration", e.target.value)}
                  className={inputClass(errors.duration)}
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className={labelClass}>Carga horária</label>
                <input
                  type="text"
                  value={form.workload ?? ""}
                  onChange={(e) => updateField("workload", e.target.value)}
                  className={inputClass(errors.workload)}
                />
              </div>
            </div>
          </div>

          {/* === GRUPO 2: PREÇO E PROMOÇÃO === */}
          <div
            className={`space-y-4 border p-4 rounded-lg bg-[${INPUT_BG}] border-zinc-800`}
          >
            <h3 className="text-base font-bold text-zinc-300 flex items-center gap-2">
              <Tag size={16} style={{ color: ACCENT_COLOR }} /> Gestão de Preços
            </h3>
            <div className="grid md:grid-cols-3 gap-4 items-end">
              <div className="flex flex-col gap-1">
                <label className={labelClass}>
                  Preço Base (R$) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  min={0}
                  step="0.01"
                  value={priceValue}
                  onChange={(e) =>
                    updateField(
                      "price",
                      e.target.value === "" ? 0 : Number(e.target.value)
                    )
                  }
                  className={inputClass(errors.price)}
                />
                {errors.price && (
                  <span className="text-[11px] text-red-500">
                    {errors.price}
                  </span>
                )}
              </div>
              <div className="flex flex-col gap-1 h-full justify-end">
                <ToggleSwitch
                  label="Curso em Promoção"
                  checked={isPromoChecked}
                  onChange={handleTogglePromo}
                />
              </div>
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{
                  opacity: isPromoChecked ? 1 : 0.5,
                  x: 0,
                  height: isPromoChecked ? "auto" : 0,
                }}
                className={`flex flex-col gap-1 overflow-hidden ${
                  isPromoChecked ? "" : "pointer-events-none"
                }`}
              >
                <label className={labelClass}>
                  Preço Promocional (R$) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  min={0}
                  step="0.01"
                  value={promoPriceValue}
                  onChange={(e) =>
                    updateField(
                      "promoPrice",
                      e.target.value === "" ? null : Number(e.target.value)
                    )
                  }
                  className={inputClass(errors.promoPrice)}
                  disabled={!isPromoChecked}
                />
              </motion.div>
            </div>
          </div>

          {/* === GRUPO 3: IMAGEM DO CURSO (SEM VÍDEO, COM BOTÃO RESPONSIVO) === */}
          <div
            className={`space-y-4 border p-4 rounded-lg bg-[${INPUT_BG}] border-zinc-800`}
          >
            <h3 className="text-base font-bold text-zinc-300 flex items-center gap-2">
              <ImageIcon size={16} style={{ color: ACCENT_COLOR }} /> Imagem do
              Card
            </h3>

            <div className="flex flex-col gap-4">
              {/* Preview */}
              {previewUrl ? (
                <div className="relative w-full h-48 bg-zinc-900 rounded-lg border border-zinc-700 overflow-hidden group">
                  <img
                    src={previewUrl}
                    alt="Preview"
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />

                  {/* --- VERSÃO DESKTOP (Hover) --- */}
                  <div className="hidden md:flex absolute inset-0 bg-black/60 items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      type="button"
                      onClick={handleRemoveClick}
                      className="px-4 py-2 bg-red-600 text-white rounded-lg flex items-center gap-2 text-sm font-bold hover:bg-red-700 transform hover:scale-105 transition-all"
                    >
                      <Trash size={16} /> Remover Imagem
                    </button>
                  </div>

                  {/* --- VERSÃO MOBILE (Fixo) --- */}
                  <button
                    type="button"
                    onClick={handleRemoveClick}
                    className="md:hidden absolute top-2 right-2 p-2 bg-red-600 text-white rounded-lg shadow-lg flex items-center justify-center active:scale-95 transition-transform z-10"
                    title="Remover Imagem"
                  >
                    <Trash size={18} />
                  </button>
                </div>
              ) : (
                <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-zinc-700 rounded-lg cursor-pointer bg-zinc-900/50 hover:bg-zinc-800 hover:border-orange-500 transition-all group">
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    <Upload className="w-8 h-8 mb-2 text-zinc-500 group-hover:text-orange-500" />
                    <p className="text-sm text-zinc-400 group-hover:text-zinc-200">
                      Clique para selecionar uma imagem
                    </p>
                    <p className="text-xs text-zinc-600">
                      JPG, PNG, WEBP (Max 5MB)
                    </p>
                  </div>
                  <input
                    id="course-image-input"
                    type="file"
                    className="hidden"
                    accept="image/*"
                    onChange={handleImageChange}
                  />
                </label>
              )}
              <p className="text-xs text-zinc-500">
                Apenas imagens são permitidas. Se não houver imagem, será
                exibido o ícone padrão.
              </p>
            </div>

            <div className="mt-4 pt-4 border-t border-zinc-800">
              <ToggleSwitch
                label="Curso ativo no site"
                checked={form.active ?? true}
                onChange={(e) => updateField("active", e.target.checked)}
              />
            </div>
          </div>

          {/* === GRUPO 4: DESCRIÇÕES === */}
          <div
            className={`space-y-4 border p-4 rounded-lg bg-[${INPUT_BG}] border-zinc-800`}
          >
            <h3 className="text-base font-bold text-zinc-300 flex items-center gap-2">
              <PackageSearch size={16} style={{ color: ACCENT_COLOR }} /> Textos
              e Conteúdo
            </h3>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1">
                <label className={labelClass}>Descrição Curta</label>
                <textarea
                  value={form.shortDescription ?? ""}
                  onChange={(e) =>
                    updateField("shortDescription", e.target.value)
                  }
                  className={`${inputClass(
                    errors.shortDescription
                  )} h-20 resize-none`}
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className={labelClass}>Descrição Detalhada</label>
                <textarea
                  value={form.description ?? ""}
                  onChange={(e) => updateField("description", e.target.value)}
                  className={`${inputClass(
                    errors.description
                  )} h-20 resize-none`}
                />
              </div>
            </div>
          </div>

          {/* === GRUPO 5: LISTAS === */}
          <div className="grid md:grid-cols-2 gap-4">
            <div
              className={`flex flex-col gap-2 p-4 rounded-lg bg-[${INPUT_BG}] border-zinc-800`}
            >
              <label className={labelClass}>Conteúdo (tópicos)</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newContent}
                  onChange={(e) => setNewContent(e.target.value)}
                  placeholder="Novo tópico"
                  className="flex-1 px-3 py-2 rounded-lg bg-zinc-900/60 border border-zinc-700 text-sm text-[${TEXT_COLOR}] focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
                <button
                  type="button"
                  onClick={handleAddContent}
                  className={`px-3 py-2 rounded-lg text-white text-sm hover:bg-[#d66a1f]`}
                  style={{ backgroundColor: ACCENT_COLOR }}
                >
                  <Plus size={16} />
                </button>
              </div>
              <ul className="text-sm text-zinc-300 max-h-48 overflow-y-auto space-y-2 mt-2 p-1 custom-scrollbar">
                {(form.content ?? []).map((item, index) => (
                  <motion.li
                    key={index}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="flex items-start justify-between gap-3 bg-zinc-900/60 px-3 py-2 rounded border border-zinc-700"
                  >
                    <span className="text-xs break-words whitespace-normal min-w-0 flex-1 leading-relaxed">
                      {item}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleRemoveContent(index)}
                      className="text-red-500 hover:text-red-400 flex-shrink-0 mt-0.5"
                    >
                      <X size={14} />
                    </button>
                  </motion.li>
                ))}
              </ul>
            </div>
            <div
              className={`flex flex-col gap-2 p-4 rounded-lg bg-[${INPUT_BG}] border-zinc-800`}
            >
              <label className={labelClass}>Benefícios</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newBenefit}
                  onChange={(e) => setNewBenefit(e.target.value)}
                  placeholder="Novo benefício"
                  className="flex-1 px-3 py-2 rounded-lg bg-zinc-900/60 border border-zinc-700 text-sm text-[${TEXT_COLOR}] focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
                <button
                  type="button"
                  onClick={handleAddBenefit}
                  className={`px-3 py-2 rounded-lg text-white text-sm hover:bg-[#d66a1f]`}
                  style={{ backgroundColor: ACCENT_COLOR }}
                >
                  <Plus size={16} />
                </button>
              </div>
              <ul className="text-sm text-zinc-300 max-h-48 overflow-y-auto space-y-2 mt-2 p-1 custom-scrollbar">
                {(form.benefits ?? []).map((item, index) => (
                  <motion.li
                    key={index}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="flex items-start justify-between gap-3 bg-zinc-900/60 px-3 py-2 rounded border border-zinc-700"
                  >
                    <span className="text-xs break-words whitespace-normal min-w-0 flex-1 leading-relaxed">
                      {item}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleRemoveBenefit(index)}
                      className="text-red-500 hover:text-red-400 flex-shrink-0 mt-0.5"
                    >
                      <X size={14} />
                    </button>
                  </motion.li>
                ))}
              </ul>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-zinc-700">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 rounded-lg border border-zinc-700 text-sm text-zinc-300 hover:bg-zinc-800 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving}
              className={`px-6 py-2 rounded-lg text-sm text-white flex items-center justify-center gap-2 disabled:opacity-60 transition-colors hover:bg-[#d66a1f] shadow-md whitespace-nowrap`}
              style={{ backgroundColor: ACCENT_COLOR }}
            >
              <Save size={18} /> {saving ? "Salvando..." : "Salvar"}
            </button>
          </div>
        </form>

        {/* Modal de confirmação para deletar imagem */}
        <ConfirmModal
          open={showDeleteImageModal}
          actionType="delete-image"
          title="Excluir Imagem do Curso"
          description="Tem certeza? A imagem será apagada permanentemente do servidor e não poderá ser recuperada."
          onCancel={() => setShowDeleteImageModal(false)}
          onConfirm={confirmDeleteImageFromBucket}
          isLoading={deletingImage}
        />
      </motion.div>
    </>
  );
}

function ConfirmModal({
  open,
  actionType,
  courseName,
  title,
  description: customDescription,
  password,
  error,
  onPasswordChange,
  onCancel,
  onConfirm,
  isLoading,
}: ConfirmModalProps & { title?: string; description?: string }) {
  // === NOVO: Bloqueia o scroll do fundo quando o modal abre ===
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    // Cleanup ao desmontar
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [open]);

  if (!open || !actionType) return null;

  let modalTitle = title;
  let modalDescription = customDescription;

  if (!modalTitle) {
    if (actionType === "delete") modalTitle = "Confirmar Exclusão do Curso";
    else if (actionType === "toggle") modalTitle = "Alterar Visibilidade";
    else if (actionType === "delete-image") modalTitle = "Excluir Imagem";
  }

  if (!modalDescription) {
    if (actionType === "delete")
      modalDescription = `Tem certeza que deseja excluir o curso "${courseName}"? Essa ação não poderá ser desfeita.`;
    else if (actionType === "toggle")
      modalDescription = `Tem certeza que deseja alterar a visibilidade do curso "${courseName}" no site?`;
  }

  const needsPassword = actionType === "delete" || actionType === "toggle";

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      {/* Backdrop Escuro */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onCancel}
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
      />

      {/* Modal - CORRIGIDO: Trocado bg-[${DARK_SHADE}] por bg-zinc-900 para garantir a cor opaca */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        transition={{ duration: 0.2 }}
        className="relative bg-zinc-900 border border-zinc-700 rounded-xl p-6 w-full max-w-md shadow-2xl z-10 text-zinc-50"
      >
        {(actionType === "delete" || actionType === "delete-image") && (
          <div className="flex justify-center mb-4">
            <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center text-red-500">
              <Trash2 size={24} />
            </div>
          </div>
        )}

        <div className="text-center mb-6">
          <h2 className="text-lg font-bold mb-2 text-zinc-50">{modalTitle}</h2>
          <p className="text-sm text-zinc-300 leading-relaxed">
            {modalDescription}
          </p>
        </div>

        {needsPassword && (
          <div className="flex flex-col gap-2 mb-6 text-left">
            <label className="text-xs font-medium text-zinc-400 uppercase tracking-wider">
              Senha de Administrador
            </label>
            <input
              type="password"
              autoFocus
              placeholder="Digite sua senha..."
              value={password}
              onChange={(e) =>
                onPasswordChange && onPasswordChange(e.target.value)
              }
              onKeyDown={(e) => e.key === "Enter" && onConfirm()}
              className="w-full px-4 py-3 rounded-lg bg-zinc-950 border border-zinc-700 text-zinc-50 focus:outline-none focus:ring-2 focus:ring-orange-500 transition-all placeholder:text-zinc-600"
            />
            {error && (
              <motion.span
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-xs text-red-500 font-medium flex items-center gap-1"
              >
                • {error}
              </motion.span>
            )}
          </div>
        )}

        <div className="flex gap-3 w-full mt-2">
          <button
            type="button"
            onClick={onCancel}
            disabled={isLoading}
            className="flex-1 px-4 py-2.5 rounded-lg border border-zinc-700 text-sm font-medium text-zinc-300 hover:bg-zinc-800 transition-colors"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isLoading}
            className={`flex-1 px-4 py-2.5 rounded-lg text-sm text-white font-medium shadow-lg transition-all flex items-center justify-center gap-2 ${
              actionType === "delete" || actionType === "delete-image"
                ? "bg-red-600 hover:bg-red-700"
                : "bg-orange-500 hover:bg-orange-600"
            }`}
          >
            {isLoading ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              "Confirmar"
            )}
          </button>
        </div>
      </motion.div>
    </div>,
    document.body
  );
}

export default function AdminCourses() {
  const [courses, setCourses] = useState<AdminCourse[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState<"all" | "presencial" | "ead">(
    "all"
  );
  const [filterStatus, setFilterStatus] = useState<
    "all" | "active" | "inactive"
  >("all");
  const [editingCourse, setEditingCourse] = useState<AdminCourse | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [confirmActionType, setConfirmActionType] = useState<
    "delete" | "toggle" | null
  >(null);
  const [confirmCourse, setConfirmCourse] = useState<AdminCourse | null>(null);
  const [confirmPassword, setConfirmPassword] = useState("");
  const [confirmError, setConfirmError] = useState("");

  async function loadCourses(showToast = false) {
    try {
      setLoading(true);
      const result = await courseService.getAdminAll();
      setCourses(result.map(normalizeCourse));
      if (showToast) toast.success("Lista de cursos atualizada.");
    } catch (error: any) {
      console.error("Erro ao carregar cursos:", error);
      toast.error("Não foi possível carregar os cursos.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadCourses();
  }, []);

  const filteredCourses = useMemo(() => {
    return courses.filter((course) => {
      const matchesSearch =
        course.name.toLowerCase().includes(search.toLowerCase()) ||
        course.slug.toLowerCase().includes(search.toLowerCase());
      const matchesType =
        filterType === "all" ? true : course.type === filterType;
      const activeFlag = course.active ?? true;
      const matchesStatus =
        filterStatus === "all"
          ? true
          : filterStatus === "active"
          ? activeFlag
          : !activeFlag;
      return matchesSearch && matchesType && matchesStatus;
    });
  }, [courses, search, filterType, filterStatus]);

  function handleNewCourse() {
    setIsCreating(true);
    setEditingCourse({
      id: "",
      name: "",
      slug: "",
      type: "presencial",
      duration: "",
      description: "",
      shortDescription: "",
      content: [],
      benefits: [],
      price: 0,
      promoPrice: null,
      workload: "",
      imageUrl: "",
      active: true,
    });
  }
  function handleEditCourse(course: AdminCourse) {
    setIsCreating(false);
    setEditingCourse(normalizeCourse(course));
  }

  // ATENÇÃO: Recebe o arquivo agora
  async function handleSaveCourse(course: AdminCourse, imageFile: File | null) {
    setSaving(true);
    try {
      let finalCourseData = { ...course, isFeatured: false };

      // 1. Se tiver arquivo novo, faz o upload primeiro
      if (imageFile) {
        try {
          const uploadedUrl = await courseService.uploadImage(imageFile);
          finalCourseData.imageUrl = uploadedUrl;
        } catch (uploadError: any) {
          toast.error("Erro ao fazer upload da imagem: " + uploadError.message);
          setSaving(false);
          return;
        }
      }

      // 2. Salva os dados do curso
      if (isCreating) {
        const { id, ...payload } = finalCourseData;
        const created = await courseService.create(payload as Course);
        setCourses((prev) => [...prev, normalizeCourse(created)]);
        toast.success("Curso criado com sucesso!");
      } else {
        const { id, ...payload } = finalCourseData;
        const updated = await courseService.update(
          course.id,
          payload as Course
        );
        setCourses((prev) =>
          prev.map((c) => (c.id === course.id ? normalizeCourse(updated) : c))
        );
        toast.success("Curso atualizado com sucesso!");
      }
      setEditingCourse(null);
      setIsCreating(false);
    } catch (error: any) {
      console.error("Erro ao salvar curso:", error);
      toast.error(error.message || "Não foi possível salvar o curso.");
    } finally {
      setSaving(false);
    }
  }

  // Função passada para o CourseForm para deletar imagem do bucket
  async function handleDeleteImage(imageUrl: string) {
    await courseService.deleteImageFromUrl(imageUrl);
    // Atualiza o curso atual na lista principal se estivermos editando
    if (editingCourse) {
      const updatedLocal = { ...editingCourse, imageUrl: "" };
      setEditingCourse(updatedLocal); // Atualiza o form
      // Opcional: Atualiza a lista principal imediatamente para refletir (mas só salva no banco se clicar em salvar depois? Não, o delete é direto no bucket)
      // OBS: Como deletamos do bucket, a imagem vai quebrar se não atualizarmos o banco.
      // Estrategia segura: Deletar do bucket e JÁ atualizar o banco setando image = null
      try {
        await courseService.update(editingCourse.id, {
          ...editingCourse,
          imageUrl: "",
        } as Course);
        // Atualiza a lista
        setCourses((prev) =>
          prev.map((c) =>
            c.id === editingCourse.id ? { ...c, imageUrl: "" } : c
          )
        );
      } catch (e) {
        console.error(
          "Erro ao atualizar registro do curso após deletar imagem",
          e
        );
      }
    }
  }

  async function handleDuplicateCourse(course: AdminCourse) {
    try {
      const duplicated = await courseService.duplicate({
        ...course,
        isFeatured: false,
      } as Course);
      setCourses((prev) => [...prev, normalizeCourse(duplicated)]);
      toast.success("Curso duplicado com sucesso!");
    } catch (error: any) {
      console.error("Erro ao duplicar curso:", error);
      toast.error("Não foi possível duplicar o curso.");
    }
  }

  function openConfirm(type: "delete" | "toggle", course: AdminCourse) {
    setConfirmActionType(type);
    setConfirmCourse(course);
    setConfirmPassword("");
    setConfirmError("");
  }
  function closeConfirm() {
    setConfirmActionType(null);
    setConfirmCourse(null);
    setConfirmPassword("");
    setConfirmError("");
  }
  async function handleConfirm() {
    if (!confirmActionType || !confirmCourse) return;
    if (confirmPassword !== ADMIN_CONFIRM_PASSWORD) {
      setConfirmError("Senha incorreta.");
      return;
    }
    try {
      if (confirmActionType === "delete") {
        await courseService.remove(confirmCourse.id);
        setCourses((prev) => prev.filter((c) => c.id !== confirmCourse.id));
        toast.success("Curso excluído com sucesso.");
      } else if (confirmActionType === "toggle") {
        await courseService.toggleActive(confirmCourse.id);
        loadCourses();
        toast.success("Visibilidade do curso atualizada.");
      }
      closeConfirm();
    } catch (error: any) {
      console.error("Erro ao confirmar ação:", error);
      toast.error("Não foi possível concluir a ação.");
    }
  }

  if (loading)
    return (
      <div
        className={`flex flex-col items-center justify-center h-full text-[${TEXT_COLOR}] gap-3 bg-[${DARK_SHADE}] p-8 rounded-xl`}
      >
        <div
          className="w-8 h-8 border-4 border-zinc-500 border-t-transparent rounded-full animate-spin"
          style={{ borderColor: ACCENT_COLOR, borderTopColor: "transparent" }}
        />
        <span className="text-sm">Carregando cursos...</span>
      </div>
    );

  const renderPriceCell = (course: AdminCourse) => {
    const price = course.price ?? 0;
    const isPromoted = isCoursePromoted(course);
    if (isPromoted)
      return (
        <div className="flex flex-col">
          <span className="text-[10px] text-zinc-400 line-through">
            R$ {price.toFixed(2)}
          </span>
          <span className="text-[13px] font-bold text-green-400">
            R$ {course.promoPrice!.toFixed(2)}
          </span>
        </div>
      );
    return (
      <span className="text-[13px] text-zinc-200 font-medium">
        R$ {price.toFixed(2)}
      </span>
    );
  };

  return (
    <div
      className={`space-y-6 p-4 md:p-8 bg-[${DARK_BACKGROUND}] rounded-xl text-[${TEXT_COLOR}]`}
    >
      <AnimatePresence mode="wait">
        {editingCourse ? (
          <CourseForm
            key="course-form"
            initialCourse={editingCourse}
            isCreating={isCreating}
            saving={saving}
            onCancel={() => {
              setEditingCourse(null);
              setIsCreating(false);
            }}
            onSubmit={handleSaveCourse}
            onDeleteImage={handleDeleteImage} // Passando a função de deletar
          />
        ) : (
          <motion.div
            key="course-list"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
              <div className="flex items-center gap-3">
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-md`}
                  style={{
                    background: `linear-gradient(to right, ${ACCENT_COLOR}, #d66a1f)`,
                  }}
                >
                  <PackageSearch size={20} className="text-white" />
                </div>
                <div className="flex flex-col">
                  <h1
                    className={`text-xl font-bold`}
                    style={{ color: TEXT_COLOR }}
                  >
                    Gerenciar Cursos
                  </h1>
                  <span className="text-sm text-zinc-400">
                    {filteredCourses.length} curso(s)
                  </span>
                </div>
              </div>
              <div className="flex flex-wrap gap-2 justify-start md:justify-end">
                <button
                  type="button"
                  onClick={() => loadCourses(true)}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg border border-zinc-700 text-xs text-zinc-200 hover:bg-zinc-800 transition-colors shadow-sm"
                >
                  <RotateCw size={14} />
                  <span className="hidden sm:inline">Atualizar</span>
                </button>
                <button
                  type="button"
                  onClick={handleNewCourse}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm text-white shadow-md transition-colors hover:bg-[#d66a1f]`}
                  style={{ backgroundColor: ACCENT_COLOR }}
                >
                  <Plus size={16} /> Novo curso
                </button>
              </div>
            </div>

            <div
              className={`bg-[${DARK_SHADE}] border border-zinc-700 rounded-xl p-4 grid grid-cols-1 md:grid-cols-7 gap-4 items-end shadow-sm`}
            >
              <div className="flex flex-col gap-1 col-span-1 md:col-span-4">
                <p className="text-xs text-zinc-400 font-semibold uppercase">
                  Buscar
                </p>
                <div className="flex items-center gap-2">
                  <PackageSearch
                    size={16}
                    className="text-zinc-500 flex-shrink-0"
                  />
                  <input
                    type="text"
                    placeholder="Filtrar por nome..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className={`w-full px-3 py-2 rounded-lg bg-zinc-900/60 border border-zinc-700 text-sm text-[${TEXT_COLOR}] focus:outline-none focus:ring-2 focus:ring-[${ACCENT_COLOR}] placeholder:text-zinc-600`}
                  />
                </div>
              </div>
              <div className="flex flex-col gap-1 col-span-1 md:col-span-2">
                <p className="text-xs text-zinc-400 font-semibold uppercase">
                  Modalidade
                </p>
                <div className="flex items-center gap-2">
                  <Filter size={16} className="text-zinc-500 flex-shrink-0" />
                  <select
                    value={filterType}
                    onChange={(e) => setFilterType(e.target.value as any)}
                    className={`w-full px-3 py-2 rounded-lg bg-zinc-900/60 border border-zinc-700 text-sm text-[${TEXT_COLOR}] focus:outline-none focus:ring-2 focus:ring-[${ACCENT_COLOR}] appearance-none cursor-pointer`}
                  >
                    <option value="all">Todos</option>
                    <option value="presencial">Presencial</option>
                    <option value="ead">EAD</option>
                  </select>
                </div>
              </div>
              <div className="flex flex-col gap-1 col-span-1 md:col-span-1">
                <p className="text-xs text-zinc-400 font-semibold uppercase">
                  Status
                </p>
                <div className="flex items-center gap-2">
                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value as any)}
                    className={`w-full px-3 py-2 rounded-lg bg-zinc-900/60 border border-zinc-700 text-sm text-[${TEXT_COLOR}] focus:outline-none focus:ring-2 focus:ring-[${ACCENT_COLOR}] appearance-none cursor-pointer`}
                  >
                    <option value="all">Todos</option>
                    <option value="active">Ativos</option>
                    <option value="inactive">Inativos</option>
                  </select>
                </div>
              </div>
            </div>

            {/* LISTA MOBILE */}
            <div className="md:hidden space-y-4 mt-6">
              {filteredCourses.map((course) => (
                <div
                  key={course.id}
                  className={`bg-[${DARK_SHADE}] border border-zinc-700 rounded-xl p-4 shadow-sm flex flex-col gap-3`}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-bold text-white text-base">
                        {course.name}
                      </h3>
                      <p className="text-xs text-zinc-500">{course.slug}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => openConfirm("toggle", course)}
                      className={`inline-flex items-center justify-center p-1.5 rounded-full border transition-colors ${
                        course.active
                          ? "bg-green-900/20 text-green-400 border-green-800"
                          : "bg-zinc-800 text-zinc-500 border-zinc-700"
                      }`}
                    >
                      {course.active ? <Eye size={16} /> : <EyeOff size={16} />}
                    </button>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded bg-zinc-900 border border-zinc-700 text-zinc-300 text-xs">
                      {course.type === "presencial" ? "Presencial" : "EAD"}
                    </span>
                    <div className="ml-auto">{renderPriceCell(course)}</div>
                  </div>
                  {isCoursePromoted(course) && (
                    <div className="inline-flex items-center gap-1 px-2 py-1 rounded bg-red-900/20 text-red-400 border border-red-800 text-xs w-fit">
                      <Tag size={12} /> Em Promoção
                    </div>
                  )}
                  <div className="grid grid-cols-3 gap-2 pt-3 border-t border-zinc-700 mt-1">
                    <button
                      onClick={() => handleEditCourse(course)}
                      className="flex items-center justify-center gap-1 py-2 rounded bg-zinc-800 text-zinc-300 text-xs font-medium border border-zinc-700"
                    >
                      <Edit size={14} /> Editar
                    </button>
                    <button
                      onClick={() => handleDuplicateCourse(course)}
                      className="flex items-center justify-center gap-1 py-2 rounded bg-zinc-800 text-zinc-300 text-xs font-medium border border-zinc-700"
                    >
                      <Copy size={14} /> Duplicar
                    </button>
                    <button
                      onClick={() => openConfirm("delete", course)}
                      className="flex items-center justify-center gap-1 py-2 rounded bg-red-900/20 text-red-400 text-xs font-medium border border-red-900/30"
                    >
                      <Trash size={14} /> Excluir
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* TABELA DESKTOP */}
            <div
              className={`hidden md:block bg-[${DARK_SHADE}] border border-zinc-700 rounded-xl overflow-hidden shadow-sm mt-6`}
            >
              <table className="min-w-full text-sm">
                <thead
                  className={`bg-[${INPUT_BG}] text-zinc-400 uppercase tracking-wide font-semibold`}
                >
                  <tr>
                    <th className="px-4 py-3 text-left">Curso</th>
                    <th className="px-4 py-3 text-left">Tipo</th>
                    <th className="px-4 py-3 text-left">Preço (Ref.)</th>
                    <th className="px-4 py-3 text-left">Status</th>
                    <th className="px-4 py-3 text-left">Promoção</th>
                    <th className="px-4 py-3 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  <AnimatePresence initial={false}>
                    {filteredCourses.map((course) => (
                      <motion.tr
                        key={course.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, x: -50 }}
                        transition={{ duration: 0.25 }}
                        className="border-t border-zinc-800 hover:bg-zinc-800/80"
                      >
                        <td className="px-4 py-3">
                          <div className="flex flex-col">
                            <span
                              className={`font-medium text-[14px]`}
                              style={{ color: TEXT_COLOR }}
                            >
                              {course.name}
                            </span>
                            <span className="text-[11px] text-zinc-500">
                              {course.slug}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-[11px] bg-zinc-900 border border-zinc-700 text-zinc-300">
                            <Layers size={12} />
                            {course.type === "presencial"
                              ? "Presencial"
                              : "EAD"}
                          </span>
                        </td>
                        <td className="px-4 py-3">{renderPriceCell(course)}</td>
                        <td className="px-4 py-3">
                          <button
                            type="button"
                            onClick={() => openConfirm("toggle", course)}
                            className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-[11px] border transition-colors ${
                              course.active
                                ? "bg-green-600/20 text-green-400 border-green-700 hover:bg-green-600/30"
                                : "bg-zinc-800/80 text-zinc-400 border-zinc-700 hover:bg-zinc-800"
                            }`}
                          >
                            {course.active ? (
                              <>
                                <Eye size={12} className="text-green-400" />
                                Ativo
                              </>
                            ) : (
                              <>
                                <EyeOff size={12} className="text-zinc-400" />
                                Inativo
                              </>
                            )}
                          </button>
                        </td>
                        <td className="px-4 py-3">
                          {isCoursePromoted(course) ? (
                            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-[11px] bg-red-600/20 text-red-400 border border-red-700">
                              <Tag size={12} /> Ativa!
                            </span>
                          ) : (
                            <span className="text-zinc-500">—</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => handleEditCourse(course)}
                              className={`p-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-100 transition-colors`}
                            >
                              <Edit size={14} />
                            </button>
                            <button
                              onClick={() => handleDuplicateCourse(course)}
                              className={`p-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-100 transition-colors`}
                            >
                              <Copy size={14} />
                            </button>
                            <button
                              onClick={() => openConfirm("delete", course)}
                              className="p-2 rounded-lg bg-red-600 hover:bg-red-700 text-white transition-colors shadow-md"
                            >
                              <Trash size={14} />
                            </button>
                          </div>
                        </td>
                      </motion.tr>
                    ))}
                  </AnimatePresence>
                </tbody>
              </table>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      <ConfirmModal
        open={!!confirmActionType && !!confirmCourse}
        actionType={confirmActionType}
        courseName={confirmCourse?.name ?? ""}
        password={confirmPassword}
        error={confirmError}
        onPasswordChange={setConfirmPassword}
        onCancel={closeConfirm}
        onConfirm={handleConfirm}
      />
    </div>
  );
}
