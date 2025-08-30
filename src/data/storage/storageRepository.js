// src/data/storage/storageRepository.js
import { storage } from "../firebase/firebase";
import { ref, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage";

export async function uploadBanner(file, folder = "banners") {
  if (!file) throw new Error("Archivo no definido");
  const path = `${folder}/${Date.now()}-${file.name}`;
  const storageRef = ref(storage, path);
  await uploadBytes(storageRef, file);
  const url = await getDownloadURL(storageRef);
  return { url, path };
}

export async function deleteByPath(path) {
  await deleteObject(ref(storage, path));
}
