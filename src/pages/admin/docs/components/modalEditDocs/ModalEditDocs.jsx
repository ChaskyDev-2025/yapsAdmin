import { useEffect, useState } from "react";
import { Button, Stack, FormControlLabel, Checkbox, Box, Typography } from "@mui/material";
import DescriptionRoundedIcon from "@mui/icons-material/DescriptionRounded";

import {
  Modal1,
  ModalHeader,
  ModalTwoColumn,
  AppDialogActions,
} from "../../../../../shared/components/modal/modal"; // o usa ruta relativa si no tenés alias

import DatosGenerales     from "../modalEditDocs/DatosGenerales";
import InputsEditor       from "../modalEditDocs/InputsEditor";
import FileSectionsEditor from "../modalEditDocs/FileSectionsEditor";
import VistaPreviaMovil   from "../modalEditDocs/VistaPreviaMovil";
import useInputs          from "../modalEditDocs/useInputs";
import useFileSections    from "../modalEditDocs/useFileSections";

const ModalEditDocs = ({ open, onClose, documento, onSave }) => {
  const [nombreCaja, setNombreCaja] = useState("");
  const [titulo, setTitulo]         = useState("");
  const [subtitulo, setSubtitulo]   = useState("");
  const [esDocumentoSistema, setEsDocumentoSistema] = useState(false);
  const [openWarning, setOpenWarning] = useState(false);

  const {
    inputs, agregarInput, eliminarInput, actualizarInput, setInputs
  } = useInputs();

  const {
    fileSections, agregarFile, eliminarFile, actualizarFile, setFileSections
  } = useFileSections();

  // ✅ Prellenar cuando cambia el documento
  useEffect(() => {
    if (documento) {
      setNombreCaja(documento.title || "");
      setTitulo(documento.screenTitle || "");
      setSubtitulo(documento.screenSubtitle || "");
      setInputs(documento.inputs || []);
      setFileSections(documento.fileSections || []);
      setEsDocumentoSistema(documento.esDocumentoSistema || false);
    }
  }, [documento]);

  const handleGuardarCambios = () => {
    onSave({
      ...documento, // importante para mantener firebaseId u otros datos
      title: nombreCaja,
      screenTitle: titulo,
      screenSubtitle: subtitulo,
      inputs,
      fileSections,
      titulo: titulo,
      esDocumentoSistema: esDocumentoSistema,
    });
    onClose();
  };

  const handleChangeDocumentoSistema = (newValue) => {
    if (newValue && !documento?.esDocumentoSistema) {
      // Si intenta activar y no estaba activado, mostrar advertencia
      setOpenWarning(true);
    } else {
      // Si lo desactiva, permitir sin advertencia
      setEsDocumentoSistema(newValue);
    }
  };

  return (
    <>
      <Modal1 open={open} onClose={onClose} maxWidth="lg" fullWidth>
        <ModalHeader
          title="Editar documento"
          icon={<DescriptionRoundedIcon />}
          onClose={onClose}
        />

        <ModalTwoColumn
          left={
            <Stack spacing={2}>
            {/* Aviso si el documento está protegido */}
            {documento?.esDocumentoSistema && (
              <Box sx={{ backgroundColor: "#fff3e0", border: "2px solid #ff9800", borderRadius: 1, p: 2 }}>
                <Typography sx={{ fontWeight: 700, color: "#ff9800", mb: 1 }}>
                  ⚠️ Documento Protegido
                </Typography>
                <Typography variant="body2" sx={{ color: "#333" }}>
                  Este documento está protegido como documento del sistema. No se puede editar ni guardar cambios.
                </Typography>
              </Box>
            )}
            
            <DatosGenerales
              nombreCaja={nombreCaja} setNombreCaja={setNombreCaja}
              titulo={titulo}         setTitulo={setTitulo}
              subtitulo={subtitulo}   setSubtitulo={setSubtitulo}
            />

            {/* Checkbox para marcar como documento del sistema */}
            <Box sx={{ p: 2, backgroundColor: documento?.esDocumentoSistema ? "#fff3e0" : "#f5f5f5", borderRadius: 1, border: documento?.esDocumentoSistema ? "1px solid #ff9800" : "1px solid #ddd" }}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={esDocumentoSistema}
                    onChange={(e) => handleChangeDocumentoSistema(e.target.checked)}
                    color="warning"
                    disabled={documento?.esDocumentoSistema}
                  />
                }
                label={
                  <Box>
                    <Typography sx={{ fontWeight: 600, color: documento?.esDocumentoSistema ? "#ff9800" : "#333" }}>
                      Proteger como documento del sistema
                    </Typography>
                    <Typography variant="caption" sx={{ color: "#666", display: "block", mt: 0.5 }}>
                      {documento?.esDocumentoSistema ? "✓ Este documento está protegido" : "La app móvil depende de este documento"}
                    </Typography>
                  </Box>
                }
              />
            </Box>

              <InputsEditor
                inputs={inputs}
                agregarInput={agregarInput}
                eliminarInput={eliminarInput}
                actualizarInput={actualizarInput}
              />

              <FileSectionsEditor
                fileSections={fileSections}
                agregarFile={agregarFile}
                eliminarFile={eliminarFile}
                actualizarFile={actualizarFile}
              />
            </Stack>
          }
          right={
            <VistaPreviaMovil
              nombreCaja={nombreCaja}
              titulo={titulo}
              subtitulo={subtitulo}
              inputs={inputs}
              fileSections={fileSections}
            />
          }
        />

        <AppDialogActions>
          <Button onClick={onClose}>Cancelar</Button>
          <Button 
            variant="contained" 
            color="primary" 
            onClick={handleGuardarCambios}
            disabled={documento?.esDocumentoSistema}
            title={documento?.esDocumentoSistema ? "Este documento está protegido y no se puede editar" : ""}
          >
            Guardar cambios
          </Button>
        </AppDialogActions>
      </Modal1>

      {/* Modal de advertencia para proteger documento */}
      {openWarning && (
        <Box
          sx={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0, 0, 0, 0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1400,
          }}
          onClick={() => setOpenWarning(false)}
        >
          <Box
            sx={{
              backgroundColor: "white",
              borderRadius: 2,
              p: 3,
              maxWidth: 500,
              boxShadow: "0 8px 32px rgba(0,0,0,0.2)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <Typography variant="h6" sx={{ fontWeight: 700, color: "#d7171a", mb: 2 }}>
              ⚠️ Documento del Sistema
            </Typography>
            <Typography sx={{ mb: 2, fontWeight: 600 }}>
              Vas a marcar este documento como documento del sistema.
            </Typography>
            <Box sx={{ backgroundColor: "#fff3e0", p: 2, borderRadius: 1, mb: 2, border: "1px solid #ff9800" }}>
              <Typography variant="body2" sx={{ mb: 1, fontWeight: 600 }}>
                ⚠️ Consecuencias:
              </Typography>
              <Typography variant="body2" sx={{ color: "#333", lineHeight: 1.8 }}>
                • Este documento NO podrá ser editado ni eliminado<br />
                • La app móvil depende de este documento<br />
                • Solo podrá ser modificado por un administrador técnico<br />
                • Esta acción es prácticamente permanente
              </Typography>
            </Box>
            <Typography variant="body2" sx={{ color: "#666", fontStyle: "italic", mb: 3 }}>
              Esta protección es importante para evitar que la app móvil falle.
            </Typography>
            <Box sx={{ display: "flex", gap: 1, justifyContent: "flex-end" }}>
              <Button 
                onClick={() => {
                  setOpenWarning(false);
                }}
                variant="outlined"
              >
                Cancelar
              </Button>
              <Button 
                onClick={() => {
                  setEsDocumentoSistema(true);
                  setOpenWarning(false);
                }} 
                color="warning" 
                variant="contained"
              >
                Sí, Proteger Documento
              </Button>
            </Box>
          </Box>
        </Box>
      )}
    </>
  );
};

export default ModalEditDocs;
