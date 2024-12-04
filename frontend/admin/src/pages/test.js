import React, { useState, useEffect, useCallback } from "react";
import Header from "../components/Header";
import Sidebar from "../components/Sidebar";
import "../assets/CSS/Dashboard.css";
import axiosInstance from "../axiosConfig";

function Dashboard() {
  const [isSidebarVisible, setIsSidebarVisible] = useState(true);
  const [data, setData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [workerRequirements, setWorkerRequirements] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");

  const toggleSidebar = () => {
    setIsSidebarVisible(!isSidebarVisible);
  };

  
  const fetchData = useCallback(async () => {
    try {
      // Fetch data from `/api/data`
      const dataResponse = await axiosInstance.get("/api/data");
      const fetchedData = dataResponse.data;
      setData(fetchedData);

      // Fetch worker requirements from `/api/departments/worker-requirements`
      const workerResponse = await axiosInstance.get(
        "/api/departments/worker-requirements"
      );
      const fetchedWorkerRequirements = workerResponse.data;
      setWorkerRequirements(fetchedWorkerRequirements);

      // Process data
      const departmentSums = fetchedData.reduce((acc, row) => {
        const dept = row["DEPARTMENT"] || "Department Not Available";
        acc[dept] = (acc[dept] || 0) + (row["QUANTITY"] || 0);
        return acc;
      }, {});

      const filterContainer = document.getElementById("filter-container");
      if (filterContainer) {
        filterContainer.innerHTML = ""; // Clear existing buttons

        Object.keys(departmentSums).forEach((department) => {
          const sum = departmentSums[department];

          // Find worker requirement for the department
          const workerRequirement = fetchedWorkerRequirements.find(
            (req) => req.DepartmentName.toLowerCase() === department.toLowerCase()
          );

          // Determine blue condition
          const blueCondition =
            workerRequirement &&
            workerRequirement.RequiredResource > workerRequirement.AvailableResource;

          // Determine other conditions
          const orangeCondition = sum < 29000;
          const greenCondition = sum >= 29000 && sum <= 34500;
          const redCondition = sum > 34500;

          // Create button
          const button = document.createElement("div");
          button.className = "filter-btn btn btn-outline-secondary";
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
                <label class="radio-wrapper">
                  <input type="radio" name="${department}-light" disabled ${
            blueCondition ? "checked" : ""
          } />
                  <span class="radio blue-light ${blueCondition ? "active" : ""}"></span>
                </label>
              </span>
            </div>
          `;
          if (blueCondition) {
            button.querySelector('.blue-light').style.backgroundColor = 'blue';
          }
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
      console.error("Error fetching data:", error);
    }
  }, []);

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
    console.log(workerRequirements); // Add this to make ESLint recognize its usage.
  }, [workerRequirements]);
  // Prevent unused variable warning
useEffect(() => {
  if (workerRequirements.length > 0) {
    console.log("Worker requirements fetched:", workerRequirements);
  }
}, [workerRequirements]);
  useEffect(() => {
    handleSearch();
  }, [searchQuery, handleSearch]);


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
          <div className="mb-0">
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
            style={{ marginTop: "-36px", zIndex: "-1", position: "relative" }}
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
                  {filteredData.map((row, index) => (
                    <tr key={index}>
                      <td>{row["JOB ORDER NO"]}</td>
                      <td>
                        {new Date(row["JOB ORDER DATE"]).toLocaleDateString()}
                      </td>
                      <td>{row["ITEM NAME"]}</td>
                      <td>{row["PROCESS NAME"]}</td>
                      <td>{row["PROCESS GROUP"]}</td>
                      <td>{row["QUANTITY"]}</td>
                      <td>{row["DEPARTMENT"]}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

export default Dashboard;