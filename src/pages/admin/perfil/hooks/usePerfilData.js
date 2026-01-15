import { useState, useEffect } from "react";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "../../../../data/firebase/firebase";
import { uploadProfilePhotoToStorage } from "../../../../services/imageUploadService";

export const usePerfilData = (user) => {
  const [nombre, setNombre] = useState("");
  const [correo, setCorreo] = useState("");
  const [telefono, setTelefono] = useState("");
  const [fotoUrl, setFotoUrl] = useState("");
  const [foto, setFoto] = useState(null);
  const [preview, setPreview] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [guardado, setGuardado] = useState(false);
  const [error, setError] = useState("");

  // Cargar datos del usuario
  useEffect(() => {
    const cargarDatosUsuario = async () => {
      if (!user?.uid) {
        setCargando(false);
        return;
      }

      try {
        const userDoc = await getDoc(doc(db, "users", user.uid));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          setNombre(userData.nombre || "");
          setCorreo(userData.email || user.email || "");
          setTelefono(userData.telefono || "");
          setFotoUrl(userData.fotoUrl || "");
          setPreview(userData.fotoUrl || null);
        } else {
          setCorreo(user.email || "");
        }
      } catch (err) {
        console.error("Error al cargar datos del usuario:", err);
        setError("Error al cargar los datos del perfil");
      } finally {
        setCargando(false);
      }
    };

    cargarDatosUsuario();
  }, [user]);

  const handleFotoChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      setFoto(file);
      setPreview(URL.createObjectURL(file));
    }
  };

  const guardarCambios = async () => {
    if (!user?.uid) {
      setError("Usuario no autenticado");
      return false;
    }

    if (!nombre || !correo) {
      setError("Por favor completa los campos requeridos");
      return false;
    }

    setGuardando(true);
    setError("");

    try {
      let nuevoFotoUrl = fotoUrl;

      // Si se seleccionó una nueva foto
      if (foto) {
        const uploadResult = await uploadProfilePhotoToStorage(foto, user.uid);
        nuevoFotoUrl = uploadResult.url;
      }

      // Actualizar datos en Firestore
      const userRef = doc(db, "users", user.uid);
      await updateDoc(userRef, {
        nombre: nombre,
        email: correo,
        telefono: telefono,
        fotoUrl: nuevoFotoUrl,
        actualizadoEn: new Date().toISOString(),
      });

      setFotoUrl(nuevoFotoUrl);
      setFoto(null);
      setGuardado(true);
      setTimeout(() => setGuardado(false), 3000);
      return true;
    } catch (err) {
      console.error("Error al guardar cambios:", err);
      setError("Error al guardar los cambios. Intenta nuevamente");
      return false;
    } finally {
      setGuardando(false);
    }
  };

  return {
    nombre,
    setNombre,
    correo,
    setCorreo,
    telefono,
    setTelefono,
    fotoUrl,
    setFotoUrl,
    foto,
    setFoto,
    preview,
    setPreview,
    cargando,
    guardando,
    guardado,
    error,
    setError,
    handleFotoChange,
    guardarCambios,
  };
};
