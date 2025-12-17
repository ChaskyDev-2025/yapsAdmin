import React from "react";
import { useAuth } from "../../../auth/AuthContext";
import DashboardHeader from "./components/DashboardHeader";
import LoadingState from "./components/LoadingState";
import { useDashboardMetrics } from "./hooks/useDashboardMetrics";
import SuperAdminDashboard from "./SuperAdminDashboard";
import FlotaAdminDashboard from "./FlotaAdminDashboard";

const Dashboard = () => {
  const { userRole, loading: authLoading } = useAuth();
  const { cargando: metricsLoading } = useDashboardMetrics();

  if (authLoading || metricsLoading) {
    return <LoadingState />;
  }

  const isSuperAdmin = userRole === "superadmin";

  return isSuperAdmin ? <SuperAdminDashboard /> : <FlotaAdminDashboard />;
};

export default Dashboard;
