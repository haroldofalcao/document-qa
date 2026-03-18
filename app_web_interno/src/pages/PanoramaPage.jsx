import React, { useState, useEffect } from 'react';
import { getVisitas } from '../services/visitasService';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell
} from 'recharts';
import { TrendingUp, Loader } from 'lucide-react';

// Cores dos gráficos
const CORES_TIPO = {
    'Enteral (E)': '#3b82f6',
    'Parenteral (P)': '#a855f7',
    'Ambas (EP)': '#6366f1',
};

const MESES_PT = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

export default function PanoramaPage() {
    const [visitas, setVisitas] = useState([]);
    const [loading, setLoading] = useState(true);
    const [paginaErro, setPaginaErro] = useState('');

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            setLoading(true);
            setPaginaErro('');
            const data = await getVisitas();
            setVisitas(data);
        } catch (err) {
            setPaginaErro('Erro ao carregar dados do panorama.');
        } finally {
            setLoading(false);
        }
    };

    // ── Visitas por mês (últimos 12 meses) ──────────────────────────────────
    const dadosMensais = (() => {
        const hoje = new Date();
        const meses = [];

        for (let i = 11; i >= 0; i--) {
            const d = new Date(hoje.getFullYear(), hoje.getMonth() - i, 1);
            meses.push({
                label: `${MESES_PT[d.getMonth()]}/${String(d.getFullYear()).slice(2)}`,
                ano: d.getFullYear(),
                mes: d.getMonth(),
                total: 0,
            });
        }

        visitas.forEach(v => {
            if (!v.data_hora) return;
            // Extrai ano e mês diretamente da string para evitar bugs de fuso horário
            const dateStr = v.data_hora.length === 10 ? v.data_hora : v.data_hora.split('T')[0];
            const [ano, mes] = dateStr.split('-').map(Number);
            const entry = meses.find(m => m.ano === ano && m.mes === mes - 1);
            if (entry) entry.total++;
        });

        return meses;
    })();

    // ── Distribuição por tipo de visita ─────────────────────────────────────
    const dadosTipo = (() => {
        const contagem = { E: 0, P: 0, EP: 0 };
        visitas.forEach(v => {
            if (v.tipo_visita in contagem) contagem[v.tipo_visita]++;
        });
        return [
            { name: 'Enteral (E)', value: contagem.E },
            { name: 'Parenteral (P)', value: contagem.P },
            { name: 'Ambas (EP)', value: contagem.EP },
        ].filter(d => d.value > 0);
    })();

    const totalTipo = dadosTipo.reduce((s, d) => s + d.value, 0);

    // ── Visitas por médico (top 10) ──────────────────────────────────────────
    const NOMES_IGNORADOS = ['migração', 'migracao', 'importação', 'importacao'];

    const dadosMedicos = (() => {
        // Agrupa por email (quando disponível) para evitar duplicatas nome vs email
        const porChave = {};
        visitas.forEach(v => {
            if (!v.nome_medico) return;
            if (NOMES_IGNORADOS.includes(v.nome_medico.toLowerCase().trim())) return;
            const chave = v.email_medico || v.nome_medico;
            if (!porChave[chave]) {
                porChave[chave] = { total: 0, nomes: [] };
            }
            porChave[chave].total++;
            if (!porChave[chave].nomes.includes(v.nome_medico)) {
                porChave[chave].nomes.push(v.nome_medico);
            }
        });

        const labelDe = (nomes, chave) => {
            // Prefere o nome que não é um email
            const nomeSemEmail = nomes.find(n => !n.includes('@'));
            if (nomeSemEmail) return nomeSemEmail.split(' ').slice(0, 2).join(' ');
            return chave.includes('@') ? chave.split('@')[0] : chave.split(' ').slice(0, 2).join(' ');
        };

        const nomeCompletoDE = (nomes, chave) => {
            return nomes.find(n => !n.includes('@')) || chave;
        };

        return Object.entries(porChave)
            .map(([chave, { total, nomes }]) => ({
                nome: labelDe(nomes, chave),
                nomeCompleto: nomeCompletoDE(nomes, chave),
                total,
            }))
            .sort((a, b) => b.total - a.total)
            .slice(0, 10);
    })();

    // ── Tooltip customizado para o gráfico de médicos ────────────────────────
    const TooltipMedico = ({ active, payload }) => {
        if (active && payload?.length) {
            return (
                <div className="bg-white border border-gray-200 rounded-lg shadow p-3 text-sm">
                    <p className="font-semibold text-gray-800">{payload[0].payload.nomeCompleto}</p>
                    <p className="text-blue-600">{payload[0].value} visitas</p>
                </div>
            );
        }
        return null;
    };

    // ── Label do gráfico de pizza ────────────────────────────────────────────
    const LabelPizza = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
        if (percent < 0.05) return null;
        const RADIAN = Math.PI / 180;
        const radius = innerRadius + (outerRadius - innerRadius) * 0.55;
        const x = cx + radius * Math.cos(-midAngle * RADIAN);
        const y = cy + radius * Math.sin(-midAngle * RADIAN);
        return (
            <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" fontSize={13} fontWeight="bold">
                {`${(percent * 100).toFixed(0)}%`}
            </text>
        );
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64 gap-3 text-gray-500">
                <Loader size={24} className="animate-spin" />
                <span>Calculando panorama...</span>
            </div>
        );
    }

    return (
        <div className="space-y-8">
            <div>
                <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                    <TrendingUp className="text-blue-500" />
                    Panorama Operacional
                </h2>
                <p className="text-gray-500 mt-1">Visão consolidada da produção clínico-nutricional.</p>
            </div>

            {paginaErro && (
                <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-lg text-sm">
                    {paginaErro}
                </div>
            )}

            {/* Cards de resumo */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
                    <p className="text-sm text-gray-500 font-medium">Total de Visitas</p>
                    <p className="text-3xl font-bold text-gray-800 mt-1">{visitas.length}</p>
                    <p className="text-xs text-gray-400 mt-1">histórico completo</p>
                </div>
                <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
                    <p className="text-sm text-gray-500 font-medium">Enteral</p>
                    <p className="text-3xl font-bold text-blue-600 mt-1">
                        {visitas.filter(v => v.tipo_visita === 'E').length}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">somente tipo E</p>
                </div>
                <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
                    <p className="text-sm text-gray-500 font-medium">Parenteral</p>
                    <p className="text-3xl font-bold text-purple-600 mt-1">
                        {visitas.filter(v => v.tipo_visita === 'P').length}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">somente tipo P</p>
                </div>
                <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
                    <p className="text-sm text-gray-500 font-medium">Ambas (EP)</p>
                    <p className="text-3xl font-bold text-indigo-600 mt-1">
                        {visitas.filter(v => v.tipo_visita === 'EP').length}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">enteral + parenteral</p>
                </div>
                <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
                    <p className="text-sm text-gray-500 font-medium">Profissionais</p>
                    <p className="text-3xl font-bold text-gray-800 mt-1">
                        {new Set(visitas.filter(n => n.nome_medico && !NOMES_IGNORADOS.includes(n.nome_medico.toLowerCase().trim())).map(v => v.email_medico || v.nome_medico)).size}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">médicos ativos</p>
                </div>
            </div>

            {/* Gráfico de barras: visitas por mês */}
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
                <h3 className="font-semibold text-gray-800 mb-4">Visitas por Mês (últimos 12 meses)</h3>
                {dadosMensais.every(d => d.total === 0) ? (
                    <p className="text-gray-400 text-sm text-center py-8">Sem dados suficientes para exibir.</p>
                ) : (
                    <ResponsiveContainer width="100%" height={240}>
                        <BarChart data={dadosMensais} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                            <XAxis dataKey="label" tick={{ fontSize: 12, fill: '#6b7280' }} />
                            <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: '#6b7280' }} />
                            <Tooltip
                                formatter={(value) => [`${value} visitas`, 'Total']}
                                contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb', fontSize: '13px' }}
                            />
                            <Bar dataKey="total" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                )}
            </div>

            {/* Linha inferior: pizza + ranking médicos */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                {/* Gráfico de pizza: distribuição por tipo */}
                <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
                    <h3 className="font-semibold text-gray-800 mb-4">Distribuição por Tipo de Visita</h3>
                    {dadosTipo.length === 0 ? (
                        <p className="text-gray-400 text-sm text-center py-8">Sem dados.</p>
                    ) : (
                        <>
                            <ResponsiveContainer width="100%" height={200}>
                                <PieChart>
                                    <Pie
                                        data={dadosTipo}
                                        cx="50%"
                                        cy="50%"
                                        outerRadius={90}
                                        dataKey="value"
                                        labelLine={false}
                                        label={LabelPizza}
                                    >
                                        {dadosTipo.map((entry) => (
                                            <Cell key={entry.name} fill={CORES_TIPO[entry.name]} />
                                        ))}
                                    </Pie>
                                </PieChart>
                            </ResponsiveContainer>
                            {/* Legenda HTML — não sobrepõe o gráfico no mobile */}
                            <div className="flex flex-col gap-1.5 mt-3">
                                {dadosTipo.map((entry) => (
                                    <div key={entry.name} className="flex items-center justify-between text-sm">
                                        <div className="flex items-center gap-2">
                                            <span
                                                className="inline-block w-3 h-3 rounded-sm shrink-0"
                                                style={{ backgroundColor: CORES_TIPO[entry.name] }}
                                            />
                                            <span className="text-gray-700">{entry.name}</span>
                                        </div>
                                        <span className="text-gray-500 font-medium">
                                            {entry.value}&nbsp;
                                            <span className="text-gray-400 font-normal">
                                                ({totalTipo > 0 ? ((entry.value / totalTipo) * 100).toFixed(1) : 0}%)
                                            </span>
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </>
                    )}
                </div>

                {/* Ranking por médico */}
                <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
                    <h3 className="font-semibold text-gray-800 mb-4">Visitas por Profissional</h3>
                    {dadosMedicos.length === 0 ? (
                        <p className="text-gray-400 text-sm text-center py-8">Sem dados.</p>
                    ) : (
                        <ResponsiveContainer width="100%" height={220}>
                            <BarChart
                                layout="vertical"
                                data={dadosMedicos}
                                margin={{ top: 0, right: 30, left: 10, bottom: 0 }}
                            >
                                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" horizontal={false} />
                                <XAxis type="number" allowDecimals={false} tick={{ fontSize: 12, fill: '#6b7280' }} />
                                <YAxis type="category" dataKey="nome" tick={{ fontSize: 12, fill: '#374151' }} width={110} />
                                <Tooltip content={<TooltipMedico />} />
                                <Bar dataKey="total" fill="#6366f1" radius={[0, 4, 4, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    )}
                </div>
            </div>
        </div>
    );
}
