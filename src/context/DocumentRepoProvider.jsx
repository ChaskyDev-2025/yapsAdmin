// src/context/DocumentRepoProvider.jsx

// Define que tecnología usar para la Base de Datos - Firebase
// Puedes cambiar a otra tecnología modificando esta línea

import { createContext, useContext, useMemo } from "react";
import { FirebaseDocumentRepository } from "../data/documents/firebaseRepository";
import { useAuth } from "../auth/AuthContext";

const DocumentRepoContext = createContext(null);
export const useDocumentRepo = () => useContext(DocumentRepoContext);

export default function DocumentRepoProvider({ children }) {
  const { userFlotaId, loading } = useAuth();
  
  console.log("🔄 DocumentRepoProvider - Estado:", { 
    userFlotaId, 
    loading,
    flotaIdType: typeof userFlotaId 
  });
  
  // Crear repositorio con el flotaId del usuario (null para SuperAdmin)
  const repo = useMemo(() => {
    console.log("🏭 DocumentRepoProvider - Creando repo con flotaId:", userFlotaId);
    return new FirebaseDocumentRepository(userFlotaId);
  }, [userFlotaId]);

  // No renderizar children hasta que AuthContext haya terminado de cargar
  if (loading) {
    console.log("⏳ DocumentRepoProvider - Esperando a que termine de cargar...");
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        fontSize: '20px'
      }}>
        Cargando...
      </div>
    );
  }

  console.log("✅ DocumentRepoProvider - Renderizando children con repo");

  return (
    <DocumentRepoContext.Provider value={repo}>
      {children}
    </DocumentRepoContext.Provider>
  );
}
