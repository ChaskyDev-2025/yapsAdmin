// src/data/firebase/firebase.js
import { initializeApp } from "firebase/app";
import { getFirestore, enableIndexedDbPersistence } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getAuth, setPersistence, browserLocalPersistence } from "firebase/auth";

const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.REACT_APP_FIREBASE_APP_ID,
};

console.log("📦 Firebase Project ID:", process.env.REACT_APP_FIREBASE_PROJECT_ID);

const app = initializeApp(firebaseConfig);
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
