import React, { useState, useEffect } from 'react';
import { getPacienteByProntuario, getPacientes } from '../services/pacientesService';
import { createInternacao, updateInternacao } from '../services/internacoesService';
import { writeBatch, doc, collection } from 'firebase/firestore';
import { db } from '../services/firebase';
import { X, Search, CheckCircle, AlertTriangle } from 'lucide-react';

export default function AdmissaoForm({ isOpen, onClose, onSuccess, admissaoParaEditar }) {
    const [formData, setFormData] = useState({
        prontuario: '',
        nome: '',
        numero_registro: '',
        data_admissao: new Date().toISOString().split('T')[0]
    });

    const [pacienteEncontrado, setPacienteEncontrado] = useState(null);
    const [todosPacientes, setTodosPacientes] = useState([]);
    const [duplicatasSuspeitas, setDuplicatasSuspeitas] = useState([]);
    const [loading, setLoading] = useState(false);
    const [searching, setSearching] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (isOpen) {
            // Carrega todos os pacientes para verificação de duplicatas
            getPacientes().then(setTodosPacientes).catch(() => {});

            if (admissaoParaEditar) {
                setFormData({
                    prontuario: admissaoParaEditar.paciente.prontuario,
                    nome: admissaoParaEditar.paciente.nome,
                    numero_registro: admissaoParaEditar.numero_registro,
                    data_admissao: admissaoParaEditar.data_admissao.split('T')[0]
                });
                setPacienteEncontrado(admissaoParaEditar.paciente);
            } else {
                setFormData({
                    prontuario: '',
                    nome: '',
                    numero_registro: '',
                    data_admissao: new Date().toISOString().split('T')[0]
                });
                setPacienteEncontrado(null);
            }
            setDuplicatasSuspeitas([]);
        }
    }, [admissaoParaEditar, isOpen]);

    if (!isOpen) return null;

    // Buscar paciente ao sair do campo Prontuário
    const handleProntuarioBlur = async () => {
        if (!formData.prontuario) return;

        setSearching(true);
        setError('');
        try {
            const paciente = await getPacienteByProntuario(formData.prontuario);
            if (paciente) {
                setPacienteEncontrado(paciente);
                setFormData(prev => ({ ...prev, nome: paciente.nome }));
                setDuplicatasSuspeitas([]);
            } else {
                setPacienteEncontrado(null);
                if (pacienteEncontrado) {
                    setFormData(prev => ({ ...prev, nome: '' }));
                }
            }
        } catch (err) {
            console.error('Erro ao buscar paciente:', err);
        } finally {
            setSearching(false);
        }
    };

    // Verificar duplicatas ao sair do campo Nome
    const handleNomeBlur = () => {
        // Só verifica se é cadastro novo (sem paciente encontrado por prontuário)
        if (pacienteEncontrado || admissaoParaEditar) return;

        const nomeDigitado = formData.nome.trim().toLowerCase();
        if (nomeDigitado.length < 3) return;

        // Quebra o nome em palavras com 3+ letras e busca qualquer correspondência
        const palavras = nomeDigitado.split(/\s+/).filter(p => p.length >= 3);
        const similares = todosPacientes.filter(p => {
            const nomeExistente = (p.nome || '').toLowerCase();
            return palavras.some(palavra => nomeExistente.includes(palavra));
        });

        setDuplicatasSuspeitas(similares);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            if (!formData.prontuario || !formData.nome || !formData.numero_registro || !formData.data_admissao) {
                throw new Error('Por favor, preencha todos os campos.');
            }

            if (admissaoParaEditar) {
                // Edição: apenas atualiza a internação existente
                await updateInternacao(admissaoParaEditar.id, {
                    numero_registro: formData.numero_registro,
                    data_admissao: formData.data_admissao
                });
            } else if (pacienteEncontrado && pacienteEncontrado.id) {
                // Paciente já existe: cria só a internação
                await createInternacao({
                    pacienteId: pacienteEncontrado.id,
                    numero_registro: formData.numero_registro,
                    data_admissao: formData.data_admissao
                });
            } else {
                // Novo paciente: cria paciente + internação atomicamente (batch)
                // Se uma falhar, nenhuma é salva
                const batch = writeBatch(db);

                const pacienteRef = doc(collection(db, 'pacientes'));
                batch.set(pacienteRef, {
                    prontuario: Number(formData.prontuario),
                    nome: formData.nome,
                    createdAt: new Date().toISOString()
                });

                const internacaoRef = doc(collection(db, 'internacoes'));
                batch.set(internacaoRef, {
                    pacienteId: pacienteRef.id,
                    numero_registro: formData.numero_registro,
                    data_admissao: formData.data_admissao,
                    status: 'ativo',
                    historico: [{ tipo: 'admissão', data: new Date().toISOString() }],
                    createdAt: new Date().toISOString()
                });

                await batch.commit();
            }

            setFormData({ prontuario: '', nome: '', numero_registro: '', data_admissao: new Date().toISOString().split('T')[0] });
            setPacienteEncontrado(null);
            setDuplicatasSuspeitas([]);
            onSuccess();
            onClose();
        } catch (err) {
            setError(err.message || 'Erro desconhecido ao salvar admissão');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center sm:p-4 z-50">
            <div className="bg-white rounded-t-2xl sm:rounded-2xl shadow-xl w-full sm:max-w-lg max-h-[95vh] overflow-y-auto">

                <div className="flex justify-between items-center p-6 border-b border-gray-100">
                    <h2 className="text-xl font-bold text-gray-800">
                        {admissaoParaEditar ? 'Editar Internação' : 'Nova Admissão / Internação'}
                    </h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
                        <X size={24} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    {error && (
                        <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm">{error}</div>
                    )}

                    <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-100 space-y-4">
                        <h3 className="font-semibold text-blue-900 flex items-center gap-2">
                            1. Identidade do Paciente
                        </h3>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Prontuário (Busca Automática)</label>
                            <div className="relative">
                                <input
                                    type="number"
                                    required
                                    disabled={!!admissaoParaEditar}
                                    className={`w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg outline-none transition-shadow ${admissaoParaEditar ? 'bg-gray-100 text-gray-600' : 'focus:ring-2 focus:ring-blue-500 focus:border-blue-500'}`}
                                    value={formData.prontuario}
                                    onChange={(e) => setFormData({ ...formData, prontuario: e.target.value })}
                                    onBlur={handleProntuarioBlur}
                                    placeholder="Digite o prontuário para buscar..."
                                />
                                {searching ? (
                                    <div className="absolute left-3 top-2.5 h-5 w-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                                ) : (
                                    <Search className="absolute left-3 top-2.5 text-gray-400" size={20} />
                                )}
                            </div>
                            {pacienteEncontrado && (
                                <p className="text-sm text-green-600 mt-1 flex items-center gap-1">
                                    <CheckCircle size={14} /> Paciente localizado no sistema.
                                </p>
                            )}
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="col-span-2">
                                <label className="block text-sm font-medium text-gray-700 mb-1">Nome Completo</label>
                                <input
                                    type="text"
                                    required
                                    disabled={!!pacienteEncontrado}
                                    className={`w-full px-4 py-2 border border-gray-300 rounded-lg outline-none transition-colors ${pacienteEncontrado ? 'bg-gray-100 text-gray-600 border-transparent' : 'focus:ring-2 focus:ring-blue-500 focus:border-blue-500'}`}
                                    value={formData.nome}
                                    onChange={(e) => {
                                        setFormData({ ...formData, nome: e.target.value });
                                        // Limpa alerta ao editar
                                        if (duplicatasSuspeitas.length > 0) setDuplicatasSuspeitas([]);
                                    }}
                                    onBlur={handleNomeBlur}
                                    placeholder="Ex: Maria da Silva"
                                />

                                {/* Alerta de possível duplicata */}
                                {duplicatasSuspeitas.length > 0 && (
                                    <div className="mt-2 bg-amber-50 border border-amber-300 rounded-lg p-3">
                                        <div className="flex items-start gap-2">
                                            <AlertTriangle size={16} className="text-amber-600 mt-0.5 shrink-0" />
                                            <div>
                                                <p className="text-sm font-semibold text-amber-800">
                                                    Possível duplicata — {duplicatasSuspeitas.length} paciente{duplicatasSuspeitas.length > 1 ? 's' : ''} com nome semelhante:
                                                </p>
                                                <ul className="mt-1 space-y-0.5">
                                                    {duplicatasSuspeitas.slice(0, 5).map(p => (
                                                        <li key={p.id} className="text-xs text-amber-700">
                                                            <span className="font-medium">{p.nome}</span>
                                                            {p.prontuario ? <span className="text-amber-500"> — Pront. {p.prontuario}</span> : null}
                                                        </li>
                                                    ))}
                                                </ul>
                                                <p className="text-xs text-amber-600 mt-1">
                                                    Se for o mesmo paciente, busque pelo prontuário acima para evitar duplicidade.
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>

                        </div>
                    </div>

                    <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 space-y-4">
                        <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                            2. Dados da Internação Atual
                        </h3>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Nº Registro Atendimento</label>
                                <input
                                    type="text"
                                    required
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-shadow"
                                    value={formData.numero_registro}
                                    onChange={(e) => setFormData({ ...formData, numero_registro: e.target.value })}
                                    placeholder="Ex: 509283"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Data de Admissão</label>
                                <input
                                    type="date"
                                    required
                                    max={new Date().toISOString().split('T')[0]}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-shadow"
                                    value={formData.data_admissao}
                                    onChange={(e) => setFormData({ ...formData, data_admissao: e.target.value })}
                                />
                            </div>
                        </div>
                    </div>

                    <div className="pt-2 flex gap-3 justify-end">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-5 py-2 text-gray-600 font-medium hover:bg-gray-100 rounded-lg transition-colors"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={loading || searching}
                            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium transition-colors disabled:opacity-70"
                        >
                            {loading ? 'Processando...' : (admissaoParaEditar ? 'Salvar Alterações' : 'Confirmar Admissão')}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
