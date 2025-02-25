///this module is visible to Sudhir only
import React, { useState, useEffect, useCallback } from "react";
import Header from "../components/Header";
import "../assets/CSS/Dashboard.css";
import axiosInstance from "../axiosConfig";
import Sidebar from "../components/Sidebar";
import DataTable from "react-data-table-component";

function SalesFlowDispatch() {
  const [records, setRecords] = useState([]); // SalesFlow records
  const [filteredRecords, setFilteredRecords] = useState([]); // Filtered records
  const [isSidebarVisible, setIsSidebarVisible] = useState(true);
  const [filters, setFilters] = useState({ searchQuery: "", fromDate: "", toDate: "" });
  // const [invoiceUpdates, setInvoiceUpdates] = useState({});
  const [scanStatusUpdates, setScanStatusUpdates] = useState({});
  
  

  const toggleSidebar = () => setIsSidebarVisible(!isSidebarVisible);

  // ** Fetch all SalesFlow records **
  const fetchRecords = useCallback(async () => {
    try {
      const response = await axiosInstance.get("/api/sales-flow-Dispatch");
      setRecords(response.data);
      setFilteredRecords(response.data);
    } catch (error) {
      console.error("Error fetching records:", error);
      alert("Failed to fetch records.");
    }
  }, []);

  useEffect(() => {
    fetchRecords();
  }, [fetchRecords]);

  // ** Handle input changes for filters **
  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  // ** Apply filters (search & date range) **
  useEffect(() => {
    const { searchQuery, fromDate, toDate } = filters;

    const filtered = records.filter((record) => {
      const recordDate = new Date(record["RECEIVED TIME"]);

      const matchesSearch =
        searchQuery === "" ||
        [record["LOT ID"], record["SRP NO"], record.QUANTITY ,record.Invoice_Number]
          .join(" ")
          .toLowerCase()
          .includes(searchQuery.toLowerCase());

      const matchesDate =
        (fromDate === "" || recordDate >= new Date(fromDate)) &&
        (toDate === "" || recordDate <= new Date(toDate));

      return matchesSearch && matchesDate;
    });

    setFilteredRecords(filtered);
  }, [filters, records]);


  const showAlert = (message, type) => {
    const alertPlaceholder = document.getElementById("alertPlaceholder");
    const alertHTML = `
      <div class="alert alert-${type} alert-dismissible fade show" role="alert">
        <strong>${type === "success" ? "Success!" : "Error!"}</strong> ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
      </div>`;
    alertPlaceholder.innerHTML = alertHTML;
    setTimeout(() => (alertPlaceholder.innerHTML = ""), 2000);
  };

//   // ** Delete a Record **
// Corrected Delete Handler
const handleDeleteRecord = async (id) => {
  if (!window.confirm("Are you sure you want to delete this record?")) return;
  try {
    await axiosInstance.delete(`/api/sales-flow/${id}`);
    showAlert("Record deleted successfully!", "success");
    fetchRecords(); // Refresh records after deletion
  } catch (error) {
    console.error("Error deleting record:", error);
    showAlert("Failed to delete record.", "error");
  }
};




  
    // ** Update Scan Status **
    const handleScanStatusUpdate = async (id, newStatus) => {
      try {
        if (!id) return;
  
        setScanStatusUpdates((prev) => ({ ...prev, [id]: newStatus }));
  
        await axiosInstance.patch(`/api/sales-flow/scan-status/${id}`, { SO_Status: newStatus });
  
        showAlert("Scan Status updated successfully!", "success");
        fetchRecords();
      } catch (error) {
        console.error("Error updating Scan Status:", error);
        showAlert("Failed to update Scan Status.", "danger");
      }
    };

  const columns = [
    { name: "LOT ID",width:"170px", selector: (row) => (
      <span
      data-bs-toggle="tooltip"
      data-bs-placement="top"
      title={row["LOT ID"]}
      >
      {row["LOT ID"]}
      </span>
    ), sortable: true },
    { name: "SRP NO", selector: (row) => row["SRP NO"], sortable: true },
    { name: "Received Time", selector: (row) => (
      <span
      data-bs-toggle="tooltip"
      data-bs-placement="top"
      title={row["RECEIVED TIME"]}
      >
      {row["RECEIVED TIME"]}
      </span>
    ), sortable: true },
    { name: "Quantity", selector: (row) => row["QUANTITY"], sortable: true },
    { name: "Remarks", selector: (row) =>(
      <span
      data-bs-toggle="tooltip"
      data-bs-placement="top"
      title={row["Remarks"]}
      >
      {row["Remarks"] || "N/A"}
      </span>
    ), sortable: true },
    // {
    //   name: "Invoice Number",
    //   cell: (row) => (
    //     <textarea
    //       className="form-control"
    //       rows="1"
    //       value={
    //         invoiceUpdates[row.ID] !== undefined
    //           ? invoiceUpdates[row.ID]
    //           : row.Invoice_Number || ""
    //       }
    //       onChange={(e) => setInvoiceUpdates((prev) => ({ ...prev, [row.ID]: e.target.value }))}
    //       onBlur={(e) => handleInvoiceUpdate(row.ID, e.target.value)}
    //       placeholder="EnterInvoice"
    //       style={{ fontSize: "12px" }}
    //       disabled={!row["Confirm Time"] || row.SO_Status !== "Scanned"}  // Disable if Confirm Time is null (not confirmed)
    //     />
    //   ),
    //   sortable: true,
    // },
    { name: "Invoice Number", selector: (row) => row["Invoice_Number"] || "N/A", sortable: true },
    {
      name: "Status",width:"200px",
      cell: (row) => (
        <select
          className="form-select form-select-sm bg-info text-black"
          value={scanStatusUpdates[row.ID] !== undefined ? scanStatusUpdates[row.ID] : row.SO_Status || "N/A"}
          onChange={(e) => handleScanStatusUpdate(row.ID, e.target.value)}
          disabled={!row["Confirm Time"]} // Disable if not confirmed
        >
          <option value="" disabled selected>Select</option>
          <option value="Ready For Sales Order">Ready For SO</option>
          <option value="Ready For Dispatch" style={{display:"none"}}>Ready For Dispatch</option>
          <option value="Ready For Sticker" style={{display:"none"}}>Ready For Sticker</option>
        </select>
      ),
      sortable: true,
    },
    {
      name: "Actions",
      cell: (row) => (
        <button
          className="btn btn-success btn-sm"
          onClick={() => handleDeleteRecord(row.ID)}
          disabled={!(row.Invoice_Number && row.Invoice_Number !== "N/A" && row.SO_Status === "Ready For Dispatch")}
        >
          Done
        </button>
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
          <div id="alertPlaceholder"></div>
          <div className="">
          <div className="d-flex justify-content-between align-items-center"> 
            <h3 className="mb-5">Sales Flow Dispatch</h3>
            <div className="d-flex gap-2">
              {/* add record btn */}
            
                </div>
                </div>


            {/* Filter Section */}
            <input
                  type="text"
                  name="searchQuery"
                  value={filters.searchQuery}
                  onChange={handleFilterChange}
                  className="form-control me-2 mb-3"
                  style={{ width: "auto" }}
                  placeholder="Search..."
                />

            <DataTable
              columns={columns}
              data={filteredRecords}
              pagination
              // selectableRows
              highlightOnHover
            />
          </div>
        </main>
      </div>

  

    </div>
  );
}

export default SalesFlowDispatch;
