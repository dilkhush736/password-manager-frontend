import React, { useState, useEffect } from "react";
import {
  FaEye,
  FaTrash,
  FaCopy,
  FaEdit,
  FaLock,
} from "react-icons/fa";
import CryptoJS from "crypto-js";
import zxcvbn from "zxcvbn";
import { useNavigate } from "react-router-dom";

const SECRET_KEY = "ultra-master-key";

function Dashboard() {
  const navigate = useNavigate();

  const [username, setUsername] = useState("");
  const [masterPassword, setMasterPassword] = useState("");
  const [isUnlocked, setIsUnlocked] = useState(false);
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
  const [editIndex, setEditIndex] = useState(null);

  // 🔐 Check token on load (IMPORTANT)
  useEffect(() => {
    const token = localStorage.getItem("token");
    const storedUser = localStorage.getItem("user");

    if (!token) {
      navigate("/", { replace: true });
    }

    if (storedUser) {
      const parsedUser = JSON.parse(storedUser);
      setUsername(parsedUser.name);
    }
  }, [navigate]);

  // Save vault
  useEffect(() => {
    localStorage.setItem("ultraVault", JSON.stringify(vault));
  }, [vault]);

  const encrypt = (text) =>
    CryptoJS.AES.encrypt(text, SECRET_KEY).toString();

  const decrypt = (cipher) => {
    const bytes = CryptoJS.AES.decrypt(cipher, SECRET_KEY);
    return bytes.toString(CryptoJS.enc.Utf8);
  };

  const handleUnlock = () => {
    if (masterPassword === "1234") {
      setIsUnlocked(true);
    } else {
      alert("Wrong Master Password!");
    }
  };

  const handleSave = () => {
    if (!formData.platform || !formData.email || !formData.password) return;

    const encryptedPass = encrypt(formData.password);

    if (editIndex !== null) {
      const updated = [...vault];
      updated[editIndex] = {
        ...formData,
        password: encryptedPass,
      };
      setVault(updated);
      setEditIndex(null);
    } else {
      setVault([...vault, { ...formData, password: encryptedPass }]);
    }

    setFormData({ platform: "", email: "", password: "" });
  };

  const handleEdit = (index) => {
    const item = vault[index];
    setFormData({
      platform: item.platform,
      email: item.email,
      password: decrypt(item.password),
    });
    setEditIndex(index);
  };

  const handleDelete = (index) => {
    setVault(vault.filter((_, i) => i !== index));
  };

  const toggleView = (index) => {
    setVisible({ ...visible, [index]: !visible[index] });
  };

  const handleCopy = (encrypted) => {
    navigator.clipboard.writeText(decrypt(encrypted));
    alert("Copied!");
  };

  const filteredVault = vault.filter((item) =>
    item.platform.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const strength = formData.password
    ? zxcvbn(formData.password).score
    : null;

  const strengthText = ["Weak", "Fair", "Good", "Strong", "Very Strong"];

  // 🔐 LOCK SCREEN
  if (!isUnlocked) {
    return (
      <div className="d-flex justify-content-center align-items-center min-vh-100 bg-light">
        <div className="card p-5 shadow-lg text-center" style={{ width: "400px" }}>
          <h3 className="mb-3">
            <FaLock className="me-2" />
            Enter Master Password
          </h3>
          <input
            type="password"
            className="form-control mb-3"
            placeholder="Master Password"
            value={masterPassword}
            onChange={(e) => setMasterPassword(e.target.value)}
          />
          <button className="btn btn-primary w-100" onClick={handleUnlock}>
            Unlock Vault
          </button>
        </div>
      </div>
    );
  }

  // 🔓 MAIN DASHBOARD
  return (
    <div className={darkMode ? "bg-dark text-light min-vh-100" : "bg-light min-vh-100"}>
      <div className="container py-5" style={{ marginTop: "80px" }}>
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
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
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
                {editIndex !== null ? "Update" : "Save"}
              </button>
            </div>
          </div>
        </div>

        <div className="row">
          {filteredVault.map((item, index) => (
            <div className="col-md-6 mb-4" key={index}>
              <div className="card p-3 shadow">
                <h5>{item.platform}</h5>
                <p className="text-muted">{item.email}</p>
                <p>
                  {visible[index] ? decrypt(item.password) : "••••••••"}
                </p>

                <div className="d-flex gap-2">
                  <button
                    className="btn btn-outline-secondary btn-sm"
                    onClick={() => toggleView(index)}
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
                    onClick={() => handleEdit(index)}
                  >
                    <FaEdit />
                  </button>

                  <button
                    className="btn btn-danger btn-sm"
                    onClick={() => handleDelete(index)}
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