import React, { useState, useEffect, useCallback } from "react";
import Header from "../components/Header";
import Sidebar from "../components/Sidebar";
import "../assets/CSS/Dashboard.css";
import axiosInstance from "../axiosConfig";

function Dashboard() {
  const [isSidebarVisible, setIsSidebarVisible] = useState(true); // Sidebar visibility state
  const [, setData] = useState([]); // State to hold all data
  const [modalData, setModalData] = useState(null); // State for modal data
  const [isModalOpen, setIsModalOpen] = useState(false); // State to control modal visibility

  const toggleSidebar = () => {
    setIsSidebarVisible(!isSidebarVisible); // Toggle the sidebar state
  };
  const fetchJobDescription = async (jobOrderNo) => {
    try {
      const response = await axiosInstance.get(
        `/api/data?jobOrderNo=${encodeURIComponent(jobOrderNo)}`
      );
      if (response.data && response.data.length > 0) {
        setModalData(response.data[0]); // Set the first item in the array as modal data
        setIsModalOpen(true); // Open modal
      } else {
        console.error("No data found for the provided Job Order No");
        setModalData(null); // Reset modal data in case of no response
      }
    } catch (error) {
      console.error("Error fetching job description:", error);
      setModalData(null); // Reset modal data in case of error
    }
  };
  const displayData = useCallback((data) => {
    const tableBody = document.getElementById("table-body");
    if (tableBody) {
      tableBody.innerHTML = ""; // Clear existing data

      data.forEach((row) => {
        const tr = document.createElement("tr");
        tr.innerHTML = `
           <td>
          <button type="button" class="job-link btn btn-link" data-job="${row["JOB ORDER NO"]}">
            ${row["JOB ORDER NO"]}
          </button>
        </td>
          <td>${new Date(row["JOB ORDER DATE"]).toLocaleDateString()}</td>
          <td>${row["ITEM NAME"]}</td>
          <td>${row["PROCESS NAME"]}</td>
          <td>${row["PROCESS GROUP"]}</td>
          <td>${row["QUANTITY"]}</td>
          <td>${row["DEPARTMENT"] || '<span class="text-danger">Department Not Available</span>'}</td>
        `;
        tableBody.appendChild(tr);
      });

           // Add click event for job links
              document.querySelectorAll(".job-link").forEach((link) => {
              link.addEventListener("click", async (e) => {
                const jobOrderNo = e.target.getAttribute("data-job");
                await fetchJobDescription(jobOrderNo);
              });
            });
    }
  }, []);

  const fetchFilteredData = useCallback(
    async (department) => {
      try {
        const url =
          department === "Department Not Available"
            ? "/api/data?department=null"
            : `/api/data?department=${encodeURIComponent(department)}`;
        const response = await axiosInstance.get(url);
        displayData(response.data);
      } catch (error) {
        console.error("Error fetching filtered data:", error);
      }
    },
    [displayData] // No external dependencies
  );

  const setupDepartmentFilter = useCallback(
    (departmentSums) => {
      const filterContainer = document.getElementById("filter-container");
      if (filterContainer) {
        filterContainer.innerHTML = ""; // Clear existing buttons

        Object.entries(departmentSums).forEach(([department, sum]) => {
          const button = document.createElement("div");
          button.className = "filter-btn btn btn-outline-secondary";

          // Determine color based on sum value
          const orangeCondition = sum < 29000; // Lesser than 19500
          const greenCondition = sum >= 29000 && sum <= 34500; // Between 19500 and 22500
          const redCondition = sum > 34500; // More than 22500

          // Create button content dynamically with 3 radio buttons
          button.innerHTML = `
            <div class="button-content">
              <span class="button-text">${department}</span>
              <span class="button-lights">
                <label class="radio-wrapper">
                  <input type="radio" name="${department}-light" disabled ${
            orangeCondition ? "checked" : ""
          } />
                  <span class="radio orange-light ${orangeCondition ? "active" : ""}"></span>
                </label>
                <label class="radio-wrapper">
                  <input type="radio" name="${department}-light" disabled ${
            greenCondition ? "checked" : ""
          } />
                  <span class="radio green-light ${greenCondition ? "active" : ""}"></span>
                </label>
                <label class="radio-wrapper">
                  <input type="radio" name="${department}-light" disabled ${
            redCondition ? "checked" : ""
          } />
                  <span class="radio red-light ${redCondition ? "active" : ""}"></span>
                </label>
              </span>
            </div>
          `;

          // Add tooltip attribute
          button.setAttribute("data-bs-toggle", "tooltip");
          button.setAttribute("data-bs-placement", "top");
          button.setAttribute("title", `Total Quantity: ${sum}`);

          // Add onclick event to filter data by department
          button.onclick = () => {
            fetchFilteredData(department);
          };

          filterContainer.appendChild(button);
        });
      }
    },
    [fetchFilteredData] // Dependency
  );


  const fetchData = useCallback(async () => {
    try {
      const response = await axiosInstance.get("/api/data");
      const fetchedData = response.data;
      setData(fetchedData); // Save data to state

      const departmentSums = fetchedData.reduce((acc, row) => {
        const dept = row["DEPARTMENT"] || "Department Not Available";
        acc[dept] = (acc[dept] || 0) + (row["QUANTITY"] || 0);
        return acc;
      }, {});

      setupDepartmentFilter(departmentSums);
      displayData(fetchedData);
    } catch (error) {
      displayErrorMessage("Database Connection Lost");
    }
  }, [setupDepartmentFilter, displayData]);

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
        const lastUpdated = response.data.reduce((latest, current) => {
          return current["Updated_Time"] > latest["Updated_Time"]
            ? current
            : latest;
        });

        const formattedDate = lastUpdated["Updated_Time"];
        const updatedDateInput = document.getElementById("updatedDate");
        if (updatedDateInput) {
          updatedDateInput.value = formattedDate;
        }
      }
    } catch (error) {
      console.error("Error fetching last updated time:", error);
    }
  }, []);

  const displayErrorMessage = (message) => {
    const tableBody = document.getElementById("table-body");
    if (tableBody) {
      tableBody.innerHTML = `<tr>
        <td colspan="7" class="text-center text-danger font-weight-bold text-uppercase">
          ${message}
        </td>
      </tr>`;
    }
  };

  useEffect(() => {
    fetchData();
    fetchLastUpdatedDate();

    const interval = setInterval(checkServerHealth, 5050);
    return () => clearInterval(interval);
  }, [fetchData, fetchLastUpdatedDate, checkServerHealth]);

  const handleViewAll = async () => {
    await fetchData(); // Refetch all data
  };
  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axiosInstance.get("/api/data");
        displayData(response.data); // Display the fetched data
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };

    fetchData();
  }, [displayData]);

  return (
    <div className="d-flex dashboard">
      <div className={isSidebarVisible ? "sidebar-container" : "sidebar-hidden"}>
        <Sidebar />
      </div>

      <div className="flex-grow-1">
        <Header toggleSidebar={toggleSidebar} isSidebarVisible={isSidebarVisible} />
        <main className="p-4">
          <div className="container-fluid mt-2 d-flex justify-content-end align-items-center mb-2">
            <p className="font-weight-bold text-uppercase mb-0 mr-2">LAST UPDATED TIME&nbsp;</p>
            <input
              type="text"
              id="updatedDate"
              readOnly
              style={{ height: "31px", color: "green", maxWidth: "168px" }}
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
                <tbody id="table-body"></tbody>
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
                  <strong>Description:</strong> {modalData.Description || "No Description"}
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
