// src/pages/admin/banner/hooks/useBannerForm.js
import { useCallback, useMemo, useRef, useState } from "react";
import { createBanner } from "../../../../data/banners/bannerRepository";

export default function useBannerForm() {
  const inputRef = useRef(null);
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState("");
  const [titulo, setTitulo] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // Abre el selector nativo
  const abrirSelector = useCallback(() => inputRef.current?.click(), []);

  // Maneja cambio de archivo y arma preview
  const onChangeInput = useCallback((e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f);

    const url = URL.createObjectURL(f);
    setPreview((old) => {
      if (old) URL.revokeObjectURL(old);
      return url;
    });
  }, []);

  // Guardar: sube la imagen y crea registro en Firestore
  const save = useCallback(async () => {
    if (!file) throw new Error("Debes seleccionar una imagen antes de guardar");
    if (!titulo.trim()) throw new Error("Debes ingresar un título para el banner");

    setSaving(true);
    setError("");

    try {
      const banner = await createBanner(file, titulo); // sube a Storage y crea doc
      return banner; // { id, imagen, estado, titulo }
    } catch (err) {
      console.error("[hook] ❌ save() error:", err?.code || err?.message, err);
      setError(err?.code || err?.message || "Error al guardar");
      throw err; // re-lanza para que Banners.jsx también lo vea en su catch
    } finally {
      setSaving(false);
    }
  }, [file, titulo]);

  const api = useMemo(
    () => ({ inputRef, abrirSelector, onChangeInput, preview, saving, error, save, titulo, setTitulo }),
    [preview, saving, error, abrirSelector, onChangeInput, save, titulo]
  );

  return api;
}
