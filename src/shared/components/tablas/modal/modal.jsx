import { Modal, Box, Typography, IconButton, Divider, Button } from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";

const CustomModal = ({
  open,
  onClose,
  title,
  children,
  footerButtons = [],
}) => {
  const commonBtnStyle = {
    backgroundColor: "#d7171a",
    color: "#fff",
    textTransform: "none",
    borderRadius: 2,
    px: 2,
    "&:hover": { backgroundColor: "#b01217" },
  };

  // Dividir por posición
  const leftButtons = footerButtons.filter(btn => btn.position === "left");
  const rightButtons = footerButtons.filter(btn => btn.position !== "left");

  return (
    <Modal open={open} onClose={onClose}
      /* 👇 desenfoque + oscurecido del fondo */
      BackdropProps={{
        sx: {
          backdropFilter: "blur(4px)",
          backgroundColor: "rgba(0,0,0,0.3)",  // opcional, quita si no quieres tinte
        },
      }}
    >
      <Box
        sx={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          bgcolor: "#fff",
          borderRadius: 4,
          p: 0,
          width: "90%",
          maxWidth: 600,
          boxShadow: "0px 10px 30px rgba(0,0,0,.66)",
          outline: "none",
        }}
      >
        {/* Header */}
        <Box sx={{ display:"flex", justifyContent:"space-between", alignItems:"center", px:3, py:2 }}>
          {title && <Typography variant="h6" fontWeight="bold">{title}</Typography>}
          <IconButton onClick={onClose}><CloseIcon/></IconButton>
        </Box>

        <Divider sx={{ borderColor:"#000", borderBottomWidth:1 }} />

        {/* Body */}
        <Box sx={{ px:3, py:2 }}>{children}</Box>

        {/* Footer */}
        {(leftButtons.length > 0 || rightButtons.length > 0) && (
          <>
            <Divider sx={{ borderColor:"#000", borderBottomWidth:1 }} />
            <Box sx={{ px:3, py:2, display:"flex", justifyContent:"space-between", flexWrap:"wrap" }}>
              {/* Izquierda */}
              <Box sx={{ display: "flex", gap: 1 }}>
                {leftButtons.map((btn, i) => (
                  <Button
                    key={`left-${i}`}
                    onClick={btn.onClick}
                    startIcon={btn.label && btn.icon ? btn.icon : undefined}
                    variant="contained"
                    sx={commonBtnStyle}
                  >
                    {btn.label ?? btn.icon}
                  </Button>
                ))}
              </Box>
              {/* Derecha */}
              <Box sx={{ display: "flex", gap: 1 }}>
                {rightButtons.map((btn, i) => (
                <Button
                  key={`right-${i}`}
                  onClick={btn.onClick}
                  variant="contained"
                  sx={commonBtnStyle}
                  startIcon={btn.label && btn.icon ? btn.icon : undefined}
                >
                  {btn.label ? btn.label : btn.icon}
                </Button>

                ))}
              </Box>
            </Box>
          </>
        )}
      </Box>
    </Modal>
  );
};

export default CustomModal;

/* Ejemplo de uso:
<CustomModal
  open={modalOpen}
  onClose={() => setModalOpen(false)}
  title="Título del Modal"
  footerButtons={[
    { label: "Cancelar", onClick: () => setModalOpen(false), position: "left" },
    { label: "Guardar", onClick: handleSave, position: "right" },
    { icon: <SomeIcon />, onClick: handleIconAction, position: "right" },
  ]}
>
  <Typography>Contenido del modal...</Typography>
</CustomModal>
*/
