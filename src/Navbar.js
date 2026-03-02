import React from "react";
import { FaUserCircle, FaMoon, FaSun } from "react-icons/fa";

function Navbar({ username, onLogout, darkMode, toggleDarkMode }) {
  return (
    <nav
      className={`navbar navbar-expand-lg fixed-top ${
        darkMode ? "navbar-dark bg-dark" : "navbar-dark bg-primary"
      } shadow px-4`}
    >
      <div className="container-fluid">

        {/* Brand */}
        <span className="navbar-brand fw-bold fs-4">
          🔐 Ultra Vault
        </span>

        {/* Right Side */}
        <div className="d-flex align-items-center gap-3">

          {/* Dark Mode Toggle */}
          <button
            className="btn btn-outline-light btn-sm"
            onClick={toggleDarkMode}
          >
            {darkMode ? <FaSun /> : <FaMoon />}
          </button>

          {/* User Dropdown */}
          <div className="dropdown">
            <button
              className="btn btn-light dropdown-toggle d-flex align-items-center gap-2"
              data-bs-toggle="dropdown"
            >
              <FaUserCircle size={20} />
              <span>{username || "User"}</span>
            </button>

            <ul className="dropdown-menu dropdown-menu-end shadow">
              <li>
                <span className="dropdown-item-text fw-semibold">
                  👋 Hello, {username || "User"}
                </span>
              </li>

              <li><hr className="dropdown-divider" /></li>

              <li>
                <button
                  className="dropdown-item text-danger"
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