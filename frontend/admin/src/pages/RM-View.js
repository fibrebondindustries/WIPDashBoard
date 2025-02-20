import React, { useState, useEffect, useRef } from "react";
import Header from "../components/Header";
import Sidebar from "../components/Sidebar";
import axiosInstance from "../axiosConfig";
import loaderGif from "../assets/Img/loading1.gif"; // Ensure correct path
import DataTable from "react-data-table-component"; // Import DataTable

function RM_View() {
  const [isSidebarVisible, setIsSidebarVisible] = useState(true);
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [loadingRecords, setLoadingRecords] = useState(false); // Loader for table
  const [excelRecords, setExcelRecords] = useState([]); // State for DataTable records

  const fileInputRef = useRef(null); // Reference to file input
  const user = JSON.parse(localStorage.getItem("user")) || {}; // Get user info
  const loggedInUser = user.Name || "N/A"; // Default if user.Name is not found

  const toggleSidebar = () => setIsSidebarVisible(!isSidebarVisible);

  // ** Fetch RM Upload Data **
  const fetchExcelRecords = async () => {
    setLoadingRecords(true);
    try {
      const response = await axiosInstance.get("/api/get-RM-data"); // ✅ Correct API Endpoint
      setExcelRecords(response.data); // ✅ Store data in state
    } catch (error) {
      console.error("Error fetching RM data:", error);
    } finally {
      setLoadingRecords(false);
    }
  };

  useEffect(() => {
    fetchExcelRecords(); // Load data when component mounts
  }, []);

  // ** Handle File Selection **
  const handleFileChange = (e) => {
    setSelectedFile(e.target.files[0] || null);
  };

  // ** Upload Excel File **
  const handleUpload = async () => {
    if (!selectedFile) {
      showAlert("Please select a file before uploading.", "error");
      return;
    }

    setUploading(true);
    const formData = new FormData();
    formData.append("file", selectedFile);
    formData.append("Uploaded_By", loggedInUser);

    try {
      const response = await axiosInstance.post("/api/RM-Upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      if (response.status === 200) {
        const rowCount = response.data.count || 0;
        showAlert(`${rowCount} record(s) inserted successfully!`, "success");

        fileInputRef.current.value = "";
        setSelectedFile(null);
      }

      fetchExcelRecords(); // Refresh DataTable after upload
    } catch (error) {
      console.error("Error uploading file:", error);
      showAlert("Failed to upload file.", "error");
    } finally {
      setUploading(false);
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

  // ** Define DataTable Columns with Conditional Styling **
  const columns = [
    { name: "Item Name", selector: (row) => row.Iteam, sortable: true },
    { name: "Unit", selector: (row) => row.Unit, sortable: true },
    { 
        name: "Plan Qty", 
        selector: (row) => row.Plan_Qty, 
        sortable: true,
        cell: (row) => (
          <span style={{ 
            color: row.Is_Highlighted === 1 ? "red" : "black",
            fontWeight: row.Is_Highlighted === 1 ? "bold" : "normal" 
          }}>
            {row.Plan_Qty || "N/A"}
          </span>
        )
      },
    { name: "Uploaded By", selector: (row) => row.Uploaded_By, sortable: true },
    { name: "Uploaded Date", selector: (row) => row.Uploaded_Date, sortable: true },
  ];

  return (
    <div className="d-flex dashboard">
      {/* Internal CSS for Loader & Overlay */}
      <style>
        {`
          .overlay {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.5);
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 9999;
          }
          .loader {
            width: 100px;
            height: 100px;
          }
          .highlighted {
            background-color: #ffcccc !important; /* Light red background */
          }
        `}
      </style>

      {uploading && selectedFile && (
        <div className="overlay">
          <img src={loaderGif} alt="Uploading..." className="loader" />
        </div>
      )}

      <div className={isSidebarVisible ? "sidebar-container" : "sidebar-hidden"}>
        <Sidebar />
      </div>

      <div className="flex-grow-1">
        <Header toggleSidebar={toggleSidebar} isSidebarVisible={isSidebarVisible} />
        <main className="main-container p-4">
          <h3 className="mb-4">RM Upload</h3>

          <div className="container d-flex">
            {/* Upload Section */}
            <div className="mt-2" style={{ marginRight: "70px" }}>
              <label className="form-label">Upload Excel File:</label>
              <input
                type="file"
                accept=".xlsx,.xls"
                onChange={handleFileChange}
                className="form-control"
                style={{ width: "auto" }}
                ref={fileInputRef}
              />
              <button
                className="btn btn-primary mt-2"
                onClick={handleUpload}
                disabled={uploading || !selectedFile}
              >
                {uploading ? "Uploading..." : "Upload Excel"}
              </button>
            </div>
          </div>

          {/* Show loader while fetching records */}
          {loadingRecords ? (
            <div className="text-center my-3">
              <span className="spinner-border text-primary"></span> Loading data...
            </div>
          ) : (
            <DataTable
              columns={columns}
              data={excelRecords}
              pagination
              highlightOnHover
            //   customStyles={{
            //     rows: {
            //       style: (row) => ({
            //         backgroundColor: row.Is_Highlighted === 1 ? "#ffcccc" : "#ffcccc", // 🔥 Highlight rows dynamically
            //       }),
            //     },
            //   }}
            />
          )}
        </main>
      </div>
    </div>
  );
}

export default RM_View;
