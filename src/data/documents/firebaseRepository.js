// src/data/documents/firebaseRepository.js
import { collection, getDocs, doc, setDoc, updateDoc, getDoc, deleteField } from "firebase/firestore";
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
      
      const flotaDoc = await getDoc(doc(db, "flotas", this.flotaId));
      
      if (!flotaDoc.exists()) {
        console.warn("⚠️ Documento de flota no existe");
        return [];
      }
      
      const flotaData = flotaDoc.data();
      const documentos = flotaData.documentos || {};
      
      // Convertir el map a array
      return Object.entries(documentos).map(([id, data], i) => ({
        id,
        numero: i + 1,
        firebaseId: id,
        ...data,
        titulo: data.screenTitle || "Sin título",
      }));
    } else {
      // SuperAdmin: leer tanto de crear-documentos como de las flotas individuales
      
      // Ciudades constantes
      const CIUDADES = ["La Paz", "Santa Cruz", "Cochabamba", "Chuquisaca", "Oruro", "Potosí", "Tarija", "Pando", "Beni"];
      
      // Cargar documentos de crear-documentos por ciudad
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
      
      // Cargar documentos de todas las flotas
      let flotasDocumentos = [];
      try {
        const flotasSnapshot = await getDocs(collection(db, "flotas"));
        flotasDocumentos = [];
        
        for (const flotaDoc of flotasSnapshot.docs) {
          const flotaData = flotaDoc.data();
          const documentos = flotaData.documentos || {};
          
          // Convertir el map de documentos a array y agregar info de la flota
          const docsFlota = Object.entries(documentos).map(([id, data]) => ({
            id,
            firebaseId: id,
            ...data,
            titulo: data.screenTitle || data.titulo || "Sin título",
            flotaId: flotaDoc.id,
            flotaNombre: flotaData.nombre || "Sin nombre"
          }));
          
          flotasDocumentos = [...flotasDocumentos, ...docsFlota];
        }
      } catch (error) {
        console.warn(`⚠️ Error cargando documentos de flotas:`, error);
      }
      
      // Esperar a que todas las promesas se resuelvan en paralelo
      const resultadosCiudades = await Promise.all(promesasCiudades);
      
      // Combinar todos los documentos
      const allDocs = [...resultadosCiudades.flat(), ...flotasDocumentos];
      
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
      
      await updateDoc(doc(db, "flotas", this.flotaId), {
        [`documentos.${id}`]: docData
      });
      
      return id;
    } else {
      // SuperAdmin: puede guardar en una flota específica o en crear-documentos
      const id = customId || `doc_${Date.now().toString(36)}`;
      const docData = { ...data, id, activo: true };
      
      if (data.flotaId) {
        // Guardar en una flota específica
        
        await updateDoc(doc(db, "flotas", data.flotaId), {
          [`documentos.${id}`]: docData
        });
        
        return id;
      } else {
        // Guardar en crear-documentos (legado)
        const ciudad = data.ciudad || "La Paz";
        const docId = this._getCiudadDocId(ciudad);
        
        // Generar ID único para el documento dentro de la ciudad
        const docDataId = `${docId}_${Math.random().toString(36).substring(2, 15)}`;
        
        const createDocData = { 
          ...data, 
          id: docDataId,
          firebaseId: docDataId,
          activo: true 
        };
        
        // Leer documento existente
        const docRef = doc(db, "crear-documentos", docId);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          // Agregar al array existente
          const documentosPorCiudad = docSnap.data().documentosPorCiudad || [];
          await updateDoc(docRef, {
            documentosPorCiudad: [...documentosPorCiudad, createDocData]
          });
        } else {
          // Crear nuevo documento con el array
          await setDoc(docRef, {
            ciudad,
            documentosPorCiudad: [createDocData]
          });
        }
        
        return docDataId;
      }
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
      // Admin de flota: eliminar de su estructura de documentos
      // Estructura: documentos/{ciudad}/{categoria}/{slug} -> { id, nombre }
      const CIUDADES = ["La Paz", "Santa Cruz", "Cochabamba", "Chuquisaca", "Oruro", "Potosí", "Tarija", "Pando", "Beni"];
      
      const flotaRef = doc(db, "flotas", this.flotaId);
      const flotaSnap = await getDoc(flotaRef);
      
      if (flotaSnap.exists()) {
        const flotaData = flotaSnap.data();
        const documentos = flotaData.documentos || {};
        
        // Buscar recursivamente el documento por su id
        for (const [ciudad, ciudadData] of Object.entries(documentos)) {
          if (typeof ciudadData !== 'object' || ciudadData === null) continue;
          
          for (const [categoria, categoriaData] of Object.entries(ciudadData)) {
            if (typeof categoriaData !== 'object' || categoriaData === null) continue;
            
            // Buscar en los slugs
            for (const [slug, docValue] of Object.entries(categoriaData)) {
              if (typeof docValue === 'object' && docValue?.id === id) {
                // Encontrado, eliminar
                await updateDoc(flotaRef, {
                  [`documentos.${ciudad}.${categoria}.${slug}`]: deleteField()
                });
                console.log(`✅ Documento ${id} eliminado de flota ${this.flotaId}`);
                return;
              }
            }
          }
        }
      }
    } else {
      // SuperAdmin: obtener el documento completo primero
      let docToDelete = null;
      const CIUDADES = ["La Paz", "Santa Cruz", "Cochabamba", "Chuquisaca", "Oruro", "Potosí", "Tarija", "Pando", "Beni"];
      
      // Buscar en crear-documentos
      for (const ciudad of CIUDADES) {
        const docId = this._getCiudadDocId(ciudad);
        const docRef = doc(db, "crear-documentos", docId);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          const documentosPorCiudad = docSnap.data().documentosPorCiudad || [];
          const found = documentosPorCiudad.find(d => d.id === id || d.firebaseId === id);
          
          if (found) {
            docToDelete = found;
            const filtered = documentosPorCiudad.filter(d => d.id !== id && d.firebaseId !== id);
            await updateDoc(docRef, { documentosPorCiudad: filtered });
            break;
          }
        }
      }
      
      // Eliminar de todas las flotas
      try {
        const flotasSnapshot = await getDocs(collection(db, "flotas"));
        
        for (const flotaDoc of flotasSnapshot.docs) {
          const flotaData = flotaDoc.data();
          const documentos = flotaData.documentos || {};
          
          // Estructura: documentos/{ciudad}/{categoria}/{slug} -> { id, nombre }
          for (const [ciudad, ciudadData] of Object.entries(documentos)) {
            if (typeof ciudadData !== 'object' || ciudadData === null) continue;
            
            for (const [categoria, categoriaData] of Object.entries(ciudadData)) {
              if (typeof categoriaData !== 'object' || categoriaData === null) continue;
              
              // Buscar en los slugs
              for (const [slug, docValue] of Object.entries(categoriaData)) {
                if (typeof docValue === 'object' && docValue?.id === id) {
                  // Encontrado, eliminar
                  await updateDoc(doc(db, "flotas", flotaDoc.id), {
                    [`documentos.${ciudad}.${categoria}.${slug}`]: deleteField()
                  });
                  console.log(`✅ Documento ${id} eliminado de flota: ${flotaDoc.id} (${ciudad}/${categoria}/${slug})`);
                }
              }
            }
          }
        }
      } catch (error) {
        console.error(`❌ Error eliminando documento de flotas:`, error);
        throw error;
      }
    }
  }
}
