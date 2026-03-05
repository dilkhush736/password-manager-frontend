import React, { useState, useEffect, useCallback } from "react";
import { FaEye, FaTrash, FaCopy, FaEdit, FaLock } from "react-icons/fa";
import zxcvbn from "zxcvbn";
import { useNavigate } from "react-router-dom";
import API from "../api";
import Footer from "../components/Footer";

function Dashboard() {
  const navigate = useNavigate();

  const [username, setUsername] = useState("");
  const [userId, setUserId] = useState("");

  const [masterPassword, setMasterPassword] = useState("");
  const [confirmMasterPassword, setConfirmMasterPassword] = useState("");

  const [isUnlocked, setIsUnlocked] = useState(false);
  const [needsSetup, setNeedsSetup] = useState(false);

  const [loading, setLoading] = useState(false);
  const [lockError, setLockError] = useState("");

  const [vault, setVault] = useState([]);
  const [darkMode, setDarkMode] = useState(false);

  const [formData, setFormData] = useState({
    platform: "",
    email: "",
    password: "",
  });

  const [visible, setVisible] = useState({});
  const [searchTerm, setSearchTerm] = useState("");
  const [editId, setEditId] = useState(null);

  // =========================
  // Lock now (manual)
  // =========================
  const handleLockNow = useCallback(() => {
    setIsUnlocked(false);
    setMasterPassword("");
    setConfirmMasterPassword("");
    setVisible({});
    setEditId(null);
    setFormData({ platform: "", email: "", password: "" });
    setLockError("");
  }, []);

  // =========================
  // Load user
  // =========================
  useEffect(() => {
    const token = localStorage.getItem("token");
    const storedUser = localStorage.getItem("user");

    if (!token) {
      navigate("/", { replace: true });
      return;
    }

    if (storedUser) {
      const parsedUser = JSON.parse(storedUser);
      setUsername(parsedUser?.name || "User");
      setUserId(parsedUser?.id || parsedUser?._id || "");
    }
  }, [navigate]);

  // =========================
  // Check master password status
  // =========================
  useEffect(() => {
    const checkMasterSetup = async () => {
      if (!userId) return;

      try {
        setLockError("");
        const res = await API.get(`/auth/master-status/${userId}`);
        setNeedsSetup(!res?.data?.isSet);
      } catch (err) {
        setNeedsSetup(true);
      }
    };

    checkMasterSetup();
  }, [userId]);

  // =========================
  // Load Vault From MongoDB
  // =========================
  const loadVault = useCallback(async () => {
    try {
      const res = await API.get("/api/credentials");
      setVault(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.log("Vault load error", err);
    }
  }, []);

  useEffect(() => {
    if (isUnlocked) loadVault();
  }, [isUnlocked, loadVault]);

  // =========================
  // AUTO LOCK + clear sensitive UI
  // =========================
  useEffect(() => {
    if (!isUnlocked) return;

    let timer;

    const resetTimer = () => {
      clearTimeout(timer);

      timer = setTimeout(() => {
        handleLockNow();
        alert("Session expired 🔒");
      }, 2 * 60 * 1000);
    };

    const events = ["mousemove", "keydown", "click", "scroll", "touchstart"];
    events.forEach((e) => window.addEventListener(e, resetTimer));
    resetTimer();

    return () => {
      clearTimeout(timer);
      events.forEach((e) => window.removeEventListener(e, resetTimer));
    };
  }, [isUnlocked, handleLockNow]);

  // =========================
  // Set master password
  // =========================
  const handleSetMasterPassword = async () => {
    setLockError("");

    if (!masterPassword || !confirmMasterPassword) {
      return setLockError("All fields required");
    }
    if (masterPassword !== confirmMasterPassword) {
      return setLockError("Passwords do not match");
    }

    try {
      setLoading(true);

      const res = await API.post("/auth/set-master-password", {
        userId,
        masterPassword,
      });

      if (res?.data?.success) {
        setIsUnlocked(true);
        setNeedsSetup(false);
      }
    } catch (err) {
      setLockError(err?.response?.data?.message || "Server error");
    } finally {
      setLoading(false);
    }
  };

  // =========================
  // Unlock vault
  // =========================
  const handleUnlock = async () => {
    setLockError("");

    if (!masterPassword) return setLockError("Master password required");

    try {
      setLoading(true);

      const res = await API.post("/auth/verify-master-password", {
        userId,
        masterPassword,
      });

      if (res?.data?.success) {
        setIsUnlocked(true);
      }
    } catch (err) {
      setLockError(err?.response?.data?.message || "Wrong master password");
    } finally {
      setLoading(false);
    }
  };

  // =========================
  // Generate Password
  // =========================
  const generatePassword = (length = 16) => {
    const chars =
      "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()";

    let password = "";
    for (let i = 0; i < length; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }

    // ✅ prevent stale formData
    setFormData((prev) => ({ ...prev, password }));
  };

  // =========================
  // Save / Update Credential
  // =========================
  const handleSave = async () => {
  if (!formData.platform || !formData.email || !formData.password) return;

  try {
    if (editId) {
      await API.put(`/api/credentials/${editId}`, formData);
    } else {
      await API.post("/api/credentials", formData); // ✅ FIXED
    }

    await loadVault();

    setFormData({ platform: "", email: "", password: "" });
    setEditId(null);
  } catch (err) {
    console.log(err);
  }
};

  // =========================
  // Delete Credential
  // =========================
  const handleDelete = async (id) => {
    try {
      await API.delete(`/api/credentials/${id}`);
      setVault((prev) => prev.filter((item) => item._id !== id));
      setVisible((prev) => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
      if (editId === id) setEditId(null);
    } catch (err) {
      console.log(err);
    }
  };

  // =========================
  // Edit Credential
  // =========================
  const handleEdit = (item) => {
    setFormData({
      platform: item.platform || "",
      email: item.email || "",
      password: item.password || "",
    });
    setEditId(item._id);
  };

  const toggleView = (id) => {
    setVisible((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleCopy = (password) => {
    navigator.clipboard.writeText(password);
    alert("Copied!");
  };

  // ✅ safe filter
  const filteredVault = vault.filter((item) =>
    (item.platform || "").toLowerCase().includes(searchTerm.toLowerCase())
  );

  const strength = formData.password ? zxcvbn(formData.password).score : null;
  const strengthText = ["Weak", "Fair", "Good", "Strong", "Very Strong"];

  // =========================
  // LOCK SCREEN
  // =========================
  if (!isUnlocked) {
    return (
      <div className="d-flex justify-content-center align-items-center min-vh-100 bg-light">
        <div className="card p-5 shadow text-center" style={{ width: "420px" }}>
          <h3>
            <FaLock className="me-2" />
            {needsSetup ? "Set Master Password" : "Unlock Vault"}
          </h3>

          {lockError && (
            <div className="alert alert-danger mt-2">{lockError}</div>
          )}

          {needsSetup ? (
            <>
              <input
                className="form-control mt-3"
                type="password"
                placeholder="Create master password"
                value={masterPassword}
                onChange={(e) => setMasterPassword(e.target.value)}
              />

              <input
                className="form-control mt-2"
                type="password"
                placeholder="Confirm password"
                value={confirmMasterPassword}
                onChange={(e) => setConfirmMasterPassword(e.target.value)}
              />

              <button
                className="btn btn-success mt-3 w-100"
                onClick={handleSetMasterPassword}
                disabled={loading}
              >
                {loading ? "Setting..." : "Set & Unlock"}
              </button>
            </>
          ) : (
            <>
              <input
                className="form-control mt-3"
                type="password"
                placeholder="Master password"
                value={masterPassword}
                onChange={(e) => setMasterPassword(e.target.value)}
              />

              <button
                className="btn btn-primary mt-3 w-100"
                onClick={handleUnlock}
                disabled={loading}
              >
                {loading ? "Unlocking..." : "Unlock"}
              </button>
            </>
          )}
        </div>
      </div>
    );
  }

  // =========================
  // MAIN DASHBOARD
  // =========================
  return (
    <div
      className={
  darkMode
    ? "app dark bg-dark text-light min-vh-100"
    : "app light bg-light text-dark min-vh-100"
}
    >
      <div className="container py-5 mt-4">
        {/* Header */}
        <div className="d-flex justify-content-between align-items-center mb-4">
          <div>
            <h4 className="mb-0">Welcome {username} 👋</h4>
            <small>Your vault is unlocked</small>
          </div>

          <div className="d-flex gap-2">
            <button
              className="btn btn-outline-secondary"
              onClick={() => setDarkMode((p) => !p)}
            >
              {darkMode ? "☀ Light" : "🌙 Dark"}
            </button>

            <button className="btn btn-outline-danger" onClick={handleLockNow}>
              <FaLock className="me-2" />
              Lock
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="row mb-4">
          <div className="col-md-4">
            <div className="card p-3 shadow">
              <h6>Total Accounts</h6>
              <h3>{vault.length}</h3>
            </div>
          </div>
        </div>

        {/* Search */}
        <input
          className="form-control mb-4"
          placeholder="Search platform..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />

        {/* Form */}
        <div className="card p-4 mb-4 shadow">
          <div className="row g-3 align-items-end">
            <div className="col-md-3">
              <input
                className="form-control"
                placeholder="Platform"
                value={formData.platform}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    platform: e.target.value,
                  }))
                }
              />
            </div>

            <div className="col-md-3">
              <input
                className="form-control"
                placeholder="Email"
                value={formData.email}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, email: e.target.value }))
                }
              />
            </div>

            <div className="col-md-3">
              <input
                className="form-control"
                type="password"
                placeholder="Password"
                value={formData.password}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, password: e.target.value }))
                }
              />
              {strength !== null && (
                <small className={darkMode ? "text-light" : "text-muted"}>
                  Strength: {strengthText[strength]}
                </small>
              )}
            </div>

            {/* ✅ fixed: inside a column */}
            <div className="col-md-3 d-grid">
              <button
                className="btn btn-outline-dark"
                type="button"
                onClick={() => generatePassword(16)}
              >
                Generate Password
              </button>
            </div>

            <div className="col-md-3 d-grid">
              <button className="btn btn-success" onClick={handleSave}>
                {editId ? "Update" : "Save"}
              </button>
            </div>
          </div>
        </div>

        {/* List */}
        <div className="row">
          {filteredVault.map((item) => (
            <div className="col-md-6 mb-4" key={item._id}>
              <div className="card p-3 shadow">
                <h5>{item.platform}</h5>
                <p className="text-muted">{item.email}</p>

                <p>{visible[item._id] ? item.password : "••••••••"}</p>

                <div className="d-flex gap-2">
                  <button
                    className="btn btn-outline-secondary btn-sm"
                    onClick={() => toggleView(item._id)}
                  >
                    <FaEye />
                  </button>

                  <button
                    className="btn btn-outline-primary btn-sm"
                    onClick={() => handleCopy(item.password)}
                  >
                    <FaCopy />
                  </button>

                  <button
                    className="btn btn-warning btn-sm"
                    onClick={() => handleEdit(item)}
                  >
                    <FaEdit />
                  </button>

                  <button
                    className="btn btn-danger btn-sm"
                    onClick={() => handleDelete(item._id)}
                  >
                    <FaTrash />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
      <Footer />
    </div>
  );
}
export default Dashboard;
