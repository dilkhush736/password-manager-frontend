import React from "react";
import { Navigate } from "react-router-dom";

export default function RequireAdmin({ children }) {
  const ok = localStorage.getItem("ultraAdmin") === "true";
  if (!ok) return <Navigate to="/admin" replace />;
  return children;
}