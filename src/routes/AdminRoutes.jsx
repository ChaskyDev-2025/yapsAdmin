//En este Apartado seleccionas la Ruta de tu panel de administración
//y las rutas de las diferentes páginas que componen el panel de administración
import React from "react";
import { Routes, Route } from "react-router-dom";
import AdminLayout from "../layouts/AdminLayout";
import Dashboard from "../pages/admin/dashboard/Dashboard";
import GestionUsuarios from "../pages/admin/usuarios/GestionUsuarios";
import Radiotaxis from "../pages/admin/radiotaxis/Radiotaxis";
import Ajustes from "../pages/admin/ajustes/Ajustes";
import Landing from "../pages/admin/landing/Landing";
import Onboarding from "../pages/admin/onboarding/Onboarding";
import Banners from "../pages/admin/banner/Banners";
import Personalizar from "../pages/admin/personalizar/Personalizar";
import Perfil from "../pages/admin/perfil/Perfil";
import VerificarRol from "../pages/admin/perfil/VerificarRol";
import Documentos from "../pages/admin/docs/docs"; // Asegúrate de que esta ruta sea correcta
import GestionFlotas from "../pages/admin/flotas/GestionFlotas";
import GestionServicios from "../pages/admin/servicios/GestionServicios";
import Referidos from "../pages/admin/referidos/Referidos";
import DocumentosPendientes from "../pages/admin/documentosPendientes/DocumentosPendientes";

const AdminRoutes = () => (
  <Routes>
    <Route path="" element={<AdminLayout />}>
      <Route path="dashboard" element={<Dashboard />} />

      <Route path="usuarios" element={<GestionUsuarios />} />
      <Route path="gestion-usuarios" element={<GestionUsuarios />} />
      <Route path="verificar-rol" element={<VerificarRol />} />
      <Route path="radiotaxis" element={<Radiotaxis />} />
      <Route path="servicios" element={<GestionServicios />} />
      <Route path="ajustes" element={<Ajustes />} />
      <Route path="landing" element={<Landing />} />
      <Route path="onboarding" element={<Onboarding />} />
      <Route path="banners" element={<Banners />} />
      <Route path="personalizar" element={<Personalizar />} />
      <Route path="perfil" element={<Perfil />} />
      <Route path="documentos" element={<Documentos />} />
      <Route path="documentos-pendientes" element={<DocumentosPendientes />} />
      <Route path="flotas" element={<GestionFlotas />} />
      <Route path="referidos" element={<Referidos />} />
    </Route>
  </Routes>
);

export default AdminRoutes;
