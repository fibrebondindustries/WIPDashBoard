import React, { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axiosInstance from "../axiosConfig";
import DataTable from "react-data-table-component";
import Header from "../components/Header";
// import Sidebar from "../components/Sidebar";

function RMDetailedView() {
  const { fileName } = useParams(); // Get file name from URL
  const [fileData, setFileData] = useState([]);
  const [loading, setLoading] = useState(true);
//   const [isSidebarVisible, setIsSidebarVisible] = useState(true);
  
  const navigate = useNavigate(); // For back button
//   const toggleSidebar = () => setIsSidebarVisible(!isSidebarVisible);

  const fetchFileData = useCallback(async () => {
    setLoading(true);
    try {
      const response = await axiosInstance.get(`/api/get-RM-data/${encodeURIComponent(fileName)}`);
      setFileData(response.data);
    } catch (error) {
      console.error("Error fetching file data:", error);
    } finally {
      setLoading(false);
    }
  }, [fileName]); // ✅ Ensures function is recreated only if `fileName` changes
  
  useEffect(() => {
    fetchFileData();
  }, [fetchFileData]); // ✅ Now it's safe to include in dependencies

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
    { name: "KD CODE", selector: (row) => row.KD_CODE || "N/A", sortable: true },
    { name: "RM Item Code", selector: (row) => row.Rm_Item_Code || "N/A", sortable: true },
    { name: "Uploaded By", selector: (row) => row.Uploaded_By, sortable: true },
    { name: "Uploaded Date", selector: (row) => row.Uploaded_Date, sortable: true },
  ];

  return (
    <div className="d-flex dashboard">
      {/* <div className={isSidebarVisible ? "sidebar-container" : "sidebar-hidden"}>
        <Sidebar />
      </div> */}

      <div className="flex-grow-1">
        <Header/>
        <main className="main-container p-4"  style={{ height: "-webkit-fill-available" }}>
          <h3 className="mb-4">Details for File: {decodeURIComponent(fileName)}</h3>

          <button 
            onClick={() => navigate(-1)}
            className="btn btn-secondary mb-3"
          >
            ← Back to RM View
          </button>

          {loading ? (
            <div className="text-center">
              <span className="spinner-border text-primary"></span> Loading data...
            </div>
          ) : (
            <DataTable columns={columns} data={fileData} pagination highlightOnHover />
          )}
        </main>
      </div>
    </div>
  );
}

export default RMDetailedView;
