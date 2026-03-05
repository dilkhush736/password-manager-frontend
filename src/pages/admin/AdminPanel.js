import React, { useState } from "react";
import "./AdminPanel.css";

// import existing + new pages
import AdminSubscribers from "../AdminSubscribers"; // <-- path adjust if needed
import AdminUsers from "./AdminUsers";
import AdminCredentials from "./AdminCredentials";

export default function AdminPanel() {
  const [tab, setTab] = useState("subscribers");

  return (
    <div className="ap-wrap">
      <div className="ap-head">
        <div>
          <h2 className="ap-title">Admin Panel</h2>
          <p className="ap-sub">Manage Users • Subscribers • Credentials</p>
        </div>

        <div className="ap-tabs">
          <button
            className={`ap-tab ${tab === "users" ? "active" : ""}`}
            onClick={() => setTab("users")}
          >
            Users
          </button>
          <button
            className={`ap-tab ${tab === "subscribers" ? "active" : ""}`}
            onClick={() => setTab("subscribers")}
          >
            Subscribers
          </button>
          <button
            className={`ap-tab ${tab === "credentials" ? "active" : ""}`}
            onClick={() => setTab("credentials")}
          >
            Credentials
          </button>
        </div>
      </div>

      {tab === "users" && <AdminUsers />}
      {tab === "subscribers" && <AdminSubscribers />}
      {tab === "credentials" && <AdminCredentials />}
    </div>
  );
}