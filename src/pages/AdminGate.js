import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./AdminGate.css";

export default function AdminGate() {
  const [key, setKey] = useState("");
  const [err, setErr] = useState("");
  const navigate = useNavigate();

  const ADMIN_KEY = "dilkhush736"; // ✅ change this

  const submit = (e) => {
    e.preventDefault();
    if (key.trim() !== ADMIN_KEY) {
      setErr("Wrong admin key ❌");
      return;
    }
    localStorage.setItem("ultraAdmin", "true");
    navigate("/admin/subscribers");
  };

  return (
    <div className="ag-wrap">
      <div className="ag-card">
        <h2>Admin Access</h2>
        <p className="ag-muted">Enter admin key to open Subscribers panel</p>

        <form onSubmit={submit} className="ag-form">
          <input
            className="ag-input"
            placeholder="Enter admin key..."
            value={key}
            onChange={(e) => setKey(e.target.value)}
          />
          <button className="ag-btn" type="submit">Unlock</button>
        </form>

        {err && <div className="ag-err">{err}</div>}

        <div className="ag-mini">
          Tip: Change <b>ADMIN_KEY</b> in <code>AdminGate.js</code>
        </div>
      </div>
    </div>
  );
}