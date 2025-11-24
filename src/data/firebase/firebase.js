// src/data/firebase/firebase.js
import { initializeApp } from "firebase/app";
import { getFirestore, enableIndexedDbPersistence } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getAuth, setPersistence, browserLocalPersistence } from "firebase/auth";
import { getAnalytics } from "firebase/analytics";

const firebaseConfig = {
  apiKey: "AIzaSyDpHcoShSwW-xBExwuZc-Cp6h5XVb15qG0",
  authDomain: "taxia1.firebaseapp.com",
  databaseURL: "https://taxia1-default-rtdb.firebaseio.com",
  projectId: "taxia1",
  storageBucket: "taxia1.firebasestorage.app",
  messagingSenderId: "818622038646",
  appId: "1:818622038646:web:9c18ecdcde0f3e09659557",
  measurementId: "G-LMSR97W98Q"
};

console.log("📦 Firebase Project ID:", firebaseConfig.projectId);

const app = initializeApp(firebaseConfig);
export const analytics = getAnalytics(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export const auth = getAuth(app);

// Mantener sesión tras cerrar el navegador (ajusta a session si quieres)
setPersistence(auth, browserLocalPersistence);

// línea clave ↓  (hazla solo una vez al arrancar la app)
enableIndexedDbPersistence(db).catch(() => {
  /* Si hay otra pestaña abierta, la persistencia puede fallar;
     no es crítico: Firestore seguirá funcionando sin caché. */
});
