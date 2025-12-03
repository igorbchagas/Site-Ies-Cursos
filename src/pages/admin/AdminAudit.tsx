import { useState, useEffect, useMemo } from 'react';
import { Lock, AlertTriangle, User, TrendingUp, TrendingDown, RefreshCw, MapPin, CheckCircle, FileText, Calendar, Clock } from 'lucide-react';
import { auditService } from '../../services/auditService';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import AuditDetailModal from '../../components/AuditDetailModal';

// Extensão da interface de Log para incluir o email do Admin
interface AugmentedAuditLog {
    id: string;
    table_name: string;
    action_type: 'INSERT' | 'UPDATE' | 'DELETE';
    record_id: string;
    changed_by_user_id: string;
    changed_at: string;
    old_data: any;
    new_data: any;
    changed_by_user_email?: string;
}

// Novo tipo para controlar a aba
type AuditTab = 'login' | 'audit';

// Componente auxiliar de carregamento (mantido)
const LoadingSkeleton = () => (
    <motion.div 
        key="loading" 
        initial={{ opacity: 0 }} 
        animate={{ opacity: 1 }} 
        exit={{ opacity: 0 }}
        className="flex justify-center p-12"
    >
        <RefreshCw className="animate-spin text-orange-500" size={32} />
    </motion.div>
);

// Componente principal
export default function AdminAudit() {
    const [auditLogs, setAuditLogs] = useState<AugmentedAuditLog[]>([]);
    const [loginAttempts, setLoginAttempts] = useState<any[]>([]);
    const [loadingAudit, setLoadingAudit] = useState(true);
    const [loadingLogin, setLoadingLogin] = useState(true);
    
    // Para controlar qual aba está ativa
    const [activeTab, setActiveTab] = useState<AuditTab>('login'); 

    // Estados para o Modal de Detalhes
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedLog, setSelectedLog] = useState<AugmentedAuditLog | null>(null);

    // Estados de FILTRO:
    const [filterDay, setFilterDay] = useState(''); // Formato YYYY-MM-DD
    const [filterUser, setFilterUser] = useState('all'); // Filtra por email
    const [filterTable, setFilterTable] = useState('all'); // Filtra por tabela


    const openModal = (log: AugmentedAuditLog) => {
        setSelectedLog(log);
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setSelectedLog(null);
    };


    const loadData = async () => {
        setLoadingAudit(true);
        setLoadingLogin(true);
        
        try {
            // Logs de Auditoria
            const rawAuditData = await auditService.getAuditLogs();
            const userIds = rawAuditData.map(log => log.changed_by_user_id);
            
            // 1. Busca os emails dos usuários usando a nova função RPC
            const userMap = await auditService.getAdminUserEmails(userIds);

            // 2. Augmenta os logs com o email
            const augmentedAuditData = rawAuditData.map(log => ({
                ...log,
                changed_by_user_email: userMap[log.changed_by_user_id] || log.changed_by_user_id
            }));

            setAuditLogs(augmentedAuditData);
        } catch (e) {
            toast.error("Falha ao carregar logs de Auditoria.");
        } finally {
            setLoadingAudit(false);
        }

        try {
            // Logs de Login (Honeypot)
            const loginData = await auditService.getLoginAttempts();
            setLoginAttempts(loginData);
        } catch (e) {
            toast.error("Falha ao carregar logs de Login.");
        } finally {
            setLoadingLogin(false);
        }
    };

    useEffect(() => {
        loadData();
    }, []);
    
    // 🛑 LÓGICA DE FILTRAGEM (CORREÇÃO FINAL: FORÇANDO INTERPRETAÇÃO UTC NO LOG)
    const filteredAuditLogs = useMemo(() => {
        let list = auditLogs;

        // 1. Filtrar por Dia
        if (filterDay) {
            
            // 1.1. Início do dia selecionado em UTC (Filtro Start)
            const parts = filterDay.split('-').map(Number);
            const startDateUTC = new Date(Date.UTC(parts[0], parts[1] - 1, parts[2], 0, 0, 0));
            
            // 1.2. Início do próximo dia em UTC (Filtro End)
            const endDateUTC = new Date(startDateUTC);
            endDateUTC.setUTCDate(startDateUTC.getUTCDate() + 1);

            // Filtra se o log.changed_at está DENTRO do intervalo [startDate, endDate[
            list = list.filter(log => {
                // 🛑 CORREÇÃO CRÍTICA: TRATAMENTO DA STRING DE DATA DO BANCO
                // Injetamos 'Z' (Zulu/UTC) para forçar o JavaScript a interpretar a data
                // da string `YYYY-MM-DD HH:MM:SS` como UTC, e não como local.
                const logDateString = log.changed_at.endsWith('Z') || log.changed_at.includes('+')
                    ? log.changed_at 
                    : log.changed_at.replace(' ', 'T') + 'Z';
                
                const logDate = new Date(logDateString); 

                // Compara em milissegundos UTC (getTime())
                return logDate.getTime() >= startDateUTC.getTime() && logDate.getTime() < endDateUTC.getTime();
            });
        }

        // 2. Filtrar por Usuário (E-mail)
        if (filterUser !== 'all') {
            list = list.filter(log => log.changed_by_user_email === filterUser);
        }

        // 3. Filtrar por Tabela
        if (filterTable !== 'all') {
            list = list.filter(log => log.table_name === filterTable);
        }

        return list;
    }, [auditLogs, filterDay, filterUser, filterTable]);
    
    // Opções únicas para os Selects (Memoize para performance)
    const uniqueUserEmails = useMemo(() => {
        // O valor 'all' é usado no estado, mas não deve aparecer como uma opção duplicada
        const emails = new Set(auditLogs.map(log => log.changed_by_user_email).filter(e => e && e !== 'all'));
        return Array.from(emails).sort(); // Retorna apenas os emails válidos
    }, [auditLogs]);

    const uniqueTables = useMemo(() => {
        // O valor 'all' é usado no estado, mas não deve aparecer como uma opção duplicada
        const tables = new Set(auditLogs.map(log => log.table_name).filter(t => t && t !== 'all'));
        return Array.from(tables).sort(); // Retorna apenas as tabelas válidas
    }, [auditLogs]);

    // Função auxiliar para formatação de data
    const formatDate = (dateString: string) => 
        new Date(dateString).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'medium' });

    // Função para renderizar o User Agent
    const renderUserAgent = (userAgent: string | null | undefined) => {
        if (!userAgent || typeof userAgent !== 'string') {
            return (
                <span className="text-xs text-zinc-500 truncate" title="User Agent não disponível">
                    Não especificado
                </span>
            );
        }
        const isMobile = /Mobi|Android|iPhone/i.test(userAgent);
        const browserMatch = userAgent.match(/(firefox|chrome|safari|edge)\/([0-9.]+)/i);
        const browser = browserMatch ? browserMatch[1] : 'Desconhecido';

        return (
            <span className="text-xs text-zinc-500 truncate" title={userAgent}>
                {browser} {isMobile ? '(Mobile)' : '(Desktop)'}
            </span>
        );
    };

    // Variantes de animação para as linhas da tabela
    const rowVariants = {
        hidden: { opacity: 0, y: 10 },
        visible: (i: number) => ({
            opacity: 1,
            y: 0,
            transition: {
                delay: i * 0.03,
                duration: 0.3
            }
        }),
        exit: { opacity: 0 }
    };


    return (
        <div className="p-4 md:p-6 space-y-8">
            <h1 className="text-2xl md:text-3xl font-bold text-white flex items-center gap-3">
                <AlertTriangle size={24} className="text-red-500" />
                <span className="hidden sm:inline">Trilha de Auditoria & Segurança</span>
                <span className="sm:hidden">Auditoria</span>
            </h1>
            
            {/* ======================================= */}
            {/* NAVEGAÇÃO POR TABS */}
            {/* ======================================= */}
            <div className="flex bg-zinc-800 p-1.5 md:p-2 rounded-xl shadow-inner border border-zinc-700 max-w-lg mx-auto">
                <button
                    onClick={() => setActiveTab('login')}
                    className={`flex-1 px-4 py-2 rounded-lg font-semibold transition-all flex items-center justify-center gap-2 text-sm md:text-base
                        ${activeTab === 'login' 
                            ? 'bg-red-700/50 text-white shadow-lg shadow-red-900/40' 
                            : 'bg-transparent text-zinc-400 hover:text-white'}`
                    }
                >
                    <Lock size={16} /> Login
                </button>
                <button
                    onClick={() => setActiveTab('audit')}
                    className={`flex-1 px-4 py-2 rounded-lg font-semibold transition-all flex items-center justify-center gap-2 text-sm md:text-base
                        ${activeTab === 'audit' 
                            ? 'bg-orange-600/50 text-white shadow-lg shadow-orange-900/40' 
                            : 'bg-transparent text-zinc-400 hover:text-white'}`
                    }
                >
                    <FileText size={16} /> Logs
                </button>
            </div>

            {/* ======================================= */}
            {/* CONTEÚDO CONDICIONAL POR TAB */}
            {/* ======================================= */}
            <AnimatePresence mode="wait">
                {/* Logs de Login (Conteúdo) */}
                {activeTab === 'login' && (
                    <motion.div 
                        key="login-tab"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.2 }}
                        className="bg-zinc-900 border border-zinc-800 rounded-xl shadow-xl p-4 md:p-6"
                    >
                        <h2 className="text-lg md:text-xl font-semibold text-white mb-4 flex items-center gap-2">
                             <Lock size={20} className="text-red-400" /> Tentativas de Login (Honeypot)
                        </h2>
                        
                        <p className='text-xs md:text-sm text-zinc-500 mb-4'>
                            Estes logs são automaticamente excluídos após 7 dias para manter a base limpa.
                        </p>

                        <AnimatePresence mode="wait">
                            {loadingLogin ? <LoadingSkeleton key="loadingLogin" /> : (
                                <motion.div key="tableLogin" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                                    
                                    {/* --- MOBILE CARDS --- */}
                                    <div className="md:hidden space-y-3">
                                        {loginAttempts.map((log) => (
                                            <div key={log.id} className={`p-4 rounded-lg border flex flex-col gap-2 ${log.success ? 'bg-zinc-800/20 border-zinc-700' : 'bg-red-900/10 border-red-900/30'}`}>
                                                <div className="flex justify-between items-start">
                                                    <div className="flex flex-col">
                                                        <span className="text-xs text-zinc-500 font-mono">{formatDate(log.attempt_at)}</span>
                                                        <span className="font-semibold text-white">{log.attempted_username}</span>
                                                    </div>
                                                    <span className={`text-xs px-2 py-1 rounded-full flex items-center gap-1 ${log.success ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                                                        {log.success ? <CheckCircle size={12} /> : <AlertTriangle size={12} />}
                                                        {log.success ? 'Sucesso' : 'Falha'}
                                                    </span>
                                                </div>
                                                <div className="flex items-center justify-between text-xs text-zinc-400 mt-1 pt-2 border-t border-zinc-800/50">
                                                    <span className="flex items-center gap-1 font-mono">
                                                        <MapPin size={12} /> {log.attempt_ip}
                                                    </span>
                                                    <span>{renderUserAgent(log.user_agent)}</span>
                                                </div>
                                            </div>
                                        ))}
                                        {loginAttempts.length === 0 && <p className="text-center text-zinc-500 py-8">Nenhum registro encontrado.</p>}
                                    </div>

                                    {/* --- DESKTOP TABLE --- */}
                                    <div className="hidden md:block overflow-x-auto">
                                        <table className="min-w-full divide-y divide-zinc-700">
                                            <thead>
                                                <tr className="text-left text-xs font-medium text-zinc-400 uppercase tracking-wider">
                                                    <th className="py-3 px-2">Data/Hora</th>
                                                    <th className="py-3 px-2">Usuário Tentado</th>
                                                    <th className="py-3 px-2">Status</th>
                                                    <th className="py-3 px-2">IP</th> 
                                                    <th className="py-3 px-2">Dispositivo</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-zinc-800">
                                                <AnimatePresence initial={false}>
                                                    {loginAttempts.map((log, index) => (
                                                        <motion.tr 
                                                            key={log.id} 
                                                            custom={index}
                                                            variants={rowVariants}
                                                            initial="hidden"
                                                            animate="visible"
                                                            exit="exit"
                                                            className={log.success ? 'bg-zinc-800/20 text-zinc-300' : 'bg-red-900/10 text-red-200 hover:bg-red-900/20 transition-colors'}
                                                        >
                                                            <td className="py-3 px-2 whitespace-nowrap text-sm">{formatDate(log.attempt_at)}</td>
                                                            <td className="py-3 px-2 whitespace-nowrap text-sm font-mono">{log.attempted_username}</td>
                                                            <td className="py-3 px-2 whitespace-nowrap text-sm font-semibold">
                                                                <span className={`inline-flex items-center gap-1 ${log.success ? 'text-green-500' : 'text-red-500'}`}>
                                                                        {log.success ? <CheckCircle size={14} /> : <AlertTriangle size={14} />}
                                                                        {log.success ? 'Sucesso' : 'Falha'}
                                                                </span>
                                                            </td>
                                                            <td className="py-3 px-2 text-sm">
                                                                <div className="flex items-center gap-1">
                                                                    <MapPin size={14} className="text-zinc-500" />
                                                                    <span className='font-mono text-zinc-400'>{log.attempt_ip}</span>
                                                                </div>
                                                            </td>
                                                            <td className="py-3 px-2">
                                                                {renderUserAgent(log.user_agent)}
                                                            </td>
                                                        </motion.tr>
                                                    ))}
                                                </AnimatePresence>
                                            </tbody>
                                        </table>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </motion.div>
                )}

                {/* Logs de Auditoria (Alterações de Conteúdo) */}
                {activeTab === 'audit' && (
                    <motion.div 
                        key="audit-tab"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.2 }}
                        className="bg-zinc-900 border border-zinc-800 rounded-xl shadow-xl p-4 md:p-6"
                    >
                        <h2 className="text-lg md:text-xl font-semibold text-white mb-4 flex items-center gap-2">
                             <User size={20} className="text-orange-400" /> Alterações de Conteúdo
                        </h2>
                        
                        {/* NOVO: BARRA DE FILTRO */}
                        <div className="flex flex-col md:flex-row flex-wrap gap-4 mb-6 p-4 bg-zinc-800 rounded-lg border border-zinc-700">
                            {/* Filtro por Dia */}
                            <div className="flex items-center gap-2 w-full md:w-auto">
                                <Calendar size={18} className="text-zinc-400 flex-shrink-0" />
                                <input
                                    type="date"
                                    value={filterDay}
                                    onChange={(e) => setFilterDay(e.target.value)}
                                    className="w-full md:w-auto p-2 bg-zinc-900 border border-zinc-700 rounded text-sm text-zinc-300 focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
                                    title="Filtrar por data"
                                />
                            </div>

                            {/* Filtro por Usuário */}
                            <select
                                value={filterUser}
                                onChange={(e) => setFilterUser(e.target.value)}
                                className="w-full md:w-auto p-2 bg-zinc-900 border border-zinc-700 rounded text-sm text-zinc-300 focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
                                title="Filtrar por usuário Admin"
                            >
                                <option value="all" className="bg-zinc-900 text-zinc-400">Todos os Usuários</option>
                                {uniqueUserEmails.map(email => (
                                    <option key={email} value={email} className="bg-zinc-900">
                                        {email}
                                    </option>
                                ))}
                            </select>

                            {/* Filtro por Tabela */}
                            <select
                                value={filterTable}
                                onChange={(e) => setFilterTable(e.target.value)}
                                className="w-full md:w-auto p-2 bg-zinc-900 border border-zinc-700 rounded text-sm text-zinc-300 focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
                                title="Filtrar por tabela alterada"
                            >
                                <option value="all" className="bg-zinc-900 text-zinc-400">Todas as Tabelas</option>
                                {uniqueTables.map(table => (
                                    <option key={table} value={table} className="bg-zinc-900">
                                        {table}
                                    </option>
                                ))}
                            </select>
                        </div>
                        
                        <AnimatePresence mode="wait">
                            {loadingAudit ? (
                                <LoadingSkeleton key="loadingAudit" />
                            ) : (
                                <motion.div key="tableAudit" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                                    <p className="text-sm text-zinc-500 mb-2">
                                        {filteredAuditLogs.length} logs encontrados (Logs mais antigos que 90 dias são excluídos automaticamente)
                                    </p>
                                    
                                    {/* --- MOBILE CARDS --- */}
                                    <div className="md:hidden space-y-3">
                                        {filteredAuditLogs.map((log) => (
                                            <div key={log.id} className="p-4 bg-zinc-800/40 border border-zinc-700 rounded-lg flex flex-col gap-3">
                                                <div className="flex justify-between items-start">
                                                    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold
                                                        ${log.action_type === 'DELETE' ? 'bg-red-800/50 text-red-300' :
                                                        log.action_type === 'INSERT' ? 'bg-green-800/50 text-green-300' :
                                                        'bg-blue-800/50 text-blue-300'}`
                                                    }>
                                                        {log.action_type === 'INSERT' && <TrendingUp size={12} />}
                                                        {log.action_type === 'DELETE' && <TrendingDown size={12} />}
                                                        {log.action_type === 'UPDATE' && <RefreshCw size={12} />}
                                                        {log.action_type}
                                                    </span>
                                                    <span className="text-xs text-zinc-500 flex items-center gap-1">
                                                        <Clock size={12} />
                                                        {formatDate(log.changed_at)}
                                                    </span>
                                                </div>
                                                
                                                <div className="flex flex-col gap-1">
                                                    <span className="text-sm font-semibold text-white">
                                                        Tabela: <span className="text-orange-400">{log.table_name}</span>
                                                    </span>
                                                    <span className="text-xs text-zinc-400">
                                                        Admin: {log.changed_by_user_email || log.changed_by_user_id}
                                                    </span>
                                                </div>

                                                <div className="pt-2 border-t border-zinc-800/50 flex justify-between items-center">
                                                    <span className="text-[10px] font-mono text-zinc-600 truncate max-w-[120px]">ID: {log.record_id}</span>
                                                    {(log.old_data || log.new_data) ? (
                                                        <button 
                                                            onClick={() => openModal(log)} 
                                                            className="flex items-center gap-1 text-blue-400 hover:text-blue-300 text-xs font-medium bg-blue-900/20 px-3 py-1.5 rounded-lg border border-blue-900/50"
                                                        >
                                                            <FileText size={14} />
                                                            Ver Detalhes
                                                        </button>
                                                    ) : (
                                                        <span className="text-zinc-500 text-xs">Sem detalhes</span>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                        {filteredAuditLogs.length === 0 && <p className="text-center text-zinc-500 py-8">Nenhum log encontrado.</p>}
                                    </div>

                                    {/* --- DESKTOP TABLE --- */}
                                    <div className="hidden md:block overflow-x-auto">
                                        <table className="min-w-full divide-y divide-zinc-700">
                                            <thead>
                                                <tr className="text-left text-xs font-medium text-zinc-400 uppercase tracking-wider">
                                                    <th className="py-3 px-2">Data/Hora</th>
                                                    <th className="py-3 px-2">Tabela</th>
                                                    <th className="py-3 px-2">Ação</th>
                                                    <th className="py-3 px-2">ID do Registro</th>
                                                    <th className="py-3 px-2">Admin</th>
                                                    <th className="py-3 px-2">Detalhes</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-zinc-800">
                                                <AnimatePresence initial={false}>
                                                    {filteredAuditLogs.map((log, index) => (
                                                        <motion.tr 
                                                            key={log.id} 
                                                            custom={index}
                                                            variants={rowVariants}
                                                            initial="hidden"
                                                            animate="visible"
                                                            exit="exit"
                                                            className="text-zinc-300 hover:bg-zinc-800/30 transition-colors"
                                                        >
                                                            <td className="py-3 px-2 whitespace-nowrap text-sm">{formatDate(log.changed_at)}</td>
                                                            <td className="py-3 px-2 whitespace-nowrap text-sm font-semibold">{log.table_name}</td>
                                                            <td className="py-3 px-2 whitespace-nowrap text-sm font-semibold">
                                                                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs 
                                                                    ${log.action_type === 'DELETE' ? 'bg-red-800/50 text-red-300' :
                                                                    log.action_type === 'INSERT' ? 'bg-green-800/50 text-green-300' :
                                                                    'bg-blue-800/50 text-blue-300'}`
                                                                }>
                                                                        {log.action_type === 'INSERT' && <TrendingUp size={14} />}
                                                                        {log.action_type === 'DELETE' && <TrendingDown size={14} />}
                                                                        {log.action_type === 'UPDATE' && <RefreshCw size={14} />}
                                                                        {log.action_type}
                                                                </span>
                                                            </td>
                                                            <td className="py-3 px-2 text-sm font-mono truncate max-w-xs">{log.record_id}</td>
                                                            <td className="py-3 px-2 text-sm font-semibold truncate max-w-xs text-orange-400">
                                                                {log.changed_by_user_email || log.changed_by_user_id}
                                                            </td>
                                                            <td className="py-3 px-2 whitespace-nowrap">
                                                                {(log.old_data || log.new_data) ? (
                                                                    <button 
                                                                        onClick={() => openModal(log)} 
                                                                        className="flex items-center gap-1 text-blue-400 hover:text-blue-300 text-xs font-medium underline"
                                                                    >
                                                                        <FileText size={14} />
                                                                        Ver Detalhes
                                                                    </button>
                                                                ) : (
                                                                    <span className="text-zinc-500 text-xs">N/A</span>
                                                                )}
                                                            </td>
                                                        </motion.tr>
                                                    ))}
                                                </AnimatePresence>
                                            </tbody>
                                        </table>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>

                    </motion.div>
                )}
            </AnimatePresence>
            
            {/* Modal de Detalhes */}
            <AuditDetailModal 
                log={selectedLog} 
                isOpen={isModalOpen} 
                onClose={closeModal} 
            />
        </div>
    );
}