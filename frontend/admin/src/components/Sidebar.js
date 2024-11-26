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
            alt="Fibre Bond Logo"
            style={{ height: "40px", width: "auto", margintop: "10px;" }}
          />
        </a>
          
      </div>
      <ul className="nav flex-column NavlinkCss">
        <li className="nav-item">
          <NavLink
            to="/Admin-dashboard"
            className="nav-link"
            activeClassName="active"
          >
            <i className="bi bi-speedometer2"></i> Dashboard
          </NavLink>
        </li>
        <li className="nav-item">
          <NavLink to="/users" className="nav-link" activeClassName="active">
            <i className="bi bi-card-list"></i> Users
          </NavLink>
        </li>
       {/*  <li className="nav-item">
          <NavLink to="/reminder" className="nav-link" activeClassName="active">
            <i className="bi bi-calendar-check"></i> Reminder
          </NavLink>
        </li>
        <li className="nav-item">
          <NavLink to="/projects" className="nav-link" activeClassName="active">
            <i className="bi bi-house-door"></i> Projects
          </NavLink>
        </li>
        <li className="nav-item">
          <NavLink to="/master" className="nav-link" activeClassName="active">
            <i className="bi bi-archive"></i> Master
          </NavLink>
        </li>
        <li className="nav-item">
          <NavLink
            to="/bulk-import-export"
            className="nav-link"
            activeClassName="active"
          >
            <i className="bi bi-upload"></i> Bulk Import/Export
          </NavLink>
        </li>
        <li className="nav-item">
          <NavLink
            to="/brokerage-module"
            className="nav-link"
            activeClassName="active"
          >
            <i className="bi bi-currency-exchange"></i> Brokerage Module
          </NavLink>
        </li> */}
      </ul>
    </div>
  );
};

export default Sidebar;
