import React, { useState, useEffect, useCallback } from "react";
import WIPHeader from "../components/WIP-Herder";
// import Sidebar from "../components/Sidebar";
import "../assets/CSS/Dashboard.css";
import axiosInstance from "../axiosConfig";
// import Logo from "../assets/Img/Logo-1.png";
// import User from "../assets/Img/User.gif";

function WIPDashboard() {
//   const [isSidebarVisible, setIsSidebarVisible] = useState(true);
  const [data, setData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [workerRequirements, setWorkerRequirements] = useState([]); //setWorkerRequirements
  const [searchQuery, setSearchQuery] = useState("");
  const [modalData, setModalData] = useState(null); // State for modal data
  const [isModalOpen, setIsModalOpen] = useState(false); // State to control modal visibility
  const [presentEmployees, setPresentEmployees] = useState([]); // Present employees data
  const [filteredPresentEmployees, setFilteredPresentEmployees] = useState([]);
  const [matchedData, setMatchedData] = useState([]); // State to store matched data
   const [filteredRequiredResources, setFilteredRequiredResources] = useState(0);

  
  // Function to check session on page load
  const checkAuth = useCallback(() => {
    const authData = sessionStorage.getItem("auth");
    if (!authData) {
      // Redirect to login if no session data found
      window.location.href = "/wip-login";
      return;
    }

    const { loggedIn, expiryTime } = JSON.parse(authData);
    if (!loggedIn || Date.now() > expiryTime) {
      // If not logged in or session expired, redirect to login
      sessionStorage.removeItem("auth");
      window.location.href = "/wip-login";
    }
  }, []);

  // Use Effect to start session check on load
  useEffect(() => {
    checkAuth(); // Initial session check on load
    const interval = setInterval(checkAuth, 1000); // Check session every second
    return () => clearInterval(interval); // Cleanup interval on component unmount
  }, [checkAuth]);

  const fetchWorkerRequirements = useCallback(async () => {
    try {
      const response = await axiosInstance.get("/api/departments/worker-requirements");
      const fetchedRequirements = response.data;
      setWorkerRequirements(fetchedRequirements);
  
      // Default filtered count is the total of all RequiredResource values
      const totalResources = fetchedRequirements.reduce(
        (sum, item) => sum + (item.RequiredResource || 0),
        0
      );
      setFilteredRequiredResources(totalResources);
    } catch (error) {
      console.error("Error fetching worker requirements:", error);
    }
  }, []);

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
          const isRM = rows.some((row) => row.RawMaterial === "RmRequired"); // Check if RawMaterial is "RmRequired" //11 jan 25 yogesh
          // Check if any row in this department has PendingProcess: "Yes"
        const hasPendingProcess = rows.some(
          (row) => row["PendingProcess"] === "Yes"
        );
        
          const resultColor = rows[0]["Result"]; // Get Result for color
          const workerStatus = rows[0]["WorkerStatus"]; // Get WorkerStatus for blue condition
          const wipQuantity = rows[0]["Wip_quantity"] || "0"; // Use correct key name
          // Create button
          const button = document.createElement("div");/// <span class="button-text">${department}</span>
          button.className = "filter-btn btn btn-outline-secondary";
          button.innerHTML = ` 
            <div class="button-content">
               <span class="button-text" style="${
              hasPendingProcess ? "color: #0033cc;" : ""
            }">${department}
            ${
              isRM
                ? '<sup style="font-size: 9px; color: rgb(10 183 0); font-weight: bold;">RM</sup>'
                : ""
            }
            </span>
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
            blueLight.style.backgroundColor = "#cc66ff"; // Apply blue background //lavender color 
          }
        }
  
          // Add tooltip attribute
          button.setAttribute("data-bs-toggle", "tooltip");
          button.setAttribute("data-bs-placement", "top");
          button.setAttribute("title", `Department: ${department}\nWIP Quantity: ${wipQuantity}`);
  
          // Add click event
        //   button.onclick = () => {
        //     const filtered = fetchedData.filter(
        //       (row) => row["DEPARTMENT"] === department
        //     );
        //     setFilteredData(filtered);
        //     // Filter present employees
        //     const filteredEmployees = presentEmployees.filter(
        //       (emp) => emp.Department === department
        //     );
        //     setFilteredPresentEmployees(filteredEmployees);
        //   };
  
        //   filterContainer.appendChild(button);
        // });
        button.onclick = () => {
          const filtered = fetchedData.filter(
            (row) => row["DEPARTMENT"] === department
          );
          setFilteredData(filtered);

          // Update filtered required resources
          const departmentRequirement = workerRequirements.find(
            (req) => req.DEPARTMENT === department
          );
          setFilteredRequiredResources(departmentRequirement?.RequiredResource || 0);

          // Filter present employees
          const filteredEmployees = presentEmployees.filter(
            (emp) => emp.Department === department
          );
          setFilteredPresentEmployees(filteredEmployees);
        };

        filterContainer.appendChild(button);
      });
      }
    } catch (error) {
      displayErrorMessage("Database Connection Lost");
    }
  }, [workerRequirements, presentEmployees]);
  
  
  
  
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
            const interval = setInterval(checkServerHealth, 5050);
            return () => clearInterval(interval);
          }, [checkServerHealth]);


          const handleViewAll = async () => {
                await fetchData(); // Refetch all data
              };   
                
   useEffect(() => {
                  
                  fetchLastUpdatedDate();
                  fetchPresentEmployees();
                  fetchWorkerRequirements();
                }, [fetchLastUpdatedDate,fetchWorkerRequirements]);

  // Fetch Present Employees
  const fetchPresentEmployees = async () => {

    try {
      const response = await axiosInstance.get("/api/presentEmployees");
      setPresentEmployees(response.data);
      setFilteredPresentEmployees(response.data); // Default to all employees
    } catch (error) {
      console.error("Error fetching present employees:", error);
    }
  };
  
  useEffect(() => {
    fetchPresentEmployees();
  }, []);
  
/// this is for model form table data //20 DEC
 const fetchMatchedData = useCallback(async () => {
  if (!modalData) return;

  try {
    const response = await axiosInstance.get("/api/matched-data");
    const fetchedData = response.data;

    // Filter data based on modalData's JOB ORDER NO
    const filteredData = fetchedData.filter(
      (row) => row["JOB ORDER NO"] === modalData["JOB ORDER NO"]
    );

    setMatchedData(filteredData);
  } catch (error) {
    console.error("Error fetching matched data:", error);
  }
}, [modalData]);

// Call fetchMatchedData when modalData changes or modal opens
useEffect(() => {
  if (isModalOpen && modalData) {
    fetchMatchedData();
  }
}, [isModalOpen, modalData, fetchMatchedData]);
  
  return (
    
    <div className="d-flex dashboard">
 

      <div className="flex-grow-1">
        <WIPHeader/>
        <main className="main-container p-4">
          {/* <div className="d-flex justify-content-start mb-3">
          <span><strong style={{color:"red"}}>Red: </strong>Over Capacity (Above <strong>23000</strong>)</span>&nbsp;&nbsp;
          <span><strong style={{color:"green"}}>Green: </strong>All Okay </span>&nbsp;&nbsp;
          <span><strong style={{color:"orange"}}>Orange: </strong>Under Capacity (Below <strong>19000</strong>)</span>&nbsp;&nbsp;
          <span><strong style={{color:"blue"}}>Blue: </strong>Process Issue Pending </span>&nbsp;&nbsp;
          <span><strong style={{color:"#cc66ff"}}>Lavender: </strong>Less Workers </span>&nbsp;&nbsp;
          </div> */}
            <table style={{ width: "100%", fontSize: "12px", borderCollapse: "collapse" }} className="mb-3">
              <tbody>
                <tr>
                  {/* First Div */}
                  <td style={{ width: "50%", verticalAlign: "top", padding: "8px" }}>
                    <div style={{ display: "grid" }}>
                      <span>
                        <strong style={{ color: "red" }}>Red:</strong> Over Capacity (Above <strong>23000</strong>)
                      </span>
                      <span>
                        <strong style={{ color: "green" }}>Green:</strong> All Okay
                      </span>
                      <span>
                        <strong style={{ color: "orange" }}>Orange:</strong> Under Capacity (Below <strong>19000</strong>)
                      </span>
                      <span>
                        <strong style={{ color: "blue" }}>Blue:</strong> Process Issue Pending
                      </span>
                      <span>
                        <strong style={{ color: "#cc66ff" }}>Lavender:</strong> Less Workers
                      </span>
                    </div>
                  </td>
                  {/* Second Div */}
                  <td style={{ width: "50%", verticalAlign: "top", padding: "8px", textAlign: "right" }}>
                    <div style={{ display: "grid" }}>
                      <span>               
                        <strong>Present Workers:</strong>{" "}
                      {filteredPresentEmployees.reduce(
                        (acc, curr) => acc + curr.PresentEmployees,
                        0
                      )}
                      </span>
                      <span>
                      <strong>Quantity Wise Workers:</strong> {filteredRequiredResources}
                      </span>
                      <span>
                      <strong>Workers To Fill:</strong>{" "}
                      {Math.max(
                        0,
                        filteredRequiredResources - filteredPresentEmployees.reduce(
                          (acc, curr) => acc + curr.PresentEmployees,
                          0
                        )
                      )}
                    </span>
                      
                    <span>
                    <strong>Reserved Worker:</strong>{" "}
                    {presentEmployees.filter(emp => emp.Department === "Reserve").reduce((acc, curr) => acc + curr.PresentEmployees, 0)}
                  </span>
                    </div>
                  </td>
                </tr>
              </tbody>
          </table>
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
            {/* <div className="d-flex">
            
              <p>
              <strong>Present Employees:</strong>{" "}
              {filteredPresentEmployees.reduce(
                (acc, curr) => acc + curr.PresentEmployees,
                0
              )}
            </p>

            </div> */}
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
                  filteredData.map((row, index) => {
                   // Check if the row has PendingProcess: "Yes"
                   const rowClass =
                   row["PendingProcess"] === "Yes" ? "table-info" : "";

                 return (
                   <tr key={index} className={rowClass}>
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
                      // ))
                    );
                  })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </main>
      </div>
      {/* Modal */}
      {/* {isModalOpen && modalData && (
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
      )} */}
      {isModalOpen && modalData && (
        <div className="modal show" tabIndex="-1" style={{ display: "block" }}>
          <div className="modal-dialog modal-lg">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Job Order Details</h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setIsModalOpen(false)}
                ></button>
              </div>
              <div className="modal-body">
                {/* Job Order Details */}
                <p>
                  <strong>Job Order No:</strong> {modalData["JOB ORDER NO"]}
                </p>
                <p>
                  <strong>Description:</strong> {modalData["Description"] || "No Description"}
                </p>

                {/* Rexine Data Table */}
                {matchedData.length > 0 ? (
                  <div className="table-responsive">
                    <table className="table table-bordered table-striped">
                      <thead>
                        <tr>
                          <th>Rexine Name</th>
                          <th>Black</th>
                          <th>Brown</th>
                          <th>Tan</th>
                          <th>Lot ID</th>
                        </tr>
                      </thead>
                      <tbody>
                        {matchedData.map((row, index) => (
                          <tr key={index}>
                            <td>{row["REXINE NAME"]}</td>
                            <td>{row["BLACK"]}</td>
                            <td>{row["BROWN"]}</td>
                            <td>{row["TAN"]}</td>
                            <td>{row["LOT ID"]}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p>No Design data found.</p>
                )}
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