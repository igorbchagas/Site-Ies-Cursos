import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Session } from "@supabase/supabase-js"; 
import { supabase } from "../lib/supabaseClient"; 

// --- TIPAGEM ---

interface AdminUser {
    name: string;
}

interface AuthContextType {
    session: Session | null;
    user: AdminUser | null; 
    loading: boolean; 
    login: (email: string, password: string) => Promise<boolean>;
    logout: () => void;
}

const AuthContext = createContext<AuthContextType>({
    session: null,
    user: null,
    loading: true, 
    login: async () => false,
    logout: () => {},
});

// --- PROVIDER ---

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const navigate = useNavigate();
    
    const [session, setSession] = useState<Session | null>(null);
    const [loading, setLoading] = useState(true);
    
    const [adminUser, setAdminUser] = useState<AdminUser | null>(null);

    const checkSession = useCallback(async () => {
        try {
            setLoading(true);
            const { data: { session: currentSession } } = await supabase.auth.getSession();
            
            setSession(currentSession);

            if (currentSession) {
                setAdminUser({ name: currentSession.user.email || "Administrador" });
            } else {
                setAdminUser(null);
            }
        } catch (error) {
            console.error("Erro ao verificar sessão:", error);
            setSession(null);
            setAdminUser(null);
        } finally {
            setLoading(false);
        }
    }, []);

    async function login(email: string, password: string) {
        setLoading(true);
        const { error } = await supabase.auth.signInWithPassword({
            email,
            password,
        });
        
        setLoading(false);

        if (error) {
            console.error("Erro de login Supabase:", error);
            return false;
        }

        return true;
    }

    async function logout() {
        await supabase.auth.signOut();
        navigate("/ies-admin/login");
    }

    useEffect(() => {
        checkSession();

        const { data: authListener } = supabase.auth.onAuthStateChange(
            // CORREÇÃO: Usamos '_' no 'event' para ignorar o parâmetro não utilizado
            (_, currentSession) => { 
                setSession(currentSession);
                
                if (currentSession?.user) {
                    setAdminUser({ name: currentSession.user.email || "Administrador" });
                } else {
                    setAdminUser(null);
                }
                
                setLoading(false);
            }
        );

        return () => {
             authListener?.subscription.unsubscribe(); 
        };
    }, [checkSession]);


    return (
        <AuthContext.Provider 
            value={{ 
                session, 
                user: adminUser, 
                loading, 
                login, 
                logout 
            }}
        >
             {!loading ? children : null}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    return useContext(AuthContext);
}