// src/pages/admin/flotas/hooks/useDocumentos.js
import { useState } from "react";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { storage } from "../../../../data/firebase/firebase";

export const useDocumentos = () => {
  const [docFile, setDocFile] = useState(null);
  const [docFormData, setDocFormData] = useState({
    tipo: "",
    nombre: "",
    contenido: "",
    url: "",
  });

  const resetDocForm = () => {
    setDocFormData({ tipo: "", nombre: "", contenido: "", url: "" });
    setDocFile(null);
  };

  const handleDocFileChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      setDocFile(file);
      setDocFormData({ ...docFormData, nombre: file.name });
    }
  };

  const uploadDocument = async () => {
    let urlDocumento = docFormData.url;

    if (docFile) {
      const docRef = ref(storage, `documentos-flotas/${Date.now()}_${docFile.name}`);
      await uploadBytes(docRef, docFile);
      urlDocumento = await getDownloadURL(docRef);
    }

    if (!docFormData.tipo) {
      throw new Error("Por favor selecciona el tipo de documento");
    }

    if (!urlDocumento && !docFormData.contenido) {
      throw new Error("Debes agregar información de texto, subir un archivo o proporcionar una URL");
    }

    return {
      tipo: docFormData.tipo,
      nombre: docFormData.nombre || docFormData.tipo,
      contenido: docFormData.contenido || "",
      url: urlDocumento || "",
      fechaSubida: new Date().toISOString(),
    };
  };

  return {
    docFile,
    docFormData,
    setDocFormData,
    handleDocFileChange,
    uploadDocument,
    resetDocForm,
  };
};
