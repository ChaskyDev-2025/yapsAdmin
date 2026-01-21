import React, { useState, useEffect, useContext } from "react";
import { Box } from "@mui/material";
import { doc, setDoc, collection, getDocs, getDoc, updateDoc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { db, storage } from "../../../../data/firebase/firebase";
import { NotificationContext } from "../../../../context/NotificationContext";
import SorteosHeader from "./sorteos/SorteosHeader";
import SorteosList from "./sorteos/SorteosList";
import SorteoDetail from "./sorteos/SorteoDetail";
import CrearSorteoModal from "./sorteos/CrearSorteoModal";
import EditSorteoModal from "./sorteos/EditSorteoModal";

const DEPARTAMENTOS = [
  "La Paz", "Santa Cruz", "Cochabamba", "Chuquisaca", 
  "Oruro", "Potosí", "Tarija", "Pando", "Beni"
];

const SorteosTab = () => {
  const { addNotification } = useContext(NotificationContext);
  
  // Estados para sorteos
  const [sorteos, setSorteos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sorteoSeleccionado, setSorteoSeleccionado] = useState(null);
  const [datosSorteo, setDatosSorteo] = useState([]);
  const [loadingDatos, setLoadingDatos] = useState(false);
  const [departamentoSeleccionado, setDepartamentoSeleccionado] = useState(0);
  const [paginaActual, setPaginaActual] = useState(1);
  const ITEMS_PER_PAGE = 10;
  
  // Estados para filtros de búsqueda
  const [busqueda, setBusqueda] = useState("");
  const [fechaInicioBusqueda, setFechaInicioBusqueda] = useState("");
  const [fechaFinBusqueda, setFechaFinBusqueda] = useState("");
  
  // Estados para el formulario de creación
  const [modalOpen, setModalOpen] = useState(false);
  const [imagenSubiendo, setImagenSubiendo] = useState(false);
  const [imagenPreview, setImagenPreview] = useState(null);
  const [nuevoSorteo, setNuevoSorteo] = useState({
    id: "",
    descripcion: "",
    modo: "pasajero",
    fechaInicio: "",
    fechaFin: "",
    departamentos: [],
    categorias: [],
    imagenUrl: "",
  });
  const [categoriasDisponibles, setCategoriasDisponibles] = useState([]);

  // Edición
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [sorteoEdicion, setSorteoEdicion] = useState(null);
  const [imagenPreviewEdicion, setImagenPreviewEdicion] = useState(null);
  const [imagenSubiendoEdicion, setImagenSubiendoEdicion] = useState(false);

  useEffect(() => {
    cargarSorteos();
    cargarCategorias();
  }, []);

  // Manejar carga de imagen
  const handleImagenChange = async (e) => {
    const archivo = e.target.files?.[0];
    if (!archivo) return;

    // Validar que sea imagen
    if (!archivo.type.startsWith("image/")) {
      addNotification({
        message: "Por favor selecciona una imagen válida",
        type: "error",
      });
      return;
    }

    // Mostrar preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setImagenPreview(e.target.result);
    };
    reader.readAsDataURL(archivo);

    // Subir a Storage
    try {
      setImagenSubiendo(true);
      const timestamp = Date.now();
      const storageRef = ref(storage, `sorteos/${timestamp}_${archivo.name}`);
      await uploadBytes(storageRef, archivo);
      const url = await getDownloadURL(storageRef);
      
      setNuevoSorteo({ ...nuevoSorteo, imagenUrl: url });
      addNotification({
        message: "Imagen subida exitosamente",
        type: "success",
      });
    } catch (error) {
      console.error("Error subiendo imagen:", error);
      addNotification({
        message: "Error al subir la imagen",
        type: "error",
      });
    } finally {
      setImagenSubiendo(false);
    }
  };

  // Enriquecer cupones con datos de usuario (para pasajeros)
  const enriquecerCuponesConNombres = async (cupones) => {
    try {
      if (!cupones || cupones.length === 0) return cupones;

      // Obtener UIDs únicos de los cupones (buscar tanto uidUsuario como UidUsuario)
      const uidsUnicos = [...new Set(
        cupones
          .map(c => c.uidUsuario || c.UidUsuario)
          .filter(Boolean)
      )];

      if (uidsUnicos.length === 0) return cupones;

      // Enriqueciendo cupones con datos de pasajero

      // Crear un mapa de UID -> nombre del pasajero
      const usuariosMap = {};

      // Buscar datos de pasajeros en Firebase
      for (const uid of uidsUnicos) {
        try {
          const pasajeroRef = doc(db, "pasajeros", uid);
          const pasajeroSnap = await getDoc(pasajeroRef);
          if (pasajeroSnap.exists()) {
            const pasajeroData = pasajeroSnap.data();
            const nombre = pasajeroData.perfil?.name || 
                           pasajeroData.perfil?.nombre || 
                           pasajeroData.name || 
                           pasajeroData.nombre || 
                           uid;
            usuariosMap[uid] = nombre;
          }
        } catch (e) {
          console.error(`Error obteniendo datos del pasajero ${uid}:`, e);
        }
      }

      // Enriquecer cupones con los nombres
      const cuponesEnriquecidos = cupones.map(cupon => {
        const uid = cupon.uidUsuario || cupon.UidUsuario;
        return {
          ...cupon,
          nombreUsuario: usuariosMap[uid] || uid || "Desconocido"
        };
      });

      // Cupones enriquecidos exitosamente
      return cuponesEnriquecidos;
    } catch (error) {
      console.error("Error enriqueciendo cupones:", error);
      return cupones;
    }
  };

  // Cargar datos de un sorteo específico (cupones o participantes según el modo)
  const cargarDatosSorteo = async (sorteoId, modo) => {
    try {
      setLoadingDatos(true);
      
      // Determinar qué colección leer según el modo
      const nombreColeccion = modo === "trabajador" ? "participantes" : "cupones";
      
      const datosRef = collection(db, "sorteos", sorteoId, nombreColeccion);
      const datosSnap = await getDocs(datosRef);

      let datosArray = datosSnap.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      // Si es pasajero (cupones), enriquecer con nombres de pasajeros
      if (modo === "pasajero") {
        datosArray = await enriquecerCuponesConNombres(datosArray);
        
        // Ordenar por número de rifa descendente (más alto primero)
        datosArray.sort((a, b) => {
          const rifaA = parseInt(a.numeroRifa || a.NumeroRifa || 0);
          const rifaB = parseInt(b.numeroRifa || b.NumeroRifa || 0);
          return rifaB - rifaA;
        });
      }

      setDatosSorteo(datosArray);
    } catch (error) {
      console.error("Error cargando datos del sorteo:", error);
      addNotification({
        message: "Error al cargar los datos del sorteo",
        type: "error",
      });
    } finally {
      setLoadingDatos(false);
    }
  };

  // Manejar selección de sorteo
  const handleSeleccionarSorteo = (sorteo) => {
    setSorteoSeleccionado(sorteo);
    setPaginaActual(1);
    setDepartamentoSeleccionado(0);
    setBusqueda("");
    setFechaInicioBusqueda("");
    setFechaFinBusqueda("");
    cargarDatosSorteo(sorteo.id, sorteo.modo);
  };

  // Volver al listado de sorteos
  const handleVolverListado = () => {
    setSorteoSeleccionado(null);
    setDatosSorteo([]);
  };

  // Cargar sorteos desde Firebase
  const cargarSorteos = async () => {
    try {
      setLoading(true);
      const sorteosRef = collection(db, "sorteos");
      const sorteosSnap = await getDocs(sorteosRef);

      const sorteosArray = sorteosSnap.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          descripcion: data.descripcion || "",
          modo: data.modo || "pasajero",
          estado: data.estado || "inactivo",
          fechaInicio: data.fechaInicio,
          fechaFin: data.fechaFin,
          departamentos: data.departamentos || [],
          categorias: data.categorias || [],
          imagenUrl: data.imagenUrl || "",
          creadoEn: data.creadoEn,
        };
      });

      setSorteos(sorteosArray);
    } catch (error) {
      console.error("Error cargando sorteos:", error);
      addNotification({
        message: "Error al cargar los sorteos",
        type: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  // Cargar categorías disponibles
  const cargarCategorias = async () => {
    try {
      const categoriasArray = [
        "Envios",
        "Viajes",
        "carga_internacional",
        "carga_local",
        "carga_nacional",
        "construccion",
        "maquinaria_y_gruas",
        "mudanza"
      ];
      setCategoriasDisponibles(categoriasArray);
    } catch (error) {
      console.error("Error cargando categorías:", error);
    }
  };

  const handleCrearSorteo = async () => {
    if (!nuevoSorteo.id.trim()) {
      addNotification({
        message: "Por favor ingresa un ID para el sorteo",
        type: "error",
      });
      return;
    }

    try {
      const modo = nuevoSorteo.modo || "pasajero";

      // Crear nuevo sorteo
      await setDoc(doc(db, "sorteos", nuevoSorteo.id), {
        descripcion: nuevoSorteo.descripcion,
        modo: modo,
        estado: "activo",
        fechaInicio: nuevoSorteo.fechaInicio ? new Date(nuevoSorteo.fechaInicio) : null,
        fechaFin: nuevoSorteo.fechaFin ? new Date(nuevoSorteo.fechaFin) : null,
        departamentos: nuevoSorteo.departamentos || [],
        categorias: nuevoSorteo.categorias || [],
        imagenUrl: nuevoSorteo.imagenUrl || "",
        creadoEn: new Date(),
      });

      addNotification({
        message: `Sorteo creado exitosamente para ${modo === "trabajador" ? "Trabajadores" : "Pasajeros"}`,
        type: "success",
      });

      // Resetear formulario y cerrar modal
      setNuevoSorteo({ 
        id: "", 
        descripcion: "", 
        modo: "pasajero", 
        fechaInicio: "", 
        fechaFin: "", 
        departamentos: [], 
        categorias: [], 
        imagenUrl: "" 
      });
      setImagenPreview(null);
      setModalOpen(false);
      
      // Recargar sorteos
      cargarSorteos();
    } catch (error) {
      console.error("Error guardando sorteo:", error);
      addNotification({
        message: "Error al crear el sorteo",
        type: "error",
      });
    }
  };

  const handleToggleEstado = async (sorteo, nuevoEstado) => {
    try {
      await updateDoc(doc(db, "sorteos", sorteo.id), { estado: nuevoEstado });

      setSorteos((prev) =>
        prev.map((item) => (item.id === sorteo.id ? { ...item, estado: nuevoEstado } : item))
      );

      setSorteoSeleccionado((prev) =>
        prev && prev.id === sorteo.id ? { ...prev, estado: nuevoEstado } : prev
      );

      addNotification({
        message: `Sorteo ${nuevoEstado === "activo" ? "activado" : "inactivado"} correctamente`,
        type: "success",
      });
    } catch (error) {
      console.error("Error actualizando estado del sorteo:", error);
      addNotification({
        message: "No se pudo actualizar el estado del sorteo",
        type: "error",
      });
    }
  };

  const toDateTimeLocal = (timestamp) => {
    if (!timestamp) return "";
    if (timestamp.seconds) {
      return new Date(timestamp.seconds * 1000).toISOString().slice(0, 16);
    }
    return timestamp;
  };

  const handleAbrirEdicion = (sorteo) => {
    setSorteoEdicion({
      ...sorteo,
      fechaInicio: toDateTimeLocal(sorteo.fechaInicio),
      fechaFin: toDateTimeLocal(sorteo.fechaFin),
    });
    setImagenPreviewEdicion(sorteo.imagenUrl || null);
    setEditModalOpen(true);
  };

  const handleCerrarEdicion = () => {
    setEditModalOpen(false);
    setImagenPreviewEdicion(null);
    setSorteoEdicion(null);
  };

  const handleImagenChangeEdicion = async (e) => {
    const archivo = e.target.files?.[0];
    if (!archivo) return;

    if (!archivo.type.startsWith("image/")) {
      addNotification({ message: "Por favor selecciona una imagen válida", type: "error" });
      return;
    }

    const reader = new FileReader();
    reader.onload = (ev) => setImagenPreviewEdicion(ev.target.result);
    reader.readAsDataURL(archivo);

    try {
      setImagenSubiendoEdicion(true);
      const timestamp = Date.now();
      const storageRef = ref(storage, `sorteos/${timestamp}_${archivo.name}`);
      await uploadBytes(storageRef, archivo);
      const url = await getDownloadURL(storageRef);
      setSorteoEdicion((prev) => ({ ...prev, imagenUrl: url }));
      addNotification({ message: "Imagen subida exitosamente", type: "success" });
    } catch (error) {
      console.error("Error subiendo imagen:", error);
      addNotification({ message: "Error al subir la imagen", type: "error" });
    } finally {
      setImagenSubiendoEdicion(false);
    }
  };

  const handleEditarSorteo = async () => {
    if (!sorteoEdicion || !sorteoEdicion.id) return;

    try {
      const payload = {
        descripcion: sorteoEdicion.descripcion,
        modo: sorteoEdicion.modo || "pasajero",
        fechaInicio: sorteoEdicion.fechaInicio ? new Date(sorteoEdicion.fechaInicio) : null,
        fechaFin: sorteoEdicion.fechaFin ? new Date(sorteoEdicion.fechaFin) : null,
        departamentos: sorteoEdicion.departamentos || [],
        categorias: sorteoEdicion.categorias || [],
        imagenUrl: sorteoEdicion.imagenUrl || "",
        estado: sorteoEdicion.estado || "inactivo",
      };

      await updateDoc(doc(db, "sorteos", sorteoEdicion.id), payload);

      setSorteos((prev) =>
        prev.map((item) => (item.id === sorteoEdicion.id ? { ...item, ...payload } : item))
      );

      setSorteoSeleccionado((prev) =>
        prev && prev.id === sorteoEdicion.id ? { ...prev, ...payload } : prev
      );

      addNotification({ message: "Sorteo actualizado", type: "success" });
      handleCerrarEdicion();
    } catch (error) {
      console.error("Error actualizando sorteo:", error);
      addNotification({ message: "No se pudo actualizar el sorteo", type: "error" });
    }
  };

  return (
    <Box>
      <SorteosHeader onOpenModal={() => setModalOpen(true)} />

      {sorteoSeleccionado ? (
        <SorteoDetail
          sorteo={sorteoSeleccionado}
          datosSorteo={datosSorteo}
          loadingDatos={loadingDatos}
          busqueda={busqueda}
          onBusquedaChange={setBusqueda}
          fechaInicioBusqueda={fechaInicioBusqueda}
          onFechaInicioChange={setFechaInicioBusqueda}
          fechaFinBusqueda={fechaFinBusqueda}
          onFechaFinChange={setFechaFinBusqueda}
          departamentoSeleccionado={departamentoSeleccionado}
          onDepartamentoChange={setDepartamentoSeleccionado}
          paginaActual={paginaActual}
          onPageChange={setPaginaActual}
          itemsPerPage={ITEMS_PER_PAGE}
          onVolver={handleVolverListado}
          onToggleEstado={handleToggleEstado}
        />
      ) : (
        <SorteosList sorteos={sorteos} loading={loading} onSelect={handleSeleccionarSorteo} onEdit={handleAbrirEdicion} />
      )}

      <CrearSorteoModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        nuevoSorteo={nuevoSorteo}
        onChange={setNuevoSorteo}
        onSubmit={handleCrearSorteo}
        imagenPreview={imagenPreview}
        imagenSubiendo={imagenSubiendo}
        onImagenChange={handleImagenChange}
        categoriasDisponibles={categoriasDisponibles}
        departamentos={DEPARTAMENTOS}
      />

      <EditSorteoModal
        open={editModalOpen}
        onClose={handleCerrarEdicion}
        sorteo={sorteoEdicion || nuevoSorteo}
        onChange={setSorteoEdicion}
        onSubmit={handleEditarSorteo}
        imagenPreview={imagenPreviewEdicion || (sorteoEdicion && sorteoEdicion.imagenUrl) || null}
        imagenSubiendo={imagenSubiendoEdicion}
        onImagenChange={handleImagenChangeEdicion}
        categoriasDisponibles={categoriasDisponibles}
        departamentos={DEPARTAMENTOS}
      />
    </Box>
  );
};

export default SorteosTab;
