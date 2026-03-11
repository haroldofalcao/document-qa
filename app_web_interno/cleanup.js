import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, deleteDoc, doc, query, where } from 'firebase/firestore';
import fs from 'fs';
import path from 'path';

// Read firebase config manually from the project
try {
    // Configs are usually in src/services/firebase.js but we need it here for node execution
    // Let's read from the actual file
    const firebaseConfigStr = fs.readFileSync('c:/Users/harol/OneDrive/Documentos/DEV/Documentacao_AppSheet_Visitas_medicas/app_web_interno/src/services/firebase.js', 'utf8');

    // Quick and dirty extraction of the config object using regex
    const match = firebaseConfigStr.match(/const firebaseConfig = ({[\s\S]*?});/);

    if (match && match[1]) {
        // Eval is dangerous but okay here for a local script reading local code
        let firebaseConfig;
        eval(`firebaseConfig = ${match[1]}`);

        // Initialize Firebase
        const app = initializeApp(firebaseConfig);
        const db = getFirestore(app);

        async function cleanup() {
            console.log("Iniciando limpeza...");

            const visitasRef = collection(db, 'visitas');
            const q = query(visitasRef);
            const snapshot = await getDocs(q);

            let deletedCount = 0;

            // The mistaken imports all happened today around 17:48
            // "11/03/2026 17:48" matches typical today string
            const todayPrefix = "2026-03-11";

            for (const docSnapshot of snapshot.docs) {
                const data = docSnapshot.data();

                // Se a visita tem o nome do médico 'Migração' e a data é de hoje, foi importada com erro
                if (data.nome_medico === 'Migração' && data.data_hora && data.data_hora.startsWith(todayPrefix)) {
                    try {
                        await deleteDoc(doc(db, 'visitas', docSnapshot.id));
                        deletedCount++;
                        if (deletedCount % 50 === 0) {
                            console.log(`Deletados ${deletedCount} registros...`);
                        }
                    } catch (err) {
                        console.error("Erro ao deletar: ", err);
                    }
                }
            }

            console.log(`Limpeza concluída! Foram deletadas ${deletedCount} visitas.`);
            process.exit(0);
        }

        cleanup();
    } else {
        console.error("Não foi possível encontrar a firebaseConfig no arquivo.");
    }
} catch (error) {
    console.error("Erro geral: ", error);
}
