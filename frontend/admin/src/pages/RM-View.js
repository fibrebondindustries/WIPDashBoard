import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Header from "../components/Header";
import Sidebar from "../components/Sidebar";
import axiosInstance from "../axiosConfig";
import DataTable from "react-data-table-component";

function RMView() {
  const [isSidebarVisible, setIsSidebarVisible] = useState(true);
  const [loadingRecords, setLoadingRecords] = useState(false);
  const [excelRecords, setExcelRecords] = useState([]);
  const [updating, setUpdating] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const navigate = useNavigate();

  const toggleSidebar = () => setIsSidebarVisible(!isSidebarVisible);

  // ** Fetch RM Upload Data **
  const fetchExcelRecords = async () => {
    setLoadingRecords(true);
    try {
      const response = await axiosInstance.get("/api/get-RM-file-Status");

      // ✅ FIXED: Store the full object (including Uploaded_Date & PO_STATUS)
      setExcelRecords(response.data);
    } catch (error) {
      console.error("Error fetching RM file names:", error);
    } finally {
      setLoadingRecords(false);
    }
  };

  useEffect(() => {
    fetchExcelRecords();
  }, []);

  // ** Handle PO_STATUS Update **
  const handleStatusUpdate = async (fileName, newStatus) => {
    setUpdating(true);
    try {
      await axiosInstance.patch("/api/update-PO-status", {
        fileName,
        poStatus: newStatus,
      });

      // ✅ Update only the changed row without refreshing entire table
      setExcelRecords((prevRecords) =>
        prevRecords.map((record) =>
          record.File_Name === fileName ? { ...record, PO_STATUS: newStatus } : record
        )
      );
      showAlert("PO Status updated successfully.", "success");
    } catch (error) {
      console.error("Error updating PO_STATUS:", error);
    } finally {
      setUpdating(false);
    }
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

// ** Handle File Deletion **
const handleDeleteFile = async (fileName) => {
  if (!window.confirm(`Are you sure you want to delete "${fileName}"?`)) return;

  setDeleting(true);
  try {
    await axiosInstance.delete("/api/delete-RM-file", {
      data: { File_Name: fileName },
    });

    // ✅ Remove the deleted row from the UI without reloading
    setExcelRecords((prevRecords) => prevRecords.filter((record) => record.File_Name !== fileName));

    showAlert(`File "${fileName}" deleted successfully.`, "success");
  } catch (error) {
    console.error("Error deleting file:", error);
    showAlert(`Failed to delete "${fileName}".`, "error");
  } finally {
    setDeleting(false);
  }
};

  // ** Define DataTable Columns **
  const columns = [
    {
      name: "File Name",
      selector: (row) => row.File_Name,
      sortable: true,
      cell: (row) => (
        <button
          onClick={() => navigate(`/RM-detailed-view/${encodeURIComponent(row.File_Name)}`)}
          style={{
            background: "none",
            border: "none",
            color: "blue",
            textDecoration: "underline",
            cursor: "pointer",
          }}
        >
          {row.File_Name}
        </button>
      ),
    },
    {
      name: "PO Status",
      cell: (row) => (
        <select
          className={`form-select form-select-sm`}
          value={row.PO_STATUS}
          onChange={(e) => handleStatusUpdate(row.File_Name, e.target.value)}
          disabled={updating}
          
          style={{
            backgroundColor: row.PO_STATUS === "PO Raised" ? "green" : "red", // ✅ Dynamic color
            color: "white",
            cursor: row.PO_STATUS === "PO Raised" ? "not-allowed" : "pointer",
          }}
        >
          <option value="PO Not Raised">PO Not Raised</option>
          <option value="PO Raised">PO Raised</option>
        </select>
      ),
      sortable: true,
    },    
    {
      name: "Uploaded Date",
      selector: (row) => row.Uploaded_Date, // ✅ Uses directly without conversion
      sortable: true,
    },
    {
      name: "Actions",
      cell: (row) => (
        <button
          onClick={() => handleDeleteFile(row.File_Name)}
          className="btn btn-outline-success btn-sm"
          disabled={row.PO_STATUS !== "PO Raised" || deleting}
        >
          {deleting ? "Completing..." : "Done"}
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
          <h3 className="mb-4">RM View - File Names</h3>

          {loadingRecords ? (
            <div className="text-center my-3">
              <span className="spinner-border text-primary"></span> Loading data...
            </div>
          ) : (
            <DataTable columns={columns} data={excelRecords} pagination highlightOnHover />
          )}
        </main>
      </div>
    </div>
  );
}

export default RMView;
