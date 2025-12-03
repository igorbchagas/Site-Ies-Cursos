import { useEffect, useMemo, useState, FormEvent, HTMLProps } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
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
  ExternalLink,
  Tag
} from "lucide-react";
import { toast } from "sonner";
import { Course } from "../../types";
import { useAuth } from "../../context/AuthContext";
import { courseService } from "../../services/courseService";

// Cores Padronizadas (Tema Escuro)
const ACCENT_COLOR = "#E45B25"; // Laranja Principal
const DARK_BACKGROUND = "#18181B"; // Fundo Principal (zinc-900)
const DARK_SHADE = "#27272A"; // Fundo Secundário (zinc-800)
const TEXT_COLOR = "#FAFAFA"; // Texto Claro (zinc-50)
const INPUT_BG = "#0A0A0A"; // Fundo de Input (zinc-950)

// ATENÇÃO: isFeatured foi removido da tipagem local para simplificar o Admin
type AdminCourse = Omit<Course, 'isFeatured'>;

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
  // Ignoramos a propriedade isFeatured do banco, pois ela será removida do Admin
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
    // isFeatured: course.isFeatured ?? course.featured ?? false, // Removido
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

  const priceNumber = Number(course.price ?? NaN);
  if (Number.isNaN(priceNumber) || priceNumber < 0) {
    errors.price = "Informe um preço base válido (zero ou maior).";
  }
  
  const promoPriceNumber = 
    (course.promoPrice !== null && course.promoPrice !== undefined)
      ? Number(course.promoPrice)
      : null;

  if (promoPriceNumber !== null) {
      if (Number.isNaN(promoPriceNumber) || promoPriceNumber < 0) {
          errors.promoPrice = "Preço promocional inválido (zero ou maior).";
      } else if (promoPriceNumber >= priceNumber) {
          errors.promoPrice = "O preço promocional deve ser menor que o preço base.";
      }
  }

  return errors;
}

function hasErrors(errors: CourseErrors) {
  return Object.values(errors).some(Boolean);
}

/**
 * Função helper para verificar se o curso está em promoção válida.
 */
function isCoursePromoted(course: AdminCourse) {
    const price = course.price ?? 0;
    const promoPrice = course.promoPrice;
    return promoPrice !== null && promoPrice !== undefined && promoPrice > 0 && promoPrice < price;
}

// ------------------------
// TOGGLE SWITCH ANIMADO
// ------------------------

interface ToggleSwitchProps extends HTMLProps<HTMLInputElement> {
  checked: boolean;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  label: string;
}

const ToggleSwitch = ({ checked, onChange, label, ...rest }: ToggleSwitchProps) => {
    // Cor de fundo do trilho no modo escuro
    const trackColor = checked ? ACCENT_COLOR : '#3F3F46'; // Laranja ou Zinc-500
    
    return (
        <label className="flex items-center cursor-pointer select-none">
            {/* Texto em branco no modo escuro */}
            <span className={`mr-3 text-sm font-medium`} style={{ color: TEXT_COLOR }}>{label}</span>
            <div className="relative">
                <input
                    type="checkbox"
                    checked={checked}
                    onChange={onChange}
                    className="sr-only" // Esconde o checkbox nativo
                    {...rest}
                />
                {/* Trilho do Switch */}
                <motion.div
                    className="w-10 h-6 rounded-full shadow-inner"
                    style={{ backgroundColor: trackColor }}
                    initial={false} 
                    animate={{ backgroundColor: checked ? ACCENT_COLOR : '#3F3F46' }}
                    transition={{ duration: 0.2 }}
                />
                {/* Bolinha do Switch */}
                <motion.div
                    className="absolute w-4 h-4 bg-white rounded-full shadow-md top-1"
                    initial={false}
                    animate={{ x: checked ? 20 : 2 }} // Move para a direita quando checked
                    transition={{ duration: 0.2 }}
                />
            </div>
        </label>
    );
};

// ------------------------
// FORM COMPONENT (Tema Escuro + Layout Melhorado)
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
  
  const isPromoChecked = form.promoPrice !== null && form.promoPrice !== undefined; 

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

  function handleTogglePromo(e: React.ChangeEvent<HTMLInputElement>) {
    const isChecked = e.target.checked;
    if (isChecked) {
        const defaultPromo = (form.promoPrice && form.promoPrice > 0) 
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
      promoPrice: isPromoChecked
          ? Number(form.promoPrice)
          : null,
    };

    const validation = validateCourse(normalized);
    if (hasErrors(validation)) {
      setErrors(validation);
      toast.error("Verifique os campos destacados antes de salvar.");
      return;
    }
    
    // NOTE: Ao enviar, incluímos isFeatured: false, pois a opção foi removida do UI
    onSubmit({...normalized, isFeatured: false} as any); 
  }

  const priceValue =
    form.price === undefined || form.price === null ? "" : String(form.price);
  const promoPriceValue =
    form.promoPrice === undefined || form.promoPrice === null
      ? ""
      : String(form.promoPrice);

  const inputClass = (fieldError: string | undefined) =>
    // CORRIGIDO: Garante o background escuro (bg-zinc-900/60) para inputs e selects
    `px-3 py-2 rounded-lg border text-sm text-[${TEXT_COLOR}] ${fieldError ? "border-red-500" : "border-zinc-700"} bg-zinc-900/60 focus:outline-none focus:ring-2 focus:ring-[${ACCENT_COLOR}] appearance-none`;
  
  const labelClass = "text-xs font-semibold text-zinc-400 uppercase tracking-wide";

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      // Tema Escuro - Padding ajustado para p-4 no mobile
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
        <div className={`space-y-4 border p-4 rounded-lg bg-[${INPUT_BG}] border-zinc-800`}>
            <h3 className="text-base font-bold text-zinc-300 flex items-center gap-2">
                <Layers size={16} style={{ color: ACCENT_COLOR }} /> Detalhes do Curso
            </h3>
            <div className="grid md:grid-cols-3 gap-4">
                <div className="flex flex-col gap-1">
                    <label className={labelClass}>Nome do curso <span className="text-red-500">*</span></label>
                    <input
                        type="text"
                        value={form.name}
                        onChange={(e) => handleNameChange(e.target.value)}
                        className={inputClass(errors.name)}
                    />
                    {errors.name && (<span className="text-[11px] text-red-500">{errors.name}</span>)}
                </div>

                <div className="flex flex-col gap-1">
                    <label className={labelClass}>Slug (URL amigável) <span className="text-red-500">*</span></label>
                    <input
                        type="text"
                        value={form.slug}
                        onChange={(e) => updateField("slug", slugify(e.target.value))}
                        className={inputClass(errors.slug)}
                    />
                    {errors.slug && (<span className="text-[11px] text-red-500">{errors.slug}</span>)}
                </div>

                {/* Select com background e texto dark */}
                <div className="flex flex-col gap-1">
                    <label className={labelClass}>Modalidade <span className="text-red-500">*</span></label>
                    <select
                        value={form.type}
                        onChange={(e) => updateField("type", e.target.value === "ead" ? "ead" : "presencial")}
                        className={`${inputClass(errors.type)} cursor-pointer`}
                    >
                        <option value="presencial">Presencial</option>
                        <option value="ead">EAD</option>
                    </select>
                    {errors.type && (<span className="text-[11px] text-red-500">{errors.type}</span>)}
                </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1">
                    <label className={labelClass}>Duração (Ex: 3 meses)</label>
                    <input
                        type="text"
                        value={form.duration ?? ""}
                        onChange={(e) => updateField("duration", e.target.value)}
                        className={inputClass(errors.duration)}
                    />
                </div>

                <div className="flex flex-col gap-1">
                    <label className={labelClass}>Carga horária (Ex: 120h)</label>
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
        <div className={`space-y-4 border p-4 rounded-lg bg-[${INPUT_BG}] border-zinc-800`}>
            <h3 className="text-base font-bold text-zinc-300 flex items-center gap-2">
                <Tag size={16} style={{ color: ACCENT_COLOR }} /> Gestão de Preços
            </h3>
            
            <div className="grid md:grid-cols-3 gap-4 items-end">
                {/* Preço Base */}
                <div className="flex flex-col gap-1">
                    <label className={labelClass}>Preço Base (R$) <span className="text-red-500">*</span></label>
                    <input
                        type="number"
                        min={0}
                        step="0.01"
                        value={priceValue}
                        onChange={(e) =>
                            updateField("price", e.target.value === "" ? 0 : Number(e.target.value))
                        }
                        className={inputClass(errors.price)}
                    />
                    {errors.price && (<span className="text-[11px] text-red-500">{errors.price}</span>)}
                </div>

                {/* Toggle de Promoção */}
                <div className="flex flex-col gap-1 h-full justify-end">
                    <ToggleSwitch 
                        label="Curso em Promoção" 
                        checked={isPromoChecked}
                        onChange={handleTogglePromo}
                    />
                </div>

                {/* Preço Promocional */}
                <motion.div 
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ 
                        opacity: isPromoChecked ? 1 : 0.5, 
                        x: 0,
                        height: isPromoChecked ? 'auto' : 0
                    }}
                    transition={{ duration: 0.3 }}
                    className={`flex flex-col gap-1 overflow-hidden ${isPromoChecked ? '' : 'pointer-events-none'}`}
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
                            updateField("promoPrice", e.target.value === "" ? null : Number(e.target.value))
                        }
                        className={inputClass(errors.promoPrice)}
                        disabled={!isPromoChecked}
                    />
                    {errors.promoPrice && (<span className="text-[11px] text-red-500">{errors.promoPrice}</span>)}
                </motion.div>
            </div>
        </div>
        
        {/* === GRUPO 3: VISIBILIDADE E MIDIA (Removido o Destaque na Home) === */}
        <div className={`space-y-4 border p-4 rounded-lg bg-[${INPUT_BG}] border-zinc-800`}>
            <h3 className="text-base font-bold text-zinc-300 flex items-center gap-2">
                <Eye size={16} style={{ color: ACCENT_COLOR }} /> Visibilidade
            </h3>
            
            <div className="grid md:grid-cols-3 gap-4">
                {/* Ativo */}
                <ToggleSwitch 
                    label="Curso ativo no site" 
                    checked={form.active ?? true}
                    onChange={(e) => updateField("active", e.target.checked)}
                />

                {/* URL Imagem (Movido para onde estava o Destaque na Home) */}
                <div className="flex flex-col gap-1 col-span-2">
                    <label className={labelClass}>URL da imagem (opcional)</label>
                    <input
                        type="text"
                        value={form.imageUrl ?? ""}
                        onChange={(e) => updateField("imageUrl", e.target.value)}
                        className={inputClass(errors.imageUrl)}
                    />
                </div>
            </div>
        </div>

        {/* === GRUPO 4: DESCRIÇÕES === */}
        <div className={`space-y-4 border p-4 rounded-lg bg-[${INPUT_BG}] border-zinc-800`}>
            <h3 className="text-base font-bold text-zinc-300 flex items-center gap-2">
                <PackageSearch size={16} style={{ color: ACCENT_COLOR }} /> Textos e Conteúdo
            </h3>
            
            <div className="grid md:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1">
                    <label className={labelClass}>Descrição Curta (Preview do Card)</label>
                    <textarea
                        value={form.shortDescription ?? ""}
                        onChange={(e) => updateField("shortDescription", e.target.value)}
                        className={`${inputClass(errors.shortDescription)} h-20 resize-none`}
                    />
                </div>
                
                <div className="flex flex-col gap-1">
                    <label className={labelClass}>Descrição Detalhada (Modal)</label>
                    <textarea
                        value={form.description ?? ""}
                        onChange={(e) => updateField("description", e.target.value)}
                        className={`${inputClass(errors.description)} h-20 resize-none`}
                    />
                </div>
            </div>
        </div>
        
        {/* === GRUPO 5: LISTAS DE CONTEÚDO E BENEFÍCIOS === */}
        <div className="grid md:grid-cols-2 gap-4">
            {/* Conteúdo do curso */}
            <div className={`flex flex-col gap-2 p-4 rounded-lg bg-[${INPUT_BG}] border-zinc-800`}>
                <label className={labelClass}>Conteúdo do curso (tópicos)</label>
                <div className="flex gap-2">
                    <input
                        type="text"
                        value={newContent}
                        onChange={(e) => setNewContent(e.target.value)}
                        placeholder="Adicionar novo tópico"
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
                            {/* CORREÇÃO APLICADA AQUI: Quebra de texto */}
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

            {/* Benefícios do curso */}
            <div className={`flex flex-col gap-2 p-4 rounded-lg bg-[${INPUT_BG}] border-zinc-800`}>
                <label className={labelClass}>Benefícios do curso</label>
                <div className="flex gap-2">
                    <input
                        type="text"
                        value={newBenefit}
                        onChange={(e) => setNewBenefit(e.target.value)}
                        placeholder="Adicionar novo benefício"
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
                            {/* CORREÇÃO APLICADA AQUI: Quebra de texto */}
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

        {/* Botões de Ação */}
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
                // ADICIONADO: 'whitespace-nowrap' para não quebrar linha e 'h-10' para travar a altura igual ao cancelar se necessário
                className={`px-6 py-2 rounded-lg text-sm text-white flex items-center justify-center gap-2 disabled:opacity-60 transition-colors hover:bg-[#d66a1f] shadow-md whitespace-nowrap`}
                style={{ backgroundColor: ACCENT_COLOR }}
            >
                <Save size={18} />
                {saving ? "Salvando..." : "Salvar"} 
                {/* DICA: Se "Salvar alterações" ainda ficar grande em telas muito pequenas, use apenas "Salvar" */}
            </button>
        </div>
      </form>
    </motion.div>
  );
}

// ------------------------
// MODAL DE CONFIRMAÇÃO (Tema Escuro)
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
    actionType === "delete" ? "Confirmar Exclusão" : "Alterar Visibilidade";

  const description =
    actionType === "delete"
      ? `Tem certeza que deseja excluir o curso "${courseName}"? Essa ação não poderá ser desfeita.`
      : `Tem certeza que deseja alterar a visibilidade do curso "${courseName}" no site?`;

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
        transition={{ duration: 0.2 }}
        // Tema Escuro
        className={`relative bg-[${DARK_SHADE}] border border-zinc-700 rounded-xl p-6 w-full max-w-md shadow-2xl z-10 text-[${TEXT_COLOR}]`}
      >
        <h2 className={`text-lg font-bold mb-2`} style={{ color: TEXT_COLOR }}>{title}</h2>
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
            className={`w-full px-4 py-3 rounded-lg bg-[${INPUT_BG}] border border-zinc-700 text-[${TEXT_COLOR}] focus:outline-none focus:ring-2 focus:ring-orange-500 transition-all placeholder:text-zinc-600`}
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

        <div className="flex justify-end gap-3 pt-2 border-t border-zinc-700">
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
                ? 'bg-red-600 hover:bg-red-700' 
                : 'bg-orange-500 hover:bg-orange-600'
            }`}
          >
            Confirmar
          </button>
        </div>
      </motion.div>
    </div>,
    document.body
  );
}

// ------------------------
// ADMIN COURSES PRINCIPAL (Tema Escuro + Tabela Melhorada)
// ------------------------

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
      active: true,
      // isFeatured removido
    });
  }

  function handleEditCourse(course: AdminCourse) {
    setIsCreating(false);
    setEditingCourse(normalizeCourse(course));
  }

  async function handleSaveCourse(course: AdminCourse) {
    setSaving(true);
    try {
      // Garantimos que isFeatured seja enviado como false ao banco, já que foi removido do UI
      const payloadWithFeature = { ...course, isFeatured: false };

      if (isCreating) {
        const { id, ...payload } = payloadWithFeature;
        const created = await courseService.create(payload as Course);
        setCourses((prev) => [...prev, normalizeCourse(created)]);
        toast.success("Curso criado com sucesso!");
      } else {
        const { id, ...payload } = payloadWithFeature;
        const updated = await courseService.update(course.id, payload as Course);
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
      // Temos que adicionar isFeatured para o service aceitar, mesmo que seja sempre false
      const duplicated = await courseService.duplicate({...course, isFeatured: false} as Course);
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
        await courseService.toggleActive(confirmCourse.id);
        // Recarregamos a lista após a ação para refletir o novo estado.
        loadCourses();
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
      <div className={`flex flex-col items-center justify-center h-full text-[${TEXT_COLOR}] gap-3 bg-[${DARK_SHADE}] p-8 rounded-xl`}>
        <div className="w-8 h-8 border-4 border-zinc-500 border-t-transparent rounded-full animate-spin" style={{ borderColor: ACCENT_COLOR, borderTopColor: 'transparent' }} />
        <span className="text-sm">Carregando cursos...</span>
      </div>
    );
  }

  // Helper para formatar preço/promoção na tabela
  const renderPriceCell = (course: AdminCourse) => {
    const price = course.price ?? 0;
    const isPromoted = isCoursePromoted(course);

    if (isPromoted) {
        return (
            <div className="flex flex-col">
                <span className="text-[10px] text-zinc-400 line-through">
                    R$ {price.toFixed(2)}
                </span>
                <span className="text-[13px] font-bold text-green-400"> {/* Verde para destaque de preço no Admin Dark */}
                    R$ {course.promoPrice!.toFixed(2)}
                </span>
            </div>
        );
    }
    // Exibimos o preço base para referência no Admin (R$ X,XX)
    return (
        <span className="text-[13px] text-zinc-200 font-medium">
            R$ {price.toFixed(2)}
        </span>
    );
  }

  return (
    // Padding reduzido para p-4 no mobile
    <div className={`space-y-6 p-4 md:p-8 bg-[${DARK_BACKGROUND}] rounded-xl text-[${TEXT_COLOR}]`}>
      <AnimatePresence mode="wait">
        {/* Renderiza o formulário de edição ou a tabela */}
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
          />
        ) : (
          <motion.div key="course-list" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }}>
            {/* Cabeçalho */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
              <div className="flex items-center gap-3">
                <div 
                    className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-md`}
                    style={{ background: `linear-gradient(to right, ${ACCENT_COLOR}, #d66a1f)` }}
                >
                  <PackageSearch size={20} className="text-white" />
                </div>
                <div className="flex flex-col">
                  <h1 className={`text-xl font-bold`} style={{ color: TEXT_COLOR }}>Gerenciar Cursos</h1>
                  <span className="text-sm text-zinc-400">
                    {filteredCourses.length} curso(s)
                  </span>
                </div>
              </div>

              {/* Botões do Topo - Envolvem para caber no mobile */}
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
                  onClick={() => {
                    logout();
                    navigate("/");
                  }}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg border border-zinc-700 text-xs text-zinc-200 hover:bg-zinc-800 transition-colors shadow-sm"
                >
                  <ExternalLink size={14} />
                  <span className="hidden sm:inline">Sair do Admin</span>
                </button>

                <button
                  type="button"
                  onClick={handleNewCourse}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm text-white shadow-md transition-colors hover:bg-[#d66a1f]`}
                  style={{ backgroundColor: ACCENT_COLOR }}
                >
                  <Plus size={16} />
                  Novo curso
                </button>
              </div>
            </div>

            {/* Filtros e Busca */}
            <div 
                className={`bg-[${DARK_SHADE}] border border-zinc-700 rounded-xl p-4 grid grid-cols-1 md:grid-cols-7 gap-4 items-end shadow-sm`}
            >
              
              {/* BUSCA */}
              <div className="flex flex-col gap-1 col-span-1 md:col-span-4">
                <p className="text-xs text-zinc-400 font-semibold uppercase">
                    Buscar
                </p>
                <div className="flex items-center gap-2">
                    <PackageSearch size={16} className="text-zinc-500 flex-shrink-0" />
                    <input
                      type="text"
                      placeholder="Filtrar por nome..."
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      className={`w-full px-3 py-2 rounded-lg bg-zinc-900/60 border border-zinc-700 text-sm text-[${TEXT_COLOR}] focus:outline-none focus:ring-2 focus:ring-[${ACCENT_COLOR}] placeholder:text-zinc-600`}
                    />
                </div>
              </div>

              {/* FILTRO TIPO */}
              <div className="flex flex-col gap-1 col-span-1 md:col-span-2">
                  <p className="text-xs text-zinc-400 font-semibold uppercase">
                      Modalidade
                  </p>
                  <div className="flex items-center gap-2">
                      <Filter size={16} className="text-zinc-500 flex-shrink-0" />
                      <select
                          value={filterType}
                          onChange={(e) => setFilterType(e.target.value as "all" | "presencial" | "ead")}
                          className={`w-full px-3 py-2 rounded-lg bg-zinc-900/60 border border-zinc-700 text-sm text-[${TEXT_COLOR}] focus:outline-none focus:ring-2 focus:ring-[${ACCENT_COLOR}] appearance-none cursor-pointer`}
                      >
                          <option value="all">Todos</option>
                          <option value="presencial">Presencial</option>
                          <option value="ead">EAD</option>
                      </select>
                  </div>
              </div>
              
              {/* FILTRO STATUS */}
              <div className="flex flex-col gap-1 col-span-1 md:col-span-1">
                  <p className="text-xs text-zinc-400 font-semibold uppercase">
                      Status
                  </p>
                  <div className="flex items-center gap-2">
                      <select
                          value={filterStatus}
                          onChange={(e) => setFilterStatus(e.target.value as "all" | "active" | "inactive")}
                          className={`w-full px-3 py-2 rounded-lg bg-zinc-900/60 border border-zinc-700 text-sm text-[${TEXT_COLOR}] focus:outline-none focus:ring-2 focus:ring-[${ACCENT_COLOR}] appearance-none cursor-pointer`}
                      >
                          <option value="all">Todos</option>
                          <option value="active">Ativos</option>
                          <option value="inactive">Inativos</option>
                      </select>
                  </div>
              </div>
            </div>

            {/* ========== NOVIDADE MOBILE: LISTA DE CARDS (Só aparece no mobile) ========== */}
            <div className="md:hidden space-y-4 mt-6">
                {filteredCourses.map((course) => {
                    const activeFlag = course.active ?? true;
                    const isPromoted = isCoursePromoted(course);

                    return (
                        <div key={course.id} className={`bg-[${DARK_SHADE}] border border-zinc-700 rounded-xl p-4 shadow-sm flex flex-col gap-3`}>
                            {/* Cabeçalho do Card */}
                            <div className="flex justify-between items-start">
                                <div>
                                    <h3 className="font-bold text-white text-base">{course.name}</h3>
                                    <p className="text-xs text-zinc-500">{course.slug}</p>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => openConfirm("toggle", course)}
                                    className={`inline-flex items-center justify-center p-1.5 rounded-full border transition-colors ${
                                        activeFlag ? 'bg-green-900/20 text-green-400 border-green-800' : 'bg-zinc-800 text-zinc-500 border-zinc-700'
                                    }`}
                                >
                                    {activeFlag ? <Eye size={16} /> : <EyeOff size={16} />}
                                </button>
                            </div>

                            {/* Detalhes do Card */}
                            <div className="flex items-center gap-3 text-sm">
                                <span className="inline-flex items-center gap-1 px-2 py-1 rounded bg-zinc-900 border border-zinc-700 text-zinc-300 text-xs">
                                    {course.type === "presencial" ? "Presencial" : "EAD"}
                                </span>
                                
                                <div className="ml-auto">
                                    {renderPriceCell(course)}
                                </div>
                            </div>

                            {/* Promoção Badge */}
                            {isPromoted && (
                                <div className="inline-flex items-center gap-1 px-2 py-1 rounded bg-red-900/20 text-red-400 border border-red-800 text-xs w-fit">
                                    <Tag size={12} /> Em Promoção
                                </div>
                            )}

                            {/* Ações */}
                            <div className="grid grid-cols-3 gap-2 pt-3 border-t border-zinc-700 mt-1">
                                <button onClick={() => handleEditCourse(course)} className="flex items-center justify-center gap-1 py-2 rounded bg-zinc-800 text-zinc-300 text-xs font-medium border border-zinc-700">
                                    <Edit size={14} /> Editar
                                </button>
                                <button onClick={() => handleDuplicateCourse(course)} className="flex items-center justify-center gap-1 py-2 rounded bg-zinc-800 text-zinc-300 text-xs font-medium border border-zinc-700">
                                    <Copy size={14} /> Duplicar
                                </button>
                                <button onClick={() => openConfirm("delete", course)} className="flex items-center justify-center gap-1 py-2 rounded bg-red-900/20 text-red-400 text-xs font-medium border border-red-900/30">
                                    <Trash size={14} /> Excluir
                                </button>
                            </div>
                        </div>
                    );
                })}
                 {filteredCourses.length === 0 && (
                     <div className="text-center py-8 text-zinc-500 text-sm">
                         Nenhum curso encontrado.
                     </div>
                 )}
            </div>

            {/* ========== TABELA DESKTOP (Escondida no mobile com 'hidden md:block') ========== */}
            <div 
                className={`hidden md:block bg-[${DARK_SHADE}] border border-zinc-700 rounded-xl overflow-hidden shadow-sm mt-6`}
            >
              <table className="min-w-full text-sm">
                <thead className={`bg-[${INPUT_BG}] text-zinc-400 uppercase tracking-wide font-semibold`}>
                  <tr>
                    <th className="px-4 py-3 text-left">Curso</th>
                    <th className="px-4 py-3 text-left">Tipo</th>
                    <th className="px-4 py-3 text-left">Preço (Ref.)</th>
                    <th className="px-4 py-3 text-left">Status</th>
                    <th className="px-4 py-3 text-left">Promoção</th> {/* Coluna Destaque renomeada para Promoção */}
                    <th className="px-4 py-3 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  <AnimatePresence initial={false}>
                    {filteredCourses.map((course) => {
                      const activeFlag = course.active ?? true;
                      const isPromoted = isCoursePromoted(course);

                      return (
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
                              <span className={`font-medium text-[14px]`} style={{ color: TEXT_COLOR }}>
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
                              {course.type === "presencial" ? "Presencial" : "EAD"}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            {renderPriceCell(course)}
                          </td>
                          <td className="px-4 py-3">
                            <button
                              type="button"
                              onClick={() => openConfirm("toggle", course)}
                              className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-[11px] border transition-colors ${
                                activeFlag ? 'bg-green-600/20 text-green-400 border-green-700 hover:bg-green-600/30' : 'bg-zinc-800/80 text-zinc-400 border-zinc-700 hover:bg-zinc-800'
                              }`}
                              title={activeFlag ? "Clique para desativar este curso" : "Clique para ativar este curso"}
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
                            {isPromoted ? (
                                <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-[11px] bg-red-600/20 text-red-400 border border-red-700">
                                    <Tag size={12} />
                                    Ativa!
                                </span>
                            ) : (
                                <span className="text-zinc-500">—</span>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                type="button"
                                onClick={() => handleEditCourse(course)}
                                className={`p-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-100 transition-colors`}
                                title="Editar curso"
                              >
                                <Edit size={14} />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDuplicateCourse(course)}
                                className={`p-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-100 transition-colors`}
                                title="Duplicar curso"
                              >
                                <Copy size={14} />
                              </button>
                              <button
                                type="button"
                                onClick={() => openConfirm("delete", course)}
                                className="p-2 rounded-lg bg-red-600 hover:bg-red-700 text-white transition-colors shadow-md"
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
                          className="px-4 py-6 text-center text-sm text-zinc-500"
                        >
                          Nenhum curso encontrado com os filtros atuais.
                        </td>
                      </tr>
                    )}
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