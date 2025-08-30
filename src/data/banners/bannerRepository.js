import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { db } from "../firebase/firebase";
import { uploadBinary } from "../storage/storageService";

export async function createBanner(file) {
  console.log("[bannerRepo] ▶️ createBanner() file:", file?.name, file?.size);
  const { downloadURL } = await uploadBinary(file, "banners");
  console.log("[bannerRepo] 🔗 downloadURL:", downloadURL);

  const col = collection(db, "banners");
  const docRef = await addDoc(col, {
    imagen: downloadURL,
    estado: true,
    createdAt: serverTimestamp(), // <— IMPORTANTE para tu orderBy
  });
  console.log("[bannerRepo] 🆔 docId:", docRef.id);

  return { id: docRef.id, imagen: downloadURL, estado: true };
}
