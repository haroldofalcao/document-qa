import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs } from "firebase/firestore";

const firebaseConfig = {
    apiKey: "AIzaSyBlmQn2whfdRNFBv98h6vp0Qu_F_d2uscg",
    authDomain: "gestao-de-visitas-1.firebaseapp.com",
    projectId: "gestao-de-visitas-1"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function check() {
    const querySnapshot = await getDocs(collection(db, "visitas"));
    let count = 0;
    let countsByDate = {};
    querySnapshot.forEach((doc) => {
        const d = doc.data();
        if (d.data_hora && d.data_hora.startsWith("2026-01")) {
            const dateStr = d.data_hora.split('T')[0];
            countsByDate[dateStr] = (countsByDate[dateStr] || 0) + 1;
        }
    });

    console.log("Counts for Jan 2026:");
    console.table(countsByDate);
    process.exit(0);
}

check();
