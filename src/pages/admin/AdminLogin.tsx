import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { LogIn, User, Lock, Loader2, Zap, Eye, EyeOff } from "lucide-react"; 
import { useAuth } from "../../context/AuthContext";
import { supabase } from "../../lib/supabaseClient"; // Importado para logar a tentativa

export default function AdminLogin() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false); 

  // NOVO: Função para logar tentativas no banco de dados
  async function logAttempt(successStatus: boolean) {
    // Captura o User Agent do navegador para o log
    const userAgent = navigator.userAgent; 
    
    try {
        await supabase.rpc('log_login_attempt', {
            username_tried: username,
            is_success: successStatus,
            user_agent_client: userAgent // Enviamos o User Agent
        });
    } catch (e) {
        console.error("Falha ao registrar log de tentativa de login:", e);
    }
  }

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const success = await login(username, password);

    // 1. REGISTRA A TENTATIVA (antes de parar o loading)
    await logAttempt(success); 

    setLoading(false);

    if (!success) {
      // 2. EXIBE ERRO
      setError("Usuário ou senha incorretos.");
      // Limpar a senha para forçar a redigitação (segurança visual)
      setPassword("");
      return; 
    }

    // Se houver sucesso, redireciona
    navigate("/ies-admin");
  }

  return (
    // Fundo escuro com sutil gradiente radial para profundidade
    <div className="min-h-screen flex items-center justify-center bg-zinc-950 p-4">
      {/* Container principal com animação de entrada */}
      <motion.div
        initial={{ opacity: 0, y: 50, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.6, ease: [0.19, 1, 0.22, 1] }}
        // Reforçado o shadow e o arredondamento
        className="bg-zinc-900 border border-zinc-800 shadow-3xl shadow-orange-950/50 rounded-[20px] p-10 w-full max-w-sm"
      >
        {/* Cabeçalho Premium */}
        <div className="flex flex-col items-center gap-3 mb-10">
          <div className="w-14 h-14 rounded-full bg-gradient-to-br from-orange-500 to-orange-700 flex items-center justify-center shadow-xl shadow-orange-500/30 ring-4 ring-zinc-800">
            <Zap size={28} className="text-white" />
          </div>
          <h1 className="text-2xl text-white font-extrabold tracking-wide">
            ADMIN LOG IN
          </h1>
          <p className="text-zinc-400 text-sm">
            Acesso exclusivo para administradores
          </p>
        </div>

        {/* Formulário */}
        <form onSubmit={handleLogin} className="flex flex-col gap-5">

          {/* Input Usuário */}
          <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1, duration: 0.4 }}
            className="relative"
          >
            <label htmlFor="username" className="text-zinc-300 text-xs font-medium uppercase tracking-wider mb-1 block">Usuário</label>
            <div className="flex items-center">
              <User size={18} className="absolute left-4 text-zinc-500" />
              <input
                type="text"
                id="username"
                className="w-full pl-12 pr-4 py-3 bg-zinc-950 border border-zinc-700 rounded-xl text-white placeholder-zinc-500 focus:bg-zinc-800 focus:border-orange-500 focus:ring-1 focus:ring-orange-500 outline-none transition-all duration-300"
                placeholder="nome.admin"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                autoComplete="username"
                required
              />
            </div>
          </motion.div>

          {/* Input Senha com Toggler */}
          <motion.div
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2, duration: 0.4 }}
            className="relative"
          >
            <label htmlFor="password" className="text-zinc-300 text-xs font-medium uppercase tracking-wider mb-1 block">Senha</label>
            <div className="flex items-center">
              <Lock size={18} className="absolute left-4 text-zinc-500" />
              <input
                type={showPassword ? "text" : "password"} 
                id="password"
                className="w-full pl-12 pr-12 py-3 bg-zinc-950 border border-zinc-700 rounded-xl text-white placeholder-zinc-500 focus:bg-zinc-800 focus:border-orange-500 focus:ring-1 focus:ring-orange-500 outline-none transition-all duration-300"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                required
              />
              {/* Botão de Toggle */}
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 p-1 text-zinc-500 hover:text-orange-400 transition"
                title={showPassword ? "Esconder senha" : "Mostrar senha"}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </motion.div>

          {/* Mensagem de erro */}
          {error && (
            <motion.p
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
              className="text-red-400 bg-red-900/20 border border-red-700/50 text-sm py-2 rounded-lg text-center"
            >
              {error}
            </motion.p>
          )}

          {/* Botão de Login */}
          <motion.button
            whileTap={{ scale: 0.98 }}
            whileHover={{ scale: loading ? 1 : 1.03 }}
            className="w-full mt-2 bg-gradient-to-r from-orange-600 to-orange-500 transition text-white font-bold py-3 rounded-xl shadow-lg shadow-orange-600/30 flex items-center justify-center gap-2 disabled:from-zinc-700 disabled:to-zinc-600 disabled:shadow-none"
            type="submit"
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 size={20} className="animate-spin" />
                Verificando...
              </>
            ) : (
              <>
                <LogIn size={20} />
                Acessar Painel
              </>
            )}
          </motion.button>
        </form>
      </motion.div>
    </div>
  );
}