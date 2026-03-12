import React, { useState } from 'react';
import Papa from 'papaparse';
import { collection, addDoc, getDocs, doc, setDoc, query, where, deleteDoc } from 'firebase/firestore';
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

    const startImport = async () => {
        if (!pacientesFile || !visitasFile) {
            addLog("ERRO: Selecione os dois arquivos CSV primeiro.");
            return;
        }

        setIsImporting(true);
        setLogs(["Iniciando processo de importação..."]);

        try {
            // 1. LER CSVs
            addLog("Lendo arquivo de Pacientes...");
            const pacientesCSV = await parseCSV(pacientesFile);
            addLog(`Total de linhas no CSV de Pacientes: ${pacientesCSV.length}`);

            addLog("Lendo arquivo de Visitas...");
            const visitasCSV = await parseCSV(visitasFile);
            addLog(`Total de linhas no CSV de Visitas: ${visitasCSV.length}`);

            // 2. IMPORTAR PACIENTES E CRIAR INTERNAÇÕES
            addLog("Processando Pacientes e criando Internações (Admissões)...");
            const mapPacienteIdAppSheetToInternacaoId = {}; // ID Antigo -> Novo ID da Internação
            const prontuariosProcessados = {}; // Para evitar duplicar pacientes na coleção base

            for (const row of pacientesCSV) {
                // row.ID_Paciente (ID antigo), row.Registro (Prontuario), row.Nome, row.Status, row."Data Inicio", row."Data Alta"

                let prontuarioFormatado = "";
                if (row.Registro && row.Registro.trim() !== '') {
                    // Remover tudo que não for número usando regex, o CSV tem aspas e virgulas em alguns registros
                    prontuarioFormatado = row.Registro.replace(/[^0-9]/g, '');
                } else {
                    prontuarioFormatado = `LEGADO-${row.ID_Paciente}`;
                }

                // 2.1 Criar ou achar o Paciente (Identidade Única)
                let pacienteFirestoreId = "";

                if (!prontuariosProcessados[prontuarioFormatado]) {
                    const newPacienteRef = await addDoc(collection(db, 'pacientes'), {
                        prontuario: prontuarioFormatado,
                        nome: row.Nome || 'Sem Nome',
                        rg: '',
                        createdAt: new Date().toISOString()
                    });
                    pacienteFirestoreId = newPacienteRef.id;
                    prontuariosProcessados[prontuarioFormatado] = pacienteFirestoreId;
                } else {
                    // É uma readmissão no CSV antigo (mesmo prontuário), precisamos achar o ID do paciente que já criamos
                    pacienteFirestoreId = prontuariosProcessados[prontuarioFormatado];
                }

                // 2.2 Criar a Internação amarrada ao paciente

                // Formatar datas DD/MM/YYYY para ISO
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
                    pacienteId: pacienteFirestoreId,
                    numero_registro: prontuarioFormatado,
                    quarto_leito: 'Importado',
                    convenio: 'Legado',
                    hospital: 'Legado',
                    data_admissao: dataAdmissaoIso,
                    status: statusInternacao,
                    data_alta: dataAltaIso,
                    createdAt: new Date().toISOString(),
                    historico: [{
                        tipo: 'admissão (importação)',
                        data: dataAdmissaoIso
                    }]
                });

                // Mapear o ID_Paciente do AppSheet para o ID da Internacao Firestore
                mapPacienteIdAppSheetToInternacaoId[row.ID_Paciente] = {
                    internacaoId: newInternacaoRef.id,
                    pacienteId: pacienteFirestoreId
                };
            }

            addLog("Pacientes e Internações importados com sucesso!");
            addLog(`Total mapeado: ${Object.keys(mapPacienteIdAppSheetToInternacaoId).length}`);

            // 3. IMPORTAR VISITAS
            addLog("Processando e importando Visitas...");
            let visitasImportadas = 0;
            let visitasIgnoradas = 0;

            let batchPromises = [];
            const BATCH_SIZE = 50;

            for (const row of visitasCSV) {
                // row.ID_Visita, row.Data_Hora, row.Nome_Medico_Visitador, row.ID_Paciente, row."Tipo_Visita (E, P, EP)", row.Status_Pagamento, row.Data_Pagamento

                const authKeys = mapPacienteIdAppSheetToInternacaoId[row.ID_Paciente];
                if (!authKeys) {
                    visitasIgnoradas++;
                    continue;
                }

                // Converter Data Hora DD/MM/YYYY HH:mm:ss ou DD/MM/YYYY
                // Se não vier data ou for inválida, colocar uma data bem antiga para não poluir o dashboard diário de hoje
                let dataVisitaIso = new Date('2000-01-01T00:00:00').toISOString();
                if (row.Data_Hora && row.Data_Hora.trim() !== '') {
                    const parts = row.Data_Hora.trim().split(' ');
                    const datePart = parts[0];
                    const timePart = parts.length > 1 ? parts[1] : '00:00:00'; // Default time if missing

                    if (datePart.includes('/')) {
                        const [d, m, y] = datePart.split('/');
                        if (d && m && y && y.length === 4) {
                            dataVisitaIso = new Date(`${y}-${m}-${d}T${timePart}`).toISOString();
                        }
                    }
                }

                // Converter Data Pagamento
                let dataPagamentoIso = null;
                if (row.Data_Pagamento) {
                    const [d, m, y] = row.Data_Pagamento.split('/');
                    dataPagamentoIso = new Date(`${y}-${m}-${d}T00:00:00`).toISOString();
                }

                // Converter Status
                let statusPagamentoFormatado = 'Pendente';
                if (row.Status_Pagamento === 'Pago' || row.Status_Pagamento === 'Pago ') statusPagamentoFormatado = 'Pago';
                if (row.Status_Pagamento === 'Glosa' || row.Status_Pagamento === 'Glosa ') statusPagamentoFormatado = 'Glosa';

                const p = addDoc(collection(db, 'visitas'), {
                    internacaoId: authKeys.internacaoId,
                    pacienteId: authKeys.pacienteId,
                    data_hora: dataVisitaIso,
                    nome_medico: row.Nome_Medico_Visitador || 'Migração',
                    tipo_visita: row['Tipo_Visita (E, P, EP)'] || 'E',
                    status_pagamento: statusPagamentoFormatado,
                    data_pagamento: dataPagamentoIso,
                    obs_pagamento: row.Obs_Pagamento || ''
                }).then(() => {
                    visitasImportadas++;
                    if (visitasImportadas % 200 === 0) {
                        addLog(`... ${visitasImportadas} visitas importadas ...`);
                    }
                });

                batchPromises.push(p);

                if (batchPromises.length >= BATCH_SIZE) {
                    await Promise.all(batchPromises);
                    batchPromises = [];
                }
            }

            if (batchPromises.length > 0) {
                await Promise.all(batchPromises);
            }

            addLog(`Importação concluída! Visitas: ${visitasImportadas} criadas, ${visitasIgnoradas} ignoradas (orfãs).`);

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
                message="ATENÇÃO: Isso apagará TODOS os pacientes, admissões e visitas do banco de dados. Esta ação é irreversível. Tem certeza?"
                variant="danger"
                confirmLabel="Sim, Apagar Tudo"
                onConfirm={() => { setConfirmLimpar(false); clearDatabase(); }}
                onCancel={() => setConfirmLimpar(false)}
            />

            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <h1 className="text-2xl font-bold text-gray-800 mb-4">Migração de Dados (CSV para Firebase)</h1>
                <p className="text-gray-600 mb-6">
                    Selecione os arquivos gerados pelo AppSheet. O script lerá tudo no navegador e fará os disparos de escrita no Firestore autenticado como você.
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
                        {isImporting ? 'Importando... (Aguarde)' : 'Iniciar Migração'}
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
