import React, { useState, useEffect, useCallback } from "react";
import Header from "../components/Header";
// import Sidebar from "../components/Sidebar";
import "../assets/CSS/Dashboard.css";
import axiosInstance from "../axiosConfig";
// import Logo from "../assets/Img/Logo-1.png";
// import User from "../assets/Img/User.gif";

function WIPDashboard() {
//   const [isSidebarVisible, setIsSidebarVisible] = useState(true);
  const [data, setData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [workerRequirements,] = useState([]); //setWorkerRequirements
  const [searchQuery, setSearchQuery] = useState("");
  const [modalData, setModalData] = useState(null); // State for modal data
  const [isModalOpen, setIsModalOpen] = useState(false); // State to control modal visibility
//   const toggleSidebar = () => {
//     setIsSidebarVisible(!isSidebarVisible);
//   };

  
  

  const fetchData = useCallback(async () => {
    try {
      // Fetch data from `/api/data`
      const dataResponse = await axiosInstance.get("/api/data");
      const fetchedData = dataResponse.data;
      setData(fetchedData);
  
      const filterContainer = document.getElementById("filter-container");
      if (filterContainer) {
        filterContainer.innerHTML = ""; // Clear existing buttons
  
        // Group data by department
        const departmentGroups = fetchedData.reduce((acc, row) => {
          const dept = row["DEPARTMENT"] || "Department Not Available";
          acc[dept] = acc[dept] || [];
          acc[dept].push(row);
          return acc;
        }, {});
  
        // Create filter buttons
        Object.keys(departmentGroups).forEach((department) => {
          const rows = departmentGroups[department];
          const resultColor = rows[0]["Result"]; // Get Result for color
          const workerStatus = rows[0]["WorkerStatus"]; // Get WorkerStatus for blue condition
          const wipQuantity = rows[0]["Wip_quantity"] || "0"; // Use correct key name
          // Create button
          const button = document.createElement("div");
          button.className = "filter-btn btn btn-outline-secondary";
          button.innerHTML = `
            <div class="button-content">
              <span class="button-text">${department}</span>
              <span class="button-lights">
                <label class="radio-wrapper">
                  <input type="radio" name="${department}-light" disabled ${
            resultColor === "Orange" ? "checked" : ""
          } />
                  <span class="radio orange-light ${
                    resultColor === "Orange" ? "active" : ""
                  }"></span>
                </label>
                <label class="radio-wrapper">
                  <input type="radio" name="${department}-light" disabled ${
            resultColor === "Green" ? "checked" : ""
          } />
                  <span class="radio green-light ${
                    resultColor === "Green" ? "active" : ""
                  }"></span>
                </label>
                <label class="radio-wrapper">
                  <input type="radio" name="${department}-light" disabled ${
            resultColor === "Red" ? "checked" : ""
          } />
                  <span class="radio red-light ${
                    resultColor === "Red" ? "active" : ""
                  }"></span>
                </label>
                <label class="radio-wrapper">
                  <input type="radio" name="${department}-light" disabled ${
            workerStatus === "Yes" ? "checked" : ""
          } />
                  <span class="radio blue-light ${
                    workerStatus === "Yes" ? "active" : ""
                  }"></span>
                </label>
              </span>
            </div>
          `;
         // Add blue-light styling dynamically
         if (workerStatus === "Yes") {
          const blueLight = button.querySelector(".blue-light");
          if (blueLight) {
            blueLight.style.backgroundColor = "blue"; // Apply blue background
          }
        }
  
          // Add tooltip attribute
          button.setAttribute("data-bs-toggle", "tooltip");
          button.setAttribute("data-bs-placement", "top");
          button.setAttribute("title", `Department: ${department}\nWIP Quantity: ${wipQuantity}`);
  
          // Add click event
          button.onclick = () => {
            const filtered = fetchedData.filter(
              (row) => row["DEPARTMENT"] === department
            );
            setFilteredData(filtered);
          };
  
          filterContainer.appendChild(button);
        });
      }
    } catch (error) {
      displayErrorMessage("Database Connection Lost");
    }
  }, []);
  
  
  
  
  const displayErrorMessage = (message) => {
    setFilteredData([
      {
        errorMessage: message,
      },
    ]);
  };

  
  const handleSearch = useCallback(() => {
    if (searchQuery.trim() === "") {
      setFilteredData(data);
    } else {
      const filtered = data.filter((row) => {
        const itemName = row["ITEM NAME"] ? row["ITEM NAME"].toLowerCase() : "";
        const jobOrderNo = row["JOB ORDER NO"]
          ? row["JOB ORDER NO"].toLowerCase()
          : "";

        return (
          itemName.includes(searchQuery.toLowerCase()) ||
          jobOrderNo.includes(searchQuery.toLowerCase())
        );
      });
      setFilteredData(filtered);
    }
  }, [data, searchQuery]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    // console.log(workerRequirements); // Add this to make ESLint recognize its usage.
  }, [workerRequirements]);
  // Prevent unused variable warning
useEffect(() => {
  if (workerRequirements.length > 0) {
    // console.log("Worker requirements fetched:", workerRequirements);
  }
}, [workerRequirements]);
  useEffect(() => {
    handleSearch();
  }, [searchQuery, handleSearch]);
  const checkServerHealth = useCallback(async () => {
        try {
          const response = await axiosInstance.get("/api/health");
          const health = response.data;
    
          if (health.status !== "connected") {
            displayErrorMessage("Database Connection Lost");
          }
        } catch (error) {
          displayErrorMessage("Database Connection Lost");
        }
      }, []);

  const fetchLastUpdatedDate = useCallback(async () => {
    try {
      const response = await axiosInstance.get("/api/data");
  
      if (response.data && response.data.length > 0) {
        // Filter out rows with null or undefined Updated_Time
        const validRows = response.data.filter(
          (row) => row["Updated_Time"] !== null && row["Updated_Time"] !== undefined
        );
  
        if (validRows.length > 0) {
          // Reduce to find the latest time
          const lastUpdated = validRows.reduce((latest, current) => {
            return new Date(`1970-01-01T${current["Updated_Time"]}`) >
              new Date(`1970-01-01T${latest["Updated_Time"]}`)
              ? current
              : latest;
          });
  
          const formattedTime = lastUpdated["Updated_Time"]; // Already in HH:mm:ss format
  
          // Update the input field
          const updatedDateInput = document.getElementById("updatedDate");
          if (updatedDateInput) {
            updatedDateInput.value = formattedTime;
          }
        } else {
          console.warn("No valid Updated_Time values found in the data.");
        }
      } else {
        console.warn("No data available to fetch the last updated time.");
      }
    } catch (error) {
      console.error("Error fetching last updated time:", error);
    }
  }, []);
  
      
  
  
  useEffect(() => {
            fetchData();
            fetchLastUpdatedDate();
        
            const interval = setInterval(checkServerHealth, 5050);
            return () => clearInterval(interval);
          }, [fetchData, fetchLastUpdatedDate, checkServerHealth]);


          const handleViewAll = async () => {
                await fetchData(); // Refetch all data
              };    
  return (
    
    <div className="d-flex dashboard">
 

      <div className="flex-grow-1">
        <Header/>
        <main className="main-container p-4">
          <div className="d-flex justify-content-start mb-3">
          <span><strong style={{color:"red"}}>Red: </strong>Over Capacity </span>&nbsp;&nbsp;
          <span><strong style={{color:"green"}}>Green: </strong>All Okay </span>&nbsp;&nbsp;
          <span><strong style={{color:"orange"}}>Oragne: </strong>Under Capacity </span>&nbsp;&nbsp;
          <span><strong style={{color:"blue"}}>Blue: </strong>Less Workers </span>&nbsp;&nbsp;
          </div>
          <div className="mb-0" style={{zIndex:"2",position:"relative"}}>
            <input
              type="text"
              className="form-control"
              placeholder="Search Item Name"
              style={{ width: "auto" }}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div
            className="container-fluid  d-flex justify-content-end align-items-center mb-2"
            style={{ marginTop: "-36px", position: "relative" }}
          >
            <p className="font-weight-bold text-uppercase mb-0 mr-2">
              LAST UPDATED TIME&nbsp;
            </p>
            <input
              type="text"
              id="updatedDate"
              readOnly
              style={{ height: "31px", color: "green", maxWidth: "168px",  }}
            />
          </div>

          <div className="d-flex align-items-center mb-2">
            <div id="filter-container" className="filter-grid w-100"></div>
          </div>

          <div className="container mt-0">
            <div className="table-responsive">
            <div className="d-flex justify-content-end">
                 <button
                   onClick={handleViewAll}
                   type="button"
                   className="btn btn-secondary mb-3">
                   View All
                 </button>
               </div>
              <table className="table table-bordered table-striped">
                <thead>
                  <tr>
                    <th>JOB NO</th>
                    <th>JOB DATE</th>
                    <th>ITEM NAME (LOT ID)</th>
                    <th>PROCESS NAME</th>
                    <th>PROCESS GROUP</th>
                    <th>QUANTITY</th>
                    <th>DEPARTMENT</th>
                  </tr>
                </thead>
                <tbody>
                {filteredData.length > 0 && filteredData[0].errorMessage ? (
                <tr>
                  <td
                    colSpan="7"
                    className="text-center text-danger font-weight-bold text-uppercase"
                  >
                    {filteredData[0].errorMessage}
                  </td>
                </tr>
              ) : (
                  filteredData.map((row, index) => (
                    <tr key={index}>
                      <td>
                      <button
                        type="button"
                        className="btn btn-link"
                        onClick={() => {
                          setModalData(row);
                          setIsModalOpen(true);
                        }}
                      >
                        {row["JOB ORDER NO"]}
                      </button>
                    </td>
                      <td>
                        {new Date(row["JOB ORDER DATE"]).toLocaleDateString()}
                      </td>
                      <td>{row["ITEM NAME"]}</td>
                      <td>{row["PROCESS NAME"]}</td>
                      <td>{row["PROCESS GROUP"]}</td>
                      <td>{row["QUANTITY"]}</td>
                      <td>{row["DEPARTMENT"]}</td>
                    </tr>
                      ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </main>
      </div>
      {/* Modal */}
      {isModalOpen && modalData && (
        <div className="modal show" tabIndex="-1" style={{ display: "block" }}>
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Job Order Description</h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setIsModalOpen(false)}
                ></button>
              </div>
              <div className="modal-body">
                <p>
                  <strong>Job Order No:</strong> {modalData["JOB ORDER NO"]}
                </p>
                <p>
                  <strong>Description:</strong> {modalData["Description"] || "No Description"}
                </p>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setIsModalOpen(false)}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

export default WIPDashboard;