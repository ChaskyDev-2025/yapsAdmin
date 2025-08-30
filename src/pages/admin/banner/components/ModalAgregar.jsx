// src/pages/admin/banner/components/ModalAgregar.jsx
import { useEffect } from "react";
import { Box, Typography, Stack } from "@mui/material";
import Icons from "../../../../shared/constants/Icons";
import useBannerForm from "../hooks/useBannerForm";

const ModalAgregar = ({ onReady }) => {
  const { preview, inputRef, abrirSelector, onChangeInput, saving, error, save } = useBannerForm();

  useEffect(() => {
    if (typeof onReady === "function") onReady({ save, saving });
  }, [onReady, save, saving]);

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
      <Box onClick={() => inputRef.current?.click()} sx={{ width:"100%", minHeight:180, border:"2px dashed #9e9e9e", borderRadius:2, display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer", overflow:"hidden" }}>
        {preview ? (
          <Box component="img" src={preview} alt="preview" sx={{ width:"100%", height:"100%", objectFit:"cover" }} />
        ) : (
          <Stack direction="column" alignItems="center" spacing={1}>
            <Icons.Camera sx={{ fontSize: 40, color: "#9e9e9e" }} />
            <Typography variant="body2" color="text.secondary">Haz clic o arrastra una imagen aquí</Typography>
          </Stack>
        )}
        <input ref={inputRef} type="file" accept="image/*" hidden onChange={onChangeInput} />
      </Box>
      <Typography variant="caption" sx={{ fontStyle: "italic", fontSize: 15 }}>
        📏 Usa imágenes de 1200×400 px (3:1).
      </Typography>
      {error && <Typography color="error">{error}</Typography>}
    </Box>
  );
};

export default ModalAgregar;
