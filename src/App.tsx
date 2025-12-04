import React, { Suspense } from "react"; // Importar React e Suspense
import { Routes, Route } from "react-router-dom";
import { Toaster } from "sonner"; 

import Home from "./pages/Home";
import AllCourses from "./pages/AllCourses";
import Moments from './pages/Moments'; 

import { ScrollToTop } from "./components/ScrollToTop";
import ProtectedRoute from "./components/ProtectedRoute"; 

// 🚨 REMOVENDO IMPORTAÇÕES DIRETAS DO ADMIN AQUI!

// ------------------------------------------
// 🟧 ADMIN: Lazy Loading (Code Splitting)
// O código para esses componentes SÓ será baixado quando a rota for acessada.
// ------------------------------------------

// Rota de Login (Precisa ser carregada antes do dashboard)
const AdminLogin = React.lazy(() => import("./pages/admin/AdminLogin"));

// Layout e Componentes Internos do Painel Admin
const AdminLayout = React.lazy(() => import("./pages/admin/AdminLayout"));
const AdminDashboard = React.lazy(() => import("./pages/admin/AdminDashboard"));
const AdminCourses = React.lazy(() => import("./pages/admin/AdminCourses")); 
const AdminLeads = React.lazy(() => import("./pages/admin/AdminLeads")); 
const AdminAudit = React.lazy(() => import("./pages/admin/AdminAudit"));
const AdminMoments = React.lazy(() => import("./pages/admin/AdminMoments")); 

// ------------------------------------------


export default function App() {
  return (
    <>
      <Routes>
        {/* === ROTAS PÚBLICAS (Carregamento Imediato) === */}
        <Route path="/" element={<Home />} />
        <Route path="/cursos" element={<AllCourses />} />
        <Route path="/momentos" element={<Moments />} />

        {/* ============================================== */}
        {/* === ROTAS DO ADMIN (Carregamento Preguiçoso) === */}
        {/* ============================================== */}
        
        {/* Rota de Login do Admin - Envolvida em Suspense para carregamento dinâmico */}
        <Route path="/ies-admin/login" element={
            <Suspense fallback={<AdminFallback />}>
                <AdminLogin />
            </Suspense>
        } />

        {/* ROTAS PROTEGIDAS DO ADMIN (/ies-admin/*) - Envolvidas em Suspense */}
        <Route path="/ies-admin" element={
            <Suspense fallback={<AdminFallback />}>
                <ProtectedRoute />
            </Suspense>
        }>
            <Route element={<AdminLayout />}>
                {/* index: /ies-admin */}
                <Route index element={<AdminDashboard />} /> 
                {/* /ies-admin/cursos */}
                <Route path="cursos" element={<AdminCourses />} /> 
                {/* /ies-admin/leads */}
                <Route path="leads" element={<AdminLeads />} /> 
                {/* /ies-admin/auditoria */}
                <Route path="auditoria" element={<AdminAudit />} />
                {/* /ies-admin/moments */}
                <Route path="moments" element={<AdminMoments />} /> 
            </Route>
        </Route>
      </Routes>

      <ScrollToTop />
      
      {/* TOASTER MANTIDO */}
      <Toaster 
        position="top-right" 
        richColors 
        expand={true} 
        closeButton={false} 
        toastOptions={{
            className: 'bg-zinc-800 text-zinc-100 border border-zinc-700 shadow-xl',
            duration: 3000,
        }}
      />
    </>
  );
}

// Componente de Fallback (Pode ser simples ou mais elaborado)
// Este componente impede que o usuário veja um erro enquanto o JS do Admin é baixado.
function AdminFallback() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-zinc-950 text-white">
            Carregando Painel de Administração...
        </div>
    );
}