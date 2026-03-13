import React, { useState, useEffect } from 'react';
import { getMedicos, createMedico, updateMedico, deleteMedico } from '../services/medicosService';
import { useAuth } from '../contexts/AuthContext';
import { UserPlus, ShieldCheck, ShieldOff, UserCheck, UserMinus, X, Pencil, Trash2 } from 'lucide-react';
import ConfirmModal from '../components/ConfirmModal';

export default function MedicosPage() {
    const { medicoData } = useAuth();
    const [medicos, setMedicos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [paginaErro, setPaginaErro] = useState('');

    // Modal de novo médico
    const [modalAberto, setModalAberto] = useState(false);
    const [novoNome, setNovoNome] = useState('');
    const [novoEmail, setNovoEmail] = useState('');
    const [novoAdmin, setNovoAdmin] = useState(false);
    const [salvando, setSalvando] = useState(false);
    const [erroModal, setErroModal] = useState('');

    // Modal de edição de nome
    const [editando, setEditando] = useState(null); // médico sendo editado
    const [nomeEditado, setNomeEditado] = useState('');
    const [salvandoEdicao, setSalvandoEdicao] = useState(false);
    const [erroEdicao, setErroEdicao] = useState('');

    // Modal de confirmação genérico
    const [confirm, setConfirm] = useState(null);

    useEffect(() => {
        loadMedicos();
    }, []);

    const loadMedicos = async () => {
        try {
            setLoading(true);
            setPaginaErro('');
            const data = await getMedicos();

            // Deduplica por e-mail: mantém o registro mais "completo" (admin > ativo > primeiro)
            const porEmail = new Map();
            data.forEach(m => {
                const key = m.email?.toLowerCase().trim();
                if (!key) return;
                const existente = porEmail.get(key);
                if (!existente) {
                    porEmail.set(key, m);
                } else {
                    // Prefere admin, depois ativo
                    const maisCompleto = m.admin || (!existente.admin && m.ativo) ? m : existente;
                    porEmail.set(key, maisCompleto);
                }
            });
            const deduplicados = [...porEmail.values()];

            // Ordena: admins primeiro, depois por nome
            deduplicados.sort((a, b) => {
                if (a.admin !== b.admin) return b.admin - a.admin;
                return (a.nome || '').localeCompare(b.nome || '');
            });
            setMedicos(deduplicados);
        } catch (err) {
            setPaginaErro('Erro ao carregar lista de médicos.');
        } finally {
            setLoading(false);
        }
    };

    // ── Adicionar novo médico ─────────────────────────────────────────────────
    const handleAdicionar = async (e) => {
        e.preventDefault();
        setErroModal('');

        if (!novoEmail.includes('@')) {
            setErroModal('Informe um e-mail válido.');
            return;
        }
        if (medicos.some(m => m.email.toLowerCase() === novoEmail.toLowerCase())) {
            setErroModal('Este e-mail já está cadastrado.');
            return;
        }

        setSalvando(true);
        try {
            await createMedico({ email: novoEmail.trim().toLowerCase(), nome: novoNome.trim(), admin: novoAdmin });
            setModalAberto(false);
            setNovoNome('');
            setNovoEmail('');
            setNovoAdmin(false);
            loadMedicos();
        } catch (err) {
            setErroModal('Erro ao cadastrar médico. Tente novamente.');
        } finally {
            setSalvando(false);
        }
    };

    // ── Editar nome ───────────────────────────────────────────────────────────
    const abrirEdicao = (medico) => {
        setEditando(medico);
        setNomeEditado(medico.nome || '');
        setErroEdicao('');
    };

    const handleSalvarEdicao = async (e) => {
        e.preventDefault();
        if (!nomeEditado.trim()) {
            setErroEdicao('O nome não pode ficar em branco.');
            return;
        }
        setSalvandoEdicao(true);
        try {
            await updateMedico(editando.id, { nome: nomeEditado.trim() });
            setEditando(null);
            loadMedicos();
        } catch (err) {
            setErroEdicao('Erro ao salvar. Tente novamente.');
        } finally {
            setSalvandoEdicao(false);
        }
    };

    // ── Excluir médico ────────────────────────────────────────────────────────
    const handleExcluir = (medico) => {
        if (medico.email === medicoData?.email) {
            setPaginaErro('Você não pode excluir sua própria conta.');
            return;
        }
        const totalAdmins = medicos.filter(m => m.admin && m.ativo).length;
        if (medico.admin && totalAdmins <= 1) {
            setPaginaErro('Não é possível excluir o último administrador do sistema.');
            return;
        }
        setConfirm({
            title: 'Excluir Médico',
            message: `Deseja excluir permanentemente ${medico.nome}? As visitas registradas por ele serão preservadas.`,
            variant: 'danger',
            confirmLabel: 'Excluir',
            onConfirm: async () => {
                setConfirm(null);
                try {
                    await deleteMedico(medico.id);
                    loadMedicos();
                } catch (err) {
                    setPaginaErro('Erro ao excluir médico.');
                }
            },
        });
    };

    // ── Ativar / Desativar ────────────────────────────────────────────────────
    const handleToggleAtivo = (medico) => {
        if (medico.email === medicoData?.email) {
            setPaginaErro('Você não pode desativar sua própria conta.');
            return;
        }
        const ativando = !medico.ativo;
        setConfirm({
            title: ativando ? 'Reativar Médico' : 'Desativar Médico',
            message: ativando
                ? `Deseja reativar ${medico.nome}? Ele voltará a ter acesso ao sistema.`
                : `Deseja desativar ${medico.nome}? Ele perderá o acesso imediatamente, mas seu histórico de visitas será preservado.`,
            variant: ativando ? 'info' : 'warning',
            confirmLabel: ativando ? 'Reativar' : 'Desativar',
            onConfirm: async () => {
                setConfirm(null);
                try {
                    await updateMedico(medico.id, { ativo: !medico.ativo });
                    loadMedicos();
                } catch (err) {
                    setPaginaErro('Erro ao atualizar status do médico.');
                }
            },
        });
    };

    // ── Promover / Rebaixar admin ─────────────────────────────────────────────
    const handleToggleAdmin = (medico) => {
        if (medico.email === medicoData?.email) {
            setPaginaErro('Você não pode alterar suas próprias permissões de administrador.');
            return;
        }
        const totalAdmins = medicos.filter(m => m.admin && m.ativo).length;
        if (medico.admin && totalAdmins <= 1) {
            setPaginaErro('Não é possível remover o último administrador do sistema.');
            return;
        }
        const promovendo = !medico.admin;
        setConfirm({
            title: promovendo ? 'Promover a Administrador' : 'Remover Administrador',
            message: promovendo
                ? `Deseja tornar ${medico.nome} administrador? Ele poderá gerenciar outros médicos.`
                : `Deseja remover os privilégios de administrador de ${medico.nome}?`,
            variant: promovendo ? 'info' : 'warning',
            confirmLabel: promovendo ? 'Promover' : 'Remover Admin',
            onConfirm: async () => {
                setConfirm(null);
                try {
                    await updateMedico(medico.id, { admin: !medico.admin });
                    loadMedicos();
                } catch (err) {
                    setPaginaErro('Erro ao atualizar permissões.');
                }
            },
        });
    };

    return (
        <div className="space-y-6">
            <ConfirmModal
                isOpen={!!confirm}
                title={confirm?.title}
                message={confirm?.message}
                variant={confirm?.variant}
                confirmLabel={confirm?.confirmLabel}
                onConfirm={confirm?.onConfirm}
                onCancel={() => setConfirm(null)}
            />

            {/* Modal: Novo Médico */}
            {modalAberto && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
                        <div className="flex justify-between items-center p-6 border-b border-gray-100 bg-blue-50">
                            <h3 className="text-lg font-bold text-blue-800">Cadastrar Novo Médico</h3>
                            <button onClick={() => { setModalAberto(false); setErroModal(''); }} className="text-blue-400 hover:text-blue-600">
                                <X size={22} />
                            </button>
                        </div>
                        <form onSubmit={handleAdicionar} className="p-6 space-y-4">
                            {erroModal && (
                                <div className="bg-red-50 text-red-700 border border-red-200 p-3 rounded-lg text-sm">{erroModal}</div>
                            )}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Nome Completo *</label>
                                <input
                                    type="text"
                                    required
                                    value={novoNome}
                                    onChange={(e) => setNovoNome(e.target.value)}
                                    placeholder="Ex: Dra. Ana Paula Silva"
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">E-mail Google *</label>
                                <input
                                    type="email"
                                    required
                                    value={novoEmail}
                                    onChange={(e) => setNovoEmail(e.target.value)}
                                    placeholder="email@gmail.com"
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                                />
                                <p className="text-xs text-gray-400 mt-1">Deve ser o mesmo e-mail da conta Google que a pessoa usará para entrar.</p>
                            </div>
                            <div className="flex items-center gap-3 bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                                <input
                                    id="chk-admin"
                                    type="checkbox"
                                    checked={novoAdmin}
                                    onChange={(e) => setNovoAdmin(e.target.checked)}
                                    className="w-4 h-4 accent-yellow-600"
                                />
                                <label htmlFor="chk-admin" className="text-sm text-yellow-800 font-medium cursor-pointer">
                                    Conceder permissão de administrador
                                </label>
                            </div>
                            <div className="flex gap-3 justify-end pt-2">
                                <button type="button" onClick={() => { setModalAberto(false); setErroModal(''); }} className="px-4 py-2 text-gray-600 font-medium hover:bg-gray-100 rounded-lg transition-colors text-sm">
                                    Cancelar
                                </button>
                                <button type="submit" disabled={salvando} className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-lg font-medium transition-colors text-sm disabled:opacity-70">
                                    {salvando ? 'Salvando...' : 'Cadastrar'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Modal: Editar Nome */}
            {editando && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden">
                        <div className="flex justify-between items-center p-6 border-b border-gray-100 bg-gray-50">
                            <h3 className="text-lg font-bold text-gray-800">Editar Nome</h3>
                            <button onClick={() => setEditando(null)} className="text-gray-400 hover:text-gray-600">
                                <X size={22} />
                            </button>
                        </div>
                        <form onSubmit={handleSalvarEdicao} className="p-6 space-y-4">
                            {erroEdicao && (
                                <div className="bg-red-50 text-red-700 border border-red-200 p-3 rounded-lg text-sm">{erroEdicao}</div>
                            )}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Nome</label>
                                <input
                                    type="text"
                                    required
                                    autoFocus
                                    value={nomeEditado}
                                    onChange={(e) => setNomeEditado(e.target.value)}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                                />
                                <p className="text-xs text-gray-400 mt-1">E-mail: {editando.email}</p>
                            </div>
                            <div className="flex gap-3 justify-end pt-2">
                                <button type="button" onClick={() => setEditando(null)} className="px-4 py-2 text-gray-600 font-medium hover:bg-gray-100 rounded-lg transition-colors text-sm">
                                    Cancelar
                                </button>
                                <button type="submit" disabled={salvandoEdicao} className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-lg font-medium transition-colors text-sm disabled:opacity-70">
                                    {salvandoEdicao ? 'Salvando...' : 'Salvar'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Cabeçalho */}
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold text-gray-800">Gestão de Médicos</h2>
                    <p className="text-gray-500 mt-1">Controle quem tem acesso ao sistema.</p>
                </div>
                <button
                    onClick={() => { setModalAberto(true); setErroModal(''); }}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2 transition-colors shadow-sm"
                >
                    <UserPlus size={20} />
                    Adicionar Médico
                </button>
            </div>

            {paginaErro && (
                <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-lg text-sm flex justify-between items-center">
                    <span>{paginaErro}</span>
                    <button onClick={() => setPaginaErro('')} className="text-red-400 hover:text-red-600 ml-4 font-bold">✕</button>
                </div>
            )}

            {/* Tabela */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                {loading ? (
                    <div className="p-8 text-center text-gray-500">Carregando médicos...</div>
                ) : medicos.length === 0 ? (
                    <div className="p-8 text-center text-gray-500">Nenhum médico cadastrado.</div>
                ) : (
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-gray-50 border-b border-gray-200 text-sm font-semibold text-gray-600">
                                <th className="p-4">Nome</th>
                                <th className="p-4">E-mail</th>
                                <th className="p-4">Perfil</th>
                                <th className="p-4">Status</th>
                                <th className="p-4 text-center">Ações</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {medicos.map((m) => {
                                const ehVoce = m.email === medicoData?.email;
                                return (
                                    <tr key={m.id} className={`hover:bg-gray-50 transition-colors ${!m.ativo ? 'opacity-50' : ''}`}>
                                        <td className="p-4 font-medium text-gray-900">
                                            {m.nome}
                                            {ehVoce && <span className="ml-2 text-xs bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full font-medium">você</span>}
                                        </td>
                                        <td className="p-4 text-sm text-gray-500">{m.email}</td>
                                        <td className="p-4">
                                            {m.admin
                                                ? <span className="flex items-center gap-1 text-xs font-semibold text-yellow-700 bg-yellow-100 px-2 py-1 rounded-full w-fit"><ShieldCheck size={13} /> Admin</span>
                                                : <span className="text-xs text-gray-400">Médico</span>
                                            }
                                        </td>
                                        <td className="p-4">
                                            <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${m.ativo ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                                                {m.ativo ? 'Ativo' : 'Inativo'}
                                            </span>
                                        </td>
                                        <td className="p-4">
                                            <div className="flex justify-center gap-3">
                                                {/* Editar nome */}
                                                <button
                                                    onClick={() => abrirEdicao(m)}
                                                    className="text-gray-400 hover:text-blue-500 transition-colors"
                                                    title="Editar nome"
                                                >
                                                    <Pencil size={17} />
                                                </button>

                                                {/* Promover / rebaixar admin */}
                                                <button
                                                    onClick={() => handleToggleAdmin(m)}
                                                    disabled={ehVoce}
                                                    className="text-gray-400 hover:text-yellow-500 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                                                    title={m.admin ? 'Remover Admin' : 'Tornar Admin'}
                                                >
                                                    {m.admin ? <ShieldOff size={18} /> : <ShieldCheck size={18} />}
                                                </button>

                                                {/* Ativar / desativar */}
                                                <button
                                                    onClick={() => handleToggleAtivo(m)}
                                                    disabled={ehVoce}
                                                    className="text-gray-400 hover:text-orange-500 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                                                    title={m.ativo ? 'Desativar acesso' : 'Reativar acesso'}
                                                >
                                                    {m.ativo ? <UserMinus size={18} /> : <UserCheck size={18} />}
                                                </button>

                                                {/* Excluir */}
                                                <button
                                                    onClick={() => handleExcluir(m)}
                                                    disabled={ehVoce}
                                                    className="text-gray-400 hover:text-red-600 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                                                    title="Excluir médico"
                                                >
                                                    <Trash2 size={17} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
}
