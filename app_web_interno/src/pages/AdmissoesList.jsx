import React, { useState, useEffect } from 'react';
import { getPacientes } from '../services/pacientesService';
import { getInternacoes, updateStatusInternacao, deleteInternacao } from '../services/internacoesService';
import { getVisitasPorInternacao } from '../services/visitasService';
import { Plus, UserMinus, UserCheck, Edit, Trash2, Search } from 'lucide-react';
import AdmissaoForm from '../components/AdmissaoForm';
import ConfirmModal from '../components/ConfirmModal';

export default function AdmissoesList() {
    const [admissoes, setAdmissoes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [admissaoEditing, setAdmissaoEditing] = useState(null);

    // Busca e filtro (client-side)
    const [busca, setBusca] = useState('');
    const [filtroStatus, setFiltroStatus] = useState('Internado');

    // Estado para erro inline (substitui alert)
    const [paginaErro, setPaginaErro] = useState('');

    // Estado para modal de confirmação (substitui window.confirm e alert)
    const [confirm, setConfirm] = useState(null);
    // confirm = { title, message, variant, confirmLabel, onConfirm }

    useEffect(() => {
        loadAdmissoes();
    }, []);

    const loadAdmissoes = async () => {
        try {
            setLoading(true);
            setPaginaErro('');
            const internacoesData = await getInternacoes();
            const pacientesData = await getPacientes();

            const pacientesMap = pacientesData.reduce((acc, p) => {
                acc[p.id] = p;
                return acc;
            }, {});

            const admissoesCompletas = internacoesData.map(int => ({
                ...int,
                paciente: pacientesMap[int.pacienteId] || { nome: 'Desconhecido', prontuario: '-', rg: '-' }
            }));

            setAdmissoes(admissoesCompletas);
        } catch (error) {
            setPaginaErro('Erro ao carregar admissões. Tente recarregar a página.');
        } finally {
            setLoading(false);
        }
    };

    const handleAlta = (adm) => {
        setConfirm({
            title: 'Registrar Alta',
            message: `Tem certeza que deseja registrar a ALTA para ${adm.paciente.nome}? O paciente deixará de aparecer na lista de visitas diárias.`,
            variant: 'warning',
            confirmLabel: 'Confirmar Alta',
            onConfirm: async () => {
                setConfirm(null);
                try {
                    await updateStatusInternacao(adm.id, 'alta', adm.historico || []);
                    loadAdmissoes();
                } catch (error) {
                    setPaginaErro('Erro ao registrar alta: ' + error.message);
                }
            },
        });
    };

    const handleReadmitir = (adm) => {
        setConfirm({
            title: 'Readmitir Paciente',
            message: `Deseja readmitir ${adm.paciente.nome} neste mesmo Registro de Atendimento? Ele voltará a aparecer na lista ativa de visitas.`,
            variant: 'info',
            confirmLabel: 'Confirmar Readmissão',
            onConfirm: async () => {
                setConfirm(null);
                try {
                    await updateStatusInternacao(adm.id, 'ativo', adm.historico || []);
                    loadAdmissoes();
                } catch (error) {
                    setPaginaErro('Erro ao readmitir paciente: ' + error.message);
                }
            },
        });
    };

    const handleEdit = (adm) => {
        setAdmissaoEditing(adm);
        setIsModalOpen(true);
    };

    const handleDelete = async (adm) => {
        // Primeiro verifica se há visitas vinculadas (antes de abrir o confirm)
        let qtdVisitas = 0;
        try {
            const visitas = await getVisitasPorInternacao(adm.id);
            qtdVisitas = visitas.length;
        } catch {
            setPaginaErro('Erro ao verificar visitas vinculadas.');
            return;
        }

        if (qtdVisitas > 0) {
            setConfirm({
                title: 'Exclusão Bloqueada',
                message: `Não é possível excluir esta admissão porque existem ${qtdVisitas} visita(s) financeira(s) atrelada(s) a ela. Por favor, exclua as visitas primeiro.`,
                variant: 'warning',
                confirmLabel: 'Entendi',
                cancelLabel: null,
                onConfirm: () => setConfirm(null),
            });
            return;
        }

        setConfirm({
            title: 'Excluir Admissão',
            message: `ATENÇÃO: Tem certeza que deseja excluir completamente a admissão de ${adm.paciente.nome}? Esta ação é irreversível.`,
            variant: 'danger',
            confirmLabel: 'Excluir',
            onConfirm: async () => {
                setConfirm(null);
                try {
                    await deleteInternacao(adm.id);
                    loadAdmissoes();
                } catch (error) {
                    setPaginaErro('Erro ao excluir admissão: ' + error.message);
                }
            },
        });
    };

    const formatDataCurta = (isoString) => {
        if (!isoString) return '-';
        if (isoString.length === 10) {
            const [y, m, d] = isoString.split('-');
            return `${d}/${m}/${y}`;
        }
        return new Date(isoString).toLocaleDateString('pt-BR');
    };

    // Filtro client-side
    const admissoesFiltradas = admissoes.filter(adm => {
        const matchBusca = !busca ||
            adm.paciente.nome.toLowerCase().includes(busca.toLowerCase()) ||
            String(adm.paciente.prontuario).includes(busca) ||
            adm.numero_registro.toLowerCase().includes(busca.toLowerCase());

        const matchStatus =
            filtroStatus === 'Todos' ||
            (filtroStatus === 'Internado' && adm.status === 'ativo') ||
            (filtroStatus === 'Alta' && adm.status !== 'ativo');

        return matchBusca && matchStatus;
    });

    return (
        <div className="space-y-6">
            <AdmissaoForm
                isOpen={isModalOpen}
                onClose={() => {
                    setIsModalOpen(false);
                    setAdmissaoEditing(null);
                }}
                onSuccess={loadAdmissoes}
                admissaoParaEditar={admissaoEditing}
            />

            <ConfirmModal
                isOpen={!!confirm}
                title={confirm?.title}
                message={confirm?.message}
                variant={confirm?.variant}
                confirmLabel={confirm?.confirmLabel}
                cancelLabel={confirm?.cancelLabel}
                onConfirm={confirm?.onConfirm}
                onCancel={() => setConfirm(null)}
            />

            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-gray-800">Admissões (Leitos)</h2>
                <button
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2 transition-colors shadow-sm"
                    onClick={() => setIsModalOpen(true)}
                >
                    <Plus size={20} />
                    Nova Admissão
                </button>
            </div>

            {/* Erro de página */}
            {paginaErro && (
                <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-lg text-sm flex justify-between items-center">
                    <span>{paginaErro}</span>
                    <button onClick={() => setPaginaErro('')} className="text-red-400 hover:text-red-600 ml-4 font-bold">✕</button>
                </div>
            )}

            {/* Barra de Busca e Filtro */}
            <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                    <Search size={16} className="absolute left-3 top-2.5 text-gray-400" />
                    <input
                        type="text"
                        value={busca}
                        onChange={(e) => setBusca(e.target.value)}
                        placeholder="Buscar por nome, prontuário ou registro..."
                        className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                    />
                </div>
                <div className="flex bg-gray-100 p-1 rounded-lg">
                    {['Todos', 'Internado', 'Alta'].map((s) => (
                        <button
                            key={s}
                            onClick={() => setFiltroStatus(s)}
                            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${filtroStatus === s ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                        >
                            {s}
                        </button>
                    ))}
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                {loading ? (
                    <div className="p-8 text-center text-gray-500">Carregando internações...</div>
                ) : admissoesFiltradas.length === 0 ? (
                    <div className="p-8 text-center text-gray-500">
                        {admissoes.length === 0
                            ? 'Nenhuma internação encontrada no momento.'
                            : 'Nenhum resultado para os filtros aplicados.'}
                    </div>
                ) : (
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-gray-50 border-b border-gray-200 text-sm font-semibold text-gray-600">
                                <th className="p-4">Admissão</th>
                                <th className="p-4">Registro (Atend.)</th>
                                <th className="p-4">Prontuário</th>
                                <th className="p-4">Paciente</th>
                                <th className="p-4">Status</th>
                                <th className="p-4 text-center">Ações</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {admissoesFiltradas.map((adm) => (
                                <tr key={adm.id} className="hover:bg-gray-50 transition-colors">
                                    <td className="p-4 text-sm text-gray-500">{formatDataCurta(adm.data_admissao)}</td>
                                    <td className="p-4 font-medium text-blue-600">{adm.numero_registro}</td>
                                    <td className="p-4 font-medium text-gray-900">{adm.paciente.prontuario}</td>
                                    <td className="p-4">
                                        {adm.status === 'ativo'
                                            ? <span className="text-gray-700">{adm.paciente.nome}</span>
                                            : <span className="text-gray-300 italic text-sm">— oculto (busque pelo nome) —</span>
                                        }
                                    </td>
                                    <td className="p-4">
                                        <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${adm.status === 'ativo' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600 border border-gray-200'}`}>
                                            {adm.status === 'ativo' ? 'Internado' : `Alta em ${formatDataCurta(adm.data_alta)}`}
                                        </span>
                                    </td>
                                    <td className="p-4 flex justify-center gap-3">
                                        <button
                                            onClick={() => handleEdit(adm)}
                                            className="text-gray-400 hover:text-blue-500 transition-colors"
                                            title="Editar Admissão"
                                        >
                                            <Edit size={18} />
                                        </button>

                                        {adm.status === 'ativo' ? (
                                            <button
                                                onClick={() => handleAlta(adm)}
                                                className="text-gray-400 hover:text-orange-500 transition-colors"
                                                title="Registrar Alta"
                                            >
                                                <UserMinus size={18} />
                                            </button>
                                        ) : (
                                            <button
                                                onClick={() => handleReadmitir(adm)}
                                                className="text-gray-400 hover:text-green-600 transition-colors"
                                                title="Readmitir neste mesmo Registro"
                                            >
                                                <UserCheck size={18} />
                                            </button>
                                        )}

                                        <button
                                            onClick={() => handleDelete(adm)}
                                            className="text-gray-400 hover:text-red-600 transition-colors"
                                            title="Excluir Admissão"
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
}
