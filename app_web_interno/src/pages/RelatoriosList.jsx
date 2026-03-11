import React, { useState, useEffect } from 'react';
import { getVisitasPorPagamento } from '../services/visitasService';
import { getPacientes } from '../services/pacientesService';
import { Printer, Filter } from 'lucide-react';

export default function RelatoriosList() {
    const [visitas, setVisitas] = useState([]);
    const [pacientesMap, setPacientesMap] = useState({});
    const [loading, setLoading] = useState(true);

    // Filtros
    const [dataInicio, setDataInicio] = useState('');
    const [dataFim, setDataFim] = useState('');
    const [filtroStatus, setFiltroStatus] = useState('Todos'); // 'Todos', 'Pendente', 'Pago', 'Glosa'
    const [filtroTipo, setFiltroTipo] = useState('Todos'); // 'Todos', 'E', 'P', 'EP'
    const [filtroMedico, setFiltroMedico] = useState('Todos');

    // Extra variables
    const [listaMedicos, setListaMedicos] = useState([]);

    useEffect(() => {
        // Inicializa com mês atual (dia 1 até ultimo dia)
        const hoje = new Date();
        const yyyy = hoje.getFullYear();
        const mm = String(hoje.getMonth() + 1).padStart(2, '0');
        const ultimoDia = new Date(yyyy, hoje.getMonth() + 1, 0).getDate();
        setDataInicio(`${yyyy}-${mm}-01`);
        setDataFim(`${yyyy}-${mm}-${ultimoDia}`);

        loadData();
    }, []);

    const loadData = async () => {
        try {
            setLoading(true);
            const pacs = await getPacientes();
            const pMap = {};
            pacs.forEach(p => pMap[p.id] = { nome: p.nome, prontuario: p.prontuario });
            setPacientesMap(pMap);

            const data = await getVisitasPorPagamento('Todos');
            setVisitas(data);

            // Extrai medicos unicos
            const medicosSet = new Set(data.map(v => v.nome_medico));
            setListaMedicos(Array.from(medicosSet).filter(Boolean).sort());
        } catch (error) {
            alert('Erro ao gerar base do relatório');
        } finally {
            setLoading(false);
        }
    };

    const handlePrint = () => {
        window.print();
    };

    const visitasFiltradas = visitas.filter(v => {
        if (!v.data_hora) return false;
        const d = v.data_hora.split('T')[0];

        // Filtro de Data
        if (dataInicio && d < dataInicio) return false;
        if (dataFim && d > dataFim) return false;

        // Filtro de Status
        if (filtroStatus !== 'Todos') {
            if (filtroStatus !== v.status_pagamento) return false;
        }

        // Filtro de Tipo
        if (filtroTipo !== 'Todos' && v.tipo_visita !== filtroTipo) return false;

        // Filtro de Médico
        if (filtroMedico !== 'Todos' && v.nome_medico !== filtroMedico) return false;

        return true;
    }).sort((a, b) => new Date(a.data_hora) - new Date(b.data_hora));

    const formatDataCurta = (isoString) => {
        if (!isoString) return '-';
        if (isoString.length === 10) {
            const [y, m, d] = isoString.split('-');
            return `${d}/${m}/${y}`;
        }
        return new Date(isoString).toLocaleDateString('pt-BR');
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 print:hidden">
                <div>
                    <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                        <Printer className="text-gray-600" />
                        Extratos e Relatórios
                    </h2>
                    <p className="text-gray-500 mt-1">Visão consolidada do faturamento com filtros dinâmicos.</p>
                </div>

                <button
                    onClick={handlePrint}
                    className="bg-gray-800 hover:bg-gray-900 text-white px-5 py-2.5 rounded-lg font-medium shadow transition-colors w-full sm:w-auto flex items-center justify-center gap-2"
                >
                    <Printer size={18} />
                    Imprimir / PDF
                </button>
            </div>

            {/* Barra de Ferramentas / Filtros */}
            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 flex flex-col md:flex-row gap-4 flex-wrap print:hidden">
                <div className="flex items-center gap-2 text-gray-700 font-medium whitespace-nowrap">
                    <Filter size={18} className="text-gray-400" />
                    Filtros:
                </div>

                <div className="grid grid-cols-2 md:grid-cols-5 gap-3 w-full">
                    <div>
                        <label className="block text-xs text-gray-500 mb-1">Data Inicial</label>
                        <input type="date" value={dataInicio} onChange={(e) => setDataInicio(e.target.value)} className="w-full border border-gray-300 rounded p-2 text-sm focus:ring-1 focus:ring-blue-500 outline-none" />
                    </div>
                    <div>
                        <label className="block text-xs text-gray-500 mb-1">Data Final</label>
                        <input type="date" value={dataFim} onChange={(e) => setDataFim(e.target.value)} className="w-full border border-gray-300 rounded p-2 text-sm focus:ring-1 focus:ring-blue-500 outline-none" />
                    </div>
                    <div>
                        <label className="block text-xs text-gray-500 mb-1">Status</label>
                        <select value={filtroStatus} onChange={(e) => setFiltroStatus(e.target.value)} className="w-full border border-gray-300 rounded p-2 text-sm focus:ring-1 focus:ring-blue-500 outline-none">
                            <option value="Todos">Todos</option>
                            <option value="Pendente">Em Aberto</option>
                            <option value="Pago">Pago</option>
                            <option value="Glosa">Glosa</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-xs text-gray-500 mb-1">Procedimento</label>
                        <select value={filtroTipo} onChange={(e) => setFiltroTipo(e.target.value)} className="w-full border border-gray-300 rounded p-2 text-sm focus:ring-1 focus:ring-blue-500 outline-none">
                            <option value="Todos">Todos</option>
                            <option value="E">Enteral (E)</option>
                            <option value="P">Parenteral (P)</option>
                            <option value="EP">Ambas (EP)</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-xs text-gray-500 mb-1">Médico</label>
                        <select value={filtroMedico} onChange={(e) => setFiltroMedico(e.target.value)} className="w-full border border-gray-300 rounded p-2 text-sm focus:ring-1 focus:ring-blue-500 outline-none">
                            <option value="Todos">Todos</option>
                            {listaMedicos.map(m => (
                                <option key={m} value={m}>{m}</option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>

            {/* Início da Área de Impressão (Print Layout) */}
            <div className="bg-white p-2 sm:p-8 rounded-xl shadow-sm border border-gray-200 print:shadow-none print:border-none print:p-0">
                {/* Header do Relatório (Aparece na impressão) */}
                <div className="hidden print:block text-center mb-8 border-b-2 border-gray-800 pb-4">
                    <h1 className="text-xl font-bold uppercase tracking-wider text-gray-900">Extrato Consolidado de Visitas Clínico-Nutricionais</h1>
                    <p className="text-sm text-gray-600 mt-1">
                        Período: {formatDataCurta(dataInicio)} a {formatDataCurta(dataFim)}
                        {filtroMedico !== 'Todos' && ` | Médico: ${filtroMedico}`}
                        {filtroStatus !== 'Todos' && ` | Status: ${filtroStatus}`}
                    </p>
                </div>

                {loading ? (
                    <div className="text-center text-gray-500 py-10 print:hidden">Processando matriz de dados...</div>
                ) : visitasFiltradas.length === 0 ? (
                    <div className="text-center text-gray-500 py-10 print:hidden">Nenhum evento registrado com os filtros selecionados.</div>
                ) : (
                    <div>
                        <div className="mb-4 text-sm text-gray-600 print:mb-6 font-medium">
                            Total de Lançamentos: {visitasFiltradas.length}
                        </div>

                        <table className="w-full text-left border-collapse border border-gray-300 print:text-[11px] text-sm">
                            <thead>
                                <tr className="bg-gray-100 print:bg-gray-200 border-b border-gray-300 text-gray-800 font-semibold">
                                    <th className="p-2 border-r border-gray-300 w-24">Data</th>
                                    <th className="p-2 border-r border-gray-300">Prontuário</th>
                                    <th className="p-2 border-r border-gray-300">Paciente</th>
                                    <th className="p-2 border-r border-gray-300 text-center w-12">Tipo</th>
                                    <th className="p-2 border-r border-gray-300">Médico</th>
                                    <th className="p-2 border-gray-300 text-center w-24">Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {visitasFiltradas.map((v) => (
                                    <tr key={v.id} className="border-b border-gray-200 hover:bg-gray-50 print:break-inside-avoid">
                                        <td className="p-2 border-r border-gray-200 text-gray-700">
                                            {formatDataCurta(v.data_hora)}
                                        </td>
                                        <td className="p-2 border-r border-gray-200 font-mono text-gray-600">
                                            {pacientesMap[v.pacienteId]?.prontuario || '-'}
                                        </td>
                                        <td className="p-2 border-r border-gray-200 font-medium text-gray-900 uppercase">
                                            {pacientesMap[v.pacienteId]?.nome || 'DESCONHECIDO'}
                                        </td>
                                        <td className="p-2 border-r border-gray-200 text-center text-gray-700 font-bold">
                                            {v.tipo_visita}
                                        </td>
                                        <td className="p-2 border-r border-gray-200 text-gray-600 truncate max-w-[150px]">
                                            {v.nome_medico}
                                        </td>
                                        <td className="p-2 text-center">
                                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${v.status_pagamento === 'Pago' ? 'bg-green-100 text-green-800 print:border print:border-green-800 text-center inline-block w-full' :
                                                    v.status_pagamento === 'Glosa' ? 'bg-red-100 text-red-800 print:border print:border-red-800 text-center inline-block w-full' :
                                                        'bg-orange-100 text-orange-800 print:border print:border-orange-800 text-center inline-block w-full'
                                                }`}>
                                                {v.status_pagamento === 'Pendente' ? 'Aberto' : v.status_pagamento}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>

                        {/* Rodapé de Assinatura (Aparece apenas na impressão) */}
                        <div className="hidden print:flex flex-col items-center mt-20 space-y-2">
                            <div className="w-64 border-t border-gray-800"></div>
                            <p className="text-xs uppercase text-gray-800 font-medium">Assinatura / Carimbo do Responsável Técnico</p>
                        </div>
                    </div>
                )}
            </div>

            <style jsx>{`
                @media print {
                    @page { size: landscape; margin: 1cm; }
                    body {
                        -webkit-print-color-adjust: exact;
                        background-color: white !important;
                    }
                    /* Esconde barra lateral no App se houver navegação global */
                    aside, header, nav { display: none !important; }
                    main { padding: 0 !important; margin: 0 !important; width: 100% !important; max-width: 100% !important; }
                }
            `}</style>
        </div>
    );
}
