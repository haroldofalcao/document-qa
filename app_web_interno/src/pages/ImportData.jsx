import React, { useState } from 'react';
import Papa from 'papaparse';
import { collection, addDoc, getDocs, doc, query, where, deleteDoc } from 'firebase/firestore';
import { db } from '../services/firebase';
import ConfirmModal from '../components/ConfirmModal';

export default function ImportData() {
    const [pacientesFile, setPacientesFile] = useState(null);
    const [visitasFile, setVisitasFile] = useState(null);
    const [logs, setLogs] = useState([]);
    const [isImporting, setIsImporting] = useState(false);
    const [isClearing, setIsClearing] = useState(false);
    const [confirmLimpar, setConfirmLimpar] = useState(false);

    const addLog = (msg) => {
        setLogs(prev => [...prev, `${new Date().toLocaleTimeString()} - ${msg}`]);
    };

    const parseCSV = (file) => {
        return new Promise((resolve, reject) => {
            Papa.parse(file, {
                header: true,
                skipEmptyLines: true,
                complete: (results) => resolve(results.data),
                error: (error) => reject(error)
            });
        });
    };

    const clearDatabase = async () => {
        setIsClearing(true);
        setLogs(["Limpando banco de dados... isso pode demorar um pouco."]);

        try {
            const colecoes = ['visitas', 'internacoes', 'pacientes'];
            for (const colName of colecoes) {
                addLog(`Limpando coleção: ${colName}...`);
                const snap = await getDocs(collection(db, colName));
                let count = 0;
                const deletePromises = [];
                snap.forEach(docSnap => {
                    deletePromises.push(deleteDoc(doc(db, colName, docSnap.id)));
                    count++;
                });
                await Promise.all(deletePromises);
                addLog(`${count} documentos apagados em ${colName}.`);
            }
            addLog("Banco de dados completamente limpo! Agora você pode iniciar a importação.");
        } catch (error) {
            console.error(error);
            addLog(`ERRO ao limpar banco: ${error.message}`);
        } finally {
            setIsClearing(false);
        }
    };

    // Retorna "YYYY-MM-DD" no fuso de Brasília (UTC-3)
    const getTodayBRT = () => {
        const brtNow = new Date(Date.now() - 3 * 60 * 60 * 1000);
        return brtNow.toISOString().split('T')[0];
    };

    // Parseia "DD/MM/YYYY HH:mm:ss" ou "DD/MM/YYYY" → { iso, dateBRT }
    const parseCsvDataHora = (str) => {
        if (!str || str.trim() === '') return null;
        const parts = str.trim().split(' ');
        const datePart = parts[0];
        const timePart = parts[1] || '00:00:00';
        if (!datePart.includes('/')) return null;
        const [d, m, y] = datePart.split('/');
        if (!d || !m || !y || y.length !== 4) return null;
        return {
            iso: new Date(`${y}-${m}-${d}T${timePart}`).toISOString(),
            dateBRT: `${y}-${m}-${d}`,
        };
    };

    const startImport = async () => {
        if (!pacientesFile || !visitasFile) {
            addLog("ERRO: Selecione os dois arquivos CSV primeiro.");
            return;
        }

        setIsImporting(true);
        setLogs(["Iniciando importação incremental..."]);

        try {
            // 1. LER CSVs
            addLog("Lendo arquivos CSV...");
            const pacientesCSV = await parseCSV(pacientesFile);
            const visitasCSV = await parseCSV(visitasFile);
            addLog(`CSV carregado: ${pacientesCSV.length} pacientes, ${visitasCSV.length} visitas no total.`);

            // 2. CARREGAR INTERNAÇÕES EXISTENTES DO FIRESTORE
            addLog("Carregando internações existentes do Firestore...");
            const internacoesSnap = await getDocs(collection(db, 'internacoes'));
            const registroToInternacao = {}; // numero_registro → { internacaoId, pacienteId }
            internacoesSnap.forEach(docSnap => {
                const data = docSnap.data();
                if (data.numero_registro) {
                    registroToInternacao[data.numero_registro] = {
                        internacaoId: docSnap.id,
                        pacienteId: data.pacienteId,
                    };
                }
            });
            addLog(`${Object.keys(registroToInternacao).length} internações já existentes no Firestore.`);

            // 3. CARREGAR VISITAS DE HOJE JÁ EXISTENTES (para deduplicação)
            const hoje = getTodayBRT();
            addLog(`Carregando visitas de hoje (${hoje}) já existentes no Firestore...`);
            // BRT midnight = UTC 03:00; BRT 23:59 = UTC next day 02:59
            const startUTC = `${hoje}T03:00:00.000Z`;
            const endUTC = new Date(new Date(startUTC).getTime() + 24 * 60 * 60 * 1000).toISOString();
            const visitasHojeSnap = await getDocs(query(
                collection(db, 'visitas'),
                where('data_hora', '>=', startUTC),
                where('data_hora', '<', endUTC)
            ));
            const visitasExistentes = new Set(); // "internacaoId|data_hora"
            visitasHojeSnap.forEach(docSnap => {
                const v = docSnap.data();
                visitasExistentes.add(`${v.internacaoId}|${v.data_hora}`);
            });
            addLog(`${visitasExistentes.size} visitas de hoje já registradas no Firestore.`);

            // 4. PROCESSAR CSV DE PACIENTES
            addLog("Processando pacientes...");
            const csvIdToInternacao = {}; // CSV ID_Paciente → { internacaoId, pacienteId }
            let pacientesCriados = 0;
            let pacientesExistentes = 0;

            for (const row of pacientesCSV) {
                const registro = row.Registro && row.Registro.trim() !== ''
                    ? row.Registro.replace(/[^0-9]/g, '')
                    : `LEGADO-${row.ID_Paciente}`;

                if (registroToInternacao[registro]) {
                    // Internação já existe — só mapeia o ID do CSV para o ID do Firestore
                    csvIdToInternacao[row.ID_Paciente] = registroToInternacao[registro];
                    pacientesExistentes++;
                } else {
                    // Paciente + internação novos — cria ambos
                    const newPacienteRef = await addDoc(collection(db, 'pacientes'), {
                        prontuario: '',
                        nome: row.Nome || 'Sem Nome',
                        createdAt: new Date().toISOString(),
                    });

                    let dataAdmissaoIso = new Date().toISOString();
                    if (row['Data Inicio']) {
                        const [d, m, y] = row['Data Inicio'].split('/');
                        dataAdmissaoIso = new Date(`${y}-${m}-${d}T00:00:00`).toISOString();
                    }

                    let statusInternacao = 'ativo';
                    let dataAltaIso = null;
                    if (row.Status === 'Alta' && row['Data Alta']) {
                        statusInternacao = 'alta';
                        const [d, m, y] = row['Data Alta'].split('/');
                        dataAltaIso = new Date(`${y}-${m}-${d}T00:00:00`).toISOString();
                    }

                    const newInternacaoRef = await addDoc(collection(db, 'internacoes'), {
                        pacienteId: newPacienteRef.id,
                        numero_registro: registro,
                        quarto_leito: '',
                        convenio: '',
                        hospital: '',
                        data_admissao: dataAdmissaoIso,
                        status: statusInternacao,
                        data_alta: dataAltaIso,
                        createdAt: new Date().toISOString(),
                        historico: [{ tipo: 'admissão (importação)', data: dataAdmissaoIso }],
                    });

                    const entry = { internacaoId: newInternacaoRef.id, pacienteId: newPacienteRef.id };
                    csvIdToInternacao[row.ID_Paciente] = entry;
                    registroToInternacao[registro] = entry;
                    pacientesCriados++;
                }
            }
            addLog(`Pacientes: ${pacientesCriados} novos criados, ${pacientesExistentes} já existentes (ignorados).`);

            // 5. PROCESSAR VISITAS DE HOJE
            addLog(`Filtrando visitas de hoje no CSV...`);
            const visitasDeHoje = visitasCSV.filter(row => {
                const parsed = parseCsvDataHora(row.Data_Hora);
                return parsed && parsed.dateBRT === hoje;
            });
            addLog(`${visitasDeHoje.length} visitas de hoje encontradas no CSV.`);

            let visitasCriadas = 0;
            let visitasDuplicadas = 0;
            let visitasOrfas = 0;
            let batchPromises = [];
            const BATCH_SIZE = 50;

            for (const row of visitasDeHoje) {
                const authKeys = csvIdToInternacao[row.ID_Paciente];
                if (!authKeys) { visitasOrfas++; continue; }

                const parsed = parseCsvDataHora(row.Data_Hora);
                const dataHoraIso = parsed ? parsed.iso : new Date().toISOString();
                const dedupeKey = `${authKeys.internacaoId}|${dataHoraIso}`;

                if (visitasExistentes.has(dedupeKey)) { visitasDuplicadas++; continue; }

                let statusPagamento = 'Pendente';
                const s = (row.Status_Pagamento || '').trim();
                if (s === 'Pago') statusPagamento = 'Pago';
                if (s === 'Glosa') statusPagamento = 'Glosa';

                let dataPagamentoIso = null;
                if (row.Data_Pagamento) {
                    const [d, m, y] = row.Data_Pagamento.split('/');
                    dataPagamentoIso = new Date(`${y}-${m}-${d}T00:00:00`).toISOString();
                }

                batchPromises.push(
                    addDoc(collection(db, 'visitas'), {
                        internacaoId: authKeys.internacaoId,
                        pacienteId: authKeys.pacienteId,
                        data_hora: dataHoraIso,
                        nome_medico: row.Nome_Medico_Visitador || '',
                        tipo_visita: row['Tipo_Visita (E, P, EP)'] || 'E',
                        status_pagamento: statusPagamento,
                        data_pagamento: dataPagamentoIso,
                        obs_pagamento: row.Obs_Pagamento || '',
                    }).then(() => { visitasCriadas++; })
                );

                if (batchPromises.length >= BATCH_SIZE) {
                    await Promise.all(batchPromises.splice(0, BATCH_SIZE));
                }
            }

            if (batchPromises.length > 0) await Promise.all(batchPromises);

            addLog(`Visitas: ${visitasCriadas} criadas, ${visitasDuplicadas} duplicatas ignoradas, ${visitasOrfas} órfãs ignoradas.`);
            addLog("✓ Importação incremental concluída!");

        } catch (error) {
            console.error(error);
            addLog(`ERRO FATAL: ${error.message}`);
        } finally {
            setIsImporting(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto p-6 space-y-6">
            <ConfirmModal
                isOpen={confirmLimpar}
                title="Limpar Banco de Dados"
                message="ATENÇÃO: Isso apagará TODOS os pacientes, admissões e visitas do banco de dados. Esta ação é irreversível."
                variant="danger"
                confirmLabel="Sim, Apagar Tudo"
                confirmPhrase="Desejo apagar tudo"
                onConfirm={() => { setConfirmLimpar(false); clearDatabase(); }}
                onCancel={() => setConfirmLimpar(false)}
            />

            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <h1 className="text-2xl font-bold text-gray-800 mb-4">Importação de Dados (CSV → Firebase)</h1>
                <p className="text-gray-600 mb-6">
                    Selecione os arquivos CSV exportados do AppSheet. O sistema criará apenas pacientes novos e importará somente as visitas de <strong>hoje</strong>. Registros já existentes serão ignorados automaticamente.
                </p>

                <div className="grid grid-cols-2 gap-6 mb-6">
                    <div className="border-2 border-dashed border-gray-300 p-4 rounded-lg">
                        <label className="block text-sm font-medium text-gray-700 mb-2">1. Arquivo de Pacientes (.csv)</label>
                        <input
                            type="file"
                            accept=".csv"
                            onChange={(e) => setPacientesFile(e.target.files[0])}
                            className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                        />
                    </div>
                    <div className="border-2 border-dashed border-gray-300 p-4 rounded-lg">
                        <label className="block text-sm font-medium text-gray-700 mb-2">2. Arquivo de Visitas (.csv)</label>
                        <input
                            type="file"
                            accept=".csv"
                            onChange={(e) => setVisitasFile(e.target.files[0])}
                            className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                        />
                    </div>
                </div>

                <div className="flex justify-between items-center">
                    <button
                        onClick={() => setConfirmLimpar(true)}
                        disabled={isImporting || isClearing}
                        className="bg-red-100 hover:bg-red-200 text-red-700 disabled:opacity-50 px-4 py-3 rounded-lg font-bold shadow-sm transition-all text-sm border border-red-200"
                    >
                        {isClearing ? 'Limpando Banco...' : 'Limpar Banco de Dados Base'}
                    </button>
                    <button
                        onClick={startImport}
                        disabled={isImporting || isClearing || !pacientesFile || !visitasFile}
                        className="bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white px-6 py-3 rounded-lg font-bold shadow-md transition-all"
                    >
                        {isImporting ? 'Importando... (Aguarde)' : 'Iniciar Importação'}
                    </button>
                </div>
            </div>

            {/* Console de Logs */}
            <div className="bg-gray-900 rounded-xl shadow-lg overflow-hidden">
                <div className="bg-gray-800 px-4 py-2 border-b border-gray-700">
                    <h3 className="text-gray-200 font-mono text-sm tracking-widest uppercase">Console de Progresso</h3>
                </div>
                <div className="p-4 h-96 overflow-y-auto font-mono text-sm">
                    {logs.length === 0 ? (
                        <p className="text-gray-500 italic">Aguardando início...</p>
                    ) : (
                        <ul className="space-y-1 text-green-400">
                            {logs.map((log, index) => (
                                <li key={index}>{'>>'} {log}</li>
                            ))}
                        </ul>
                    )}
                </div>
            </div>
        </div>
    );
}
