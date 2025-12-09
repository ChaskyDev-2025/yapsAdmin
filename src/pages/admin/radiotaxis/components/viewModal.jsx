import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, Box, IconButton, Divider, Chip, Stack, Tooltip,
  Menu, MenuItem, ListItemIcon, ListItemText, Typography
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import ArticleIcon from "@mui/icons-material/Article";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import HourglassBottomIcon from "@mui/icons-material/HourglassBottom";
import CancelIcon from "@mui/icons-material/Cancel";
import ImageNotSupportedIcon from "@mui/icons-material/ImageNotSupported";
import DownloadIcon from "@mui/icons-material/Download";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import { useEffect, useMemo, useState } from "react";

const ESTADO_META = {
  aprobado:     { label: "Aprobado",    color: "success",  icon: <CheckCircleIcon sx={{ fontSize: 16 }} /> },
  pendiente:    { label: "Pendiente",   color: "warning",  icon: <HourglassBottomIcon sx={{ fontSize: 16 }} /> },
  rechazado:    { label: "Rechazado",   color: "error",    icon: <CancelIcon sx={{ fontSize: 16 }} /> },
  "sin imagen": { label: "Sin imagen",  color: "default",  icon: <ImageNotSupportedIcon sx={{ fontSize: 16 }} /> },
};

export default function ViewModal({ open, doc, onClose, onSaveEstado }) {
  const initialEstado = useMemo(() => {
    if (!doc) return "pendiente";
    return doc.estado ?? (doc.preview ? "pendiente" : "sin imagen");
  }, [doc]);

  const [estado, setEstado] = useState(initialEstado);
  const [imgError, setImgError] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);

  const images = useMemo(() => {
    if (!doc?.files) return [];
    return Object.entries(doc.files)
      .filter(([, v]) => typeof v === "string" && /^https?:\/\//.test(v))
      .map(([key, url]) => ({ key, url }));
  }, [doc]);

  const [idx, setIdx] = useState(0);
  useEffect(() => { setIdx(0); setImgError(false); }, [doc, images.length]);

  useEffect(() => {
    setEstado(initialEstado);
    setImgError(false);
  }, [initialEstado]);

  const meta = ESTADO_META[String(estado).toLowerCase()] ?? ESTADO_META.pendiente;

  const openMenu = Boolean(anchorEl);
  const handleChipClick = (e) => setAnchorEl(e.currentTarget);
  const handleCloseMenu = () => setAnchorEl(null);
  const handleSelectEstado = (value) => {
    setEstado(value);
    handleCloseMenu();
  };

  const handleGuardar = () => {
    onSaveEstado?.(estado, doc);
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="sm"
      PaperProps={{
        sx: {
          p: 0,
          borderRadius: 3,
          overflow: "hidden",
          boxShadow: "0 12px 32px rgba(182, 0, 0, 0.18)",
        },
      }}
    >
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          px: 3,
          py: 2,
          gap: 2,
          bgcolor: "background.paper",
          borderBottom: "1px solid",
          borderColor: "divider",
        }}
      >
        <DialogTitle sx={{ flexGrow: 1, p: 0, fontWeight: 700 }}>
          {typeof doc?.nombre === 'string' ? doc.nombre : 'Documento'}
        </DialogTitle>

        <Tooltip title={`Estado: ${meta.label}`}>
          <Chip
            size="medium"
            icon={meta.icon}
            label={meta.label}
            color={meta.color}
            variant={meta.color === "default" ? "outlined" : "filled"}
            sx={{
              fontWeight: 700,
              cursor: "pointer",
              height: 34,
              px: 1.25,
              borderRadius: 1.25,                 // más cuadrado
              boxShadow: "2px 2px 4px rgb(0, 0, 0)",
              "&:hover": { boxShadow: "3px 3px 5px rgb(0, 0, 0)" },
            }}
            onClick={handleChipClick}
            aria-controls={openMenu ? "menu-estado" : undefined}
            aria-haspopup="true"
            aria-expanded={openMenu ? "true" : undefined}
          />
        </Tooltip>

        <Menu
          id="menu-estado"
          anchorEl={anchorEl}
          open={openMenu}
          onClose={handleCloseMenu}
          elevation={0}
          transformOrigin={{ horizontal: "right", vertical: "top" }}
          anchorOrigin={{ horizontal: "right", vertical: "bottom" }}
          PaperProps={{
            sx: {
              borderRadius: 1.25,                 // más cuadrado
              minWidth: 260,                      // un poco más grande
              border: "1px solid rgba(0,0,0,0.12)",
              boxShadow: "0 18px 46px rgba(0,0,0,0.28)", // sombreado marcado
              p: 0.5,
            },
          }}
          MenuListProps={{ sx: { py: 0.5 } }}
        >
          <MenuItem sx={{ py: 1.1, px: 1.5 }} onClick={() => handleSelectEstado("pendiente")}>
            <ListItemIcon sx={{ minWidth: 34 }}><HourglassBottomIcon sx={{ fontSize: 20 }} /></ListItemIcon>
            <ListItemText primaryTypographyProps={{ fontSize: 15, fontWeight: 500 }}>Pendiente</ListItemText>
          </MenuItem>
          <MenuItem sx={{ py: 1.1, px: 1.5 }} onClick={() => handleSelectEstado("aprobado")}>
            <ListItemIcon sx={{ minWidth: 34 }}><CheckCircleIcon sx={{ fontSize: 20 }} /></ListItemIcon>
            <ListItemText primaryTypographyProps={{ fontSize: 15, fontWeight: 500 }}>Aprobado</ListItemText>
          </MenuItem>
          <MenuItem sx={{ py: 1.1, px: 1.5 }} onClick={() => handleSelectEstado("rechazado")}>
            <ListItemIcon sx={{ minWidth: 34 }}><CancelIcon sx={{ fontSize: 20 }} /></ListItemIcon>
            <ListItemText primaryTypographyProps={{ fontSize: 15, fontWeight: 500 }}>Rechazado</ListItemText>
          </MenuItem>
          <MenuItem sx={{ py: 1.1, px: 1.5 }} onClick={() => handleSelectEstado("sin imagen")}>
            <ListItemIcon sx={{ minWidth: 34 }}><ImageNotSupportedIcon sx={{ fontSize: 20 }} /></ListItemIcon>
            <ListItemText primaryTypographyProps={{ fontSize: 15, fontWeight: 500 }}>Sin imagen</ListItemText>
          </MenuItem>
        </Menu>

        <IconButton onClick={onClose} size="small" sx={{ ml: 1 }}>
          <CloseIcon />
        </IconButton>
      </Box>

      <DialogContent sx={{ p: 3, bgcolor: "background.default" }}>
        <Box
          sx={{
            border: "1px solid",
            borderColor: "divider",
            bgcolor: "background.paper",
            borderRadius: 2,
            p: 2,
            boxShadow: "inset 0 1px 0 rgba(255,255,255,0.4)",
          }}
        >
          {images.length > 0 && !imgError ? (
            <>
              <Box
                sx={{
                  position: "relative",
                  minHeight: 320,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Box
                  component="img"
                  src={images[idx].url}
                  alt={`${typeof doc?.nombre === 'string' ? doc.nombre : 'Documento'} - ${images[idx].key}`}
                  onError={() => setImgError(true)}
                  sx={{ maxWidth: "100%", maxHeight: "60vh", objectFit: "contain", borderRadius: 1 }}
                />

                {images.length > 1 && (
                  <>
                    <IconButton
                      size="medium"
                      onClick={() => { setIdx((idx - 1 + images.length) % images.length); setImgError(false); }}
                      sx={{
                        position: "absolute",
                        left: 10,
                        top: "50%",
                        transform: "translateY(-50%)",
                        zIndex: 2,
                        color: "#fff",
                        bgcolor: "rgba(0,0,0,0.55)",     // fondo oscuro constante
                        border: "1px solid rgba(255,255,255,0.35)",
                        boxShadow: "0 8px 24px rgba(0,0,0,0.35)",
                        backdropFilter: "blur(2px)",
                        "&:hover": {
                          bgcolor: "rgba(0,0,0,0.7)",
                          boxShadow: "0 10px 30px rgba(0,0,0,0.5)",
                        },
                      }}
                    >
                      <ChevronLeftIcon sx={{ fontSize: 28 }} />
                    </IconButton>

                    <IconButton
                      size="medium"
                      onClick={() => { setIdx((idx + 1) % images.length); setImgError(false); }}
                      sx={{
                        position: "absolute",
                        right: 10,
                        top: "50%",
                        transform: "translateY(-50%)",
                        zIndex: 2,
                        color: "#fff",
                        bgcolor: "rgba(0,0,0,0.55)",
                        border: "1px solid rgba(255,255,255,0.35)",
                        boxShadow: "0 8px 24px rgba(0,0,0,0.35)",
                        backdropFilter: "blur(2px)",
                        "&:hover": {
                          bgcolor: "rgba(0,0,0,0.7)",
                          boxShadow: "0 10px 30px rgba(0,0,0,0.5)",
                        },
                      }}
                    >
                      <ChevronRightIcon sx={{ fontSize: 28 }} />
                    </IconButton>

                    <Box
                      sx={{
                        position: "absolute",
                        bottom: 8,
                        left: 0,
                        right: 0,
                        textAlign: "center",
                        fontSize: 12,
                        opacity: 0.9,
                        color: "#fff",
                        textShadow: "0 1px 2px rgba(0,0,0,0.6)",
                      }}
                    >
                      {idx + 1} / {images.length} — {images[idx].key}
                    </Box>
                  </>
                )}
              </Box>

              {images.length > 1 && (
                <Stack direction="row" spacing={1} sx={{ mt: 2, overflowX: "auto" }}>
                  {images.map((im, i) => (
                    <Box
                      key={im.key}
                      component="img"
                      src={im.url}
                      alt={im.key}
                      onClick={() => { setIdx(i); setImgError(false); }}
                      sx={{
                        width: 72,
                        height: 72,
                        objectFit: "cover",
                        borderRadius: 1,
                        cursor: "pointer",
                        border: i === idx ? "2px solid" : "1px solid",
                        borderColor: i === idx ? "primary.main" : "divider",
                      }}
                    />
                  ))}
                </Stack>
              )}
            </>
          ) : (
            <Stack alignItems="center" justifyContent="center" sx={{ minHeight: 320, color: "text.secondary" }} spacing={1}>
              <ArticleIcon sx={{ fontSize: 80 }} />
              <Box sx={{ fontSize: 13 }}>
                {estado === "sin imagen" ? "No hay imagen para este documento" : "Vista previa no disponible"}
              </Box>
            </Stack>
          )}
        </Box>

        {doc?.data && (
          <Box sx={{ mt: 3 }}>
            <Divider sx={{ mb: 2 }} />
            <Stack spacing={1}>
              {Object.entries(doc.data).map(([key, value]) => (
                <Typography key={key} variant="body2" sx={{ fontSize: 15 }}>
                  <b>{key}:</b> {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                </Typography>
              ))}
            </Stack>
          </Box>
        )}
      </DialogContent>

      <Divider />

      <DialogActions
        sx={{
          px: 3,
          py: 2,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          bgcolor: "background.paper",
        }}
      >
        <Box />
        <Stack direction="row" spacing={1}>
          <Button variant="outlined" onClick={onClose}>
            Cerrar
          </Button>
          <Button
            variant="contained"
            startIcon={<DownloadIcon />}
            href={(images[idx]?.url) || doc?.url}
            target="_blank"
            rel="noopener noreferrer"
            disabled={!images[idx]?.url && (!doc?.url || doc?.url === "#")}
          >
            Descargar
          </Button>
          <Button variant="contained" color="success" onClick={handleGuardar}>
            Guardar
          </Button>
        </Stack>
      </DialogActions>
    </Dialog>
  );
}
