import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, Variants } from "framer-motion";
import {
  Users,
  GraduationCap,
  Image as ImageIcon,
  Calendar,
  LayoutDashboard,
  ExternalLink,
  LucideIcon
} from "lucide-react";
import { AdminBanners } from "./AdminBanners";
import { courseService } from "../../services/courseService";
import { bannerService } from "../../services/bannerService";

// --- TIPAGEM ---
type CardColor = 'orange' | 'blue' | 'green' | 'purple';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  color: CardColor;
  variants: Variants;
}

// Cores Padronizadas (Tema Escuro)
const DARK_BACKGROUND = "#18181B"; 
const TEXT_COLOR = "#FAFAFA"; 

export default function AdminDashboard() {
  const navigate = useNavigate();
  
  const [stats, setStats] = useState({
    totalCourses: 0,
    activeBanners: 0,
    totalStudents: 5000,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      try {
        setLoading(true);
        // Busca paralela para ser mais rápido
        const [courses, banners] = await Promise.all([
          courseService.getAdminAll(),
          bannerService.getAllAdmin()
        ]);
        
        const activeBanners = banners.filter((b) => b.ativo).length;

        setStats((prev) => ({
          ...prev,
          totalCourses: courses.length,
          activeBanners: activeBanners,
        }));
      } catch (error) {
        console.error("Erro ao carregar estatísticas", error);
      } finally {
        setLoading(false);
      }
    }
    fetchStats();
  }, []);

  // Variantes tipadas
  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 20, filter: "blur(4px)" },
    show: { 
      opacity: 1, 
      y: 0, 
      filter: "blur(0px)",
      transition: { duration: 0.4, ease: [0.19, 1, 0.22, 1] }
    },
  };

  return (
    // Padding ajustado para mobile (p-4)
    <motion.div 
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className={`space-y-6 p-4 md:p-8 bg-[${DARK_BACKGROUND}] rounded-xl text-[${TEXT_COLOR}]`}
    >
      {/* --- HEADER --- */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-orange-700 flex items-center justify-center shadow-lg shadow-orange-500/20">
            <LayoutDashboard size={20} className="text-white" />
          </div>
          <div className="flex flex-col">
            <h1 className="text-xl font-bold text-white">Dashboard</h1>
            <p className="text-xs text-zinc-400">
              Visão geral da IesCursos
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 justify-start md:justify-end">
          <button
            type="button"
            onClick={() => navigate("/")}
            className="flex items-center gap-2 px-3 py-2 rounded-lg border border-zinc-700 bg-zinc-900 text-xs text-zinc-200 hover:bg-zinc-800 transition-colors"
          >
            <ExternalLink size={14} />
            Voltar ao site
          </button>
        </div>
      </div>

      {/* --- CARDS DE ESTATÍSTICAS --- */}
      {/* Mobile: 1 coluna | Tablet: 2 colunas | Desktop: 4 colunas */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Cursos Totais"
          value={loading ? "..." : stats.totalCourses}
          icon={GraduationCap}
          color="orange"
          variants={itemVariants}
        />
        <StatCard
          title="Banners Ativos"
          value={loading ? "..." : stats.activeBanners}
          icon={ImageIcon}
          color="blue"
          variants={itemVariants}
        />
        <StatCard
          title="Alunos Formados"
          value="+5k"
          icon={Users}
          color="green"
          variants={itemVariants}
        />
        <StatCard
          title="Data Atual"
          value={new Date().toLocaleDateString("pt-BR", {day: '2-digit', month: '2-digit'})}
          icon={Calendar}
          color="purple"
          variants={itemVariants}
        />
      </div>

      <motion.hr variants={itemVariants} className="border-zinc-800 my-6" />

      {/* --- GERENCIADOR DE BANNERS --- */}
      <motion.div variants={itemVariants} className="space-y-4">
        <div className="flex items-center gap-2 mb-2">
            <h2 className="text-base font-bold text-zinc-200 flex items-center gap-2">
                <ImageIcon size={18} className="text-orange-500" /> Destaques da Página Inicial
            </h2>
        </div>
        
        {/* Componente de Banners estilizado */}
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl overflow-hidden shadow-sm">
            <AdminBanners />
        </div>
      </motion.div>
    </motion.div>
  );
}

// Subcomponente tipado corretamente
function StatCard({ title, value, icon: Icon, color, variants }: StatCardProps) {
  const colorStyles: Record<CardColor, string> = {
    orange: "from-orange-500 to-orange-700 text-orange-100 shadow-orange-900/20",
    blue: "from-blue-500 to-blue-700 text-blue-100 shadow-blue-900/20",
    green: "from-emerald-500 to-emerald-700 text-emerald-100 shadow-emerald-900/20",
    purple: "from-violet-500 to-violet-700 text-violet-100 shadow-violet-900/20",
  };

  return (
    <motion.div
      variants={variants}
      className="bg-zinc-900 border border-zinc-800 p-5 rounded-xl shadow-md relative overflow-hidden group hover:border-zinc-700 transition-colors"
    >
      <div className="flex justify-between items-start relative z-10">
        <div>
          <p className="text-xs text-zinc-400 font-medium mb-1 uppercase tracking-wide">{title}</p>
          <h3 className="text-2xl font-bold text-white tracking-tight">{value}</h3>
        </div>
        <div className={`p-2.5 rounded-lg bg-gradient-to-br shadow-lg ${colorStyles[color]}`}>
          <Icon size={20} />
        </div>
      </div>
      
      {/* Efeito decorativo no fundo */}
      <div className="absolute -bottom-4 -right-4 opacity-5 group-hover:opacity-10 transition-opacity z-0 pointer-events-none">
        <Icon size={80} />
      </div>
    </motion.div>
  );
}