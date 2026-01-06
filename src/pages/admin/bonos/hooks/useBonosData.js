import { useState, useEffect } from "react";
import {
  obtenerReglasBonosConductores,
  obtenerHistorialBonos,
  obtenerConductoresConViajes,
  obtenerConductoresFlotaConViajes,
} from "../services/bonosService";

// Hook para cargar reglas de bonos
export const useReglasBonosConductores = () => {
  const [reglas, setReglas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const cargar = async () => {
    try {
      setLoading(true);
      const data = await obtenerReglasBonosConductores();
      setReglas(data);
      setError(null);
    } catch (err) {
      setError(err);
      console.error("Error en useReglasBonosConductores:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargar();
  }, []);

  return { reglas, loading, error, recargar: cargar };
};

// Hook para cargar historial de bonos
export const useHistorialBonos = () => {
  const [historial, setHistorial] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const cargar = async () => {
    try {
      setLoading(true);
      const data = await obtenerHistorialBonos();
      setHistorial(data);
      setError(null);
    } catch (err) {
      setError(err);
      console.error("Error en useHistorialBonos:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargar();
  }, []);

  return { historial, loading, error, recargar: cargar };
};

// Hook para cargar conductores con viajes
export const useConductoresConViajes = () => {
  const [conductores, setConductores] = useState([]);
  const [viajesConductores, setViajesConductores] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const cargar = async () => {
    try {
      setLoading(true);
      const { conductores: conds, viajesCond } = await obtenerConductoresConViajes();
      setConductores(conds);
      setViajesConductores(viajesCond);
      setError(null);
    } catch (err) {
      setError(err);
      console.error("Error en useConductoresConViajes:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargar();
  }, []);

  return { conductores, viajesConductores, loading, error, recargar: cargar };
};

// Hook para cargar conductores de una flota con viajes
export const useConductoresFlotaConViajes = (flotaId) => {
  const [conductores, setConductores] = useState([]);
  const [viajesConductores, setViajesConductores] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const cargar = async () => {
      if (!flotaId) {
        setConductores([]);
        setViajesConductores({});
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const { conductores: conds, viajesCond } = await obtenerConductoresFlotaConViajes(flotaId);
        setConductores(conds);
        setViajesConductores(viajesCond);
        setError(null);
      } catch (err) {
        setError(err);
        console.error("Error en useConductoresFlotaConViajes:", err);
      } finally {
        setLoading(false);
      }
    };

    cargar();
  }, [flotaId]);

  const recargar = async () => {
    if (!flotaId) {
      setConductores([]);
      setViajesConductores({});
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const { conductores: conds, viajesCond } = await obtenerConductoresFlotaConViajes(flotaId);
      setConductores(conds);
      setViajesConductores(viajesCond);
      setError(null);
    } catch (err) {
      setError(err);
      console.error("Error en useConductoresFlotaConViajes:", err);
    } finally {
      setLoading(false);
    }
  };

  return { conductores, viajesConductores, loading, error, recargar };
};
