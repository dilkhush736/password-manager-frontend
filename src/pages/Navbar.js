import React, { useEffect, useState } from "react";
import { FaMoon, FaSun } from "react-icons/fa";

function Navbar({ username, onLogout, darkMode, toggleDarkMode }) {
  const [scrolled, setScrolled] = useState(false);

  const displayName = username || "User";
  const firstLetter = displayName.charAt(0).toUpperCase();

  // 🔥 Scroll Shadow Effect
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
   <nav
  className={`navbar navbar-expand-lg fixed-top ${
    darkMode ? "navbar-dark bg-dark" : "navbar-dark bg-primary"
  } shadow px-4`}
>
      <div className="container-fluid">

        {/* Brand */}
        <span
          className="navbar-brand fw-bold fs-4"
          style={{
            background: "linear-gradient(45deg, #0d6efd, #6610f2)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent"
          }}
        >
          🔐 Ultra Vault
        </span>

        {/* Right Side */}
        <div className="d-flex align-items-center gap-3">

          {/* Dark Mode Toggle */}
          <button
            className="btn btn-outline-primary btn-sm"
            onClick={toggleDarkMode}
            style={{ borderRadius: "20px" }}
          >
            {darkMode ? <FaSun /> : <FaMoon />}
          </button>

          {/* User Dropdown */}
          <div className="dropdown">
            <button
              className="btn btn-light dropdown-toggle d-flex align-items-center gap-2 shadow-sm"
              data-bs-toggle="dropdown"
              style={{
                borderRadius: "30px",
                padding: "6px 14px",
                transition: "0.3s"
              }}
            >
              {/* Gradient Avatar */}
              <div
                className="rounded-circle d-flex align-items-center justify-content-center text-white"
                style={{
                  width: "32px",
                  height: "32px",
                  fontSize: "14px",
                  fontWeight: "bold",
                  background: "linear-gradient(45deg, #0d6efd, #6610f2)"
                }}
              >
                {firstLetter}
              </div>

              {displayName}
            </button>

            <ul className="dropdown-menu dropdown-menu-end shadow-lg border-0">
              <li>
                <span className="dropdown-item-text fw-semibold">
                  👋 Hello, {displayName}
                </span>
              </li>

              <li>
                <hr className="dropdown-divider" />
              </li>

              <li>
                <button
                  className="dropdown-item text-danger fw-semibold"
                  onClick={onLogout}
                >
                  Logout
                </button>
              </li>
            </ul>
          </div>

        </div>
      </div>
    </nav>
  );
}

export default Navbar;