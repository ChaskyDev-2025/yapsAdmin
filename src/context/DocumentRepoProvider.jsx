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
  
  // Crear repositorio con el flotaId del usuario (null para SuperAdmin)
  const repo = useMemo(() => {
    return new FirebaseDocumentRepository(userFlotaId);
  }, [userFlotaId]);

  // No renderizar children hasta que AuthContext haya terminado de cargar
  if (loading) {
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

  return (
    <DocumentRepoContext.Provider value={repo}>
      {children}
    </DocumentRepoContext.Provider>
  );
}
