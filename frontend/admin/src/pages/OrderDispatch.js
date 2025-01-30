import React, { useState, useEffect } from "react";
import Header from "../components/Header";
import "../assets/CSS/Dashboard.css";
import axiosInstance from "../axiosConfig";
import Sidebar from "../components/Sidebar";
import DataTable from "react-data-table-component";

const OrderDispatch = () => {
  const [inventory, setInventory] = useState([]); // Store order dispatch data
  const [isSidebarVisible, setIsSidebarVisible] = useState(true);


  const toggleSidebar = () => {
    setIsSidebarVisible(!isSidebarVisible);
  };

  // Fetch order dispatch data from API
  const fetchInventory = async () => {
    try {
      const response = await axiosInstance.get("/api/order-dispatch");
      console.log("Fetched Order Dispatch:", response.data); // Debug data
      setInventory(response.data);
    } catch (error) {
      console.error("Error fetching order dispatch data:", error);
    }
  };

  useEffect(() => {
    fetchInventory();
  }, []);

  // Handle status update
  const handleStatusUpdate = async (id, newStatus) => {
    try {
      if (!id) {
        alert("Invalid ID");
        return;
      }

      await axiosInstance.patch(`/api/order-dispatch/${id}`, { STATUS: newStatus });
      alert("Status updated successfully");
      fetchInventory(); // Refresh the list after update
    } catch (error) {
      console.error("Error updating status:", error);
      alert("Failed to update status.");
    }
  };

  const handleConfirmDispatch = async (id) => {
    if (!window.confirm("Are you sure you want to confirm this dispatch?")) return;
  
    try {
      await axiosInstance.delete(`/api/order-dispatch/${id}`); // Call DELETE API
      alert("Order dispatch confirmed and removed successfully!");
      fetchInventory(); // Refresh the data after deleting
    } catch (error) {
      console.error("Error confirming dispatch:", error);
      alert("Failed to confirm dispatch.");
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
      name: "Process Name",
      selector: (row) => (
        <span
        data-bs-toggle="tooltip"
        data-bs-placement="top"
        title={`${row["PROCESS NAME"]}`}
      >
        {row["PROCESS NAME"]}
      </span>
      ),    
      sortable: true,
    },
    {
      name: "Item Name",
      selector: (row) => (
        <span
        data-bs-toggle="tooltip"
        data-bs-placement="top"
        title={`${row["ITEM NAME"]}`}
      >
        {row["ITEM NAME"]}
        </span>
      ),
      sortable: true,
    },
    {
      name: "Quantity",
      selector: (row) => row["QUANTITY"],
      sortable: true,
    },
    {
      name: "Department",
      selector: (row) => row["DEPARTMENT"],
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
          <option value="Pending">Pending</option>
          <option value="Ready to Dispatch">Ready to Dispatch</option>
          <option value="Dispatched" style={{display:"none"}} disabled>Dispatched</option>
        
        </select>
      ),
      sortable: true,
    },
    {
      name: "Confirm Dispatch",
      cell: (row) =>
        row["STATUS"] === "Dispatched" ? (
          <button
            className="btn btn-success btn-sm"
            onClick={() => handleConfirmDispatch(row.ID)}
          >
            Confirm
          </button>
        ) : (
          <span className="text-muted">N/A</span> // Show "N/A" for other statuses
        ),
      ignoreRowClick: true,
      allowOverflow: true,
      button: true,
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
            <h3 className="mb-4">Order Dispatch</h3>
            {inventory.length > 0 ? (
              <DataTable
                columns={columns}
                data={inventory}
                pagination
                highlightOnHover
                pointerOnHover
              />
            ) : (
              <p className="text-center mt-4">No order dispatch data available.</p>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default OrderDispatch;
