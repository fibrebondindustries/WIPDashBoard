//this module is visible to Faizan only
import React, { useState, useEffect, useCallback } from "react";
import Header from "../components/Header";
import "../assets/CSS/Dashboard.css";
import axiosInstance from "../axiosConfig";
import Sidebar from "../components/Sidebar";
import DataTable from "react-data-table-component";

function SalesFlowScan() {
  const [records, setRecords] = useState([]); // SalesFlow records
  const [filteredRecords, setFilteredRecords] = useState([]); // Filtered records
  const [isSidebarVisible, setIsSidebarVisible] = useState(true);
  const [filters, setFilters] = useState({ searchQuery: "", fromDate: "", toDate: "" });
  const [invoiceUpdates, setInvoiceUpdates] = useState({});
  const [scanStatusUpdates, setScanStatusUpdates] = useState({});
  // const [invoiceStatusUpdates, setInvoiceStatusUpdates] = useState({});
  // const handleInvoiceChange = (e, id) => {
  //   setInvoiceUpdates((prev) => ({ ...prev, [id]: e.target.value }));
  // };
  

  const toggleSidebar = () => setIsSidebarVisible(!isSidebarVisible);

  // ** Fetch all SalesFlow records **
  const fetchRecords = useCallback(async () => {
    try {
      const response = await axiosInstance.get("/api/sales-flow-Scan");
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


    // ** Update Scan Status **
    const handleScanStatusUpdate = async (id, newStatus) => {
      try {
        if (!id) return;
  
        setScanStatusUpdates((prev) => ({ ...prev, [id]: newStatus }));
  
        await axiosInstance.patch(`/api/sales-flow/scan-status/${id}`, { ScanStatus: newStatus });
  
        showAlert("Scan Status updated successfully!", "success");
        fetchRecords();
      } catch (error) {
        console.error("Error updating Scan Status:", error);
        showAlert("Failed to update Scan Status.", "danger");
      }
    };
    const handleInvoiceUpdate = (id, newInvoice) => {
      if (!id) return;
    
      // Trim whitespace and ensure null is only sent when user intentionally clears it
      const sanitizedInvoice = newInvoice?.trim() || null;
    
      // If the value hasn't changed, do not trigger an update
      if (sanitizedInvoice === records.find((record) => record.ID === id)?.Invoice_Number) {
        return;
      }
    
      // Update local state for immediate UI feedback
      setInvoiceUpdates((prev) => ({ ...prev, [id]: sanitizedInvoice }));
    
      clearTimeout(window.invoiceUpdateTimeout);
      window.invoiceUpdateTimeout = setTimeout(async () => {
        try {
          await axiosInstance.patch(`/api/sales-flow/invoice/${id}`, {
            Invoice_Number: sanitizedInvoice,
          });
    
          showAlert("Invoice Number updated successfully!", "success");
          fetchRecords(); // Refresh Data
        } catch (error) {
          console.error("Error updating Invoice Number:", error);
          showAlert("Failed to update Invoice Number.", "danger");
        }
      }, 800); // 800ms delay to reduce API calls
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
    // { name: "Invoice Number", selector: (row) => row["Invoice_Number"] || "N/A", sortable: true },
    { name: "Remarks", selector: (row) =>(
      <span
      data-bs-toggle="tooltip"
      data-bs-placement="top"
      title={row["Remarks"]}
      >
      {row["Remarks"] || "N/A"}
      </span>
    ), sortable: true },
    {
      name: "Invoice Number",
      cell: (row) => (
        <textarea
          className="form-control"
          rows="1"
          value={
            invoiceUpdates[row.ID] !== undefined
              ? invoiceUpdates[row.ID]
              : row.Invoice_Number || ""
          }
          onChange={(e) => setInvoiceUpdates((prev) => ({ ...prev, [row.ID]: e.target.value }))}
          onBlur={(e) => handleInvoiceUpdate(row.ID, e.target.value)}
          placeholder="EnterInvoice"
          style={{ fontSize: "12px" }}
          // disabled={row.ScanStatus !== "Sales Order Done"}  // Disable if Confirm Time is null (not confirmed)
        />
      ),
      sortable: true,
    },
    {
      name: "Scan Status",width:"200px",
      cell: (row) => (
        <select
          className="form-select form-select-sm bg-info text-black"
          value={scanStatusUpdates[row.ID] !== undefined ? scanStatusUpdates[row.ID] : row.ScanStatus || "N/A"}
          onChange={(e) => handleScanStatusUpdate(row.ID, e.target.value)}
        >
          <option value="" disabled selected>Select</option>
          <option value="Ready for Sales Order" style={{display:"none"}}>Ready for Scan</option>
          <option value="Sales Order Done">Sales Order Done</option>
        </select>
      ),
      sortable: true,
    },
    // { name: "Invoice Status", selector: (row) => row["InvoiceStatus"] || "N/A", sortable: true },
    // {
    //     name: "Invoice Status",
    //     cell: (row) => (
    //       <select
    //         className="form-select form-select-sm bg-success text-white"
    //         value={invoiceStatusUpdates[row.ID] !== undefined ? invoiceStatusUpdates[row.ID] : row.InvoiceStatus || "N/A"}
    //         onChange={(e) => handleInvoiceStatusUpdate(row.ID, e.target.value)}
    //       >
    //         <option value="Pending">Pending</option>
    //         <option value="Create Invoice">Create Invoice</option>
    //         {/* <option value="Scanned">Scanned</option> */}
    //       </select>
    //     ),
    //     sortable: true,
    //   },
    //  {
    //   name: "Actions",
    //   cell: (row) =>
    //     row["Confirm Time"] === null ? ( // Check if "Confirm Time" is NULL
    //       <button className="btn btn-success btn-sm" onClick={() => ConfirnRecord(row.ID)}>
    //         Confirm
    //       </button>
    //     ) : (
    //       <span className="text-muted">Confirmed</span> // Hide button if already confirmed
    //     ),
    //   ignoreRowClick: true,
    //   allowOverflow: true,
    //   button: true,
    // },
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
            <h3 className="mb-5">Sales Flow</h3>
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

export default SalesFlowScan;
