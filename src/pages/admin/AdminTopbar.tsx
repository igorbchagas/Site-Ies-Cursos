import { motion } from "framer-motion";
import { Shield, LogOut } from "lucide-react";

interface AdminTopbarProps {
  userName: string;
  onLogout: () => void;
}

export default function AdminTopbar({ userName, onLogout }: AdminTopbarProps) {
  return (
    <motion.header
      initial={{ opacity: 0, y: -10, filter: "blur(8px)" }}
      animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      transition={{ duration: 0.35, ease: [0.19, 1, 0.22, 1] }}
      className="w-full border-b border-zinc-800/80 bg-zinc-950/70 backdrop-blur-md px-4 md:px-8 py-3 flex items-center justify-between"
    >
      {/* Esquerda: título */}
      <div className="flex items-center gap-3">
        <Shield size={22} className="text-orange-400" />
        <div className="flex flex-col">
          <span className="text-sm font-semibold">
            Área Administrativa
          </span>
          <span className="text-xs text-zinc-400">
            Gerencie conteúdos do site da IesCursos
          </span>
        </div>
      </div>

      {/* Direita: usuário + botão sair */}
      <div className="flex items-center gap-4">
        <div className="hidden sm:flex flex-col items-end">
          <span className="text-sm font-medium">{userName}</span>
          <span className="text-[11px] text-zinc-400">Administrador</span>
        </div>

        <button
          onClick={onLogout}
          className="flex items-center gap-2 text-xs md:text-sm text-zinc-300 hover:text-red-300 px-3 py-1.5 rounded-lg border border-zinc-700 hover:border-red-500 transition"
        >
          <LogOut size={16} />
          <span>Sair</span>
        </button>
      </div>
    </motion.header>
  );
}
