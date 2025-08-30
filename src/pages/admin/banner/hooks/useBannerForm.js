// src/pages/admin/banner/hooks/useBannerForm.js
import { useCallback, useMemo, useRef, useState } from "react";
import { createBanner } from "../../../../data/banners/bannerRepository";

export default function useBannerForm() {
  const inputRef = useRef(null);
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // Abre el selector nativo
  const abrirSelector = useCallback(() => inputRef.current?.click(), []);

  // Maneja cambio de archivo y arma preview
  const onChangeInput = useCallback((e) => {
    const f = e.target.files?.[0];
    console.log("HOOK ▶️ archivo seleccionado:", f?.name, f?.size, f?.type);
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
    console.log("HOOK ▶️ save() llamado. file:", file?.name, file?.size);
    if (!file) throw new Error("Debes seleccionar una imagen antes de guardar");

    setSaving(true);
    setError("");

    try {
      const banner = await createBanner(file); // sube a Storage y crea doc
      console.log("HOOK ✅ createBanner() devolvió:", banner);
      return banner; // { id, imagen, estado }
    } catch (err) {
      console.error("[hook] ❌ save() error:", err?.code || err?.message, err);
      setError(err?.code || err?.message || "Error al guardar");
      throw err; // re-lanza para que Banners.jsx también lo vea en su catch
    } finally {
      setSaving(false);
    }
  }, [file]);

  const api = useMemo(
    () => ({ inputRef, abrirSelector, onChangeInput, preview, saving, error, save }),
    [preview, saving, error, abrirSelector, onChangeInput, save]
  );

  return api;
}
