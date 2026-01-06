import React from "react";
import { Card, CardContent, Typography, Grid } from "@mui/material";

export const EstadisticasCard = ({ title, value, bgColor = "#e3f2fd" }) => {
  return (
    <Grid item xs={12} sm={6} md={3}>
      <Card sx={{ backgroundColor: bgColor }}>
        <CardContent>
          <Typography color="textSecondary" gutterBottom>
            {title}
          </Typography>
          <Typography variant="h5">{value}</Typography>
        </CardContent>
      </Card>
    </Grid>
  );
};
