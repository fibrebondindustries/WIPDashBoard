// import React, { useState, useEffect, useCallback } from "react";
// import Header from "../components/Header";
// import Sidebar from "../components/Sidebar";
// import "../assets/CSS/Dashboard.css";
// import axiosInstance from "../axiosConfig";

// function Dashboard() {
//   const [isSidebarVisible, setIsSidebarVisible] = useState(true); // Sidebar visibility state
//   const [data, setData] = useState([]); // State to hold all data
//   const [modalData, setModalData] = useState(null); // State for modal data
//   const [isModalOpen, setIsModalOpen] = useState(false); // State to control modal visibility
//   const [searchQuery, setSearchQuery] = useState(""); // State for search query
//   const [filteredData, setFilteredData] = useState([]); // State to hold filtered data

//   const toggleSidebar = () => {
//     setIsSidebarVisible(!isSidebarVisible); // Toggle the sidebar state
//   };
//   const fetchJobDescription = async (jobOrderNo) => {
//     try {
//       const response = await axiosInstance.get(
//         `/api/data?jobOrderNo=${encodeURIComponent(jobOrderNo)}`
//       );
//       if (response.data && response.data.length > 0) {
//         setModalData(response.data[0]); // Set the first item in the array as modal data
//         setIsModalOpen(true); // Open modal
//       } else {
//         console.error("No data found for the provided Job Order No");
//         setModalData(null); // Reset modal data in case of no response
//       }
//     } catch (error) {
//       console.error("Error fetching job description:", error);
//       setModalData(null); // Reset modal data in case of error
//     }
//   };
//   const displayData = useCallback((dataToDisplay) => {
//     const tableBody = document.getElementById("table-body");
//     if (tableBody) {
//       tableBody.innerHTML = ""; // Clear existing data

//       dataToDisplay.forEach((row) => {
//         const tr = document.createElement("tr");
//         tr.innerHTML = `
//            <td>
//           <button type="button" class="job-link btn btn-link" data-job="${row["JOB ORDER NO"]}">
//             ${row["JOB ORDER NO"]}
//           </button>
//         </td>
//           <td>${new Date(row["JOB ORDER DATE"]).toLocaleDateString()}</td>
//           <td>${row["ITEM NAME"]}</td>
//           <td>${row["PROCESS NAME"]}</td>
//           <td>${row["PROCESS GROUP"]}</td>
//           <td>${row["QUANTITY"]}</td>
//           <td>${row["DEPARTMENT"] || '<span class="text-danger">Department Not Available</span>'}</td>
//         `;
//         tableBody.appendChild(tr);
//       });

//            // Add click event for job links
//               document.querySelectorAll(".job-link").forEach((link) => {
//               link.addEventListener("click", async (e) => {
//                 const jobOrderNo = e.target.getAttribute("data-job");
//                 await fetchJobDescription(jobOrderNo);
//               });
//             });
//     }
//   }, []);

//   const fetchFilteredData = useCallback(
//     async (department) => {
//       try {
//         const url =
//           department === "Department Not Available"
//             ? "/api/data?department=null"
//             : `/api/data?department=${encodeURIComponent(department)}`;
//         const response = await axiosInstance.get(url);
//         displayData(response.data);
//       } catch (error) {
//         console.error("Error fetching filtered data:", error);
//       }
//     },
//     [displayData] // No external dependencies
//   );

//   const setupDepartmentFilter = useCallback(
//     (departmentSums) => {
//       const filterContainer = document.getElementById("filter-container");
//       if (filterContainer) {
//         filterContainer.innerHTML = ""; // Clear existing buttons

//         Object.entries(departmentSums).forEach(([department, sum]) => {
//           const button = document.createElement("div");
//           button.className = "filter-btn btn btn-outline-secondary";

//           // Determine color based on sum value
//           const orangeCondition = sum < 29000; // Lesser than 19500
//           const greenCondition = sum >= 29000 && sum <= 34500; // Between 19500 and 22500
//           const redCondition = sum > 34500; // More than 22500

//           // Create button content dynamically with 3 radio buttons
//           button.innerHTML = `
//             <div class="button-content">
//               <span class="button-text">${department}</span>
//               <span class="button-lights">
//                 <label class="radio-wrapper">
//                   <input type="radio" name="${department}-light" disabled ${
//             orangeCondition ? "checked" : ""
//           } />
//                   <span class="radio orange-light ${orangeCondition ? "active" : ""}"></span>
//                 </label>
//                 <label class="radio-wrapper">
//                   <input type="radio" name="${department}-light" disabled ${
//             greenCondition ? "checked" : ""
//           } />
//                   <span class="radio green-light ${greenCondition ? "active" : ""}"></span>
//                 </label>
//                 <label class="radio-wrapper">
//                   <input type="radio" name="${department}-light" disabled ${
//             redCondition ? "checked" : ""
//           } />
//                   <span class="radio red-light ${redCondition ? "active" : ""}"></span>
//                 </label>
//               </span>
//             </div>
//           `;

//           // Add tooltip attribute
//           button.setAttribute("data-bs-toggle", "tooltip");
//           button.setAttribute("data-bs-placement", "top");
//           button.setAttribute("title", `Total Quantity: ${sum}`);

//           // Add onclick event to filter data by department
//           button.onclick = () => {
//             fetchFilteredData(department);
//           };

//           filterContainer.appendChild(button);
//         });
//       }
//     },
//     [fetchFilteredData] // Dependency
//   );

// const handleSearch = useCallback(() => {
//   if (searchQuery.trim() === "") {
//     setFilteredData(data); // If search is empty, reset to original data
//   } else {
//     const filtered = data.filter((row) => {
//       const itemName = row["ITEM NAME"] ? row["ITEM NAME"].toLowerCase() : ""; // Handle null/undefined
//       const jobOrderNo = row["JOB ORDER NO"] ? row["JOB ORDER NO"].toLowerCase() : ""; // Handle null/undefined

//       return (
//         itemName.includes(searchQuery.toLowerCase()) ||
//         jobOrderNo.includes(searchQuery.toLowerCase())
//       );
//     });
//     setFilteredData(filtered);
//   }
// }, [data, searchQuery]);


//   useEffect(() => {
//     handleSearch(); // Call search logic whenever the query changes
//   }, [searchQuery, handleSearch]);


//   const fetchData = useCallback(async () => {
//     try {
//       const response = await axiosInstance.get("/api/data");
//       const fetchedData = response.data;
//       setData(fetchedData); // Save data to state

//       const departmentSums = fetchedData.reduce((acc, row) => {
//         const dept = row["DEPARTMENT"] || "Department Not Available";
//         acc[dept] = (acc[dept] || 0) + (row["QUANTITY"] || 0);
//         return acc;
//       }, {});

//       setupDepartmentFilter(departmentSums);
//       displayData(fetchedData);
//       setFilteredData(fetchedData); // Initially display all data
//     } catch (error) {
//       displayErrorMessage("Database Connection Lost");
//     }
//   }, [setupDepartmentFilter, displayData]);

//   const checkServerHealth = useCallback(async () => {
//     try {
//       const response = await axiosInstance.get("/api/health");
//       const health = response.data;

//       if (health.status !== "connected") {
//         displayErrorMessage("Database Connection Lost");
//       }
//     } catch (error) {
//       displayErrorMessage("Database Connection Lost");
//     }
//   }, []);

//   const fetchLastUpdatedDate = useCallback(async () => {
//     try {
//       const response = await axiosInstance.get("/api/data");
//       if (response.data && response.data.length > 0) {
//         const lastUpdated = response.data.reduce((latest, current) => {
//           return current["Updated_Time"] > latest["Updated_Time"]
//             ? current
//             : latest;
//         });

//         const formattedDate = lastUpdated["Updated_Time"];
//         const updatedDateInput = document.getElementById("updatedDate");
//         if (updatedDateInput) {
//           updatedDateInput.value = formattedDate;
//         }
//       }
//     } catch (error) {
//       console.error("Error fetching last updated time:", error);
//     }
//   }, []);

//   const displayErrorMessage = (message) => {
//     const tableBody = document.getElementById("table-body");
//     if (tableBody) {
//       tableBody.innerHTML = `<tr>
//         <td colspan="7" class="text-center text-danger font-weight-bold text-uppercase">
//           ${message}
//         </td>
//       </tr>`;
//     }
//   };

//   useEffect(() => {
//     fetchData();
//     fetchLastUpdatedDate();

//     const interval = setInterval(checkServerHealth, 5050);
//     return () => clearInterval(interval);
//   }, [fetchData, fetchLastUpdatedDate, checkServerHealth]);

//   const handleViewAll = async () => {
//     await fetchData(); // Refetch all data
//   };
//   useEffect(() => {
//     const fetchData = async () => {
//       try {
//         const response = await axiosInstance.get("/api/data");
//         displayData(response.data); // Display the fetched data
//       } catch (error) {
//         console.error("Error fetching data:", error);
//       }
//     };

//     fetchData();
//   }, [displayData]);

//   return (
//     <div className="d-flex dashboard">
//       <div className={isSidebarVisible ? "sidebar-container" : "sidebar-hidden"}>
//         <Sidebar />
//       </div>

//       <div className="flex-grow-1">
//         <Header toggleSidebar={toggleSidebar} isSidebarVisible={isSidebarVisible} />
//         <main className="main-container p-4">
//         <div className="mb-0">
//             <input
//               type="text"
//               className="form-control"
//               placeholder="Search Item Name"
//               style={{width:"auto"}}
//               value={searchQuery}
//               onChange={(e) => setSearchQuery(e.target.value)} // Update search query
//             />
//           </div>
//           <div className="container-fluid  d-flex justify-content-end align-items-center mb-2" style={{marginTop:"-36px", zIndex:"-1", position:"relative"}}>
//             <p className="font-weight-bold text-uppercase mb-0 mr-2">LAST UPDATED TIME&nbsp;</p>
//             <input
//               type="text"
//               id="updatedDate"
//               readOnly
//               style={{ height: "31px", color: "green", maxWidth: "168px",  }}
//             />
//           </div>

//           <div className="d-flex align-items-center mb-2">
//             <div id="filter-container" className="filter-grid w-100"></div>
//           </div>

//           <div className="container mt-0">
//             <div className="table-responsive">
//               <div className="d-flex justify-content-end">
//                 <button
//                   onClick={handleViewAll}
//                   type="button"
//                   className="btn btn-secondary mb-3">
//                   View All
//                 </button>
//               </div>
//               <table className="table table-bordered table-striped">
//                 <thead>
//                   <tr>
//                     <th>JOB NO</th>
//                     <th>JOB DATE</th>
//                     <th>ITEM NAME (LOT ID)</th>
//                     <th>PROCESS NAME</th>
//                     <th>PROCESS GROUP</th>
//                     <th>QUANTITY</th>
//                     <th>DEPARTMENT</th>
//                   </tr>
//                 </thead>
//                 <tbody id="table-body">
//                   {/* Display filtered data */}
//                   {displayData(filteredData)}
//                 </tbody>
//               </table>
//             </div>
//           </div>
//         </main>
//       </div>
    //  {/* Modal */}
     
    //   {isModalOpen && modalData && (
    //     <div className="modal show" tabIndex="-1" style={{ display: "block" }}>
    //       <div className="modal-dialog">
    //         <div className="modal-content">
    //           <div className="modal-header">
    //             <h5 className="modal-title">Job Order Description</h5>
    //             <button
    //               type="button"
    //               className="btn-close"
    //               onClick={() => setIsModalOpen(false)}
    //             ></button>
    //           </div>
    //           <div className="modal-body">
    //             <p>
    //               <strong>Job Order No:</strong> {modalData["JOB ORDER NO"]}
    //             </p>
    //             <p>
    //               <strong>Description:</strong> {modalData.Description || "No Description"}
    //             </p>
    //           </div>
    //           <div className="modal-footer">
    //             <button
    //               type="button"
    //               className="btn btn-secondary"
    //               onClick={() => setIsModalOpen(false)}
    //             >
    //               Close
    //             </button>
    //           </div>
    //         </div>
    //       </div>
    //     </div>
    //   )}
//     </div>
//   );
// }
// export default Dashboard;


// ----------------------------- old 
//// ---backup code for filter
  // const fetchData = useCallback(async () => {
  //   try {
  //     // Fetch data from `/api/data`
  //     const dataResponse = await axiosInstance.get("/api/data");
  //     const fetchedData = dataResponse.data;
  //     setData(fetchedData);

  //     // Fetch worker requirements from `/api/departments/worker-requirements`
  //     const workerResponse = await axiosInstance.get(
  //       "/api/departments/worker-requirements"
  //     );
  //     const fetchedWorkerRequirements = workerResponse.data;
  //     setWorkerRequirements(fetchedWorkerRequirements);

  //     // Process data
  //     const departmentSums = fetchedData.reduce((acc, row) => {
  //       const dept = row["DEPARTMENT"] || "Department Not Available";
  //       acc[dept] = (acc[dept] || 0) + (row["QUANTITY"] || 0);
  //       return acc;
  //     }, {});

  //     const filterContainer = document.getElementById("filter-container");
  //     if (filterContainer) {
  //       filterContainer.innerHTML = ""; // Clear existing buttons

  //       Object.keys(departmentSums).forEach((department) => {
  //         const sum = departmentSums[department];

  //         // Find worker requirement for the department
  //         const workerRequirement = fetchedWorkerRequirements.find(
  //           (req) => req.DEPARTMENT.toLowerCase() === department.toLowerCase()
  //         );

  //         // Determine blue condition
  //         const blueCondition =
  //           workerRequirement &&
  //           workerRequirement.RequiredResource > workerRequirement.AvailableResource;

  //         // Determine other conditions
  //         const orangeCondition = sum < 29000;
  //         const greenCondition = sum >= 29000 && sum <= 34500;
  //         const redCondition = sum > 34500;

  //         // Create button
  //         const button = document.createElement("div");
  //         button.className = "filter-btn btn btn-outline-secondary";
  //         button.innerHTML = `
  //           <div class="button-content">
  //             <span class="button-text">${department}</span>
  //             <span class="button-lights">
  //               <label class="radio-wrapper">
  //                 <input type="radio" name="${department}-light" disabled ${
  //           orangeCondition ? "checked" : ""
  //         } />
  //                 <span class="radio orange-light ${orangeCondition ? "active" : ""}"></span>
  //               </label>
  //               <label class="radio-wrapper">
  //                 <input type="radio" name="${department}-light" disabled ${
  //           greenCondition ? "checked" : ""
  //         } />
  //                 <span class="radio green-light ${greenCondition ? "active" : ""}"></span>
  //               </label>
  //               <label class="radio-wrapper">
  //                 <input type="radio" name="${department}-light" disabled ${
  //           redCondition ? "checked" : ""
  //         } />
  //                 <span class="radio red-light ${redCondition ? "active" : ""}"></span>
  //               </label>
  //               <label class="radio-wrapper">
  //                 <input type="radio" name="${department}-light" disabled ${
  //           blueCondition ? "checked" : ""
  //         } />
  //                 <span class="radio blue-light ${blueCondition ? "active" : ""}"></span>
  //               </label>
  //             </span>
  //           </div>
  //         `;
  //         if (blueCondition) {
  //           button.querySelector('.blue-light').style.backgroundColor = 'blue';
  //         }

  //           // Add tooltip attribute
  //           button.setAttribute("data-bs-toggle", "tooltip");
  //           button.setAttribute("data-bs-placement", "top");
  //           button.setAttribute("title", `Total Quantity: ${sum}`);
  //         // Add click event
  //         button.onclick = () => {
  //           const filtered = fetchedData.filter(
  //             (row) => row["DEPARTMENT"] === department
  //           );
  //           setFilteredData(filtered);
  //         };

  //         filterContainer.appendChild(button);
  //       });
  //     }
  //   } catch (error) {
  //     displayErrorMessage("Database Connection Lost");
  //   }
  // }, []);

 
// ---backup code


import React, { useState, useEffect, useCallback } from "react";
import Header from "../components/Header";
import Sidebar from "../components/Sidebar";
import "../assets/CSS/Dashboard.css";
import axiosInstance from "../axiosConfig";

function Dashboard() {
  const [isSidebarVisible, setIsSidebarVisible] = useState(true);
  const [data, setData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [workerRequirements,] = useState([]); //setWorkerRequirements
  const [searchQuery, setSearchQuery] = useState("");
  const [modalData, setModalData] = useState(null); // State for modal data
  const [isModalOpen, setIsModalOpen] = useState(false); // State to control modal visibility
  const [presentEmployees, setPresentEmployees] = useState([]); // Present employees data
  const [filteredPresentEmployees, setFilteredPresentEmployees] = useState([]);


  const toggleSidebar = () => {
    setIsSidebarVisible(!isSidebarVisible);
  };

  
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

             // Check if any row in this department has PendingProcess: "Yes"
        const hasPendingProcess = rows.some(
          (row) => row["PendingProcess"] === "Yes"
        );

          const resultColor = rows[0]["Result"]; // Get Result for color
          const workerStatus = rows[0]["WorkerStatus"]; // Get WorkerStatus for blue condition
          const wipQuantity = rows[0]["Wip_quantity"] || "0"; // Use correct key name
          // Create button
          const button = document.createElement("div");
          button.className = "filter-btn btn btn-outline-secondary";
          button.innerHTML = `
            <div class="button-content">
                <span class="button-text" style="${
              hasPendingProcess ? "color: #0033cc;" : ""
            }">${department}</span>
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
          button.onclick = () => {
            const filtered = fetchedData.filter(
              (row) => row["DEPARTMENT"] === department
            );
            setFilteredData(filtered);
              // Filter present employees
            const filteredEmployees = presentEmployees.filter(
              (emp) => emp.Department === department
            );
            setFilteredPresentEmployees(filteredEmployees);
          };
          // };
  
          filterContainer.appendChild(button);
        });
      }
    } catch (error) {
      displayErrorMessage("Database Connection Lost");
    }
  }, [presentEmployees]);
  
  
  
  
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
              }, [fetchLastUpdatedDate]);
              
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



  return (
    <div className="d-flex dashboard">
      <div className={isSidebarVisible ? "sidebar-container" : "sidebar-hidden"}>
        <Sidebar />
      </div>

      <div className="flex-grow-1">
        <Header
          toggleSidebar={toggleSidebar}
          isSidebarVisible={isSidebarVisible}
        />
        <main className="main-container p-4">
          <div className="d-flex justify-content-start mb-3">
          <span><strong style={{color:"red"}}>Red: </strong>Over Capacity </span>&nbsp;&nbsp;
          <span><strong style={{color:"green"}}>Green: </strong>All Okay </span>&nbsp;&nbsp;
          <span><strong style={{color:"orange"}}>Orange: </strong>Under Capacity </span>&nbsp;&nbsp;
          <span><strong style={{color:"blue"}}>Blue: </strong>Process Issue Pending </span>&nbsp;&nbsp;
          <span><strong style={{color:"#cc66ff"}}>Lavender: </strong>Less Workers </span>&nbsp;&nbsp;
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
            <div className="d-flex">
              {/* <p>
                <strong>Present Employees:</strong>{" "}
                {presentEmployees.reduce((acc, curr) => acc + curr.PresentEmployees, 0)}
              </p> */}
              <p>
              <strong>Present Employees:</strong>{" "}
              {filteredPresentEmployees.reduce(
                (acc, curr) => acc + curr.PresentEmployees,
                0
              )}
            </p>

            </div>
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

export default Dashboard;