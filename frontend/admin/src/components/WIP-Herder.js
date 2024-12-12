import React from "react";
import Logo from "../assets/Img/Logo-1.png";
import User from "../assets/Img/User.gif";

const WIPHeader = ({ handleLogout }) => {
  const logoutUser = () => {
    // Clear session data
    sessionStorage.removeItem("auth");

    // Redirect to login page or homepage
    window.location.href = "/wip-login"; // Replace "/login" with your desired route
  };
  return (
    <nav
      className="navbar navbar-expand-lg bg-body-tertiary"
      style={{ boxShadow: "0 1px 5px rgba(0, 0, 0, 0.2)" }}
    >
      <div className="container-fluid">
        {/* Logo */}
        <a className="navbar-brand">
          <img
            src={Logo}
            className="img-fluid rounded-top"
            alt="Logo"
            style={{ height: "40px", marginLeft: "40px" }}
          />
        </a>

        {/* Navbar Toggler for smaller screens */}
        <button
          className="navbar-toggler"
          type="button"
          data-bs-toggle="collapse"
          data-bs-target="#navbarSupportedContent"
          aria-controls="navbarSupportedContent"
          aria-expanded="false"
          aria-label="Toggle navigation"
        >
          <span className="navbar-toggler-icon"></span>
        </button>

        {/* Navbar Links and Profile */}
        <div
          className="collapse navbar-collapse"
          id="navbarSupportedContent">
          {/* Empty Links Section */}
          <ul className="navbar-nav me-auto mb-2 mb-lg-0"></ul>

    
          {/* Profile Dropdown */}
          <div className="dropdown">
            <a
              className="d-flex align-items-center text-decoration-none dropdown-toggle ml-5"
              role="button"
              id="dropdownMenuLink"
              data-bs-toggle="dropdown"
              aria-expanded="false"
              style={{
                marginRight: "20px",
                justifyContent: "end",
                marginLeft: "10px",
              }}
            >
              <img
                src={User}
                alt="Profile"
                className="rounded-circle"
                style={{
                  width: "40px",
                  height: "40px",
                  objectFit: "cover",
                }}
              />
            </a>
            <ul
              className="dropdown-menu dropdown-menu-end"
              aria-labelledby="dropdownMenuLink"
            >
              {/* Logout Option */}
              <li>
                <button
                  className="dropdown-item text-danger"
                  onClick={logoutUser}
                  style={{ border: "none", background: "none"  }}
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
};

export default WIPHeader;
