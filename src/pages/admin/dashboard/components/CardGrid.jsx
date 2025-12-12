import React from "react";

const CardGrid = ({ children, columns = 4 }) => (
  <div
    style={{
      display: "grid",
      gridTemplateColumns: `repeat(${columns}, 1fr)`,
      gap: "16px",
      marginBottom: "24px",
    }}
  >
    {children}
  </div>
);

export default CardGrid;
