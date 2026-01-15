import React from "react";
import {
  Stack,
  Avatar,
  Button,
  Box,
} from "@mui/material";
import UploadIcon from "@mui/icons-material/Upload";

const PerfilFoto = ({ preview, onFotoChange }) => {
  return (
    <Stack spacing={3} alignItems="center">
      <Avatar
        src={preview}
        alt="Foto de perfil"
        sx={{ width: 120, height: 120 }}
      />

      <Button
        variant="outlined"
        component="label"
        startIcon={<UploadIcon />}
      >
        Cambiar foto
        <input
          type="file"
          accept="image/*"
          hidden
          onChange={onFotoChange}
        />
      </Button>
    </Stack>
  );
};

export default PerfilFoto;
