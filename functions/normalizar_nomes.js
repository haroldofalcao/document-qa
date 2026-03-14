/**
 * normalizar_nomes.js
 * Script de uso único para normalizar nomes no Firestore:
 *   - Remove acentos (João → Joao)
 *   - Title case (joao das couves → Joao Das Couves)
 *   - Espaços múltiplos → espaço único
 *
 * Como usar:
 *   1. Baixe a chave de serviço do Firebase Console e salve como serviceAccountKey.json nesta pasta
 *   2. No terminal, entre na pasta functions/
 *   3. Execute: node normalizar_nomes.js
 */

const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const readline = require('readline');
const path = require('path');
const fs = require('fs');

// --- Configuração ---
const KEY_PATH = path.join(__dirname, 'serviceAccountKey.json');

// Coleções e campos a normalizar
const ALVOS = [
  { colecao: 'pacientes', campo: 'nome' },
  { colecao: 'visitas',   campo: 'nome_medico' },
  { colecao: 'medicos',   campo: 'nome' },
];

// Partículas que ficam em minúsculo em nomes brasileiros
const PARTICULAS = new Set(['da', 'de', 'do', 'das', 'dos', 'e']);

// --- Função de normalização ---
function normalizar(str) {
  if (!str || typeof str !== 'string') return str;
  if (str.includes('@')) return str; // e-mails não são normalizados
  const palavras = str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')   // remove acentos
    .replace(/\s+/g, ' ')              // colapsa espaços múltiplos
    .trim()
    .split(' ');

  return palavras
    .map((palavra, i) => {
      const lower = palavra.toLowerCase();
      // Primeira palavra sempre maiúscula; partículas no meio ficam minúsculas
      if (i > 0 && PARTICULAS.has(lower)) return lower;
      // Capitaliza primeira letra e também a letra após apóstrofo (ex: D'Avila)
      return lower
        .replace(/^(.)/, c => c.toUpperCase())
        .replace(/'(.)/g, (_, c) => "'" + c.toUpperCase());
    })
    .join(' ');
}

// --- Utilitário: confirmar no terminal ---
function confirmar(pergunta) {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise(resolve => {
    rl.question(pergunta, resposta => {
      rl.close();
      resolve(resposta.trim().toLowerCase());
    });
  });
}

// --- Script principal ---
async function main() {
  // Verifica chave de serviço
  if (!fs.existsSync(KEY_PATH)) {
    console.error('\n❌ Arquivo serviceAccountKey.json não encontrado em functions/');
    console.error('   Baixe em: Firebase Console → Configurações do Projeto → Contas de serviço → Gerar nova chave privada');
    process.exit(1);
  }

  initializeApp({ credential: cert(KEY_PATH) });
  const db = getFirestore();

  console.log('\n🔍 Buscando registros no Firestore...\n');

  // Coleta todas as mudanças necessárias
  const mudancas = [];

  for (const { colecao, campo } of ALVOS) {
    const snap = await db.collection(colecao).get();
    let count = 0;
    snap.forEach(docSnap => {
      const valorAtual = docSnap.get(campo);
      const valorNovo = normalizar(valorAtual);
      if (valorAtual && valorAtual !== valorNovo) {
        mudancas.push({ colecao, campo, id: docSnap.id, de: valorAtual, para: valorNovo });
        count++;
      }
    });
    console.log(`  ${colecao}.${campo}: ${snap.size} registros lidos, ${count} precisam de ajuste`);
  }

  if (mudancas.length === 0) {
    console.log('\n✅ Nenhum registro precisa de alteração. Tudo já está normalizado!');
    process.exit(0);
  }

  // Mostra preview
  console.log(`\n📋 Preview das ${mudancas.length} alterações:\n`);
  mudancas.forEach(({ colecao, campo, de, para }) => {
    console.log(`  [${colecao}] "${de}"  →  "${para}"`);
  });

  // Pede confirmação
  const resposta = await confirmar(`\nDeseja aplicar as ${mudancas.length} alterações? (sim/não): `);
  if (resposta !== 'sim') {
    console.log('\n⛔ Operação cancelada. Nenhum dado foi alterado.');
    process.exit(0);
  }

  // Aplica em batches de 500 (limite do Firestore)
  console.log('\n💾 Aplicando alterações...');
  const BATCH_SIZE = 500;
  for (let i = 0; i < mudancas.length; i += BATCH_SIZE) {
    const lote = mudancas.slice(i, i + BATCH_SIZE);
    const batch = db.batch();
    lote.forEach(({ colecao, campo, id, para }) => {
      const ref = db.collection(colecao).doc(id);
      batch.update(ref, { [campo]: para });
    });
    await batch.commit();
    console.log(`  Lote ${Math.floor(i / BATCH_SIZE) + 1}: ${lote.length} registros atualizados`);
  }

  console.log('\n✅ Normalização concluída com sucesso!');
}

main().catch(err => {
  console.error('\n❌ Erro durante a execução:', err.message);
  process.exit(1);
});
