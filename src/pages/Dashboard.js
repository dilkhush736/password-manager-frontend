import React, { useState, useEffect } from "react";
import { FaEye, FaTrash, FaCopy, FaEdit, FaLock } from "react-icons/fa";
import CryptoJS from "crypto-js";
import zxcvbn from "zxcvbn";
import { useNavigate } from "react-router-dom";
import API from "../api";

// ✅ V2: Removed hardcoded SECRET_KEY

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

  const [darkMode, setDarkMode] = useState(false);

  const [formData, setFormData] = useState({
    platform: "",
    email: "",
    password: "",
  });

  const [vault, setVault] = useState(() => {
    const stored = localStorage.getItem("ultraVault");
    return stored ? JSON.parse(stored) : [];
  });

  const [visible, setVisible] = useState({});
  const [searchTerm, setSearchTerm] = useState("");
  const [editId, setEditId] = useState(null);

  // 🔐 Check token + load user
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

      // ✅ safer: support id and _id
      setUserId(parsedUser?.id || parsedUser?._id || "");
    }
  }, [navigate]);

  // ✅ AUTO-LOCK on refresh + tab switch
  useEffect(() => {
    // refresh/reload => lock + clear master
    setIsUnlocked(false);
    setMasterPassword("");
    setConfirmMasterPassword("");

    const handleBlur = () => {
      setIsUnlocked(false);
      setMasterPassword("");
      setConfirmMasterPassword("");
      setVisible({});
      setEditId(null);
      setFormData({ platform: "", email: "", password: "" });
    };

    window.addEventListener("blur", handleBlur);
    return () => window.removeEventListener("blur", handleBlur);
  }, []);

  // ✅ AUTO-LOCK after 2 minutes inactivity
  useEffect(() => {
    if (!isUnlocked) return;

    let timer;

    const resetTimer = () => {
      clearTimeout(timer);
      timer = setTimeout(() => {
        setIsUnlocked(false);

        // clear sensitive state on timeout
        setMasterPassword("");
        setConfirmMasterPassword("");
        setVisible({});
        setEditId(null);
        setFormData({ platform: "", email: "", password: "" });

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
  }, [isUnlocked]);

  // ✅ Decide: master password setup needed or not (UPDATED to master-status route)
  useEffect(() => {
    const checkMasterSetup = async () => {
      if (!userId) return;

      try {
        setLoading(true);
        setLockError("");

        const res = await API.get(`/auth/master-status/${userId}`);

        // isSet = true => master exists => needsSetup false
        // isSet = false => first time => needsSetup true
        setNeedsSetup(!res?.data?.isSet);
      } catch (err) {
        console.log("master-status error:", err?.response?.data || err.message);
        // fallback: if anything fails, show setup to avoid blocking user
        setNeedsSetup(true);
        setLockError(
          err?.response?.data?.message || "Unable to check master password status"
        );
      } finally {
        setLoading(false);
      }
    };

    checkMasterSetup();
  }, [userId]);

  // ✅ Ensure every item has an id (for older localStorage data)
  useEffect(() => {
    const hasMissingId = vault.some((item) => !item?.id);
    if (!hasMissingId) return;

    setVault((prev) =>
      prev.map((item, idx) => ({
        id: item?.id || Date.now() + idx,
        ...item,
      }))
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Save vault
  useEffect(() => {
    localStorage.setItem("ultraVault", JSON.stringify(vault));
  }, [vault]);

  // ✅ V2: Encrypt/Decrypt uses MASTER PASSWORD (real security)
  const encrypt = (text) => CryptoJS.AES.encrypt(text, masterPassword).toString();

  const decrypt = (cipher) => {
    const bytes = CryptoJS.AES.decrypt(cipher, masterPassword);
    return bytes.toString(CryptoJS.enc.Utf8);
  };

  // ✅ Lock Now (manual lock)
  const handleLockNow = () => {
    setIsUnlocked(false);
    setVisible({});
    setEditId(null);
    setFormData({ platform: "", email: "", password: "" });

    // clear master password on lock
    setMasterPassword("");
    setConfirmMasterPassword("");
  };

  // ✅ First time: set master password
  const handleSetMasterPassword = async () => {
    setLockError("");

    if (!masterPassword || !confirmMasterPassword) {
      return setLockError("All fields are required");
    }
    if (masterPassword.length < 4) {
      return setLockError("Master password must be at least 4 characters");
    }
    if (masterPassword !== confirmMasterPassword) {
      return setLockError("Master passwords do not match");
    }

    try {
      setLoading(true);

      const res = await API.post("/auth/set-master-password", {
        userId,
        masterPassword,
      });

      if (res.data.success) {
        setNeedsSetup(false);
        setIsUnlocked(true);

        // ✅ keep masterPassword (needed for encrypt/decrypt)
        setConfirmMasterPassword("");
      }
    } catch (err) {
      setLockError(err?.response?.data?.message || "Server error");
    } finally {
      setLoading(false);
    }
  };

  // ✅ Normal unlock: verify master password
  const handleUnlock = async () => {
    setLockError("");

    if (!masterPassword) {
      return setLockError("Master password is required");
    }

    try {
      setLoading(true);

      const res = await API.post("/auth/verify-master-password", {
        userId,
        masterPassword,
      });

      if (res.data.success) {
        setIsUnlocked(true);
        // ✅ keep masterPassword for decrypt/copy/show
      }
    } catch (err) {
      setLockError(err?.response?.data?.message || "Wrong master password");
    } finally {
      setLoading(false);
    }
  };

  // ✅ Save / Update (id-based)
  const handleSave = () => {
    if (!formData.platform || !formData.email || !formData.password) return;

    if (!masterPassword) {
      alert("Master password missing. Please lock & unlock again.");
      return;
    }

    const encryptedPass = encrypt(formData.password);

    if (editId !== null) {
      setVault((prev) =>
        prev.map((item) =>
          item.id === editId
            ? { ...item, ...formData, password: encryptedPass }
            : item
        )
      );
      setEditId(null);
    } else {
      setVault((prev) => [
        ...prev,
        {
          id: Date.now(),
          ...formData,
          password: encryptedPass,
        },
      ]);
    }

    setFormData({ platform: "", email: "", password: "" });
  };

  const handleEdit = (id) => {
    const item = vault.find((v) => v.id === id);
    if (!item) return;

    const plain = decrypt(item.password);
    if (!plain) {
      alert("Unable to decrypt. Please lock & unlock with correct master password.");
      return;
    }

    setFormData({
      platform: item.platform,
      email: item.email,
      password: plain,
    });
    setEditId(id);
  };

  const handleDelete = (id) => {
    setVault((prev) => prev.filter((item) => item.id !== id));
    setVisible((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
    if (editId === id) setEditId(null);
  };

  const toggleView = (id) => {
    setVisible((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleCopy = (encrypted) => {
    const plain = decrypt(encrypted);
    if (!plain) {
      alert("Unable to decrypt. Please lock & unlock with correct master password.");
      return;
    }
    navigator.clipboard.writeText(plain);
    alert("Copied!");
  };

  const filteredVault = vault.filter((item) =>
    (item.platform || "").toLowerCase().includes(searchTerm.toLowerCase())
  );

  const strength = formData.password ? zxcvbn(formData.password).score : null;
  const strengthText = ["Weak", "Fair", "Good", "Strong", "Very Strong"];

  // 🔐 LOCK SCREEN (SETUP OR UNLOCK)
  if (!isUnlocked) {
    return (
      <div className="d-flex justify-content-center align-items-center min-vh-100 bg-light">
        <div className="card p-5 shadow-lg text-center" style={{ width: "420px" }}>
          <h3 className="mb-2">
            <FaLock className="me-2" />
            {needsSetup ? "Set Master Password" : "Enter Master Password"}
          </h3>

          <p className="text-muted mb-3" style={{ fontSize: "14px" }}>
            {needsSetup
              ? "First time setup — choose a strong master password."
              : `Welcome back, ${username}. Unlock your vault.`}
          </p>

          {lockError && <div className="alert alert-danger py-2">{lockError}</div>}

          {needsSetup ? (
            <>
              <input
                type="password"
                className="form-control mb-3"
                placeholder="Create Master Password"
                value={masterPassword}
                onChange={(e) => setMasterPassword(e.target.value)}
              />

              <input
                type="password"
                className="form-control mb-3"
                placeholder="Confirm Master Password"
                value={confirmMasterPassword}
                onChange={(e) => setConfirmMasterPassword(e.target.value)}
              />

              <button
                className="btn btn-success w-100"
                onClick={handleSetMasterPassword}
                disabled={loading}
              >
                {loading ? "Setting..." : "Set & Unlock"}
              </button>
            </>
          ) : (
            <>
              <input
                type="password"
                className="form-control mb-3"
                placeholder="Master Password"
                value={masterPassword}
                onChange={(e) => setMasterPassword(e.target.value)}
              />

              <button
                className="btn btn-primary w-100"
                onClick={handleUnlock}
                disabled={loading}
              >
                {loading ? "Unlocking..." : "Unlock Vault"}
              </button>
            </>
          )}
        </div>
      </div>
    );
  }

  // 🔓 MAIN DASHBOARD
  return (
    <div className={darkMode ? "bg-dark text-light min-vh-100" : "bg-light min-vh-100"}>
      <div className="container py-5" style={{ marginTop: "80px" }}>
        {/* ✅ Header with Lock Now */}
        <div className="d-flex justify-content-between align-items-center mb-4">
          <div>
            <h4 className="mb-0">Welcome, {username} 👋</h4>
            <small className="text-muted">Your vault is unlocked</small>
          </div>

          <button className="btn btn-outline-danger" onClick={handleLockNow}>
            <FaLock className="me-2" />
            Lock Now
          </button>
        </div>

        <div className="row mb-4">
          <div className="col-md-4">
            <div className="card p-3 shadow">
              <h6>Total Accounts</h6>
              <h3>{vault.length}</h3>
            </div>
          </div>
        </div>

        <input
          type="text"
          className="form-control mb-4"
          placeholder="Search platform..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />

        <div className="card p-4 mb-4 shadow">
          <div className="row g-3">
            <div className="col-md-3">
              <input
                type="text"
                className="form-control"
                placeholder="Platform"
                value={formData.platform}
                onChange={(e) =>
                  setFormData({ ...formData, platform: e.target.value })
                }
              />
            </div>

            <div className="col-md-3">
              <input
                type="email"
                className="form-control"
                placeholder="Email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </div>

            <div className="col-md-3">
              <input
                type="password"
                className="form-control"
                placeholder="Password"
                value={formData.password}
                onChange={(e) =>
                  setFormData({ ...formData, password: e.target.value })
                }
              />
              {strength !== null && (
                <small className="text-muted">
                  Strength: {strengthText[strength]}
                </small>
              )}
            </div>

            <div className="col-md-3 d-grid">
              <button className="btn btn-success" onClick={handleSave}>
                {editId !== null ? "Update" : "Save"}
              </button>
            </div>
          </div>
        </div>

        <div className="row">
          {filteredVault.map((item, index) => (
            <div className="col-md-6 mb-4" key={item.id || index}>
              <div className="card p-3 shadow">
                <h5>{item.platform}</h5>
                <p className="text-muted">{item.email}</p>
                <p>{visible[item.id] ? decrypt(item.password) : "••••••••"}</p>

                <div className="d-flex gap-2">
                  <button
                    className="btn btn-outline-secondary btn-sm"
                    onClick={() => toggleView(item.id)}
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
                    onClick={() => handleEdit(item.id)}
                  >
                    <FaEdit />
                  </button>

                  <button
                    className="btn btn-danger btn-sm"
                    onClick={() => handleDelete(item.id)}
                  >
                    <FaTrash />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default Dashboard;