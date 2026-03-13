import React, { useState, useEffect, useRef, useMemo } from 'react';
import { createVisita } from '../services/visitasService';
import { getPacientes } from '../services/pacientesService';
import { getInternacoes } from '../services/internacoesService';
import { X, Search, ChevronDown } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export default function VisitaForm({ isOpen, onClose, onSuccess }) {
    const { currentUser } = useAuth();
    const nomeMedico = currentUser?.displayName || currentUser?.email || 'Médico Não Identificado';
    const emailMedico = currentUser?.email || '';

    const [admissoesAtivas, setAdmissoesAtivas] = useState([]);
    const [formData, setFormData] = useState({
        internacaoId: '',
        pacienteId: '',
        tipo_visita: 'E',
        nome_medico: nomeMedico,
        email_medico: emailMedico
    });

    const [loading, setLoading] = useState(false);
    const [loadingPacientes, setLoadingPacientes] = useState(false);
    const [error, setError] = useState('');

    // Combobox de busca de paciente
    const [busca, setBusca] = useState('');
    const [dropdownAberto, setDropdownAberto] = useState(false);
    const [selecionado, setSelecionado] = useState(null);
    const comboboxRef = useRef(null);

    useEffect(() => {
        if (isOpen) {
            loadAdmissoesAtivas();
            setBusca('');
            setSelecionado(null);
            setDropdownAberto(false);
        }
    }, [isOpen]);

    // Fecha dropdown ao clicar fora
    useEffect(() => {
        const handleClickFora = (e) => {
            if (comboboxRef.current && !comboboxRef.current.contains(e.target)) {
                setDropdownAberto(false);
            }
        };
        document.addEventListener('mousedown', handleClickFora);
        return () => document.removeEventListener('mousedown', handleClickFora);
    }, []);

    const loadAdmissoesAtivas = async () => {
        setLoadingPacientes(true);
        try {
            const internacoes = await getInternacoes(true);
            const pacientes = await getPacientes();
            const pacientesMap = pacientes.reduce((acc, p) => ({ ...acc, [p.id]: p }), {});
            const completas = internacoes
                .map(int => ({
                    ...int,
                    paciente: pacientesMap[int.pacienteId] || { nome: 'Desconhecido', prontuario: '-' }
                }))
                .sort((a, b) => (a.paciente.nome || '').localeCompare(b.paciente.nome || '', 'pt-BR'));
            setAdmissoesAtivas(completas);
        } catch (err) {
            setError('Falha ao carregar lista de leitos ocupados.');
        } finally {
            setLoadingPacientes(false);
        }
    };

    // Lista filtrada conforme o que foi digitado
    const opcoesFiltradas = useMemo(() => {
        const termo = busca.trim().toLowerCase();
        if (!termo) return admissoesAtivas;
        return admissoesAtivas.filter(adm =>
            adm.paciente.nome.toLowerCase().includes(termo) ||
            adm.numero_registro.toLowerCase().includes(termo)
        );
    }, [admissoesAtivas, busca]);

    const handleSelecionarAdmissao = (adm) => {
        setSelecionado(adm);
        setBusca(adm.paciente.nome);
        setDropdownAberto(false);
        setFormData(prev => ({
            ...prev,
            internacaoId: adm.id,
            pacienteId: adm.pacienteId
        }));
    };

    const handleBuscaChange = (e) => {
        setBusca(e.target.value);
        setSelecionado(null);
        setFormData(prev => ({ ...prev, internacaoId: '', pacienteId: '' }));
        setDropdownAberto(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (!formData.internacaoId || !formData.pacienteId) {
            setError('Selecione um paciente internado da lista.');
            return;
        }

        setLoading(true);
        try {
            await createVisita({ ...formData, status_pagamento: 'Pendente' });
            setFormData({ ...formData, internacaoId: '', pacienteId: '', tipo_visita: 'E', nome_medico: nomeMedico, email_medico: emailMedico });
            setBusca('');
            setSelecionado(null);
            onSuccess();
            onClose();
        } catch (err) {
            setError(err.message || 'Erro ao salvar visita.');
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center sm:p-4 z-50">
            <div className="bg-white rounded-t-2xl sm:rounded-2xl shadow-xl w-full sm:max-w-md max-h-[95vh] overflow-y-auto">
                <div className="flex justify-between items-center p-6 border-b border-gray-100 bg-blue-50">
                    <h2 className="text-xl font-bold text-blue-800">Registrar Visita Diária</h2>
                    <button onClick={onClose} className="text-blue-400 hover:text-blue-600 transition-colors">
                        <X size={24} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-5">
                    {error && (
                        <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm">{error}</div>
                    )}

                    {/* Combobox de busca de paciente */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Paciente Internado (Leito Ativo)
                        </label>
                        {loadingPacientes ? (
                            <div className="p-2 text-sm text-gray-500">Carregando mapa de leitos...</div>
                        ) : (
                            <div className="relative" ref={comboboxRef}>
                                <div className="relative">
                                    <Search size={16} className="absolute left-3 top-2.5 text-gray-400 pointer-events-none" />
                                    <input
                                        type="text"
                                        placeholder="Digite o nome ou nº de registro..."
                                        value={busca}
                                        onChange={handleBuscaChange}
                                        onFocus={() => setDropdownAberto(true)}
                                        className="w-full pl-9 pr-9 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm"
                                        autoComplete="off"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setDropdownAberto(v => !v)}
                                        className="absolute right-2 top-2 text-gray-400 hover:text-gray-600"
                                        tabIndex={-1}
                                    >
                                        <ChevronDown size={16} />
                                    </button>
                                </div>

                                {/* Dropdown */}
                                {dropdownAberto && (
                                    <ul className="absolute z-50 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-52 overflow-y-auto">
                                        {opcoesFiltradas.length === 0 ? (
                                            <li className="px-4 py-3 text-sm text-gray-400 text-center">Nenhum paciente encontrado</li>
                                        ) : (
                                            opcoesFiltradas.map(adm => (
                                                <li
                                                    key={adm.id}
                                                    onMouseDown={() => handleSelecionarAdmissao(adm)}
                                                    className="px-4 py-2.5 text-sm cursor-pointer hover:bg-blue-50 flex items-center justify-between gap-2"
                                                >
                                                    <span className="font-medium text-gray-800 truncate">{adm.paciente.nome}</span>
                                                    <span className="text-xs text-blue-500 shrink-0">Reg: {adm.numero_registro}</span>
                                                </li>
                                            ))
                                        )}
                                    </ul>
                                )}

                                {/* Paciente selecionado */}
                                {selecionado && (
                                    <p className="text-xs text-green-600 mt-1 font-medium">
                                        ✓ Reg. {selecionado.numero_registro} selecionado
                                    </p>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Radio Group: Tipo de Visita */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Tipo de Visita Clínico-Nutricional</label>
                        <div className="grid grid-cols-3 gap-3">
                            {[
                                { value: 'E', label: 'Enteral (E)', active: 'bg-blue-50 border-blue-500 ring-1 ring-blue-500' },
                                { value: 'P', label: 'Parenteral (P)', active: 'bg-purple-50 border-purple-500 ring-1 ring-purple-500' },
                                { value: 'EP', label: 'Ambas (EP)', active: 'bg-indigo-50 border-indigo-500 ring-1 ring-indigo-500' },
                            ].map(({ value, label, active }) => (
                                <label
                                    key={value}
                                    className={`cursor-pointer border rounded-lg p-3 text-center transition-all ${formData.tipo_visita === value ? active : 'hover:bg-gray-50 border-gray-200'}`}
                                >
                                    <input
                                        type="radio" name="tipoVisita" value={value} className="sr-only"
                                        checked={formData.tipo_visita === value}
                                        onChange={(e) => setFormData({ ...formData, tipo_visita: e.target.value })}
                                    />
                                    <span className="block font-medium text-gray-900 text-sm">{label}</span>
                                </label>
                            ))}
                        </div>
                    </div>

                    <div className="pt-4 flex gap-3 justify-end border-t border-gray-100 mt-6 !pt-6">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-5 py-2 text-gray-600 font-medium hover:bg-gray-100 rounded-lg transition-colors"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={loading || loadingPacientes}
                            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium transition-colors disabled:opacity-70 shadow-sm"
                        >
                            {loading ? 'Registrando...' : 'Confirmar Visita'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
