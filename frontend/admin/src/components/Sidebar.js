import React, {useContext,useState, useEffect } from "react";
import { NavLink } from "react-router-dom";
import { AuthContext } from "../AuthContext"; // Import AuthContext
import "../assets/CSS/Sidebar.css"; // Add custom styles here if needed
import logo from "../assets/Img/Logo-1.png";
import axiosInstance from "../axiosConfig";

const Sidebar = () => {
  const { user } = useContext(AuthContext); // Get the user's role from AuthContext
  const [ticketCount, setTicketCount] = useState(0); // State to store ticket count

  useEffect(() => {
    // Fetch the ticket count when the component mounts
    const fetchTicketCount = async () => {
      try {
        const response = await axiosInstance.get("/api/ticketsAdmin"); // Use appropriate API for admin tickets
        setTicketCount(response.data.length); // Set the count based on the number of tickets
      } catch (error) {
        console.error("Error fetching ticket count:", error);
      }
    };

    if (user?.Auth === "SuperAdmin") {
      fetchTicketCount();
    }
  }, [user]);

  return (
    <div className="d-flex flex-column vh-100 bg-light sidebar">
      <div className=" text-center">
        <a className="navbar-brand" >
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
        {/* <li className="nav-item">
          <NavLink to="/users" 
           className={({ isActive }) => (isActive ? "nav-link active" : "nav-link")}
          // className="nav-link" 
          // activeClassName="active"
          >
            <i className="bi bi-card-list"></i> Users
          </NavLink>
        </li> */}
        {(user?.Auth === "Admin" || user?.Auth === "SuperAdmin") && (
          <li className="nav-item">
            <NavLink
              to="/users"
              className={({ isActive }) =>
                isActive ? "nav-link active" : "nav-link"
              }
            >
              <i className="bi bi-calendar-check"></i> Users
            </NavLink>
          </li>
        )}
        {/* <li className="nav-item">
          <NavLink
            to="/department"
            className={({ isActive }) => (isActive ? "nav-link active" : "nav-link")}
          >
            <i className="bi bi-calendar-check"></i> Department
          </NavLink>
        </li> */}
        {(user?.Auth === "Admin" || user?.Auth === "SuperAdmin") && (
          <li className="nav-item">
            <NavLink
              to="/department"
              className={({ isActive }) =>
                isActive ? "nav-link active" : "nav-link"
              }
            >
              <i className="bi bi-calendar-check"></i> Department
            </NavLink>
          </li>
        )}
        {/* <li className="nav-item">
          <NavLink to="/workers"
          className={({ isActive }) => (isActive ? "nav-link active" : "nav-link")}
           >
            <i className="bi bi-calendar-check"></i> Workers
          </NavLink>
        </li> */}
         {(user?.Auth === "Admin" || user?.Auth === "SuperAdmin") && (
          <li className="nav-item">
            <NavLink
              to="/workers"
              className={({ isActive }) =>
                isActive ? "nav-link active" : "nav-link"
              }
            >
              <i className="bi bi-calendar-check"></i> Workers
            </NavLink>
          </li>
        )}
          {/* Ticketing Link - Only Visible to SuperAdmin */}
         {user?.Auth === "SuperAdmin" && (
          <li className="nav-item">
            <NavLink
              to="/ticket-admin"
              className={({ isActive }) =>
                isActive ? "nav-link active" : "nav-link"
              }
            >
              <i className="bi bi-calendar-check"></i> Ticketing{" "}
              {ticketCount > 0 && (
                <span className="badge bg-danger">{ticketCount}</span>
              )}
            </NavLink>
          </li>
        )}
        {user?.Auth === "Supervisor" && (
          <li className="nav-item">
            <NavLink
              to="/ticket-home"
              className={({ isActive }) =>
                isActive ? "nav-link active" : "nav-link"
              }
            >
              <i className="bi bi-calendar-check"></i> Raise Ticket{" "}
              {ticketCount > 0 && (
                <span className="badge bg-danger">{ticketCount}</span>
              )}
            </NavLink>
          </li>
        )}
      </ul>
    </div>
  );
};

export default Sidebar;
