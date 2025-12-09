import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { db } from "../firebase/firebase";
import { uploadBinary } from "../storage/storageService";

export async function createBanner(file) {
  const { downloadURL } = await uploadBinary(file, "banners");

  const col = collection(db, "banners");
  const docRef = await addDoc(col, {
    imagen: downloadURL,
    estado: true,
    createdAt: serverTimestamp(), // <— IMPORTANTE para tu orderBy
  });

  return { id: docRef.id, imagen: downloadURL, estado: true };
}
