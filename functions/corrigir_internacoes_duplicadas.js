/**
 * corrigir_internacoes_duplicadas.js
 * Script de uso único para detectar e corrigir pacientes com mais de uma
 * internação ativa — mantém a mais recente e dá alta nas demais.
 *
 * Como usar:
 *   node corrigir_internacoes_duplicadas.js
 *   (requer serviceAccountKey.json na mesma pasta)
 */

const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const readline = require('readline');
const path = require('path');
const fs = require('fs');

const KEY_PATH = path.join(__dirname, 'serviceAccountKey.json');

function confirmar(pergunta) {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    return new Promise(resolve => {
        rl.question(pergunta, resposta => {
            rl.close();
            resolve(resposta.trim().toLowerCase());
        });
    });
}

async function main() {
    if (!fs.existsSync(KEY_PATH)) {
        console.error('\n❌ serviceAccountKey.json não encontrado em functions/');
        process.exit(1);
    }

    initializeApp({ credential: cert(KEY_PATH) });
    const db = getFirestore();

    console.log('\n🔍 Buscando internações ativas...\n');

    // Carrega todas as internações ativas
    const snap = await db.collection('internacoes').where('status', '==', 'ativo').get();
    const internacoes = snap.docs.map(d => ({ id: d.id, ...d.data() }));

    // Carrega pacientes para exibir nomes
    const pacSnap = await db.collection('pacientes').get();
    const pacientes = {};
    pacSnap.forEach(d => { pacientes[d.id] = d.data(); });

    // Agrupa por pacienteId
    const porPaciente = {};
    internacoes.forEach(int => {
        if (!porPaciente[int.pacienteId]) porPaciente[int.pacienteId] = [];
        porPaciente[int.pacienteId].push(int);
    });

    // Filtra só os que têm duplicata
    const duplicatas = Object.entries(porPaciente).filter(([, ints]) => ints.length > 1);

    if (duplicatas.length === 0) {
        console.log('✅ Nenhuma duplicata encontrada. Tudo certo!');
        process.exit(0);
    }

    console.log(`⚠️  ${duplicatas.length} paciente(s) com mais de uma internação ativa:\n`);

    const paraDesativar = [];

    duplicatas.forEach(([pacienteId, ints]) => {
        const nome = pacientes[pacienteId]?.nome || 'Nome desconhecido';
        // Ordena por data_admissao decrescente — mais recente primeiro
        ints.sort((a, b) => (b.data_admissao || '').localeCompare(a.data_admissao || ''));
        const maisRecente = ints[0];
        const antigas = ints.slice(1);

        console.log(`  📋 ${nome}`);
        console.log(`     ✅ Manter: Reg. ${maisRecente.numero_registro} (adm: ${maisRecente.data_admissao})`);
        antigas.forEach(int => {
            console.log(`     ❌ Dar alta: Reg. ${int.numero_registro} (adm: ${int.data_admissao})`);
            paraDesativar.push(int);
        });
        console.log('');
    });

    console.log(`Total: ${paraDesativar.length} internação(ões) serão marcadas como alta.\n`);

    const resposta = await confirmar('Deseja aplicar as correções? (sim/não): ');
    if (resposta !== 'sim') {
        console.log('\n⛔ Operação cancelada. Nenhum dado foi alterado.');
        process.exit(0);
    }

    const agora = new Date().toISOString();
    const batch = db.batch();
    paraDesativar.forEach(int => {
        const ref = db.collection('internacoes').doc(int.id);
        batch.update(ref, {
            status: 'alta',
            data_alta: agora,
            historico: [...(int.historico || []), { tipo: 'alta', data: agora, observacao: 'Corrigido: duplicata removida automaticamente' }]
        });
    });

    await batch.commit();
    console.log(`\n✅ ${paraDesativar.length} internação(ões) corrigida(s) com sucesso!`);
}

main().catch(err => {
    console.error('\n❌ Erro:', err.message);
    process.exit(1);
});
