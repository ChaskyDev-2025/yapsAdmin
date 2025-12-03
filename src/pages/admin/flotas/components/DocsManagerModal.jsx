// src/pages/admin/flotas/components/DocsManagerModal.jsx
import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Chip,
  Alert,
} from "@mui/material";
import ArticleIcon from "@mui/icons-material/Article";
import CheckIcon from '@mui/icons-material/Check';
import CloseIcon from '@mui/icons-material/Close';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../../../../data/firebase/firebase';

export const DocsManagerModal = ({
  open,
  onClose,
  flota,
  onAssignTemplates,
}) => {
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [templates, setTemplates] = useState([]);
  const [selectedTemplates, setSelectedTemplates] = useState([]);

  useEffect(() => {
    if (!assignDialogOpen) return;
    const fetchTemplates = async () => {
      try {
        const tplRef = collection(db, 'crear-documentos');
        const snap = await getDocs(tplRef);
        const items = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        setTemplates(items);
      } catch (err) {
        console.error('Error cargando plantillas:', err);
      }
    };
    fetchTemplates();
  }, [assignDialogOpen]);

  useEffect(() => {
    // precargar selección si la flota ya tiene plantillas asignadas
    const assigned = flota?.documentosFlota?.documentosAsignados || [];
    setSelectedTemplates(assigned.map(a => ({ id: a.id, titulo: a.titulo || a.nombre || a.title || a.name })));
  }, [flota, open]);
  return (
    <>
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle
        sx={{
          bgcolor: "#d7171a",
          color: "white",
          fontFamily: "Mulish, sans-serif",
          fontWeight: 700,
        }}
      >
        📂 Gestión de Documentos - {flota?.nombre}
      </DialogTitle>
      <DialogContent sx={{ mt: 2 }}>
        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 2 }}>
          <Typography variant="h6" sx={{ fontFamily: "Mulish, sans-serif", fontWeight: 600 }}>
            Plantillas de Documentos
          </Typography>
          <Button
            variant="outlined"
            size="small"
            startIcon={<ArticleIcon />}
            onClick={() => setAssignDialogOpen(true)}
            sx={{
              borderColor: "#1976d2",
              color: "#1976d2",
              fontFamily: "Mulish, sans-serif",
              fontWeight: 600,
              "&:hover": { borderColor: "#115293", bgcolor: "rgba(25,118,210,0.04)" },
            }}
          >
            Asignar Plantilla
          </Button>
        </Box>

        {(flota && flota.documentosFlota && Array.isArray(flota.documentosFlota.documentosAsignados) && flota.documentosFlota.documentosAsignados.length > 0) ? (
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            {flota.documentosFlota.documentosAsignados.map((tpl, i) => (
              <Chip 
                key={tpl.id || i} 
                label={tpl.titulo || tpl.nombre || tpl.name || tpl.id} 
                color="primary"
                onDelete={() => {
                  const updated = flota.documentosFlota.documentosAsignados.filter(p => p.id !== tpl.id);
                  if (onAssignTemplates) onAssignTemplates(updated);
                }}
              />
            ))}
          </Box>
        ) : (
          <Alert severity="info" sx={{ fontFamily: "Mulish, sans-serif" }}>
            No hay documentos asignados. Haz clic en "Asignar Documento" para comenzar.
          </Alert>
        )}
      </DialogContent>
      <DialogActions sx={{ p: 2 }}>
        <Button onClick={onClose} sx={{ fontFamily: "Mulish, sans-serif", fontWeight: 600, color: "#484848" }}>
          Cerrar
        </Button>
      </DialogActions>
    </Dialog>

    {/* Dialogo para asignar plantillas globales */}
    <Dialog open={assignDialogOpen} onClose={() => setAssignDialogOpen(false)} maxWidth="sm" fullWidth>
      <DialogTitle>Asignar Plantillas a {flota?.nombre}</DialogTitle>
      <DialogContent>
        <Box sx={{ mt: 1 }}>
          {templates.length === 0 ? (
            <Typography sx={{ fontFamily: 'Mulish, sans-serif' }}>No hay plantillas disponibles</Typography>
          ) : (
            templates.map((tpl) => {
              const isSelected = selectedTemplates.some(s => s.id === tpl.id);
              return (
                <Box key={tpl.id} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', py: 0.5 }}>
                  <Typography sx={{ fontFamily: 'Mulish, sans-serif' }}>{tpl.titulo || tpl.nombre || tpl.nombrePlantilla || tpl.id}</Typography>
                  <Button size="small" variant={isSelected ? 'contained' : 'outlined'} onClick={() => {
                    if (isSelected) setSelectedTemplates(prev => prev.filter(p => p.id !== tpl.id));
                    else setSelectedTemplates(prev => [...prev, { id: tpl.id, titulo: tpl.titulo || tpl.nombre || tpl.id }]);
                  }}>{isSelected ? <><CheckIcon fontSize="small" sx={{ mr: .5 }} />Seleccionado</> : 'Seleccionar'}</Button>
                </Box>
              );
            })
          )}
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={() => setAssignDialogOpen(false)} startIcon={<CloseIcon />}>Cancelar</Button>
        <Button onClick={() => {
          // Pasar las plantillas seleccionadas al padre
          if (onAssignTemplates) onAssignTemplates(selectedTemplates);
          setAssignDialogOpen(false);
        }} variant="contained">Asignar</Button>
      </DialogActions>
    </Dialog>
    </>
  );
};
