import { useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { useAuth } from "../../context/AuthContext";
import AdminSidebar from "./AdminSidebar";
import AdminTopbar from "./AdminTopbar";

export default function AdminLayout() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black text-white">
        Acesso negado.
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-zinc-950 to-black text-white flex">
      {/* Sidebar: Agora recebe props para controlar visibilidade no mobile */}
      <AdminSidebar 
        isOpen={isSidebarOpen} 
        onClose={() => setIsSidebarOpen(false)} 
      />

      {/* Conteúdo principal */}
      <div className="flex-1 flex flex-col min-w-0"> {/* min-w-0 evita overflow horizontal */}
        {/* Topbar: Agora recebe função para abrir a sidebar */}
        <AdminTopbar 
          userName={user.name} 
          onLogout={logout} 
          onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
        />

        {/* Área de páginas internas com animação */}
        <motion.main
          key={location.pathname}
          initial={{ opacity: 0, y: 20, filter: "blur(8px)" }}
          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          transition={{ duration: 0.4, ease: [0.19, 1, 0.22, 1] }}
          className="flex-1 p-4 md:p-8 overflow-y-auto" // Reduzi padding mobile para p-4
        >
          <Outlet />
        </motion.main>
      </div>
    </div>
  );
}