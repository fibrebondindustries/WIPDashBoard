import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import Header from "../components/Header";
import Sidebar from "../components/Sidebar";
import axiosInstance from "../axiosConfig";
import loaderGif from "../assets/Img/loading1.gif"; // Ensure correct path
import DataTable from "react-data-table-component"; // Import DataTable

function RMUpload() {
  const [isSidebarVisible, setIsSidebarVisible] = useState(true);
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [loadingRecords, setLoadingRecords] = useState(false); // Loader for table
  const [excelRecords, setExcelRecords] = useState([]); // State for DataTable records
  const [fileNames, setFileNames] = useState([]); // 🔥 State for unique file names
  const [selectedFileName, setSelectedFileName] = useState(""); // 🔥 Selected file to delete
  const [deleting, setDeleting] = useState(false); //  Deleting loader

  const fileInputRef = useRef(null); // Reference to file input
  const user = JSON.parse(localStorage.getItem("user")) || {}; // Get user info
  const loggedInUser = user.Name || "N/A"; // Default if user.Name is not found

  const toggleSidebar = () => setIsSidebarVisible(!isSidebarVisible);

  const navigate = useNavigate();

  // ** Fetch RM Upload Data **
  const fetchExcelRecords = async () => {
    setLoadingRecords(true);
    try {
      const response = await axiosInstance.get("/api/get-RM-data");
  
      // 🔥 Extract unique File_Name values
      const uniqueRecords = Array.from(
        new Map(response.data.map(item => [item.File_Name, item])).values()
      );
  
      setExcelRecords(uniqueRecords); // ✅ Store only unique records
    } catch (error) {
      console.error("Error fetching RM data:", error);
    } finally {
      setLoadingRecords(false);
    }
  };
  

 
  // ** Fetch Unique File Names (Without Duplicates) **
  const fetchFileNames = async () => {
    setLoadingRecords(true);
    try {
      const response = await axiosInstance.get("/api/get-RM-file");
  
      // ✅ Store full object instead of only File_Name
      setFileNames(response.data);
    } catch (error) {
      console.error("Error fetching file names:", error);
    } finally {
      setLoadingRecords(false);
    }
  };
  

  useEffect(() => {
    fetchExcelRecords(); // Load data when component mounts
    fetchFileNames(); // Fetch file names when component mounts
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
      fetchFileNames(); // Refresh File Name List
    } catch (error) {
      console.error("Error uploading file:", error);
      showAlert("Failed to upload file.", "error");
    } finally {
      setUploading(false);
    }
  };

   // ** Delete File Name Data **
   const handleDeleteFile = async () => {
    if (!selectedFileName) {
      showAlert("Please select a file name to delete.", "error");
      return;
    }

    if (!window.confirm(`Are you sure you want to delete records for "${selectedFileName}"?`)) return;

    setDeleting(true);
    try {
      await axiosInstance.delete("/api/delete-RM-file", {
        data: { File_Name: selectedFileName },
      });

      showAlert("File records deleted successfully!", "success");
      fetchExcelRecords();
      fetchFileNames();
      setSelectedFileName(""); // Reset selection
    } catch (error) {
      console.error("Error deleting file records:", error);
      showAlert("Failed to delete file records.", "error");
    } finally {
      setDeleting(false);
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
  // const columns = [
  //   // { name: "Item Name", selector: (row) => (
  //   //   <span
  //   //   data-bs-toggle="tooltip"
  //   //   data-bs-placement="top"
  //   //   title={row.Iteam}>
  //   //     {row.Iteam}
  //   //   </span>
  //   // ), sortable: true },
  //   // { name: "Unit", selector: (row) => (
  //   //   <span
  //   //   data-bs-toggle="tooltip"
  //   //   data-bs-placement="top"
  //   //   title={row.Unit}>
  //   //     {row.Unit}
  //   //   </span>
  //   // ), sortable: true },
  //   // { 
  //   //     name: "Plan Qty", 
  //   //     selector: (row) => row.Plan_Qty, 
  //   //     sortable: true,
  //   //     cell: (row) => (
  //   //       <span style={{ 
  //   //         color: row.Is_Highlighted === 1 ? "red" : "black",
  //   //         fontWeight: row.Is_Highlighted === 1 ? "bold" : "normal" 
  //   //       }}>
  //   //         {row.Plan_Qty || "N/A"}
  //   //       </span>
  //   //     )
  //   //   },
  //   // { name: "KD CODE", selector: (row) => row.KD_CODE || "N/A", sortable: true },
  //   // { name: "RM Item Code", selector: (row) => row.Rm_Item_Code || "N/A", sortable: true },
  //   // { name: "Uploaded Date", selector: (row) => (
  //   //   <span data-bs-toggle="tooltip" data-bs-placement="top" title={row.Uploaded_Date}>
  //   //       {row.Uploaded_Date}
  //   //   </span>
  //   // ), sortable: true },
  //   // { name: "File Name", selector: (row) => row.File_Name, sortable: true },
 
  // ];
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
      name: "Uploaded Date",
      selector: (row) => row.Uploaded_Date, 
      sortable: true,
    },
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
        <main className="main-container p-4" style={{ height: "-webkit-fill-available" }}>
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
            {/* Delete by file name */}
            <div className="mt-2">
            <label className="form-label">Select File to Delete:</label>
            <select 
              className="form-select ml-5" 
              value={selectedFileName} 
              onChange={(e) => setSelectedFileName(e.target.value)}
            >
              <option value="">Select a File Name</option>
              {fileNames.length > 0 ? (
                fileNames.map((file, index) => (
                  <option key={index} value={file}>{file}</option>
                ))
              ) : (
                <option value="" disabled>No files found</option>
              )}
            </select>

              <button className="btn btn-danger mt-2" onClick={handleDeleteFile} disabled={deleting || !selectedFileName}>
                {deleting ? "Deleting..." : "Delete File"}
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
            />
          )}
        </main>
      </div>
    </div>
  );
}

export default RMUpload;
