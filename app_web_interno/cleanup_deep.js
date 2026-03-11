import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, deleteDoc, doc, query, where } from 'firebase/firestore';
import fs from 'fs';

try {
    const firebaseConfigStr = fs.readFileSync('c:/Users/harol/OneDrive/Documentos/DEV/Documentacao_AppSheet_Visitas_medicas/app_web_interno/src/services/firebase.js', 'utf8');
    const match = firebaseConfigStr.match(/const firebaseConfig = ({[\s\S]*?});/);

    if (match && match[1]) {
        let firebaseConfig;
        eval(`firebaseConfig = ${match[1]}`);

        const app = initializeApp(firebaseConfig);
        const db = getFirestore(app);

        async function cleanup() {
            console.log("Iniciando limpeza por DATA exata...");

            const visitasRef = collection(db, 'visitas');
            const q = query(visitasRef);
            const snapshot = await getDocs(q);

            let deletedCount = 0;
            let oldestDate = null;
            let newestDate = null;

            for (const docSnapshot of snapshot.docs) {
                const data = docSnapshot.data();

                // Deleta TODA visita (seja quem for o médico) que tiver a data exata de hoje
                // Assumindo que o admin não criou centenas de visitas reais hoje à tarde
                if (data.data_hora && data.data_hora.startsWith("2026-03-11")) {
                    try {
                        await deleteDoc(doc(db, 'visitas', docSnapshot.id));
                        deletedCount++;
                    } catch (err) {
                        console.error("Erro ao deletar: ", err);
                    }
                }
            }

            console.log(`Verificadas ${snapshot.size} visitas totais.`);
            console.log(`Deletadas ${deletedCount} visitas de COM DATA de hoje (2026-03-11).`);
            process.exit(0);
        }

        cleanup();
    }
} catch (error) {
    console.error("Erro geral: ", error);
}
