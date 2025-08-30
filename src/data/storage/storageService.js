import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { storage } from "../firebase/firebase";

export async function uploadBinary(file, path = "uploads") {
  if (!file) throw new Error("No hay archivo para subir");


  console.log("DEBUG file:", file, file instanceof File, file.size, file.type);
  console.log("DEBUG storage bucket:", storage.app.options.storageBucket);

  const safeName = (file.name || "archivo")
    .toLowerCase()
    .replaceAll(/\s+/g, "-")
    .replaceAll(/[^a-z0-9.\-_]/g, "");
  const filePath = `${path}/${Date.now()}-${safeName}`;

  console.log("[storage] ⬆️ Subiendo a:", filePath, "size:", file.size);

  try {
    const storageRef = ref(storage, filePath);
    const snapshot = await uploadBytes(storageRef, file);
    const downloadURL = await getDownloadURL(snapshot.ref);
    console.log("[storage] ✅ OK URL:", downloadURL);
    return { path: filePath, downloadURL };
  } catch (err) {
    console.error("[storage] ❌ ERROR:", err.code || err.message, err);
    throw err; // re-lanza para que lo vea el hook
  }
}
