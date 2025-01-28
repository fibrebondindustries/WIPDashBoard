import React, { useState, useEffect, useCallback } from "react";
import Header from "../components/Header";
import "../assets/CSS/Dashboard.css";
import axiosInstance from "../axiosConfig";
import Sidebar from "../components/Sidebar";
import DataTable from "react-data-table-component";

const ViewInventory = () => {
  const [inventory, setInventory] = useState([]); // Store inventory data
  const [isSidebarVisible, setIsSidebarVisible] = useState(true);

  // Fetch logged-in user info from local storage or global state
  const loggedInUser = JSON.parse(localStorage.getItem("user"));

  const toggleSidebar = () => {
    setIsSidebarVisible(!isSidebarVisible);
  };

  // Fetch inventory data from API
//   const fetchInventory = async () => {
//     try {
//       const response = await axiosInstance.get("/api/noke-inventory");
//       console.log("Fetched Inventory:", response.data); // Debug inventory data
//       setInventory(response.data);
//     } catch (error) {
//       console.error("Error fetching inventory:", error);
//     }
//   };
//   // Fetch inventory data from API
//   const fetchInventory = async () => {
//     try {
//       const response = await axiosInstance.get("/api/noke-inventory");
//       console.log("Fetched Inventory:", response.data); // Debug inventory data

//       // Filter inventory by logged-in supervisor name
//       const filteredData = response.data.filter(
//         (item) => item["SUPERVISOR"] === loggedInUser?.Name
//       );
//       setInventory(filteredData);
//     } catch (error) {
//       console.error("Error fetching inventory:", error);
//     }
//   };

 // Fetch inventory data from API
 const fetchInventory = useCallback(async () => {
    try {
      const response = await axiosInstance.get("/api/noke-inventory");
      console.log("Fetched Inventory:", response.data); // Debug inventory data

      // Filter inventory by logged-in supervisor name
      const filteredData = response.data.filter(
        (item) => item["SUPERVISOR"] === loggedInUser?.Name
      );
      setInventory(filteredData);
    } catch (error) {
      console.error("Error fetching inventory:", error);
    }
  }, [loggedInUser?.Name]); // Dependency array ensures function stability
  
  useEffect(() => {
    fetchInventory();
  }, [fetchInventory]);

  // Handle status update
  const handleStatusUpdate = async (id, newStatus) => {
    try {
      if (!id) {
        alert("Invalid ID");
        return;
      }
  
      await axiosInstance.patch(`/api/noke-inventory/${id}`, { STATUS: newStatus });
      alert("Status updated successfully");
      fetchInventory(); // Refresh the inventory list after update
    } catch (error) {
      console.error("Error updating status:", error);
      alert("Failed to update status.");
    }
  };
  

  // DataTable columns
  const columns = [
    {
      name: "Job Order No",
      selector: (row) => row["JOB ORDER NO"],
      sortable: true,
    },
    {
      name: "Job Order Date",
      selector: (row) => row["JOB ORDER DATE"],
      sortable: true,
    },
    {
      name: "Supervisor",
      selector: (row) => row["SUPERVISOR"],
      sortable: true,
    },
    {
      name: "Raw Material",
      selector: (row) => row["RAW MATERIAL"],
      sortable: true,
    },
    {
      name: "Status",
      cell: (row) => (
        <select
          className="form-select form-select-sm bg-info text-black"
          value={row["STATUS"]}
          onChange={(e) => handleStatusUpdate(row.ID, e.target.value)}
        >
          <option value="Not Use">Not Use</option>
          <option value="Used">Used</option>
        </select>
      ),
      sortable: true,
    },
  ];

  return (
    <div className="d-flex dashboard">
      <div className={isSidebarVisible ? "sidebar-container" : "sidebar-hidden"}>
        <Sidebar />
      </div>
      <div className="flex-grow-1">
        <Header toggleSidebar={toggleSidebar} isSidebarVisible={isSidebarVisible} />
        <main className="main-container p-4" style={{ height: "-webkit-fill-available" }}>
          <div className="container mt-0">
            <h3 className="mb-4">View Inventory</h3>
            <DataTable
              columns={columns}
              data={inventory}
              pagination
              highlightOnHover
              pointerOnHover
            />
          </div>
        </main>
      </div>
    </div>
  );
};

export default ViewInventory;
