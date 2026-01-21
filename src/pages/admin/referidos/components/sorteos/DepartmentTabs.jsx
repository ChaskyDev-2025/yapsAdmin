import React from "react";
import { Tab, Tabs } from "@mui/material";

const DepartmentTabs = ({ departamentos, selected, onChange }) => (
  <Tabs
    value={selected}
    onChange={(e, newValue) => onChange(newValue)}
    sx={{
      borderBottom: 2,
      borderColor: "divider",
      backgroundColor: "#fafafa",
      mb: 2,
      "& .MuiTabs-indicator": {
        backgroundColor: "#d7171a",
        height: "4px",
      },
    }}
  >
    {departamentos.map((dept, idx) => (
      <Tab
        key={dept.name}
        label={`${dept.name} (${dept.count})`}
        sx={{
          fontWeight: 600,
          fontSize: "0.95rem",
          color: selected === idx ? "#d7171a" : "#666",
          textTransform: "none",
          "&:hover": {
            color: "#d7171a",
            backgroundColor: "rgba(215, 23, 26, 0.05)",
          },
        }}
      />
    ))}
  </Tabs>
);

export default DepartmentTabs;
