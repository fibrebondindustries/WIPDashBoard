import React, { useState, useEffect, useCallback } from "react";
import Header from "../components/Header";
import "../assets/CSS/Dashboard.css";
import axiosInstance from "../axiosConfig";
import Sidebar from "../components/Sidebar";
import DataTable from "react-data-table-component";

function SalesFlow() {
  const [records, setRecords] = useState([]); // SalesFlow records
  const [filteredRecords, setFilteredRecords] = useState([]); // Filtered records
  const [isSidebarVisible, setIsSidebarVisible] = useState(true);
  const [showModal, setShowModal] = useState(false); // Modal state for adding records
  const [showUpdateModal, setShowUpdateModal] = useState(false); // Update modal state
  const [selectedRow, setSelectedRow] = useState(null); // Selected row for update
  const [filters, setFilters] = useState({ searchQuery: "", fromDate: "", toDate: "" });

  const initialFormData = {
    LOT_ID: "",
    SRP_NO: "",
    RECEIVED_TIME: "",
    QUANTITY: "",
    Invoice_Number: "",
    Remarks: "",
  };

  const [formData, setFormData] = useState(initialFormData);

  const toggleSidebar = () => setIsSidebarVisible(!isSidebarVisible);

  // ** Fetch all SalesFlow records **
  const fetchRecords = useCallback(async () => {
    try {
      const response = await axiosInstance.get("/api/sales-flow");
      setRecords(response.data);
      setFilteredRecords(response.data);
    } catch (error) {
      console.error("Error fetching records:", error);
      // alert("Failed to fetch records.");
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
    const { searchQuery } = filters;

    const filtered = records.filter((record) => {
      // const recordDate = new Date(record["RECEIVED TIME"]);

      const matchesSearch =
        searchQuery === "" ||
        [record["LOT ID"], record["SRP NO"], record.QUANTITY, record["RECEIVED TIME"] ,record.Invoice_Number]
          .join(" ")
          .toLowerCase()
          .includes(searchQuery.toLowerCase());

      // const matchesDate =
      //   (fromDate === "" || recordDate >= new Date(fromDate)) &&
      //   (toDate === "" || recordDate <= new Date(toDate));

      return matchesSearch ;
    });

    setFilteredRecords(filtered);
  }, [filters, records]);

  // ** Handle Input Changes for Modal Form **
  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

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

  // ** Add a New Record **
  const handleFormSubmit = async (e) => {
    e.preventDefault();
    try {
      await axiosInstance.post("/api/sales-flow", formData);
      showAlert("Record added successfully!", "success");
      setShowModal(false);
      fetchRecords();
      setFormData(initialFormData);
    } catch (error) {
      console.error("Error creating record:", error);
      showAlert("Failed to create record.", "danger");
    }
  };

  // ** Update a Record **
  const handleUpdateSubmit = async (e) => {
    e.preventDefault();
    if (!selectedRow) {
      showAlert("No row selected for update!", "danger");
      return;
    }
    try {
      await axiosInstance.put(`/api/sales-flow/${selectedRow.ID}`, formData);
      showAlert("Record updated successfully!", "success");
      setShowUpdateModal(false);
      fetchRecords();
      setFormData(initialFormData);
    } catch (error) {
      console.error("Error updating record:", error);
      showAlert("Failed to update record.", "danger");
    }
  };

    // Clear form data and close modal
    const resetFormAndCloseModal = (closeModalCallback) => {
        setFormData(initialFormData);
        closeModalCallback();
      };

       // ** Set form data correctly for update modal **
  const handleUpdateClick = () => {
    if (selectedRow) {
      setFormData({
        LOT_ID: selectedRow["LOT ID"] || "",
        SRP_NO: selectedRow["SRP NO"] || "",
        RECEIVED_TIME: selectedRow["RECEIVED TIME"] || "", // If empty, use new timestamp
        QUANTITY: selectedRow["QUANTITY"] || "",
        Invoice_Number: selectedRow["Invoice_Number"] || "",
        Remarks: selectedRow["Remarks"] || "",

      });
      setShowUpdateModal(true);
    } else {
      showAlert("Please select a row to update!", "danger");
    }
  };

  // ** Delete a Record **
  const deleteRecord = async (id) => {
    if (!window.confirm("Are you sure you want to delete this record?")) return;
    try {
      await axiosInstance.delete(`/api/sales-flow/${id}`);
      showAlert("Record deleted successfully!", "success");
      fetchRecords();
    } catch (error) {
      console.error("Error deleting record:", error);
      showAlert("Failed to delete record.", "danger");
    }
  };

  // ** DataTable Columns **
  const columns = [
    { name: "LOT ID", selector: (row) => (
      <span
      data-bs-toggle="tooltip"
      data-bs-placement="top"
      title={row["LOT ID"]}
      >
      {row["LOT ID"]}
      </span>
    ), sortable: true },
    { name: "SRP NO", selector: (row) => row["SRP NO"], sortable: true },
    { name: "Issued Time", width:"170px", selector: (row) =>(
      <span
      data-bs-toggle="tooltip"
      data-bs-placement="top"
      title={row["RECEIVED TIME"]}
      >
        {row["RECEIVED TIME"]}
      </span>
    ) , sortable: true },
    { name: "Quantity", selector: (row) => row["QUANTITY"], sortable: true },
    { name: "Invoice Number", selector: (row) => row["Invoice_Number"] || "N/A", sortable: true },
    { name: "Confirmed", selector: (row) => (row["Confirm Time"] ? "Yes" : "No"), sortable: true },
    { name: "Remarks", selector: (row) =>(
      <span
      data-bs-toggle="tooltip"
      data-bs-placement="top"
      title={row["Remarks"]}
      >
      {row["Remarks"] || "N/A"}
      </span>
    ), sortable: true },
    { name: "Status", selector: (row) =>(
      <span
      data-bs-toggle="tooltip"
      data-bs-placement="top"
      title={row["SO_Status"]}
      >
      { row["SO_Status"] || "N/A"}
      </span>

    ), sortable: true },
    {
      name: "Actions",
      cell: (row) => (
        <button className="btn btn-danger btn-sm" onClick={() => deleteRecord(row.ID)}>
          Delete
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
          <div className="container">
          <div className="d-flex justify-content-between align-items-center"> 
            <h3 className="mb-5">Sales Flow</h3>
            <div className="d-flex gap-2">
              <button
                className="btn btn-primary"
                onClick={() => setShowModal(true)}
              >
                Add Record
              </button>
             {/* <button
                className="btn btn-primary"
                onClick={() => {
                  setFormData({ 
                    ...initialFormData, 
                    RECEIVED_TIME: formatDateTime(new Date())  // Auto-fill timestamp
                  });
                  setShowModal(true);
                }}
              >
                Add Record
              </button> */}

                <button className="btn btn-primary" onClick={handleUpdateClick}>
                  Update Record
                </button>
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
              selectableRows
              highlightOnHover
              onSelectedRowsChange={(selected) => setSelectedRow(selected.selectedRows[0] || null)}
            />
          </div>
        </main>
      </div>

    {/* Add Record Modal */}
    {showModal && (
    <div className="modal show" style={{ display: "block" }}>
        <div className="modal-dialog">
        <div className="modal-content">
            <div className="modal-header">
            <h5 className="modal-title">Add Sales Record</h5>
            <button type="button" className="btn-close" onClick={() => resetFormAndCloseModal(() => setShowModal(false))}></button>
            </div>
            <form onSubmit={handleFormSubmit}>
            <div className="modal-body">
                <div className="mb-3">
                <label className="form-label">LOT ID</label>
                <input type="text" name="LOT_ID" value={formData.LOT_ID} onChange={handleFormChange} className="form-control" placeholder="Enter LOT ID" required />
                </div>
                <div className="mb-3">
                <label className="form-label">SRP NO</label>
                <input type="text" name="SRP_NO" value={formData.SRP_NO} onChange={handleFormChange} className="form-control" placeholder="Enter SRP NO" required />
                </div>
                {/* <div className="mb-3">
                <label className="form-label">Issued Time</label>
                <input type="text" name="RECEIVED_TIME" value={formData.RECEIVED_TIME} onChange={handleFormChange} className="form-control" required readOnly/>
                </div> */}
                <div className="mb-3">
                <label className="form-label">Quantity</label>
                <input type="number" name="QUANTITY" value={formData.QUANTITY} onChange={handleFormChange} className="form-control" placeholder="Enter Quantity" required />
                </div>
                <div className="mb-3">
                <label className="form-label">Remarks</label>               
                <textarea name="Remarks" value={formData.Remarks} onChange={handleFormChange} className="form-control" placeholder="Enter Remarks" required />
                </div>
                
               
            </div>
            <div className="modal-footer">
                <button type="submit" className="btn btn-primary">Save</button>
                <button type="button" className="btn btn-secondary" onClick={() => resetFormAndCloseModal(() => setShowModal(false))}>Close</button>
            </div>
            </form>
        </div>
        </div>
    </div>
    )}

    {/* Update Record Modal */}
    {showUpdateModal && (
    <div className="modal show" style={{ display: "block" }}>
        <div className="modal-dialog">
        <div className="modal-content">
            <div className="modal-header">
            <h5 className="modal-title">Update Sales Record</h5>
            <button type="button" className="btn-close" onClick={() => resetFormAndCloseModal(() => setShowUpdateModal(false))}></button>
            </div>
            <form onSubmit={handleUpdateSubmit}>
            <div className="modal-body">
                <div className="mb-3">
                <label className="form-label">LOT ID</label>
                <input type="text" name="LOT_ID" value={formData.LOT_ID} onChange={handleFormChange} className="form-control" required />
                </div>
                <div className="mb-3">
                <label className="form-label">SRP NO</label>
                <input type="text" name="SRP_NO" value={formData.SRP_NO} onChange={handleFormChange} className="form-control" required />
                </div>
                {/* <div className="mb-3">
                <label className="form-label">Issued Time</label>
                <input type="text" name="RECEIVED_TIME" value={formData.RECEIVED_TIME} onChange={handleFormChange} className="form-control" readOnly/>
                </div> */}
                <div className="mb-3">
                <label className="form-label">Quantity</label>
                <input type="number" name="QUANTITY" value={formData.QUANTITY} onChange={handleFormChange} className="form-control" required />
                </div>
                <div className="mb-3">
                <label className="form-label">Remarks</label>               
                <textarea name="Remarks" value={formData.Remarks} onChange={handleFormChange} className="form-control" placeholder="Enter Remarks" required />
                </div>
                
            </div>
            <div className="modal-footer">
                <button type="submit" className="btn btn-primary">Update</button>
                <button type="button" className="btn btn-secondary" onClick={() => resetFormAndCloseModal(() => setShowUpdateModal(false))}>Close</button>
            </div>
            </form>
        </div>
        </div>
    </div>
    )}

    </div>
  );
}

export default SalesFlow;
