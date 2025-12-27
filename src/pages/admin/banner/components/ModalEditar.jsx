// src/pages/admin/banner/components/ModalEditar.jsx
import { useEffect } from "react";
import { Box, Typography, Stack, TextField } from "@mui/material";
import Icons from "../../../../shared/constants/Icons";
import useBannerFormEditar from "../hooks/useBannerFormEditar";

const ModalEditar = ({ banner, onReady }) => {
  const { preview, inputRef, onChangeInput, saving, error, save, titulo, setTitulo, linkBanner, setLinkBanner } = useBannerFormEditar(banner);

  useEffect(() => {
    if (typeof onReady === "function") onReady({ save, saving });
  }, [onReady, save, saving]);

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
      {/* Campo de Título */}
      <TextField
        fullWidth
        label="Título del Banner"
        placeholder="Ej: Promoción de verano"
        value={titulo}
        onChange={(e) => setTitulo(e.target.value)}
        variant="outlined"
        size="small"
        sx={{
          mt: 2,
          "& .MuiOutlinedInput-root": {
            "&:hover fieldset": {
              borderColor: "#d7171a",
            },
            "&.Mui-focused fieldset": {
              borderColor: "#d7171a",
            },
          },
        }}
      />

      {/* Campo de Link del Banner */}
      <TextField
        fullWidth
        label="Link del Banner"
        placeholder="Ej: https://ejemplo.com"
        value={linkBanner}
        onChange={(e) => setLinkBanner(e.target.value)}
        variant="outlined"
        size="small"
        sx={{
          "& .MuiOutlinedInput-root": {
            "&:hover fieldset": {
              borderColor: "#d7171a",
            },
            "&.Mui-focused fieldset": {
              borderColor: "#d7171a",
            },
          },
        }}
      />

      {/* Área de carga/actualización de imagen */}
      <Box sx={{ mt: 3 }}>
        <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 600, color: "#484848" }}>
          📸 Imagen del Banner
        </Typography>
        <Box 
          onClick={() => inputRef.current?.click()} 
          sx={{ 
            width:"100%", 
            minHeight: 200, 
            border:"2px dashed #d7171a", 
            borderRadius: 2, 
            display:"flex", 
            alignItems:"center", 
            justifyContent:"center", 
            cursor:"pointer", 
            overflow:"hidden",
            backgroundColor: "#f9f9f9",
            transition: "all 0.3s ease",
            "&:hover": {
              backgroundColor: "#ffe0e0",
              borderColor: "#b01217",
            }
          }}
        >
          {preview ? (
            <Box component="img" src={preview} alt="preview" sx={{ width:"100%", height:"100%", objectFit:"cover" }} />
          ) : (
            <Stack direction="column" alignItems="center" spacing={1}>
              <Icons.Camera sx={{ fontSize: 50, color: "#d7171a" }} />
              <Typography variant="body2" color="text.secondary" sx={{ textAlign: "center" }}>
                Haz clic o arrastra una imagen aquí
              </Typography>
            </Stack>
          )}
          <input ref={inputRef} type="file" accept="image/*" hidden onChange={onChangeInput} />
        </Box>
      </Box>

      {/* Recomendación de tamaño */}
      <Typography variant="caption" sx={{ fontStyle: "italic", fontSize: 13, color: "#666", mt: 1 }}>
        📏 Recomendamos imágenes de 1200×400 px (relación 3:1) para mejor calidad.
      </Typography>

      {/* Mensaje de error */}
      {error && (
        <Typography color="error" variant="body2" sx={{ mt: 1 }}>
          ⚠️ {error}
        </Typography>
      )}
    </Box>
  );
};

export default ModalEditar;
