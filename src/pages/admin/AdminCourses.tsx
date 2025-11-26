import { useEffect, useMemo, useState, FormEvent } from "react";
import { createPortal } from "react-dom"; // IMPORTANTE: Importação necessária
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Plus,
  Edit,
  Trash,
  Copy,
  Eye,
  EyeOff,
  Star,
  Filter,
  Layers,
  PackageSearch,
  Save,
  X,
  RotateCw,
  ExternalLink,
} from "lucide-react";
import { toast } from "sonner";
import { Course } from "../../types";
import { useAuth } from "../../context/AuthContext";
import { courseService } from "../../services/courseService";

type AdminCourse = Course;

type CourseErrors = Partial<Record<keyof AdminCourse | "promoPrice", string>>;

interface CourseFormProps {
  initialCourse: AdminCourse;
  isCreating: boolean;
  saving: boolean;
  onCancel: () => void;
  onSubmit: (course: AdminCourse) => void;
}

interface ConfirmModalProps {
  open: boolean;
  actionType: "delete" | "toggle" | null;
  courseName: string;
  password: string;
  error: string;
  onPasswordChange: (value: string) => void;
  onCancel: () => void;
  onConfirm: () => void;
}

const ADMIN_CONFIRM_PASSWORD = "admin";

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
    price:
      typeof course.price === "number"
        ? course.price
        : Number(course.price ?? 0),
    promoPrice:
      course.promoPrice !== undefined && course.promoPrice !== null
        ? Number(course.promoPrice)
        : course.promo_price !== undefined && course.promo_price !== null
        ? Number(course.promo_price)
        : null,
    workload: course.workload ?? "",
    imageUrl: course.imageUrl ?? course.image ?? "",
    active: course.active ?? true,
    isFeatured: course.isFeatured ?? course.featured ?? false,
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

  if (!course.name?.trim()) {
    errors.name = "Informe o nome do curso.";
  }

  if (!course.slug?.trim()) {
    errors.slug = "Informe o slug (URL amigável).";
  }

  if (!course.type?.trim()) {
    errors.type = "Selecione a modalidade.";
  }

  const priceNumber =
    typeof course.price === "number"
      ? course.price
      : Number(course.price ?? NaN);

  if (Number.isNaN(priceNumber) || priceNumber < 0) {
    errors.price = "Informe um preço válido (zero ou maior).";
  }

  if (
    course.promoPrice !== null &&
    course.promoPrice !== undefined &&
    (Number.isNaN(Number(course.promoPrice)) ||
      Number(course.promoPrice) < 0)
  ) {
    errors.promoPrice =
      "Informe um preço promocional válido (ou deixe em branco).";
  }

  return errors;
}

function hasErrors(errors: CourseErrors) {
  return Object.values(errors).some(Boolean);
}

// ------------------------
// FORM COMPONENT
// ------------------------

function CourseForm({
  initialCourse,
  isCreating,
  saving,
  onCancel,
  onSubmit,
}: CourseFormProps) {
  const [form, setForm] = useState<AdminCourse>(initialCourse);
  const [errors, setErrors] = useState<CourseErrors>({});
  const [newContent, setNewContent] = useState("");
  const [newBenefit, setNewBenefit] = useState("");

  useEffect(() => {
    setForm(initialCourse);
    setErrors({});
    setNewContent("");
    setNewBenefit("");
  }, [initialCourse]);

  function updateField(
    field: keyof AdminCourse,
    value: string | number | boolean | null
  ) {
    setForm((prev) => ({
      ...prev,
      [field]: value as any,
    }));
    setErrors((prev) => ({ ...prev, [field]: undefined }));
  }

  function handleNameChange(value: string) {
    updateField("name", value);
    if (!form.slug || form.slug === slugify(form.name ?? "")) {
      const autoSlug = slugify(value);
      setForm((prev) => ({ ...prev, slug: autoSlug }));
      setErrors((prev) => ({ ...prev, slug: undefined }));
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
      promoPrice:
        form.promoPrice === undefined || form.promoPrice === null
          ? null
          : Number(form.promoPrice),
    };

    const validation = validateCourse(normalized);
    if (hasErrors(validation)) {
      setErrors(validation);
      toast.error("Verifique os campos destacados antes de salvar.");
      return;
    }

    onSubmit(normalized);
  }

  const priceValue =
    form.price === undefined || form.price === null ? "" : String(form.price);
  const promoPriceValue =
    form.promoPrice === undefined || form.promoPrice === null
      ? ""
      : String(form.promoPrice);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, filter: "blur(6px)" }}
      animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      transition={{ duration: 0.4, ease: [0.19, 1, 0.22, 1] }}
      className="bg-zinc-900/80 border border-zinc-800 rounded-xl p-4 md:p-6 shadow-xl"
    >
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-lg font-semibold">
            {isCreating ? "Adicionar novo curso" : "Editar curso"}
          </h2>
          <p className="text-xs text-zinc-400">
            Preencha os campos abaixo e salve para atualizar o site.
          </p>
        </div>

        <button
          type="button"
          onClick={onCancel}
          className="flex items-center gap-1 text-xs text-zinc-400 hover:text-zinc-200"
        >
          <X size={14} />
          Fechar
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Linha 1 */}
        <div className="grid md:grid-cols-3 gap-3">
          <div className="flex flex-col gap-1">
            <label className="text-xs text-zinc-300">
              Nome do curso <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => handleNameChange(e.target.value)}
              className={`px-3 py-2 rounded-lg bg-zinc-950/60 border text-sm text-white focus:outline-none focus:ring-2 focus:ring-orange-500 ${
                errors.name ? "border-red-500" : "border-zinc-700"
              }`}
            />
            {errors.name && (
              <span className="text-[11px] text-red-400">{errors.name}</span>
            )}
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs text-zinc-300">
              Slug (URL amigável) <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={form.slug}
              onChange={(e) => updateField("slug", slugify(e.target.value))}
              className={`px-3 py-2 rounded-lg bg-zinc-950/60 border text-sm text-white focus:outline-none focus:ring-2 focus:ring-orange-500 ${
                errors.slug ? "border-red-500" : "border-zinc-700"
              }`}
            />
            {errors.slug && (
              <span className="text-[11px] text-red-400">{errors.slug}</span>
            )}
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs text-zinc-300">
              Modalidade <span className="text-red-400">*</span>
            </label>
            <select
              value={form.type}
              onChange={(e) =>
                updateField(
                  "type",
                  e.target.value === "ead" ? "ead" : "presencial"
                )
              }
              className={`px-3 py-2 rounded-lg bg-zinc-950/60 border text-sm text-white focus:outline-none focus:ring-2 focus:ring-orange-500 ${
                errors.type ? "border-red-500" : "border-zinc-700"
              }`}
            >
              <option value="presencial">Presencial</option>
              <option value="ead">EAD</option>
            </select>
            {errors.type && (
              <span className="text-[11px] text-red-400">{errors.type}</span>
            )}
          </div>
        </div>

        {/* Linha 2 */}
        <div className="grid md:grid-cols-2 gap-3">
          <div className="flex flex-col gap-1">
            <label className="text-xs text-zinc-300">Duração</label>
            <input
              type="text"
              value={form.duration ?? ""}
              onChange={(e) => updateField("duration", e.target.value)}
              className="px-3 py-2 rounded-lg bg-zinc-950/60 border border-zinc-700 text-sm text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs text-zinc-300">Carga horária</label>
            <input
              type="text"
              value={form.workload ?? ""}
              onChange={(e) => updateField("workload", e.target.value)}
              className="px-3 py-2 rounded-lg bg-zinc-950/60 border border-zinc-700 text-sm text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
          </div>
        </div>

        {/* Linha 3 */}
        <div className="grid md:grid-cols-3 gap-3">
          <div className="flex flex-col gap-1">
            <label className="text-xs text-zinc-300">
              Preço (R$) <span className="text-red-400">*</span>
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
              className={`px-3 py-2 rounded-lg bg-zinc-950/60 border text-sm text-white focus:outline-none focus:ring-2 focus:ring-orange-500 ${
                errors.price ? "border-red-500" : "border-zinc-700"
              }`}
            />
            {errors.price && (
              <span className="text-[11px] text-red-400">{errors.price}</span>
            )}
          </div>

          <div className="flex items-center gap-2 mt-6">
            <input
              type="checkbox"
              checked={!!form.promoPrice && Number(form.promoPrice) > 0}
              onChange={(e) =>
                updateField(
                  "promoPrice",
                  e.target.checked
                    ? form.promoPrice && form.promoPrice > 0
                      ? form.promoPrice
                      : form.price ?? 0
                    : null
                )
              }
              className="w-4 h-4 rounded border-zinc-600 bg-zinc-900"
            />
            <span className="text-xs text-zinc-300">Curso em promoção</span>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs text-zinc-300">
              Preço promocional (R$)
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
              className={`px-3 py-2 rounded-lg bg-zinc-950/60 border text-sm text-white focus:outline-none focus:ring-2 focus:ring-orange-500 ${
                errors.promoPrice ? "border-red-500" : "border-zinc-700"
              }`}
              disabled={
                !form.promoPrice && !(form.promoPrice && form.promoPrice > 0)
              }
            />
            {errors.promoPrice && (
              <span className="text-[11px] text-red-400">
                {errors.promoPrice}
              </span>
            )}
          </div>
        </div>

        {/* Linha 4 */}
        <div className="grid md:grid-cols-3 gap-3">
          <div className="flex items-center gap-2 mt-2">
            <input
              type="checkbox"
              checked={form.isFeatured ?? false}
              onChange={(e) => updateField("isFeatured", e.target.checked)}
              className="w-4 h-4 rounded border-zinc-600 bg-zinc-900"
            />
            <span className="text-xs text-zinc-300">Destaque na Home</span>
          </div>

          <div className="flex items-center gap-2 mt-2">
            <input
              type="checkbox"
              checked={form.active ?? true}
              onChange={(e) => updateField("active", e.target.checked)}
              className="w-4 h-4 rounded border-zinc-600 bg-zinc-900"
            />
            <span className="text-xs text-zinc-300">Curso ativo no site</span>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs text-zinc-300">
              URL da imagem (opcional)
            </label>
            <input
              type="text"
              value={form.imageUrl ?? ""}
              onChange={(e) => updateField("imageUrl", e.target.value)}
              className="px-3 py-2 rounded-lg bg-zinc-950/60 border border-zinc-700 text-sm text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
          </div>
        </div>

        {/* Descrições */}
        <div className="flex flex-col gap-1">
          <label className="text-xs text-zinc-300">Descrição curta</label>
          <input
            type="text"
            value={form.shortDescription ?? ""}
            onChange={(e) => updateField("shortDescription", e.target.value)}
            className="px-3 py-2 rounded-lg bg-zinc-950/60 border border-zinc-700 text-sm text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-xs text-zinc-300">Descrição detalhada</label>
          <textarea
            value={form.description ?? ""}
            onChange={(e) => updateField("description", e.target.value)}
            className="px-3 py-2 h-24 rounded-lg bg-zinc-950/60 border border-zinc-700 text-sm text-white focus:outline-none focus:ring-2 focus:ring-orange-500 resize-none"
          />
        </div>

        {/* Conteúdo e benefícios */}
        <div className="grid md:grid-cols-2 gap-4">
          <div className="flex flex-col gap-2">
            <label className="text-xs text-zinc-300">Conteúdo do curso</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={newContent}
                onChange={(e) => setNewContent(e.target.value)}
                placeholder="Adicionar novo tópico"
                className="flex-1 px-3 py-2 rounded-lg bg-zinc-950/60 border border-zinc-700 text-xs text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
              <button
                type="button"
                onClick={handleAddContent}
                className="px-3 py-2 rounded-lg bg-orange-500 hover:bg-orange-600 text-white text-xs"
              >
                +
              </button>
            </div>
            <ul className="text-xs text-zinc-300 max-h-32 overflow-y-auto space-y-1">
              {(form.content ?? []).map((item, index) => (
                <li
                  key={index}
                  className="flex items-center justify-between gap-2 bg-zinc-950/60 px-2 py-1 rounded"
                >
                  <span className="truncate">{item}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveContent(index)}
                    className="text-red-400 hover:text-red-300"
                  >
                    <X size={12} />
                  </button>
                </li>
              ))}
            </ul>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-xs text-zinc-300">Benefícios do curso</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={newBenefit}
                onChange={(e) => setNewBenefit(e.target.value)}
                placeholder="Adicionar novo benefício"
                className="flex-1 px-3 py-2 rounded-lg bg-zinc-950/60 border border-zinc-700 text-xs text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
              <button
                type="button"
                onClick={handleAddBenefit}
                className="px-3 py-2 rounded-lg bg-orange-500 hover:bg-orange-600 text-white text-xs"
              >
                +
              </button>
            </div>
            <ul className="text-xs text-zinc-300 max-h-32 overflow-y-auto space-y-1">
              {(form.benefits ?? []).map((item, index) => (
                <li
                  key={index}
                  className="flex items-center justify-between gap-2 bg-zinc-950/60 px-2 py-1 rounded"
                >
                  <span className="truncate">{item}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveBenefit(index)}
                    className="text-red-400 hover:text-red-300"
                  >
                    <X size={12} />
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 rounded-lg border border-zinc-700 text-xs text-zinc-300 hover:bg-zinc-800"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={saving}
            className="px-4 py-2 rounded-lg bg-orange-500 hover:bg-orange-600 text-xs text-white flex items-center gap-2 disabled:opacity-60"
          >
            <Save size={14} />
            {saving ? "Salvando..." : "Salvar alterações"}
          </button>
        </div>
      </form>
    </motion.div>
  );
}

// ------------------------
// MODAL DE CONFIRMAÇÃO (CORRIGIDO COM PORTAL)
// ------------------------

function ConfirmModal({
  open,
  actionType,
  courseName,
  password,
  error,
  onPasswordChange,
  onCancel,
  onConfirm,
}: ConfirmModalProps) {
  if (!open || !actionType) return null;

  const title =
    actionType === "delete" ? "Confirmar exclusão" : "Alterar visibilidade";

  const description =
    actionType === "delete"
      ? `Tem certeza que deseja excluir o curso "${courseName}"? Essa ação não poderá ser desfeita.`
      : `Tem certeza que deseja alterar a visibilidade do curso "${courseName}" no site?`;

  // === SOLUÇÃO: Usar createPortal para jogar o modal no document.body ===
  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      {/* Overlay Escuro com Backdrop Blur */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onCancel}
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
      />

      {/* Janela do Modal Centralizada */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
        className="relative bg-zinc-900 border border-zinc-700 rounded-xl p-6 w-full max-w-md shadow-2xl z-10"
      >
        <h2 className="text-lg font-semibold mb-2 text-white">{title}</h2>
        <p className="text-sm text-zinc-300 mb-6 leading-relaxed">{description}</p>

        <div className="flex flex-col gap-2 mb-6">
          <label className="text-xs font-medium text-zinc-400 uppercase tracking-wider">
            Senha de Administrador
          </label>
          <input
            type="password"
            autoFocus
            placeholder="Digite sua senha..."
            value={password}
            onChange={(e) => onPasswordChange(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && onConfirm()}
            className="w-full px-4 py-3 rounded-lg bg-zinc-950 border border-zinc-700 text-white focus:outline-none focus:ring-2 focus:ring-orange-500 transition-all placeholder:text-zinc-600"
          />
          {error && (
            <motion.span 
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-xs text-red-400 font-medium flex items-center gap-1"
            >
              • {error}
            </motion.span>
          )}
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 rounded-lg border border-zinc-700 text-sm text-zinc-300 hover:bg-zinc-800 transition-colors"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className={`px-4 py-2 rounded-lg text-sm text-white font-medium shadow-lg transition-all ${
                actionType === 'delete' 
                ? 'bg-red-600 hover:bg-red-700 shadow-red-900/20' 
                : 'bg-orange-500 hover:bg-orange-600 shadow-orange-900/20'
            }`}
          >
            Confirmar
          </button>
        </div>
      </motion.div>
    </div>,
    document.body // Isso garante que o modal fique "acima" de todo o site
  );
}

// ... resto do componente AdminCourses (loadCourses, useEffect, etc) mantido igual ...
// (Copie apenas a parte acima e mantenha a lógica abaixo igual, ou copie o arquivo todo se preferir)

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

  const navigate = useNavigate();
  const { logout } = useAuth();

  async function loadCourses(showToast = false) {
    try {
      setLoading(true);
      const result = await courseService.getAdminAll();
      setCourses(result.map(normalizeCourse));
      if (showToast) {
        toast.success("Lista de cursos atualizada.");
      }
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
      isFeatured: false,
      active: true,
    });
  }

  function handleEditCourse(course: AdminCourse) {
    setIsCreating(false);
    setEditingCourse(normalizeCourse(course));
  }

  async function handleSaveCourse(course: AdminCourse) {
    setSaving(true);
    try {
      if (isCreating) {
        const { id, ...payload } = course;
        const created = await courseService.create(payload);
        setCourses((prev) => [...prev, normalizeCourse(created)]);
        toast.success("Curso criado com sucesso!");
      } else {
        const { id, ...payload } = course;
        const updated = await courseService.update(course.id, payload);
        setCourses((prev) =>
          prev.map((c) =>
            c.id === course.id ? normalizeCourse(updated) : c
          )
        );
        toast.success("Curso atualizado com sucesso!");
      }
      setEditingCourse(null);
      setIsCreating(false);
    } catch (error: any) {
      console.error("Erro ao salvar curso:", error);
      const msg =
        error?.message && typeof error.message === "string"
          ? error.message
          : "Não foi possível salvar o curso. Verifique os dados e tente novamente.";
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  }

  async function handleDuplicateCourse(course: AdminCourse) {
    try {
      const duplicated = await courseService.duplicate(course as Course);
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
        setCourses((prev) =>
          prev.filter((c) => c.id !== confirmCourse.id)
        );
        toast.success("Curso excluído com sucesso.");
      } else if (confirmActionType === "toggle") {
        const newValue = await courseService.toggleActive(confirmCourse.id);
        setCourses((prev) =>
          prev.map((c) =>
            c.id === confirmCourse.id ? { ...c, active: newValue } : c
          )
        );
        toast.success("Visibilidade do curso atualizada.");
      }
      closeConfirm();
    } catch (error: any) {
      console.error("Erro ao confirmar ação:", error);
      toast.error("Não foi possível concluir a ação.");
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-zinc-300 gap-3">
        <div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
        <span className="text-sm">Carregando cursos...</span>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Cabeçalho */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-orange-500 to-orange-700 flex items-center justify-center">
            <PackageSearch size={18} className="text-white" />
          </div>
          <div className="flex flex-col">
            <h1 className="text-lg font-semibold">Gerenciar cursos</h1>
            <span className="text-xs text-zinc-400">
              {filteredCourses.length} curso(s) encontrado(s)
            </span>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 justify-end">
          <button
            type="button"
            onClick={() => loadCourses(true)}
            className="flex items-center gap-2 px-3 py-2 rounded-lg border border-zinc-700 text-xs text-zinc-200 hover:bg-zinc-800"
          >
            <RotateCw size={14} />
            Atualizar lista
          </button>

          <button
            type="button"
            onClick={() => {
              logout();
              navigate("/");
            }}
            className="flex items-center gap-2 px-3 py-2 rounded-lg border border-zinc-700 text-xs text-zinc-200 hover:bg-zinc-800"
          >
            <ExternalLink size={14} />
            Voltar ao site
          </button>

          <button
            type="button"
            onClick={handleNewCourse}
            className="flex items-center gap-2 px-3 py-2 rounded-lg bg-orange-500 hover:bg-orange-600 text-xs text-white shadow-md"
          >
            <Plus size={14} />
            Novo curso
          </button>
        </div>
      </div>

      {/* Tabela ou Form */}
      {editingCourse ? (
        <CourseForm
          initialCourse={editingCourse}
          isCreating={isCreating}
          saving={saving}
          onCancel={() => {
            setEditingCourse(null);
            setIsCreating(false);
          }}
          onSubmit={handleSaveCourse}
        />
      ) : (
        <>
          <motion.div
            initial={{ opacity: 0, y: 10, filter: "blur(8px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            transition={{ duration: 0.3, ease: [0.19, 1, 0.22, 1] }}
            className="bg-zinc-900/80 border border-zinc-800 rounded-xl p-4 flex flex-col md:flex-row gap-3 md:items-center md:justify-between"
          >
            <div className="flex items-center gap-2 flex-1">
              <div className="w-8 h-8 rounded-lg bg-zinc-950 flex items-center justify-center">
                <Layers size={16} className="text-zinc-400" />
              </div>
              <div className="flex-1">
                <p className="text-xs text-zinc-400 mb-1">
                  Buscar por nome ou slug
                </p>
                <div className="flex items-center gap-2">
                  <PackageSearch size={16} className="text-zinc-500" />
                  <input
                    type="text"
                    placeholder="Digite para filtrar cursos..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-zinc-950/60 border border-zinc-700 text-xs text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-3 justify-end text-xs">
              <div className="flex items-center gap-2">
                <Filter size={14} className="text-zinc-500" />
                <select
                  value={filterType}
                  onChange={(e) =>
                    setFilterType(
                      e.target.value as "all" | "presencial" | "ead"
                    )
                  }
                  className="px-3 py-2 rounded-lg bg-zinc-950/60 border border-zinc-700 text-xs text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                >
                  <option value="all">Todos os tipos</option>
                  <option value="presencial">Presencial</option>
                  <option value="ead">EAD</option>
                </select>
              </div>

              <div className="flex items-center gap-2">
                <Filter size={14} className="text-zinc-500" />
                <select
                  value={filterStatus}
                  onChange={(e) =>
                    setFilterStatus(
                      e.target.value as "all" | "active" | "inactive"
                    )
                  }
                  className="px-3 py-2 rounded-lg bg-zinc-950/60 border border-zinc-700 text-xs text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                >
                  <option value="all">Todos</option>
                  <option value="active">Ativos</option>
                  <option value="inactive">Inativos</option>
                </select>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10, filter: "blur(8px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            transition={{ duration: 0.35, ease: [0.19, 1, 0.22, 1] }}
            className="bg-zinc-900/80 border border-zinc-800 rounded-xl overflow-hidden shadow-xl"
          >
            <table className="min-w-full text-xs">
              <thead className="bg-zinc-950/80 text-zinc-400 uppercase tracking-wide">
                <tr>
                  <th className="px-4 py-3 text-left">Curso</th>
                  <th className="px-4 py-3 text-left">Tipo</th>
                  <th className="px-4 py-3 text-left">Preço</th>
                  <th className="px-4 py-3 text-left">Status</th>
                  <th className="px-4 py-3 text-left">Destaque</th>
                  <th className="px-4 py-3 text-right">Ações</th>
                </tr>
              </thead>
              <tbody>
                {filteredCourses.map((course) => {
                  const activeFlag = course.active ?? true;
                  const onPromo =
                    course.promoPrice !== null &&
                    course.promoPrice !== undefined &&
                    Number(course.promoPrice) > 0;

                  return (
                    <motion.tr
                      key={course.id}
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.25 }}
                      className="border-t border-zinc-800/80 hover:bg-zinc-900/60"
                    >
                      <td className="px-4 py-3">
                        <div className="flex flex-col">
                          <span className="font-medium text-[13px]">
                            {course.name}
                          </span>
                          <span className="text-[11px] text-zinc-500">
                            {course.slug}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-[11px] bg-zinc-950/70 border border-zinc-700">
                          <Layers size={12} />
                          {course.type === "presencial" ? "Presencial" : "EAD"}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-col">
                          <span className="text-[13px] text-zinc-100">
                            R$ {Number(course.price ?? 0).toFixed(2)}
                          </span>
                          {onPromo && (
                            <span className="text-[11px] text-green-400">
                              Promo: R${" "}
                              {Number(course.promoPrice ?? 0).toFixed(2)}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <button
                          type="button"
                          onClick={() => openConfirm("toggle", course)}
                          className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-[11px] border border-zinc-700 bg-zinc-950/70 hover:bg-zinc-900"
                          title={
                            activeFlag
                              ? "Clique para desativar este curso"
                              : "Clique para ativar este curso"
                          }
                        >
                          {activeFlag ? (
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
                        {course.isFeatured && (
                          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-[11px] bg-orange-500/20 text-orange-300 border border-orange-500/50">
                            <Star size={12} />
                            Destaque
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => handleEditCourse(course)}
                            className="p-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-100"
                            title="Editar curso"
                          >
                            <Edit size={14} />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDuplicateCourse(course)}
                            className="p-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-100"
                            title="Duplicar curso"
                          >
                            <Copy size={14} />
                          </button>
                          <button
                            type="button"
                            onClick={() => openConfirm("delete", course)}
                            className="p-2 rounded-lg bg-red-600 hover:bg-red-700 text-white"
                            title="Excluir curso"
                          >
                            <Trash size={14} />
                          </button>
                        </div>
                      </td>
                    </motion.tr>
                  );
                })}

                {filteredCourses.length === 0 && (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-4 py-6 text-center text-xs text-zinc-500"
                    >
                      Nenhum curso encontrado com os filtros atuais.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </motion.div>
        </>
      )}

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