import React from "react";
import { Grid } from "@mui/material";
import StatCard from "./StatCard";
import PeopleIcon from "@mui/icons-material/People";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import CardGiftcardIcon from "@mui/icons-material/CardGiftcard";
import EmojiEventsIcon from "@mui/icons-material/EmojiEvents";
import LocalAtmIcon from "@mui/icons-material/LocalAtm";
import CardBoardIcon from "@mui/icons-material/CardGiftcard";

const StatsGrid = ({ stats, loading }) => {
  return (
    <Grid container spacing={3} sx={{ mb: 4 }}>
      <Grid item xs={12} sm={6} md={2}>
        <StatCard
          title="Total participantes"
          value={loading ? "..." : stats.total}
          subtitle="Con y sin código"
          icon={PeopleIcon}
          color="#9c27b0"
        />
      </Grid>
      <Grid item xs={12} sm={6} md={2}>
        <StatCard
          title="Total Referidos"
          value={loading ? "..." : stats.totalReferidos}
          subtitle="Invitaciones exitosas"
          icon={TrendingUpIcon}
          color="#4caf50"
        />
      </Grid>
     
      <Grid item xs={12} sm={6} md={2}>
        <StatCard
          title="Total Donaciones"
          value={loading ? "..." : `Bs. ${(stats.totalDonaciones || 0).toFixed(2)}`}
          subtitle="Monto acumulado"
          icon={LocalAtmIcon}
          color="#2196f3"
        />
      </Grid>
      
      
    </Grid>
  );
};

export default StatsGrid;
