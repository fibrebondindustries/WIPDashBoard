import React, { useEffect, useState, useCallback} from "react";
import { useContext } from "react";
import { AuthContext } from "../AuthContext";
import axiosInstance from "../axiosConfig";
import "../assets/CSS/Header.css"; // Import the custom CSS for styling
import logo from "../assets/Img/Logo-1.png";
import User from "../assets/Img/User.gif";
import Bell from "../assets/Img/BellIcon.png";
import moment from "moment-timezone";

const Header = ({ toggleSidebar, isSidebarVisible }) => {
  const { logout } = useContext(AuthContext);

  // Get the user object from localStorage
  const user = JSON.parse(localStorage.getItem("user"));
  const [processData, setProcessData] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [delayedProcesses, setDelayedProcesses] = useState([]); // Delayed processes for admin
  const [showDelayedModal, setShowDelayedModal] = useState(false); // New modal for delayed processes
  const [delayed24hrProcesses, setDelayed24hrProcesses] = useState([]); // Delayed processes for superadmin
  const [showDelayed24hrModal, setShowDelayed24hrModal] = useState(false);  // New modal for 24hr delayed processes // 03 Jan 25 yogesh
  
  // useEffect(() => {
  //   const fetchProcessData = async () => {
  //     try {
  //       const supervisorName = user?.Name;
  //       const response = await axiosInstance.get("/api/first-process-count",{
  //         params: { supervisorName },
  //       });
  //       // const data = response.data;

  //       setProcessData(response.data); // Update process data with filtered rows

  //     } catch (error) {
  //       console.error("Error fetching process data:", error);
  //     }
  //   };

  //   const fetchDelayedProcesses = async () => {
  //     try {
  //       const response = await axiosInstance.get("/api/delayed-processes");
  //       setDelayedProcesses(response.data); // Update state with delayed processes
  //     } catch (error) {
  //       console.error("Error fetching delayed processes:", error);
  //     }
  //   };

  //   fetchProcessData();
  //   if (user?.Auth === "Admin") {
  //     fetchDelayedProcesses();
  //   }
  // }, [user?.Name, user?.Auth]);

  //   fetchProcessData();
  // }, [user?.Name]);

  ///Confirm Process Modification 30 Dec 24 // modificaton 13 Jan 25 yogesh
  
  // Fetch process data function - moved outside useEffect
  const fetchProcessData = useCallback(async () => {
    try {
      const supervisorName = user?.Name; // Get the logged-in user's name
      const response = await axiosInstance.get("/api/first-process-count", {
        params: { supervisorName },
      });

      setProcessData(response.data); // Update the process data state with filtered rows
    } catch (error) {
      console.error("Error fetching process data:", error);
    }
  }, [user?.Name]);
  

  useEffect(() => {
    fetchProcessData();

    const fetchDelayedProcesses = async () => {
      try {
        const response = await axiosInstance.get("/api/delayed-processes");
        setDelayedProcesses(response.data); // Update state with delayed processes
      } catch (error) {
        console.error("Error fetching delayed processes:", error);
      }
    };

    if (user?.Auth === "Admin") {
      fetchDelayedProcesses();
    }
  }, [user?.Name, user?.Auth, fetchProcessData]);
  
  const handleConfirm = async (processName, id) => {
    try {

       // Display a confirmation dialog
    const isConfirmed = window.confirm(
      `Are you sure you want to confirm this Process ${processName}?`
    );


    // Proceed only if the user confirms
    if (!isConfirmed) {
      return;
    }
  
    // Get the current time in IST
    const currentISTTime = moment().tz("Asia/Kolkata").format("DD/MM/YYYY : hh:mm A");
    // Get the ConfirmBy value from localStorage
    const confirmBy = JSON.parse(localStorage.getItem("user"))?.Name;
      // Make an API call to the confirm-process endpoint
      await axiosInstance.post("/api/confirm-process", {
        ID: id,
        // LotId: itemName,
        ConfirmTime: currentISTTime, // Send IST-confirmed time explicitly
        ConfirmBy: confirmBy, // Pass ConfirmBy
      });
    
      // Handle successful response
      showAlert(`Process ${processName} confirmed successfully!`, "success");
      
      // Update only the relevant row in the processData state
    // setProcessData((prevData) =>
    //   prevData.map((process) =>
    //     process["ITEM NAME"] === itemName
    //       ? { ...process, ConfirmTime: currentISTTime, ConfirmBy: confirmBy }
    //       : process
    //   )
    // )
    // // Fetch the updated data
    fetchProcessData();;
    // setProcessData(response.data);
      
    } catch (error) {
      console.error("Error confirming process:", error);
      alert(
        error.response?.data?.error || "Failed to confirm process. Please try again."
      );
    }
  };
  
 // Done button handler
 const handleDone = async (processName, id) => {
  try {
    const isConfirmed = window.confirm(
      `Are you sure you want to mark this process as done: ${processName}?`
    );
    if (!isConfirmed) return;

    const currentISTTime = moment().tz("Asia/Kolkata").format("DD/MM/YYYY : hh:mm A");
    const confirmBy = JSON.parse(localStorage.getItem("user"))?.Name;

    // Trigger completedTime-process API
    await axiosInstance.post("/api/completedTime-process", {
      // LotId: itemName,
      ID: id,
      CompletedTime: currentISTTime,
      ConfirmTime: currentISTTime,
      ConfirmBy: confirmBy,
    });

    showAlert(`Process marked as done!`, "success");

    // Fetch the updated data after marking as done
    fetchProcessData();

  } catch (error) {
    console.error("Error marking process as done:", error);
    alert(error.response?.data?.error || "Failed to mark process as done.");
  }
};

  
  const showAlert = (message, type) => {
    const alertPlaceholder = document.getElementById("alertPlaceholder");
    const alertHTML = `
      <div class="alert alert-${type} alert-dismissible fade show" role="alert">
        <strong>${type === "success" ? "Success!" : "Error!"}</strong> ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
      </div>`;
    alertPlaceholder.innerHTML = alertHTML;
    setTimeout(() => {
      alertPlaceholder.innerHTML = "";
    }, 3000);
  };


  // const handleDone = () => {
  //   // Confirmation before proceeding
  //   const isConfirmed = window.confirm("Are you sure you want to mark the process as completed?");
  //   if (!isConfirmed) return;

  //   // Show success alert when "Done" button is clicked
  //   showAlert("Process completed successfully!", "success");
  // };



  const handleAdminDone = async (id) => {
    try {
      const isConfirmed = window.confirm(
        `Are you sure you want to mark this process as Done?`
      );
  
      if (!isConfirmed) return;
  
      const currentISTTime = moment()
        .tz("Asia/Kolkata")
        .format("DD/MM/YYYY : hh:mm A");

            // Get the ConfirmBy value from localStorage
      const confirmBy = JSON.parse(localStorage.getItem("user"))?.Name;

      await axiosInstance.post("/api/completedTime-process", {
        ID: id,
        // LotId: lotId,
        CompletedTime: currentISTTime,
        ConfirmBy: confirmBy, // Pass ConfirmBy
      });
  
      showAlert(`Process marked as Done`, "success");
  
      // Refetch delayed processes to update the table
      const response = await axiosInstance.get("/api/delayed-processes");
      setDelayedProcesses(response.data); // Update state with the latest data

      // Refetch 24hr delayed processes to update the table // 03 Jan 25 yogesh
      const response24hr = await axiosInstance.get("/api/delayed-24hr-processes");
      setDelayed24hrProcesses(response24hr.data); // Update state with the latest data
    } catch (error) {
      console.error("Error marking process as Done:", error);
      alert(
        error.response?.data?.error ||
          "Failed to mark process as Done. Please try again."
      );
    }
  };

  // Show 24hr delayed processes // 03 Jan 25 yogesh
  const fetchDelayed24hrProcesses = async () => {  
    try {
      const response = await axiosInstance.get("/api/delayed-24hr-processes");
      setDelayed24hrProcesses(response.data);
    } catch (error) {
      console.error("Error fetching 24hr delayed processes:", error);
    }
  };
  
  useEffect(() => {
    if (user?.Auth === "SuperAdmin") {
      fetchDelayed24hrProcesses();
    }
  }, [user?.Auth]);

  
  return (
    <div>
           <div id="alertPlaceholder"></div>
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
              {user?.Auth === "Supervisor"  && (
                <a
                  name="Notification"
                  id="Notification"
                  className="btn"
                  href="#"
                  role="button"
                  onClick={() => setShowModal(true)}
                >
                 <span style={{ color: "red" }}>{processData.length}</span>
                  <img
                    src={Bell}
                    className="img-fluid rounded-top"
                    alt="Bell Icon"
                    style={{ height: "20px", width: "20px" }}
                  />
                </a>
              )}
                {user?.Auth === "Admin" && (
                <a
                  name="AdminNotification"
                  id="AdminNotification"
                  className="btn"
                  href="#"
                  role="button"
                  onClick={() => setShowDelayedModal(true)}
                >
                  <span style={{ color: "red" }}>{delayedProcesses.length}</span>
                  <img
                    src={Bell}
                    className="img-fluid rounded-top"
                    alt="Bell Icon"
                    style={{ height: "20px", width: "20px" }}
                  />
                </a>
              )}
              {user?.Auth === "SuperAdmin" && (
                <a
                  name="SuperAdminNotification"
                  id="SuperAdminNotification"
                  className="btn"
                  href="#"
                  role="button"
                  onClick={() => setShowDelayed24hrModal(true)}
                >
                  <span style={{ color: "red" }}>{delayed24hrProcesses.length}</span>
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
       {/* Modal */}
       {showModal && (
        <div className="modal show" style={{ display: "block" }}>
          <div className="modal-dialog modal-lg">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Process Details</h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setShowModal(false)}
                ></button>
              </div>
              <div className="modal-body">
                <table className="table table-bordered">
                  <thead>
                    <tr>
                      <th>Process Name</th>
                      <th>Item Name</th>
                      <th>Quantity</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {processData.map((process, index) => (
                      <tr key={index}>
                        <td>{process["PROCESS NAME"]}</td>
                        <td>{process["ITEM NAME"]}</td>
                        <td>{process["QUANTITY"]}</td>
                        <td>
                          {process.ConfirmTime == null ? (
                            <button
                              className="btn btn-outline-success"
                              onClick={() =>
                                handleConfirm(process["PROCESS NAME"],process.ID)
                              }
                            >
                              Confirm
                            </button>
                          ) : process.CompletedTime == null ? (
                            <button
                              className="btn btn-outline-primary"
                              onClick={() =>
                                handleDone(
                                  process["PROCESS NAME"],process.ID)
                                
                              }
                            >
                              Done
                            </button>
                          ) : (
                            <span>Completed</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Admin Modal */}
      {showDelayedModal && (
        <div className="modal show" style={{ display: "block" }}>
          <div className="modal-dialog modal-xl">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Delayed Processes</h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setShowDelayedModal(false)}
                ></button>
              </div>
              <div className="modal-body">
                <table className="table table-bordered">
                  <thead>
                    <tr>
                      <th>Supervisor</th>
                      <th>Process Name</th>
                      <th>Item Name</th>
                      <th>Quantity</th>
                      <th>New Process Time</th>
                      <th>Status</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  {/* <tbody>
                    {delayedProcesses.map((process, index) => (
                      <tr key={index}>
                        <td>{process["SupervisorName"]}</td>
                        <td>{process["PROCESS NAME"]}</td>
                        <td>{process["ITEM NAME"]}</td>
                        <td>{process["Quantity"]}</td>
                        <td>{process["NewProcessTime"]}</td>
                        <td>
                          <button
                            className="btn btn-outline-success"
                            onClick={() => handleAdminDone(process["ID"])}
                          >
                            Done
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody> */}
                <tbody>
                    {delayedProcesses.map((process, index) => (
                      <tr key={index}>
                        <td>{process["SupervisorName"]}</td>
                        <td>{process["PROCESS NAME"]}</td>
                        <td>{process["ITEM NAME"]}</td>
                        <td>{process["Quantity"]}</td>
                        <td>{process["NewProcessTime"]}</td>
                        <td>
                          {process["ProcessIncomplete"] === "Yes"
                            ? "Process Incomplete" // Show ProcessIncomplete if true
                            : process["ConfirmDelay"] === "Yes"
                            ? "Confirm Incomplete" // Show ConfirmIncomplete if true
                            : ""} {/* Leave blank otherwise */}
                        </td>
                        <td>
                          <button
                            className="btn btn-outline-success"
                            onClick={() => handleAdminDone(process["ID"])}
                          >
                            Done
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* SuperAdmin Modal */}
      {showDelayed24hrModal && (
        <div className="modal show" style={{ display: "block" }}>
          <div className="modal-dialog modal-lg">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">24-Hour Delayed Processes</h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setShowDelayed24hrModal(false)}
                ></button>
              </div>
              <div className="modal-body">
                <table className="table table-bordered">
                  <thead>
                    <tr>
                      <th>Supervisor</th>
                      <th>Process Name</th>
                      <th>Item Name</th>
                      <th>Quantity</th>
                      <th>New Process Time</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {delayed24hrProcesses.map((process, index) => (
                      <tr key={index}>
                        <td>{process["SupervisorName"]}</td>
                        <td>{process["PROCESS NAME"]}</td>
                        <td>{process["ITEM NAME"]}</td>
                        <td>{process["Quantity"]}</td>
                        <td>{process["NewProcessTime"]}</td>
                        <td>
                          <button
                            className="btn btn-outline-success"
                            onClick={() => handleAdminDone(process["ID"])}
                          >
                            Done
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default Header;
