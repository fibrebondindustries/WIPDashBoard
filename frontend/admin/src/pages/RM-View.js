import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom"; // Import useNavigate for navigation
import Header from "../components/Header";
import Sidebar from "../components/Sidebar";
import axiosInstance from "../axiosConfig";
import DataTable from "react-data-table-component";

function RMView() {
  const [isSidebarVisible, setIsSidebarVisible] = useState(true);
  const [loadingRecords, setLoadingRecords] = useState(false);
  const [excelRecords, setExcelRecords] = useState([]);
  
  const navigate = useNavigate(); // Initialize useNavigate

  const toggleSidebar = () => setIsSidebarVisible(!isSidebarVisible);

  // ** Fetch RM Upload Data **
  const fetchExcelRecords = async () => {
    setLoadingRecords(true);
    try {
      const response = await axiosInstance.get("/api/get-RM-file"); // Fetch only unique file names
      setExcelRecords(response.data.map(fileName => ({ File_Name: fileName }))); // Convert response to expected format
    } catch (error) {
      console.error("Error fetching RM file names:", error);
    } finally {
      setLoadingRecords(false);
    }
  };

  useEffect(() => {
    fetchExcelRecords(); // Load data when component mounts
  }, []);

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
            textDecoration: "NONE", 
            cursor: "pointer" 
          }}
        >
          {row.File_Name}
        </button>
      ),
    },
  ];

  return (
    <div className="d-flex dashboard">
      <div className={isSidebarVisible ? "sidebar-container" : "sidebar-hidden"}>
        <Sidebar />
      </div>

      <div className="flex-grow-1">
        <Header toggleSidebar={toggleSidebar} isSidebarVisible={isSidebarVisible} />
        <main className="main-container p-4">
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
