import React, { Suspense, useEffect } from "react"; // Importar React e Suspense
import { Routes, Route, useLocation } from "react-router-dom";
import { Toaster } from "sonner"; 
import Lenis from '@studio-freight/lenis';

import Home from "./pages/Home";
import AllCourses from "./pages/AllCourses";
import Moments from './pages/Moments'; 
import Feedback from './pages/Feedback'; // 🆕 Import da Página Pública de Feedback

import { ScrollToTop } from "./components/ScrollToTop";
import ProtectedRoute from "./components/ProtectedRoute"; 

// 🚨 REMOVENDO IMPORTAÇÕES DIRETAS DO ADMIN AQUI!

// ------------------------------------------
// 🟧 ADMIN: Lazy Loading (Code Splitting)
// O código para esses componentes SÓ será baixado quando a rota for acessada.
// ------------------------------------------

// Rota de Login (Precisa ser carregada antes do dashboard)
const AdminLogin = React.lazy(() => import("./pages/admin/AdminLogin"));

// 1. GERENCIADOR DE SCROLL (LENIS)
const ScrollManager = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    // 1. Desativa a restauração automática do navegador para não brigar com o código
    if ('scrollRestoration' in window.history) {
      window.history.scrollRestoration = 'manual';
    }

    // 2. Inicializa o Lenis (Apenas uma vez)
    const lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
    });

    // Função de animação
    function raf(time: number) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    }
    requestAnimationFrame(raf);

    // Guardamos a instância no window para acessar no outro useEffect se necessário
    (window as any).lenis = lenis;

    return () => {
      lenis.destroy();
    };
  }, []); // Array vazio = Roda apenas quando o site abre

  useEffect(() => {
    // 3. Toda vez que o pathname mudar, joga o scroll para o topo
    window.scrollTo(0, 0);
    
    const lenis = (window as any).lenis;
    if (lenis) {
      lenis.scrollTo(0, { immediate: true });
    }
  }, [pathname]); // Roda toda vez que você mudar de página

  return null;
};

// Layout e Componentes Internos do Painel Admin
const AdminLayout = React.lazy(() => import("./pages/admin/AdminLayout"));
const AdminDashboard = React.lazy(() => import("./pages/admin/AdminDashboard"));
const AdminCourses = React.lazy(() => import("./pages/admin/AdminCourses")); 
const AdminLeads = React.lazy(() => import("./pages/admin/AdminLeads")); 
const AdminAudit = React.lazy(() => import("./pages/admin/AdminAudit"));
const AdminMoments = React.lazy(() => import("./pages/admin/AdminMoments")); 
const AdminFeedbacks = React.lazy(() => import("./pages/admin/AdminFeedbacks")); // 🆕 Import Lazy do Admin de Feedbacks

// ------------------------------------------


export default function App() {
  return (
    <>
    <ScrollManager />
      <Routes>
        {/* === ROTAS PÚBLICAS (Carregamento Imediato) === */}
        <Route path="/" element={<Home />} />
        <Route path="/cursos" element={<AllCourses />} />
        <Route path="/momentos" element={<Moments />} />
        <Route path="/feedback" element={<Feedback />} /> {/* 🆕 Rota Pública de Feedback */}

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
                {/* /ies-admin/feedbacks */}
                <Route path="feedbacks" element={<AdminFeedbacks />} /> {/* 🆕 Rota Admin de Feedbacks */}
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