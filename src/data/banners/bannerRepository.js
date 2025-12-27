import { addDoc, collection, serverTimestamp, doc, updateDoc } from "firebase/firestore";
import { db } from "../firebase/firebase";
import { uploadBinary } from "../storage/storageService";
import { deleteObject, ref } from "firebase/storage";
import { storage } from "../firebase/firebase";

export async function createBanner(file, titulo, linkBanner = "") {
  const { downloadURL } = await uploadBinary(file, "banners");

  const col = collection(db, "banners");
  const docRef = await addDoc(col, {
    imagen: downloadURL,
    titulo: titulo || "Sin título",
    linkBanner: linkBanner || "",
    estado: true,
    createdAt: serverTimestamp(), // <— IMPORTANTE para tu orderBy
  });

  return { id: docRef.id, imagen: downloadURL, titulo, linkBanner, estado: true };
}

export async function updateBanner(bannerId, titulo, file = null, linkBanner = "") {
  const updateData = { titulo, linkBanner };

  // Si hay un archivo nuevo, subir imagen
  if (file) {
    const { downloadURL } = await uploadBinary(file, "banners");
    updateData.imagen = downloadURL;
  }

  const docRef = doc(db, "banners", bannerId);
  await updateDoc(docRef, updateData);

  return { id: bannerId, ...updateData };
}