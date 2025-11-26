import { Routes, Route } from "react-router-dom";
import { Toaster } from "sonner"; 

import Home from "./pages/Home";
import AllCourses from "./pages/AllCourses";

import { ScrollToTop } from "./components/ScrollToTop";
import ProtectedRoute from "./components/ProtectedRoute"; 

// 🟧 ADMIN
import AdminLogin from "./pages/admin/AdminLogin";
import AdminLayout from "./pages/admin/AdminLayout";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminCourses from "./pages/admin/AdminCourses";
import AdminLeads from "./pages/admin/AdminLeads"; 
import AdminAudit from "./pages/admin/AdminAudit";

export default function App() {
  return (
    <>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/cursos" element={<AllCourses />} />

        <Route path="/ies-admin/login" element={<AdminLogin />} />

        <Route path="/ies-admin" element={<ProtectedRoute />}>
                <Route element={<AdminLayout />}>
                <Route index element={<AdminDashboard />} />
                <Route path="cursos" element={<AdminCourses />} />
                <Route path="leads" element={<AdminLeads />} />
                <Route path="auditoria" element={<AdminAudit />} /> {/* <-- NOVA ROTA */}
            </Route>
        </Route>
      </Routes>

      <ScrollToTop />
      
      {/* TOASTER CORRIGIDO: Removida a aninhagem incorreta de success/error */}
      <Toaster 
        position="top-right" 
        // Usamos richColors para as cores de sucesso/erro.
        richColors 
        expand={true} 
        closeButton={false} 
        // Aplicamos o estilo diretamente ao container de todos os toasts
        toastOptions={{
             className: 'bg-zinc-800 text-zinc-100 border border-zinc-700 shadow-xl',
             duration: 3000,
             // Opções específicas de estilo para cada tipo são tratadas internamente pelo richColors
        }}
      />
    </>
  );
}