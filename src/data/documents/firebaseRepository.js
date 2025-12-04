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
      // SuperAdmin: leer de las subcollecciones por ciudad
      console.log("📖 FirebaseRepository.getAll() - Leyendo de: crear-documentos por ciudad");
      
      // Ciudades constantes
      const CIUDADES = ["La Paz", "Santa Cruz", "Cochabamba", "Chuquisaca", "Oruro", "Potosí", "Tarija", "Pando", "Beni"];
      
      // Cargar todas las ciudades EN PARALELO con Promise.all()
      const promesasCiudades = CIUDADES.map(async (ciudad) => {
        const docId = this._getCiudadDocId(ciudad);
        const docRef = doc(db, "crear-documentos", docId);
        
        try {
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            return docSnap.data().documentosPorCiudad || [];
          }
        } catch (error) {
          console.warn(`⚠️ Error cargando documentos de ${ciudad}:`, error);
        }
        
        return [];
      });
      
      // Esperar a que todas las promesas se resuelvan en paralelo
      const resultadosCiudades = await Promise.all(promesasCiudades);
      
      // Combinar todos los documentos
      const allDocs = resultadosCiudades.flat();
      
      console.log("📊 Documentos encontrados:", allDocs.length);
      
      return allDocs.map((d, i) => ({
        id: d.id || Math.random().toString(36).substring(2, 15),
        numero: i + 1,
        firebaseId: d.id,
        ...d,
        titulo: d.screenTitle || d.titulo || "Sin título",
      }));
    }
  }

  _getCiudadDocId(ciudad) {
    return ciudad.toLowerCase().replace(/\s+/g, '') + "_doc";
  }

  async create(data, customId = null) {
    if (this.flotaId) {
      // Admin de flota: guardar en el map documentos
      const id = customId || `doc_${Date.now().toString(36)}`;
      const docData = { ...data, id, activo: true };
      
      console.log("💾 FirebaseRepository.create() - Guardando en: flotas/" + this.flotaId + "/documentos." + id);
      
      await updateDoc(doc(db, "flotas", this.flotaId), {
        [`documentos.${id}`]: docData
      });
      
      console.log("✅ Documento guardado en map documentos");
      return id;
    } else {
      // SuperAdmin: guardar en subcampo documentosPorCiudad del documento ciudad
      const ciudad = data.ciudad || "La Paz";
      const docId = this._getCiudadDocId(ciudad);
      
      // Generar ID único para el documento dentro de la ciudad
      const docDataId = `${docId}_${Math.random().toString(36).substring(2, 15)}`;
      
      const docData = { 
        ...data, 
        id: docDataId,
        firebaseId: docDataId,
        activo: true 
      };
      
      console.log("💾 FirebaseRepository.create() - Guardando en: crear-documentos/" + docId + "/documentosPorCiudad");
      
      // Leer documento existente
      const docRef = doc(db, "crear-documentos", docId);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        // Agregar al array existente
        const documentosPorCiudad = docSnap.data().documentosPorCiudad || [];
        await updateDoc(docRef, {
          documentosPorCiudad: [...documentosPorCiudad, docData]
        });
      } else {
        // Crear nuevo documento con el array
        await setDoc(docRef, {
          ciudad,
          documentosPorCiudad: [docData]
        });
      }
      
      console.log("✅ Documento guardado en crear-documentos/" + docId);
      return docDataId;
    }
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
      // Actualizar en el array documentosPorCiudad
      const ciudad = data.ciudad || "La Paz";
      const docId = this._getCiudadDocId(ciudad);
      const docRef = doc(db, "crear-documentos", docId);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        const documentosPorCiudad = docSnap.data().documentosPorCiudad || [];
        const updated = documentosPorCiudad.map(d => 
          d.id === id || d.firebaseId === id ? { ...d, ...data } : d
        );
        
        return updateDoc(docRef, { documentosPorCiudad: updated });
      }
    }
  }
  
  async remove(id) {
    if (this.flotaId) {
      // Eliminar del map documentos
      return updateDoc(doc(db, "flotas", this.flotaId), {
        [`documentos.${id}`]: deleteField()
      });
    } else {
      // Eliminar del array documentosPorCiudad
      // Necesitamos buscar en todas las ciudades
      const CIUDADES = ["La Paz", "Santa Cruz", "Cochabamba", "Chuquisaca", "Oruro", "Potosí", "Tarija", "Pando", "Beni"];
      
      for (const ciudad of CIUDADES) {
        const docId = this._getCiudadDocId(ciudad);
        const docRef = doc(db, "crear-documentos", docId);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          const documentosPorCiudad = docSnap.data().documentosPorCiudad || [];
          const filtered = documentosPorCiudad.filter(d => d.id !== id && d.firebaseId !== id);
          
          if (filtered.length < documentosPorCiudad.length) {
            // El documento estaba en esta ciudad
            return updateDoc(docRef, { documentosPorCiudad: filtered });
          }
        }
      }
    }
  }
}
