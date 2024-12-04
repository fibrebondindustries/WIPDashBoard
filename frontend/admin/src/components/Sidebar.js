import React from "react";
import { NavLink } from "react-router-dom";
import "../assets/CSS/Sidebar.css"; // Add custom styles here if needed
import logo from "../assets/Img/Logo-1.png";

const Sidebar = () => {
  return (
    <div className="d-flex flex-column vh-100 bg-light sidebar">
      <div className=" text-center">
        <a className="navbar-brand" href="#">
          <img
            src={logo}
            className="mt-2"
            alt="Fibre Bond Logo"
            style={{ height: "40px", width: "auto" }}
          />
        </a>
      </div>
      <ul className="nav flex-column NavlinkCss">
        <li className="nav-item">
          <NavLink
            to="/Admin-dashboard"
            // className="nav-link"
            className={({ isActive }) =>
              isActive ? "nav-link active" : "nav-link"
            }
            // activeClassName="active"
          >
            <i className="bi bi-speedometer2"></i> Dashboard
          </NavLink>
        </li>
        <li className="nav-item">
          <NavLink to="/users" 
           className={({ isActive }) => (isActive ? "nav-link active" : "nav-link")}
          // className="nav-link" 
          // activeClassName="active"
          >
            <i className="bi bi-card-list"></i> Users
          </NavLink>
        </li>
        <li className="nav-item">
          <NavLink
            to="/department"
            className={({ isActive }) => (isActive ? "nav-link active" : "nav-link")}
            // className="nav-link"
            // activeClassName="active"
          >
            <i className="bi bi-calendar-check"></i> Department
          </NavLink>
        </li>
        <li className="nav-item">
          <NavLink to="/workers"
          //  className="nav-link" 
          //  activeClassName="active"
          className={({ isActive }) => (isActive ? "nav-link active" : "nav-link")}
           >
            <i className="bi bi-calendar-check"></i> Workers
          </NavLink>
        </li>
      </ul>
    </div>
  );
};

export default Sidebar;
