import React, { useState, useEffect, useRef } from "react";
import Header from "../components/Header";
import Sidebar from "../components/Sidebar";
import axiosInstance from "../axiosConfig";
import loaderGif from "../assets/Img/loading1.gif"; // Ensure correct path
import DataTable from "react-data-table-component"; // Import DataTable

function ExcelImport() {
  const [isSidebarVisible, setIsSidebarVisible] = useState(true);
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [selectedItem, setSelectedItem] = useState("");
  const [uniqueItemNames, setUniqueItemNames] = useState([]);
  const [deleting, setDeleting] = useState(false);
  const [loadingItems, setLoadingItems] = useState(false);
  const [excelRecords, setExcelRecords] = useState([]); // State for DataTable records
  const [loadingRecords, setLoadingRecords] = useState(false); // Loader for table

  const fileInputRef = useRef(null); // Reference to file input

  const user = JSON.parse(localStorage.getItem("user")) || {}; // Ensure we always get an object
  const loggedInUser = user.Name || "N/A"; // Extract Name, default to "N/A" if not found

  const toggleSidebar = () => setIsSidebarVisible(!isSidebarVisible);

  // ** Fetch Unique Item Names **
  const fetchUniqueItemNames = async () => {
    setLoadingItems(true);
    try {
      const response = await axiosInstance.get("/api/get-unique-item-names");
      setUniqueItemNames(response.data.itemNames);
    } catch (error) {
      console.error("Error fetching item names:", error);
    //   alert("Failed to load item names.");
    } finally {
      setLoadingItems(false);
    }
  };

  useEffect(() => {
    fetchUniqueItemNames();
    fetchExcelRecords();
  }, []);

 // ** Fetch Excel Records for DataTable **
 const fetchExcelRecords = async () => {
  setLoadingRecords(true); // Show loader while fetching
  try {
    const response = await axiosInstance.get("/api/get-excel-records");
    setExcelRecords(response.data.records);
  } catch (error) {
    console.error("Error fetching Excel records:", error);
  } finally {
    setLoadingRecords(false); // Hide loader after fetching
  }
};


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
    const response  =  await axiosInstance.post("/api/import-excel", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
    //   showAlert("File uploaded successfully!", "success");
    if (response.status === 200) {
        const rowCount = response.data.count || 0; // Get count from API response
        showAlert(`${rowCount} record(s) inserted successfully!`, "success");
  
        // Reset File Input
        fileInputRef.current.value = "";
        setSelectedFile(null);
      }
      fetchUniqueItemNames(); // Refresh item names after upload

      // ** Clear the file input **
      setSelectedFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    } catch (error) {
      console.error("Error uploading file:", error);
      showAlert("Failed to upload file.", "error");
    } finally {
      setUploading(false);
    }
  };

  // ** Handle Item Selection for Deletion **
  const handleItemSelect = (e) => {
    setSelectedItem(e.target.value);
  };

  // ** Delete Selected Records **
  const handleDelete = async () => {
    if (!selectedItem) {
      showAlert("Please select an item to delete.", "error");
      return;
    }

    if (!window.confirm(`Are you sure you want to delete all records for "${selectedItem}"?`)) return;

    setDeleting(true);
    try {
      const response = await axiosInstance.delete("/api/delete-stock", {
        data: { ITEM_NAME: selectedItem },
      });

      alert(response.data.message);
      fetchUniqueItemNames(); // Refresh list after deletion
      fetchExcelRecords(); // Refresh DataTable
      setSelectedItem(""); // Reset selection
    } catch (error) {
      console.error("Error deleting records:", error);
    //   alert("Failed to delete records.");
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
  // ** Define DataTable Columns **
  const columns = [
    { name: "Item Name", selector: (row) => row["ITEM NAME"], sortable: true },
    { name: "GRN No", selector: (row) => row["GRN NO"], sortable: true },
    { name: "GRN Date", selector: (row) => row["GRN DATE"], sortable: true },
    { name: "Uploaded By", selector: (row) => row["Uploaded_By"], sortable: true },
  ];
  return (
    <div className="d-flex dashboard">
      {/* Internal CSS for Loader & Overlay */}
      <style>
        {`
          /* Overlay Effect */
          .overlay {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.5); /* Black transparent background */
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 9999;
          }

          /* Loader Image */
          .loader {
            width: 100px; /* Adjust size as needed */
            height: 100px;
          }
        `}
      </style>

      {/* Loader Overlay (Only show if uploading & file is selected) */}
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
          <h3 className="mb-4">Excel Import</h3>

      <div className="container d-flex" >
          {/* Upload Section */}
          <div className="mt-2" style={{marginRight:"70px"}}>
            <label className="form-label">Upload Excel File:</label>
            <input
              type="file"
              accept=".xlsx,.xls"
              onChange={handleFileChange}
              className="form-control "
              style={{ width: "auto" }}
              ref={fileInputRef} // Reference to clear input after upload
            />
            <button className="btn btn-primary mt-2" onClick={handleUpload} disabled={uploading || !selectedFile}>
              {uploading ? "Uploading..." : "Upload Excel"}
            </button>
          </div>

          {/* Select & Delete Section */}
          <div className="mt-2">
            <label className="form-label">Select Item to Delete:</label>
            <select className="form-select ml-5" value={selectedItem} onChange={handleItemSelect} disabled={loadingItems} style={{ width: "auto" }}>
              <option value="">Select an Item Name</option>
              {uniqueItemNames.length > 0 ? (
                uniqueItemNames.map((name, index) => (
                  <option key={index} value={name}>
                    {name}
                  </option>
                ))
              ) : (
                <option value="" disabled>
                  {loadingItems ? "Loading items..." : "No items found"}
                </option>
              )}
            </select>
            <button className="btn btn-danger mt-2" onClick={handleDelete} disabled={deleting || !selectedItem}>
              {deleting ? "Deleting..." : "Delete Records"}
            </button>
          </div>
          </div>
         {/* Show loader while fetching records */}
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

export default ExcelImport;
