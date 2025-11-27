// src/data/documents/firebaseRepository.js
import { collection, getDocs, doc, setDoc, updateDoc, deleteDoc, getDoc, deleteField } from "firebase/firestore";
import { db } from "../firebase/firebase";
import { DocumentRepository } from "./repository";

export class FirebaseDocumentRepository extends DocumentRepository {
  constructor(flotaId = null) {
    super();
    this.flotaId = flotaId;
  }

  async getAll() {
    if (this.flotaId) {
      // Admin de flota: leer documentos desde el map documentos
      console.log("📖 FirebaseRepository.getAll() - Leyendo de: flotas/" + this.flotaId + "/documentos");
      
      const flotaDoc = await getDoc(doc(db, "flotas", this.flotaId));
      
      if (!flotaDoc.exists()) {
        console.warn("⚠️ Documento de flota no existe");
        return [];
      }
      
      const flotaData = flotaDoc.data();
      const documentos = flotaData.documentos || {};
      
      console.log("📊 Documentos en map:", Object.keys(documentos).length);
      
      // Convertir el map a array
      return Object.entries(documentos).map(([id, data], i) => ({
        id,
        numero: i + 1,
        firebaseId: id,
        ...data,
        titulo: data.screenTitle || "Sin título",
      }));
    } else {
      // SuperAdmin: leer de la colección global
      console.log("📖 FirebaseRepository.getAll() - Leyendo de: crear-documentos");
      const snap = await getDocs(collection(db, "crear-documentos"));
      console.log("📊 Documentos encontrados:", snap.size);
      
      return snap.docs.map((d, i) => ({
        id: d.id,
        numero: i + 1,
        firebaseId: d.id,
        ...d.data(),
        titulo: d.data().screenTitle || "Sin título",
      }));
    }
  }

  async create(data) {
    const id = `doc_${Date.now().toString(36)}`;
    const docData = { ...data, id, activo: true };
    
    if (this.flotaId) {
      // Admin de flota: guardar en el map documentos
      console.log("💾 FirebaseRepository.create() - Guardando en: flotas/" + this.flotaId + "/documentos." + id);
      
      await updateDoc(doc(db, "flotas", this.flotaId), {
        [`documentos.${id}`]: docData
      });
      
      console.log("✅ Documento guardado en map documentos");
    } else {
      // SuperAdmin: guardar en colección global
      console.log("💾 FirebaseRepository.create() - Guardando en: crear-documentos/" + id);
      await setDoc(doc(db, "crear-documentos", id), docData);
      console.log("✅ Documento guardado en colección global");
    }
    
    return id;
  }

  async update(id, data) {
    if (this.flotaId) {
      // Actualizar en el map documentos
      const updates = {};
      Object.keys(data).forEach(key => {
        updates[`documentos.${id}.${key}`] = data[key];
      });
      
      return updateDoc(doc(db, "flotas", this.flotaId), updates);
    } else {
      // Actualizar en colección global
      return updateDoc(doc(db, "crear-documentos", id), data);
    }
  }
  
  async remove(id) {
    if (this.flotaId) {
      // Eliminar del map documentos
      return updateDoc(doc(db, "flotas", this.flotaId), {
        [`documentos.${id}`]: deleteField()
      });
    } else {
      // Eliminar de colección global
      return deleteDoc(doc(db, "crear-documentos", id));
    }
  }
}
