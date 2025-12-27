// src/pages/admin/banner/hooks/useBannerFormEditar.js
import { useCallback, useMemo, useRef, useState } from "react";
import { updateBanner } from "../../../../data/banners/bannerRepository";

export default function useBannerFormEditar(bannerInicial) {
  const inputRef = useRef(null);
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(bannerInicial?.imagen || "");
  const [titulo, setTitulo] = useState(bannerInicial?.titulo || "");
  const [linkBanner, setLinkBanner] = useState(bannerInicial?.linkBanner || "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // Maneja cambio de archivo y arma preview
  const onChangeInput = useCallback((e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f);

    const url = URL.createObjectURL(f);
    setPreview((old) => {
      if (old && old.startsWith("blob:")) URL.revokeObjectURL(old);
      return url;
    });
  }, []);

  // Guardar: actualiza en Firestore (puede o no tener imagen nueva)
  const save = useCallback(async () => {
    if (!titulo.trim()) throw new Error("Debes ingresar un título para el banner");

    setSaving(true);
    setError("");

    try {
      const banner = await updateBanner(bannerInicial.id, titulo, file, linkBanner); // actualiza título, link y opcionalmente imagen
      return banner;
    } catch (err) {
      console.error("[hook] ❌ save() error:", err?.code || err?.message, err);
      setError(err?.code || err?.message || "Error al guardar");
      throw err;
    } finally {
      setSaving(false);
    }
  }, [file, titulo, linkBanner, bannerInicial.id]);

  const api = useMemo(
    () => ({ inputRef, onChangeInput, preview, saving, error, save, titulo, setTitulo, setPreview, linkBanner, setLinkBanner }),
    [preview, saving, error, onChangeInput, save, titulo, linkBanner]
  );

  return api;
}
