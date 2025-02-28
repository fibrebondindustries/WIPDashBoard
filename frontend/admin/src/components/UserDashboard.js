import React, { useContext, useEffect, useState } from "react";
// import { useNavigate } from "react-router-dom";
import axiosInstance from "../axiosConfig";
import { AuthContext } from "../AuthContext";
import Logo from "../assets/Img/Logo-1.png";
import User from "../assets/Img/User.gif";
import DataTable from "react-data-table-component";

function UserDashboard() {
  const { user, logout } = useContext(AuthContext);
  const [department, setDepartment] = useState("Not Assigned");
  const [temporaryDepartment, setTemporaryDepartment] = useState("Not Assigned");
  const [workerData, setWorkerData] = useState([]);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5; // Number of items per page for mobile view
  const [totalAmount, setTotalAmount] = useState(0);

  useEffect(() => {
    const fetchTotalAmount = async () => {
      if (!user?.EmployeeID) return;
  
      try {
        const response = await axiosInstance.get(`/api/worker-total-amount/${user.EmployeeID}`);
        setTotalAmount(response.data.TotalAmount || 0); // Store total amount
      } catch (error) {
        console.error("Error fetching total amount:", error);
      }
    };
  
    fetchTotalAmount();
  }, [user?.EmployeeID]);

  ////new code for worker data
  useEffect(() => {
    const fetchWorkerData = async () => {
      try {
        const response = await axiosInstance.get("api/worker-wages");
        const filteredData = response.data.filter(
          (item) => item.EmployeeID === user?.EmployeeID
        );
        setWorkerData(filteredData);
      } catch (error) {
        console.error("Error fetching worker wages data:", error);
      }
    };
    
    fetchWorkerData();
    
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [user?.EmployeeID]);

  const totalPages = Math.ceil(workerData.length / itemsPerPage);
  const paginatedData = workerData.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const nextPage = () => {
    if (currentPage < totalPages) setCurrentPage(currentPage + 1);
  };

  const prevPage = () => {
    if (currentPage > 1) setCurrentPage(currentPage - 1);
  };
//end

  const getISTTime = () => {
    const now = new Date();
    // Convert the time to IST
    const offset = 5.5 * 60 * 60 * 1000; // IST is UTC + 5:30
    const istTime = new Date(now.getTime() + offset);
    return istTime.toISOString().replace("T", " ").slice(0, 19); // Format as 'YYYY-MM-DD HH:MM:SS'
  };

  /// 3 Dec 24 //  yogesh
  // Fetch user department
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await axiosInstance.get("/api/AllUsers");
        const users = response.data;

        const userDepartment = users.find(
          (u) => u.EmployeeID === user?.EmployeeID
        )?.Department;
        setDepartment(userDepartment || "Not Assigned");
      } catch (error) {
        console.error("Error fetching users:", error);
      }
    };

    const fetchTemporaryDepartments = async () => {
      try {
        const response = await axiosInstance.get("/api/temporaryDepartments");
        const temporaryData = response.data;

        const tempDept = temporaryData.find(
          (temp) => temp.EmployeeID === user?.EmployeeID
        )?.TemporaryDepartment;
        setTemporaryDepartment(tempDept || "Not Assigned");
      } catch (error) {
        console.error("Error fetching temporary departments:", error);
      }
    };

    fetchUsers();
    fetchTemporaryDepartments();
  }, [user?.EmployeeID]);
  //end
  useEffect(() => {
    const checkSessionExpiration = () => {
      const sessionExpiration = localStorage.getItem("sessionExpiration");
      const currentTime = new Date();

      if (!sessionExpiration || currentTime > new Date(sessionExpiration)) {
        // handleLogout(); // Automatically logout if session expires
        window.location.reload(); // Reload the page after logout
      }
    };

    // Check session expiration immediately
    checkSessionExpiration();

    // Optionally, check periodically (e.g., every 5 seconds)
    const interval = setInterval(checkSessionExpiration, 5000);

    return () => clearInterval(interval); // Cleanup interval on unmount
  }, []);


  // Handle "IN" Button Click
  const handleMarkIn = async () => {
    const loginTime = getISTTime();
  
    try {
      // Check for active session using /presentEmployees API
      const activeSessionResponse = await axiosInstance.get("/api/presentEmployees");
      const activeEmployees = activeSessionResponse.data;
  
      // Check if the user is already logged in
      const isActive = activeEmployees.some(
        (employee) => employee.EmployeeID === user?.EmployeeID
      );
  
      if (isActive) {
        showAlert("You are already marked in." , "danger");
        return; // Stop further processing  
      }
  
      // Proceed with marking IN if no active session exists
      await axiosInstance.post("/api/mark-in", {
        EmployeeID: user?.EmployeeID,
        LoginTime: loginTime,
        Department: department,
      });
      showAlert("Marked In successfully!" , "success");
    } catch (err) {
      console.error("Error marking login time:", err);
      alert("Failed to record login time. Please try again.");
    }
  };
  

  // Handle "OUT" Button Click
const handleMarkOut = async () => {
   try {
    // Check for active session using /presentEmployees API
    const activeSessionResponse = await axiosInstance.get("/api/presentEmployees");
    const activeEmployees = activeSessionResponse.data;

    // Check if the user has an active session
    const isActive = activeEmployees.some(
      (employee) => employee.EmployeeID === user?.EmployeeID
    );

    if (!isActive) {
      showAlert("No active session found. You are not marked in.", "danger");
      return; // Stop further processing
    }
    
    if (!window.confirm("Are you sure you want to mark out?")) {
      return;
    }

    // Proceed with marking OUT if an active session exists
    const logoutTime = getISTTime();
    await axiosInstance.post("/api/logout", {
      EmployeeID: user?.EmployeeID,
      logoutTime: logoutTime, // Optional: Can be handled by the backend as well
    });

    showAlert("Marked Out successfully!", "success");

    // Clear local storage and navigate to login page (if needed)
    // localStorage.removeItem("user");
    // localStorage.removeItem("loginTime");
    // navigate("/"); // Redirect to login page (optional)
  } catch (err) {
    console.error("Error marking logout time:", err);
    showAlert("Failed to record logout time. Please try again.", "danger");
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

  const columns = [
    { name: "LOT NUMBER", selector: (row) => row["LOT NUMBER"], sortable: true },
    { name: "PROCESS NAME", selector: (row) => row["PROCESS NAME"], sortable: true },
    { name: "WORKER NAME", selector: (row) => row.Name, sortable: true },
    { name: "AMOUNT", selector: (row) => row.AMOUNT, sortable: true },
    { name: "QTY", selector: (row) => row.QTY, sortable: true },
  ];
  return (
    <div className=" ">
            <div id="alertPlaceholder"></div>
      <nav className="navbar navbar-expand-lg bg-body-white" style={{boxShadow:"0 1px 5px rgba(0, 0, 0, 0.2) "}}>
        <div className="container-fluid">
          <a className="navbar-brand">
            {" "}
            <img
              src={Logo}
              className="img-fluid rounded-top"
              alt="Logo"
              style={{ height: "40px", marginLeft: "40px" }}
            />
          </a>
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
          <div
            className="collapse navbar-collapse"
            id="navbarSupportedContent"
          ></div>
        </div>
        {/* Navbar Links and Profile Dropdown */}
        <div className="collapse navbar-collapse" id="navbarSupportedContent">
          <ul className="navbar-nav me-auto mb-2 mb-lg-0"></ul>
          <span style={{marginLeft:"-21rem"}}>Welcome,{user?.Name}! </span>
          {/* Profile Dropdown */}
          <div className="dropdown">
            <a
              className="d-flex align-items-center text-decoration-none dropdown-toggle ml-5 "
              // href="#"
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
              {/* <li>
                  <a className="dropdown-item" href="#">
                    My Profile
                  </a>
                </li> */}
              <li>
                <a
                  className="dropdown-item text-danger"
                  // href="#"
                  // onClick={handleLogout}
                  onClick={logout}
                >
                  Logout
                </a>
              </li>
            </ul>
          </div>
        </div>
      </nav>
      {/* <main>
        <div className="container">
          <p>Employee ID: {user?.EmployeeID}</p>
          <p>Department: {department}</p>
          <p>Assigned Department: {temporaryDepartment}</p>
        </div>
      </main> */}
       <div className="dashboard-container" style={{ background: "#f7f9fc", height: "-webkit-fill-available" }}>
      <main style={{ padding: "20px" }}>
        <div className="dashboard-content" style={{ maxWidth: "800px", margin: "0 auto" }}>
          <div
            className="card"
            style={{
              background: "#ffffff",
              padding: "20px",
              borderRadius: "8px",
              boxShadow: "0 4px 8px rgba(0, 0, 0, 0.1)",
              marginBottom: "20px",
            }}
          >
            <span style={{ marginBottom: "40px", color: "red", textAlign: "center" }}>
               Please Don't Forget To Logout After Complete Your Work
            </span>
            <p style={{ fontSize: "18px", color: "#555", marginBottom: "8px" }}>
              <strong>Employee ID:</strong> {user?.EmployeeID}
            </p>
            <p style={{ fontSize: "18px", color: "#555", marginBottom: "8px" }}>
              <strong>Department:</strong> {department || "Not Assigned"}
            </p>
            <p style={{ fontSize: "18px", color: "#555", marginBottom: "8px" }}>
              <strong>Assigned Department:</strong> {temporaryDepartment || "Not Assigned"}
            </p>
            <p style={{ fontSize: "18px", color: "#555", marginBottom: "8px" }}>
              <strong>Total Amount:</strong> ₹{totalAmount}
            </p>

            {/* Buttons for IN and OUT */}
             <div style={{ display: "flex", justifyContent: "end", gap: "20px" }}>
              <button
                className="btn btn-success"
                onClick={handleMarkIn}
              >
                IN
              </button>
              <button
                className="btn btn-danger"
                 onClick={handleMarkOut}
              >
                OUT
              </button>
            </div>
          </div>

          
        </div>

        {/* <div className="container mt-4" style={{boxShadow:"0 1px 5px rgba(0, 0, 0, 0.51) "}}>
        {!isMobile ? (
          <DataTable columns={columns} data={workerData} pagination highlightOnHover
          />
        ) : (
          <div className="row">
            {workerData.map((item, index) => (
              <div className="col-12 mb-3 mt-2" key={index}>
                <div className="card p-3 shadow-sm">
                  <h5 className="card-title">{item["LOT NUMBER"]}</h5>
                  <p className="card-text"><strong>Process:</strong> {item["PROCESS NAME"]}</p>
                  <p className="card-text"><strong>Worker:</strong> {item.Name}</p>
                  <p className="card-text"><strong>Amount:</strong> {item.AMOUNT}</p>
                  <p className="card-text"><strong>Quantity:</strong> {item.QTY}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div> */}
        <div className="container mt-4" style={{ boxShadow: "0 1px 5px rgba(0, 0, 0, 0.51)", borderRadius: "5px", padding: "6px" }}>
          {!isMobile ? (
            <DataTable columns={columns} data={workerData} pagination highlightOnHover />
          ) : (
            <>
              <div className="row">
                {paginatedData.map((item, index) => (
                  <div className="col-12 mb-3 mt-2" key={index}>
                    <div className="card p-3 shadow-sm">
                      <h5 className="card-title">{item["LOT NUMBER"]}</h5>
                      <p className="card-text"><strong>Process:</strong> {item["PROCESS NAME"]}</p>
                      <p className="card-text"><strong>Worker:</strong> {item.Name}</p>
                      <p className="card-text"><strong>Amount:</strong> {item.AMOUNT}</p>
                      <p className="card-text"><strong>Quantity:</strong> {item.QTY}</p>
                    </div>
                  </div>
                ))}
              </div>

              {totalPages > 1 && (
                <div className="d-flex justify-content-between mt-3">
                  <button className="btn btn-primary mb-3" onClick={prevPage} disabled={currentPage === 1}>
                    Previous
                  </button>
                  <span>Page {currentPage} of {totalPages}</span>
                  <button className="btn btn-primary mb-3" onClick={nextPage} disabled={currentPage === totalPages}>
                    Next
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </main>
      
    </div>
    </div>
  );
}

export default UserDashboard;
