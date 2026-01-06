//En este Apartado seleccionas la Ruta de tu panel de administración
//y las rutas de las diferentes páginas que componen el panel de administración
import React from "react";
import { Routes, Route } from "react-router-dom";
import AdminLayout from "../layouts/AdminLayout";
import RoleProtectedRoute from "../auth/RoleProtectedRoute";
import FlotaProtectedRoute from "../auth/FlotaProtectedRoute";
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
import Solicitudes from "../pages/admin/solicitudes/Solicitudes";
import SolicitudesAsignadas from "../pages/admin/solicitudes-asignadas/SolicitudesAsignadas";
import Billetera from "../pages/admin/billetera/Billetera";
import BilleteraFlota from "../pages/admin/billetera/BilleteraFlota";
import GestionarSolicitudes from "../pages/admin/billetera/GestionarSolicitudes";
import Bonos from "../pages/admin/bonos/Bonos";
import BonosAdmin from "../pages/admin/bonos-aplicar/BonosAdmin";

const AdminRoutes = () => (
  <Routes>
    <Route path="" element={<AdminLayout />}>
      <Route path="dashboard" element={<Dashboard />} />

      {/* RUTAS SOLO SUPERADMIN */}
      <Route path="usuarios" element={<RoleProtectedRoute allowedRoles={["superadmin"]}><GestionUsuarios /></RoleProtectedRoute>} />
      <Route path="gestion-usuarios" element={<RoleProtectedRoute allowedRoles={["superadmin"]}><GestionUsuarios /></RoleProtectedRoute>} />
      <Route path="verificar-rol" element={<RoleProtectedRoute allowedRoles={["superadmin"]}><VerificarRol /></RoleProtectedRoute>} />
      <Route path="radiotaxis" element={<RoleProtectedRoute allowedRoles={["superadmin", "admin"]}><Radiotaxis /></RoleProtectedRoute>} />
      <Route path="servicios" element={<RoleProtectedRoute allowedRoles={["superadmin"]}><GestionServicios /></RoleProtectedRoute>} />
      <Route path="ajustes" element={<RoleProtectedRoute allowedRoles={["superadmin", "admin"]}><Ajustes /></RoleProtectedRoute>} />
      <Route path="landing" element={<RoleProtectedRoute allowedRoles={["superadmin"]}><Landing /></RoleProtectedRoute>} />
      <Route path="onboarding" element={<RoleProtectedRoute allowedRoles={["superadmin"]}><Onboarding /></RoleProtectedRoute>} />
      <Route path="banners" element={<RoleProtectedRoute allowedRoles={["superadmin"]}><Banners /></RoleProtectedRoute>} />
      <Route path="personalizar" element={<RoleProtectedRoute allowedRoles={["superadmin"]}><Personalizar /></RoleProtectedRoute>} />
      <Route path="perfil" element={<Perfil />} />
      <Route path="documentos" element={<RoleProtectedRoute allowedRoles={["superadmin"]}><Documentos /></RoleProtectedRoute>} />
      <Route path="documentos-pendientes" element={<RoleProtectedRoute allowedRoles={["superadmin", "admin"]}><DocumentosPendientes /></RoleProtectedRoute>} />
      <Route path="flotas" element={<RoleProtectedRoute allowedRoles={["superadmin"]}><GestionFlotas /></RoleProtectedRoute>} />
      <Route path="referidos" element={<RoleProtectedRoute allowedRoles={["superadmin"]}><Referidos /></RoleProtectedRoute>} />
      <Route path="solicitudes" element={<RoleProtectedRoute allowedRoles={["superadmin"]}><Solicitudes /></RoleProtectedRoute>} />
      <Route path="bonos" element={<RoleProtectedRoute allowedRoles={["superadmin"]}><Bonos /></RoleProtectedRoute>} />
      <Route path="aplicar-bonos" element={<RoleProtectedRoute allowedRoles={["admin"]}><BonosAdmin /></RoleProtectedRoute>} />
      
      {/* RUTAS PARA FLOTAS */}
      <Route path="solicitudes-asignadas" element={<FlotaProtectedRoute><SolicitudesAsignadas /></FlotaProtectedRoute>} />
      <Route path="billetera-flota" element={<FlotaProtectedRoute><BilleteraFlota /></FlotaProtectedRoute>} />
      
      {/* RUTAS SOLO SUPERADMIN (BILLETERA Y SOLICITUDES DE RECARGA) */}
      <Route path="billetera" element={<RoleProtectedRoute allowedRoles={["superadmin"]}><Billetera /></RoleProtectedRoute>} />
      <Route path="solicitudes-recarga" element={<RoleProtectedRoute allowedRoles={["superadmin"]}><GestionarSolicitudes /></RoleProtectedRoute>} />
    </Route>
  </Routes>
);

export default AdminRoutes;
