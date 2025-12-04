// src/components/ui/CardGrid.jsx
import React from "react";

const CardGrid = ({ children, className = "" }) => {
  return (
    <div className={`art-cards ${className}`.trim()}>{children}</div>
  );
};

export default CardGrid;
