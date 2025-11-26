// src/components/ProtectedRoute.tsx
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Loader2 } from 'lucide-react';

export default function ProtectedRoute() {
  const { session, loading } = useAuth(); // Assume-se que useAuth retorna session e loading

  if (loading) {
    // Tela de carregamento enquanto verifica a sessão
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-900">
        <Loader2 size={40} className="animate-spin text-orange-500" />
      </div>
    );
  }

  // Se a sessão não existir, redireciona para a página de login
  if (!session) {
    return <Navigate to="/ies-admin/login" replace />;
  }

  // Se a sessão for válida, renderiza o conteúdo da rota (AdminLayout)
  return <Outlet />;
}