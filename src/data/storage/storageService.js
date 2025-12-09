import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { storage } from "../firebase/firebase";

export async function uploadBinary(file, path = "uploads") {
  if (!file) throw new Error("No hay archivo para subir");

  const safeName = (file.name || "archivo")
    .toLowerCase()
    .replaceAll(/\s+/g, "-")
    .replaceAll(/[^a-z0-9.\-_]/g, "");
  const filePath = `${path}/${Date.now()}-${safeName}`;

  try {
    const storageRef = ref(storage, filePath);
    const snapshot = await uploadBytes(storageRef, file);
    const downloadURL = await getDownloadURL(snapshot.ref);
    return { path: filePath, downloadURL };
  } catch (err) {
    console.error("[storage] ❌ ERROR:", err.code || err.message, err);
    throw err; // re-lanza para que lo vea el hook
  }
}
