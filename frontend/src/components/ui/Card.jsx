// src/components/ui/Card.jsx
import React from "react";

const Card = ({ children, className = "", ...rest }) => {
  return (
    <div className={`card ${className}`.trim()} {...rest}>
      {children}
    </div>
  );
};

export default Card;
