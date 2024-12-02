import React, { useState, useEffect } from "react";
import Header from "../components/Header";
import Sidebar from "../components/Sidebar";
import "../assets/CSS/Dashboard.css";
import axiosInstance from "../axiosConfig";

function Dashboard() {
  const [isSidebarVisible, setIsSidebarVisible] = useState(true); // Sidebar visibility state

  const toggleSidebar = () => {
    setIsSidebarVisible(!isSidebarVisible); // Toggle the sidebar state
  };

  useEffect(() => {
    let wasDisconnected = false;

    const checkServerHealth = async () => {
      try {
        const response = await axiosInstance.get("/api/health");
        const health = response.data;

        if (health.status === "connected") {
          if (wasDisconnected) {
            window.location.reload();
          }
          wasDisconnected = false;
        } else {
          displayErrorMessage("Database Connection Lost");
          wasDisconnected = true;
        }
      } catch (error) {
        displayErrorMessage("Database Connection Lost");
        wasDisconnected = true;
      }
    };

    const fetchData = async () => {
      try {
        const response = await axiosInstance.get("/api/data");
        const data = response.data;

        const departmentSums = data.reduce((acc, row) => {
          const dept = row["DEPARTMENT"] || "Department Not Available";
          acc[dept] = (acc[dept] || 0) + (row["QUANTITY"] || 0);
          return acc;
        }, {});

        setupDepartmentFilter(departmentSums);
        displayData(data);
      } catch (error) {
        displayErrorMessage("Database Connection Lost");
      }
    };

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

    const displayData = (data) => {
      const tableBody = document.getElementById("table-body");
      if (tableBody) {
        tableBody.innerHTML = ""; // Clear existing data

        data.forEach((row) => {
          const tr = document.createElement("tr");
          tr.innerHTML = `
            <td><a href="description.html?jobOrderNo=${encodeURIComponent(row["JOB ORDER NO"])}">
              ${row["JOB ORDER NO"]}
            </a></td>
            <td>${new Date(row["JOB ORDER DATE"]).toLocaleDateString()}</td>
            <td>${row["ITEM NAME"]}</td>
            <td>${row["PROCESS NAME"]}</td>
            <td>${row["PROCESS GROUP"]}</td>
            <td>${row["QUANTITY"]}</td>
            <td>${row["DEPARTMENT"] || '<span class="text-danger">Department Not Available</span>'}</td>
          `;
          tableBody.appendChild(tr);
        });
      }
    };

    

    const setupDepartmentFilter = (departmentSums) => {
      const filterContainer = document.getElementById("filter-container");
      if (filterContainer) {
        filterContainer.innerHTML = ""; // Clear any existing buttons
    
        Object.entries(departmentSums).forEach(([department, sum]) => {
          const button = document.createElement("div");
          button.className = "filter-btn btn btn-outline-secondary";
    
          // Determine color based on sum value
          let orangeCondition = sum < 19500; // Lesser than 19500
          let greenCondition = sum >= 19500 && sum <= 22500; // Between 19500 and 21000
          let redCondition = sum > 22500; // More than 21000
    
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
            // Optionally setActiveButton(button);
          };
    
          filterContainer.appendChild(button);
        });
      }
    };
    
    const fetchFilteredData = async (department) => {
      try {
        const url =
          department === "Department Not Available"
            ? "/api/data?department=null"
            : `/api/data?department=${encodeURIComponent(department)}`;
        const response = await axiosInstance.get(url);
        const data = response.data;
        displayData(data);
      } catch (error) {
        console.error("Error fetching filtered data:", error);
      }
    };

    // const setActiveButton = (activeButton) => {
    //   const buttons = document.querySelectorAll("#filter-container button");
    //   buttons.forEach((button) => button.classList.remove("active"));
    //   activeButton.classList.add("active");
    // };

    const fetchLastUpdatedDate = async () => {
      try {
        const response = await axiosInstance.get("/api/data");
        const data = response.data;

        if (data && data.length > 0) {
          const lastUpdated = data.reduce((latest, current) => {
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
    };

    const init = async () => {
      await fetchData();
      await fetchLastUpdatedDate();
    };

    init();
    const interval = setInterval(checkServerHealth, 5050);

    return () => clearInterval(interval);
  }, []);


    // Show the button when the user scrolls down 20px from the top
    window.onscroll = function() {
      const backToTopBtn = document.getElementById("backToTopBtn");
      if (document.body.scrollTop > 20 || document.documentElement.scrollTop > 20) {
          backToTopBtn.style.display = "block";
      } else {
          backToTopBtn.style.display = "none";
      }
  };
  
//   // Scroll to the top of the page when the button is clicked
//   document.getElementById("viewAllButton").addEventListener("click", async function() {
//     await fetchData(); // Fetch all data (no department filter)
// });

  return (
    <div className="d-flex dashboard">
      <div className={isSidebarVisible ? "sidebar-container" : "sidebar-hidden"}>
        <Sidebar />
      </div>

      <div className="flex-grow-1">
        <Header toggleSidebar={toggleSidebar} isSidebarVisible={isSidebarVisible} />
        <main className="p-4">
          <div className="container-fluid mt-2 d-flex justify-content-end align-items-center mb-4">
            <p className="font-weight-bold text-uppercase mb-0 mr-2">LAST UPDATED TIME&nbsp;</p>
            <input
              type="text"
              id="updatedDate"
              readOnly
              style={{ height: "31px", color: "green", maxWidth: "168px" }}
            />
          </div>

          <div className="d-flex align-items-center mb-4">
            <div id="filter-container" className="filter-grid w-100"></div>
          </div>

          <div className="container mt-4">
            <div className="table-responsive">
            <div class="d-flex justify-content-end">
            <button
                id="viewAllButton"
                type="button"
                class="btn btn-secondary mb-3">
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
           <button
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
            id="backToTopBtn"
            title="Go to top"
          >
            ▲
          </button>
        </main>
      </div>
    </div>
  );
}

export default Dashboard;
