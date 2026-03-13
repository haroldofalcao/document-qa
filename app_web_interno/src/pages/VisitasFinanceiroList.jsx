import React, { useState, useEffect, useMemo } from 'react';
import { getVisitasPorPagamento, updatePagamentoVisita } from '../services/visitasService';
import { getPacientes } from '../services/pacientesService';
import { getInternacoes } from '../services/internacoesService';
import { DollarSign, Check, Filter, X } from 'lucide-react';
import { getTipoVisitaLabel } from '../utils/visitaUtils';

const TIPOS_VISITA = [
    { value: '', label: 'Todos os procedimentos' },
    { value: 'E', label: 'Enteral (E)' },
    { value: 'P', label: 'Parenteral (P)' },
    { value: 'EP', label: 'Enteral + Parenteral (EP)' },
];

export default function VisitasFinanceiroList() {
    const [visitas, setVisitas] = useState([]);
    const [internacoesMap, setInternacoesMap] = useState({});
    const [loading, setLoading] = useState(true);
    const [paginaErro, setPaginaErro] = useState('');

    // Filtro de status (abas)
    const [filtroStatus, setFiltroStatus] = useState('Pendente');

    // Filtros adicionais
    const [filtroDataDe, setFiltroDataDe] = useState('');
    const [filtroDataAte, setFiltroDataAte] = useState('');
    const [filtroMedico, setFiltroMedico] = useState('');
    const [filtroTipo, setFiltroTipo] = useState('');

    useEffect(() => {
        loadData();
    }, [filtroStatus]);

    const loadData = async () => {
        try {
            setLoading(true);
            setPaginaErro('');

            const pacs = await getPacientes();
            const pMap = {};
            pacs.forEach(p => pMap[p.id] = p.nome);

            const ints = await getInternacoes(false);
            const iMap = {};
            ints.forEach(i => {
                iMap[i.id] = {
                    numero_registro: i.numero_registro,
                    paciente_nome: pMap[i.pacienteId] || 'Paciente Desconhecido'
                };
            });
            setInternacoesMap(iMap);

            const data = await getVisitasPorPagamento(filtroStatus);
            setVisitas(data);
        } catch (error) {
            setPaginaErro('Erro ao carregar dados financeiros. Tente recarregar a página.');
        } finally {
            setLoading(false);
        }
    };

    const handleStatusChange = async (id, novoStatus) => {
        try {
            await updatePagamentoVisita(id, {
                status_pagamento: novoStatus,
                data_pagamento: (novoStatus === 'Pago' || novoStatus === 'Glosa') ? new Date().toISOString().split('T')[0] : null
            });
            loadData();
        } catch (error) {
            setPaginaErro('Erro ao atualizar status financeiro.');
        }
    };

    const formatDataCurta = (dateString) => {
        if (!dateString) return '-';
        if (dateString.length === 10) {
            const [y, m, d] = dateString.split('-');
            return `${d}/${m}/${y}`;
        }
        return new Date(dateString).toLocaleDateString('pt-BR');
    };

    // Extrai data YYYY-MM-DD de um campo data_hora (ISO ou string)
    const extrairData = (dateString) => {
        if (!dateString) return '';
        if (dateString.length === 10) return dateString;
        return dateString.substring(0, 10);
    };

    // Lista de médicos únicos presentes nas visitas carregadas
    const medicosUnicos = useMemo(() => {
        const nomes = [...new Set(visitas.map(v => v.nome_medico).filter(Boolean))].sort();
        return nomes;
    }, [visitas]);

    // Visitas filtradas pelos filtros adicionais
    const visitasFiltradas = useMemo(() => {
        return visitas.filter(v => {
            const dataVisita = extrairData(v.data_hora);
            if (filtroDataDe && dataVisita < filtroDataDe) return false;
            if (filtroDataAte && dataVisita > filtroDataAte) return false;
            if (filtroMedico && v.nome_medico !== filtroMedico) return false;
            if (filtroTipo && v.tipo_visita !== filtroTipo) return false;
            return true;
        });
    }, [visitas, filtroDataDe, filtroDataAte, filtroMedico, filtroTipo]);

    const temFiltroAtivo = filtroDataDe || filtroDataAte || filtroMedico || filtroTipo;

    const limparFiltros = () => {
        setFiltroDataDe('');
        setFiltroDataAte('');
        setFiltroMedico('');
        setFiltroTipo('');
    };

    return (
        <div className="space-y-6">
            {paginaErro && (
                <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-lg text-sm flex justify-between items-center">
                    <span>{paginaErro}</span>
                    <button onClick={() => setPaginaErro('')} className="text-red-400 hover:text-red-600 ml-4 font-bold">✕</button>
                </div>
            )}

            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                        <DollarSign className="text-green-600" />
                        Controle de Repasses
                    </h2>
                    <p className="text-gray-500 mt-1">Gerencie o pagamento das visitas realizadas.</p>
                </div>

                {/* Abas de Status */}
                <div className="flex bg-gray-100 p-1 rounded-lg">
                    {['Pendente', 'Pago', 'Glosa', 'Todos'].map((status) => (
                        <button
                            key={status}
                            onClick={() => setFiltroStatus(status)}
                            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${filtroStatus === status
                                ? 'bg-white text-gray-900 shadow-sm'
                                : 'text-gray-500 hover:text-gray-700'
                                }`}
                        >
                            {status === 'Pendente' ? 'Em Aberto' : status}
                        </button>
                    ))}
                </div>
            </div>

            {/* Painel de filtros */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
                <div className="flex items-center gap-2 mb-3 text-sm font-semibold text-gray-600">
                    <Filter size={15} />
                    Filtros
                    {temFiltroAtivo && (
                        <button
                            onClick={limparFiltros}
                            className="ml-auto flex items-center gap-1 text-xs text-red-500 hover:text-red-700 font-medium"
                        >
                            <X size={13} /> Limpar filtros
                        </button>
                    )}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                    {/* Data De */}
                    <div>
                        <label className="block text-xs text-gray-500 mb-1">Data de</label>
                        <input
                            type="date"
                            value={filtroDataDe}
                            onChange={e => setFiltroDataDe(e.target.value)}
                            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-400"
                        />
                    </div>
                    {/* Data Até */}
                    <div>
                        <label className="block text-xs text-gray-500 mb-1">Data até</label>
                        <input
                            type="date"
                            value={filtroDataAte}
                            onChange={e => setFiltroDataAte(e.target.value)}
                            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-400"
                        />
                    </div>
                    {/* Médico */}
                    <div>
                        <label className="block text-xs text-gray-500 mb-1">Médico</label>
                        <select
                            value={filtroMedico}
                            onChange={e => setFiltroMedico(e.target.value)}
                            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-400 bg-white"
                        >
                            <option value="">Todos os médicos</option>
                            {medicosUnicos.map(nome => (
                                <option key={nome} value={nome}>{nome}</option>
                            ))}
                        </select>
                    </div>
                    {/* Procedimento */}
                    <div>
                        <label className="block text-xs text-gray-500 mb-1">Procedimento</label>
                        <select
                            value={filtroTipo}
                            onChange={e => setFiltroTipo(e.target.value)}
                            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-400 bg-white"
                        >
                            {TIPOS_VISITA.map(t => (
                                <option key={t.value} value={t.value}>{t.label}</option>
                            ))}
                        </select>
                    </div>
                </div>
                {temFiltroAtivo && (
                    <p className="text-xs text-gray-400 mt-3">
                        Exibindo {visitasFiltradas.length} de {visitas.length} registros
                    </p>
                )}
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                {loading ? (
                    <div className="p-8 text-center text-gray-500">Buscando pendências financeiras...</div>
                ) : visitasFiltradas.length === 0 ? (
                    <div className="p-8 text-center text-gray-500 flex flex-col items-center gap-3">
                        {filtroStatus === 'Pendente' && !temFiltroAtivo ? (
                            <>
                                <Check size={48} className="text-green-400 mb-2" />
                                <p className="text-lg font-medium text-gray-800">Tudo em dia!</p>
                                <p>Não há visitas aguardando repasse.</p>
                            </>
                        ) : (
                            <p>Nenhum registro encontrado para os filtros aplicados.</p>
                        )}
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse min-w-max">
                            <thead>
                                <tr className="bg-gray-50 border-b border-gray-200 text-sm font-semibold text-gray-600">
                                    <th className="p-4">Data Visita</th>
                                    <th className="p-4">Paciente</th>
                                    <th className="p-4">Tipo</th>
                                    <th className="p-4">Médico</th>
                                    <th className="p-4 w-64">Status & Pagamento</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {visitasFiltradas.map((v) => (
                                    <tr key={v.id} className="hover:bg-gray-50 transition-colors">
                                        <td className="p-4 text-sm text-gray-600">
                                            {formatDataCurta(v.data_hora)}
                                        </td>
                                        <td className="p-4 font-medium text-gray-900 border-l-4 border-l-green-500 pl-3 leading-tight">
                                            {internacoesMap[v.internacaoId]?.paciente_nome || 'Paciente Desconhecido'}
                                            <div className="text-xs text-blue-500 font-normal mt-0.5">
                                                Reg: {internacoesMap[v.internacaoId]?.numero_registro || '-'}
                                            </div>
                                        </td>
                                        <td className="p-4">{getTipoVisitaLabel(v.tipo_visita)}</td>
                                        <td className="p-4 text-sm text-gray-600">{v.nome_medico}</td>
                                        <td className="p-4">
                                            <div className="flex items-center gap-2">
                                                {(!v.status_pagamento || v.status_pagamento === 'Pendente') ? (
                                                    <>
                                                        <button
                                                            onClick={() => handleStatusChange(v.id, 'Pago')}
                                                            className="bg-green-100 hover:bg-green-200 text-green-700 font-semibold py-1.5 px-3 rounded-lg text-xs transition-colors border border-green-200 shadow-sm"
                                                        >
                                                            Marcar Pago
                                                        </button>
                                                        <button
                                                            onClick={() => handleStatusChange(v.id, 'Glosa')}
                                                            className="bg-red-100 hover:bg-red-200 text-red-700 font-semibold py-1.5 px-3 rounded-lg text-xs transition-colors border border-red-200 shadow-sm"
                                                        >
                                                            Glosar
                                                        </button>
                                                    </>
                                                ) : (
                                                    <div className="flex items-center gap-2">
                                                        <span className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wide shadow-sm border ${v.status_pagamento === 'Pago' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-700 border-red-200'}`}>
                                                            {v.status_pagamento}
                                                        </span>
                                                        <button
                                                            onClick={() => handleStatusChange(v.id, 'Pendente')}
                                                            className="text-gray-400 hover:text-gray-700 underline text-xs"
                                                            title="Desfazer"
                                                        >
                                                            Desfazer
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}
