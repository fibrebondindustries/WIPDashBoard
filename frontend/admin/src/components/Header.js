import React from "react";
import { useContext } from "react";
import { AuthContext } from "../AuthContext";
import "../assets/CSS/Header.css"; // Import the custom CSS for styling
import logo from "../assets/Img/Logo-1.png";
import User from "../assets/Img/User.gif";
import Bell from "../assets/Img/BellIcon.png";
const Header = ({ toggleSidebar, isSidebarVisible }) => {
  const { logout } = useContext(AuthContext);

   // Get the user object from localStorage
   const user = JSON.parse(localStorage.getItem("user"));
  return (
    <div>
      <nav className="navbar navbar-expand-lg bg-body-tertiary">
        <div className="container-fluid">
          {/* Toggle Sidebar Button */}
          <button
            className="btn btn-link toggleBtn"
            onClick={toggleSidebar}
            style={{
              fontSize: "24px",
              border: "none",
              background: "black",
              cursor: "pointer",
              marginRight: "15px",
              marginleft: "10px",
            }}
          >
            <i className={`bi ${isSidebarVisible ? "bi-list" : "bi-x-lg"}`}></i>
            {/* Use a different icon when the sidebar is hidden */}
          </button>

          {/* Brand Logo */}
          <a className="navbar-brand">
            <img
              src={logo}
              alt="Fibre Bond Logo"
              style={{ height: "40px", width: "auto", display: "none" }}
            />
          </a>

          {/* Toggler for Mobile View */}
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

          {/* Navbar Links and Profile Dropdown */}
          <div className="collapse navbar-collapse" id="navbarSupportedContent">
            <ul className="navbar-nav me-auto mb-2 mb-lg-0"></ul>

            <span style={{ marginLeft: "-21rem" }}>
              {/* Conditionally Render Bell Icon for Supervisors */}
              {user?.Auth === "Supervisor" && (
                <a name="" id="" className="btn" href="#" role="button">
                  <span style={{color:"red"}}>1</span>
                  <img
                    src={Bell}
                    className="img-fluid rounded-top"
                    alt="Bell Icon"
                    style={{ height: "20px", width: "20px" }}
                  />
                </a>
              )}
              Welcome, {user?.Name}!
            </span>
            {/* Profile Dropdown */}
            <div className="dropdown">
              <a
                className="d-flex align-items-center text-decoration-none dropdown-toggle ml-5"
                // href="#"
                role="button"
                id="dropdownMenuLink"
                data-bs-toggle="dropdown"
                aria-expanded="false"
                style={{ marginRight: "20px", justifyContent: "end" }}
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
                {/* <li>
                  <a className="dropdown-item" href="#">
                    My Profile
                  </a>
                </li> */}
                <li>
                  <a
                    className="dropdown-item text-danger"
                    // href="#"
                    onClick={logout}
                  >
                    Logout
                  </a>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </nav>
    </div>
  );
};

export default Header;
