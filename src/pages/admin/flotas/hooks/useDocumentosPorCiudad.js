// src/pages/admin/flotas/hooks/useDocumentosPorCiudad.js
import { useState, useEffect } from "react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../../../../data/firebase/firebase";

const CIUDADES = [
  "La Paz", "Santa Cruz", "Cochabamba", "Chuquisaca", 
  "Oruro", "Potosí", "Tarija", "Pando", "Beni"
];

export const useDocumentosPorCiudad = () => {
  const [documentosPorCiudad, setDocumentosPorCiudad] = useState({});
  const [loading, setLoading] = useState(true);

  // Función para convertir ciudad a ID de documento
  const getCiudadDocId = (ciudad) => {
    return ciudad.toLowerCase().replace(/\s+/g, '') + "_doc";
  };

  // Obtener documentos por ciudad
  const fetchDocumentosPorCiudad = async () => {
    try {
      setLoading(true);
      const documentosPorDept = {};

      // Cargar todas las ciudades EN PARALELO con Promise.all()
      const promesasCiudades = CIUDADES.map(async (ciudad) => {
        try {
          const docId = getCiudadDocId(ciudad);
          const docRef = doc(db, "crear-documentos", docId);
          const docSnap = await getDoc(docRef);

          if (docSnap.exists()) {
            const data = docSnap.data();
            // Obtener el array de documentosPorCiudad
            return {
              ciudad,
              documentos: data.documentosPorCiudad || []
            };
          } else {
            return {
              ciudad,
              documentos: []
            };
          }
        } catch (err) {
          console.error(`Error obteniendo documentos de ${ciudad}:`, err);
          return {
            ciudad,
            documentos: []
          };
        }
      });

      // Esperar a que todas las promesas se resuelvan en paralelo
      const resultados = await Promise.all(promesasCiudades);

      // Construir el objeto documentosPorDept desde los resultados
      resultados.forEach(({ ciudad, documentos }) => {
        documentosPorDept[ciudad] = documentos;
        console.log(`📄 Documentos en ${ciudad}:`, documentos.length);
      });

      setDocumentosPorCiudad(documentosPorDept);
      console.log('📄 Documentos por ciudad cargados (paralelo):', Object.keys(documentosPorDept).length, 'ciudades');
    } catch (error) {
      console.error("Error al obtener documentos por ciudad:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocumentosPorCiudad();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { documentosPorCiudad, loading, fetchDocumentosPorCiudad };
};
