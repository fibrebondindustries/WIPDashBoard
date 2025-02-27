// // // import React, { useState, useEffect, useCallback } from "react";
// // // import { useNavigate } from "react-router-dom";
// // // import axiosInstance from "../axiosConfig";
// // // import WIPHeader from "../components/WIP-Herder";



// // // const Stock = () => {
// // //   const [stockData, setStockData] = useState([]);
// // //   const navigate = useNavigate();
// // //   const [updatingStatus, setUpdatingStatus] = useState(false);
// // //   const [statusData, setStatusData] = useState({}); // Store Status by JO NO
// // //   const [poData, setPoData] = useState({}); // Store PO by JO NO

// // //   const fetchStockData = useCallback(async () => {
// // //     try {
// // //       const response = await axiosInstance.get("/api/stockData");
// // //       processStockData(response.data);
// // //     } catch (error) {
// // //       console.error("Error fetching stock data:", error);
// // //     }
// // //   }, []);

// // //   // ** Fetch Status Data by JO NO **
// // //   const fetchStatusData = useCallback(async () => {
// // //     try {
// // //       const response = await axiosInstance.get("/api/get-status-by-jo");
// // //       setStatusData(response.data);
// // //     } catch (error) {
// // //       console.error("Error fetching status data:", error);
// // //     }
// // //   }, []);

// // //    // ** Fetch Status Data by JO NO **
// // //    const fetchPOData = useCallback(async () => {
// // //     try {
// // //       const response = await axiosInstance.get("/api/get-PONumber");
// // //       setPoData(response.data);
// // //     } catch (error) {
// // //       console.error("Error fetching status data:", error);
// // //     }
// // //   }, []);
// // // // Function to check session on page load
// // // const checkAuth = useCallback(() => {
// // //     const authData = sessionStorage.getItem("auth");
// // //     if (!authData) {
// // //       // Redirect to login if no session data found
// // //       window.location.href = "/wip-login";
// // //       return;
// // //     }

// // //     const { loggedIn, expiryTime } = JSON.parse(authData);
// // //     if (!loggedIn || Date.now() > expiryTime) {
// // //       // If not logged in or session expired, redirect to login
// // //       sessionStorage.removeItem("auth");
// // //       window.location.href = "/wip-login";
// // //     }
// // //   }, []);

// // //   // Use Effect to start session check on load
// // //   useEffect(() => {
// // //     checkAuth(); // Initial session check on load
// // //     const interval = setInterval(checkAuth, 1000); // Check session every second
// // //     return () => clearInterval(interval); // Cleanup interval on component unmount
// // //   }, [checkAuth]);


// // //   useEffect(() => {
// // //     fetchStockData();
// // //     fetchStatusData();
// // //     fetchPOData();
// // //   }, [fetchStockData, fetchStatusData, fetchPOData]);

// // //   const processStockData = (data) => {
// // //     const aggregatedData = {};

// // //     data.forEach((row) => {
// // //       if (row["PROCESS NAME"] && row["PROCESS NAME"].toUpperCase().includes("BOX")) {
// // //         return;
// // //       }

// // //       const joNo = row["JO NO"];
// // //       const totalQuantityShortage = parseFloat(row["Quantity_Shortage"]) || 0;
// // //       const totalShortage = parseFloat(row["shortage"]) || 0;

// // //       if (!aggregatedData[joNo]) {
// // //         aggregatedData[joNo] = {
// // //           joNo,
// // //           joDate: row["JO DATE"] || "",
// // //           quantityShortage: 0,
// // //           shortage: 0,
// // //         };
// // //       }
// // //       aggregatedData[joNo].quantityShortage += totalQuantityShortage;
// // //       aggregatedData[joNo].shortage += totalShortage;
// // //     });

// // //     setStockData(Object.values(aggregatedData));
// // //   };

// // //   // const handleRowClick = (joNo) => {
// // //   //   navigate(`/stock-details?joNo=${encodeURIComponent(joNo)}`);
// // //   // };

// // //   const handleRedirect = (path) => {
// // //     navigate(path);
// // //   };


// // //  // ** Handle Status Change 18 fab 25 **
// // //  // Handle Status Update
// // //  const updateStockStatus = async (joNo, newStatus) => {
// // //   if (!joNo) return;

// // //   setUpdatingStatus(true);
// // //   try {
// // //     await axiosInstance.patch("/api/update-stock-status", {
// // //       joNo,
// // //       status: newStatus,
// // //     });

// // //     alert(`Status updated to '${newStatus}' for JO NO: ${joNo}`);
// // //    window.location.reload();
// // //   } catch (error) {
// // //     console.error("Error updating status:", error);
// // //     // alert("Failed to update stock status.");
// // //   } finally {
// // //     setUpdatingStatus(false);
// // //   }
// // // };

// // //   // Handle PO Number Update (Triggers on Blur)
// // //   const updatePoNumber = async (joNo, newPoNumber) => {
// // //     try {
// // //       await axiosInstance.patch("/api/update-stock-PO_Number", {
// // //         joNo,
// // //         PO_Number: newPoNumber || null, // Allow sending NULL
// // //       });

// // //       // Update UI Immediately
// // //       setPoData((prev) => ({ ...prev, [joNo]: newPoNumber || "" }));
// // //      alert(`PO Number updated for JO NO: ${joNo} -> ${newPoNumber || "NULL"}`);
// // //     //  window.location.reload();
// // //       console.log(`PO Number updated for JO NO: ${joNo} -> ${newPoNumber || "NULL"}`);
// // //     } catch (error) {
// // //       console.error("Error updating PO Number:", error);
// // //     }
// // //   };


// // //   return (
// // //     <div className="">
// // //         <WIPHeader/>
// // //     <div className="container mt-4">
// // //       <style>{`
// // //         .table td {
// // //           font-size: 14px;
// // //           padding: 6px 10px;
// // //           vertical-align: middle;
// // //           white-space: normal;
// // //           text-align: left;
// // //         }
// // //         .table th {
// // //           font-size: 15px;
// // //           padding: 13px 10px;
// // //           text-align: start;
// // //           white-space: nowrap;
// // //           font-family: fangsong;
// // //           background-color: darkgray !important;
// // //         }
// // //         h1 {
// // //           font-family: fangsong;
// // //           font-weight: bold;
// // //         }
// // //         #backToTopBtn {
// // //           display: none;
// // //           position: fixed;
// // //           bottom: 20px;
// // //           right: 20px;
// // //           z-index: 99;
// // //           font-size: 13px;
// // //           background-color: #333;
// // //           color: white;
// // //           border: none;
// // //           border-radius: 20px;
// // //           padding: 10px 15px;
// // //           cursor: pointer;
// // //           box-shadow: 0 2px 5px rgba(0, 0, 0, 0.2);
// // //           transition: background-color 0.3s;
// // //         }
// // //         #backToTopBtn:hover {
// // //           background-color: #555;
// // //         }
// // //         @media (max-width: 768px) {
// // //           #backToTopBtn {
// // //             display: none !important;
// // //           }
// // //         }
// // //         .btn-secondary {
// // //           margin-top: -35px;
// // //           margin-right: 5px;
// // //           text-decoration: none;
// // //         }
// // //       `}</style>

// // //       <h1>Stock Management</h1>
// // //       <div className="d-flex justify-content-end mb-3">
// // //         <button
// // //           className="btn btn-secondary"
// // //           onClick={() => handleRedirect("/rm-shortage")}
// // //         >
// // //           RM Shortage →
// // //         </button>
// // //         <button
// // //           className="btn btn-secondary"
// // //           onClick={() => handleRedirect("/box-rm-shortage")}
// // //         >
// // //           BOX RM Shortage →
// // //         </button>
// // //       </div>
// // //       <div className="table-responsive">
// // //         <table className="table table-bordered table-striped">
// // //           <thead>
// // //             <tr>
// // //               <th>Sr No</th>
// // //               <th>Job Order No</th>
// // //               <th>Job Order Date</th>
// // //               <th>Quantity Shortage</th>
// // //               <th>Quantity Status</th>
// // //               <th>Status</th>
// // //               <th>Po Number</th>
// // //             </tr>
// // //           </thead>
// // //           <tbody>
// // //             {stockData.map((row, index) => {
// // //               const quantityShortage = row.quantityShortage ?? 0;
// // //               const shortage = row.shortage ?? 0;

// // //               let statusText, statusClass;
// // //               if (quantityShortage !== 0) {
// // //                 statusText = "Shortage";
// // //                 statusClass = "text-danger";
// // //               } else if (quantityShortage === 0 && shortage !== 0) {
// // //                 statusText = "Potential Shortage";
// // //                 statusClass = "text-warning";
// // //               } else {
// // //                 statusText = "Satisfied";
// // //                 statusClass = "text-success";
// // //               }

// // //               return (
// // //                 <tr key={index} >
// // //                   <td>{index + 1}</td>
// // //                   {/* <td>
// // //                     <a href={`/stock-details?joNo=${encodeURIComponent(row.joNo)}`}>
// // //                       {row.joNo}
// // //                     </a>
// // //                   </td> */}
// // //                    {/* 🔹 Job Order No Clickable Only */}
// // //                   <td>
// // //                     <a
// // //                       href={`/stock-details?joNo=${encodeURIComponent(row.joNo)}`}
// // //                       onClick={(e) => e.stopPropagation()} // Prevents row click when clicking the link
// // //                     >
// // //                       {row.joNo}
// // //                     </a>
// // //                   </td>
// // //                   <td>
// // //                     {row.joDate}
// // //                   </td>
// // //                   <td>{quantityShortage.toFixed(2)}</td>
// // //                   <td className={statusClass}>{statusText}</td>
// // //                   <td>
// // //                     {/* Dropdown to Change Status */}
// // //                     <select
// // //                         className="form-select form-select-sm "
// // //                         value={statusData[row.joNo] || "Pending"}
// // //                         onChange={(e) => updateStockStatus(row.joNo, e.target.value)}
// // //                         disabled={statusData[row.joNo] === "Purchase Made" || updatingStatus}
// // //                         style={{
// // //                           backgroundColor:
// // //                             statusData[row.joNo] === "Purchase Made"
// // //                               ? "#28a745" // ✅ Green
// // //                               : statusData[row.joNo] === "Purchase Not Made"
// // //                               ? "#dc3545" // ✅ Red
// // //                               : "white", // 
// // //                           // color: statusData[row.joNo] === "Pending" ? "black" : "white",
// // //                           // fontWeight: "bold",
// // //                           // border: "1px solid #ccc",
// // //                         }}
// // //                       >
// // //                       <option value="Pending">Pending</option>                      
// // //                      <option value="Purchase Not Made">Purchase Not Made</option>  
// // //                      <option value="Purchase Made">Purchase Made</option>
                     
// // //                     </select>
// // //                   </td>
// // //                   <td>              
// // //                   <input
// // //                       type="text"
// // //                       className="form-control"
// // //                       value={poData[row.joNo]}
// // //                       placeholder="Enter PO Number"
// // //                       onBlur={(e) => updatePoNumber(row.joNo, e.target.value)}
// // //                       onChange={(e) => setPoData({ ...poData, [row.joNo]: e.target.value })}
// // //                       />           
// // //                   </td>
// // //                 </tr>
// // //               );
// // //             })}
// // //           </tbody>
// // //         </table>
// // //       </div>
// // //     </div>
// // //     </div>
// // //   );
// // // };


// import React, { useState, useEffect, useCallback } from "react";
// import { useNavigate } from "react-router-dom";
// import axiosInstance from "../axiosConfig";
// import WIPHeader from "../components/WIP-Herder";

// const Stock = () => {
//   const [stockData, setStockData] = useState([]);
//   const navigate = useNavigate();
//   const [updatingStatus, setUpdatingStatus] = useState(false);

//   // ** Fetch Stock Data **
//   const fetchStockData = useCallback(async () => {
//     try {
//       const response = await axiosInstance.get("/api/get-RM-file-Status");
//       setStockData(response.data);
//     } catch (error) {
//       console.error("Error fetching stock data:", error);
//     }
//   }, []);

//   useEffect(() => {
//     fetchStockData();
//   }, [fetchStockData]);

//   // ** Handle PO Status Update **
//   const updateStockStatus = async (fileName, newStatus) => {
//     if (!fileName) return;
//     setUpdatingStatus(true);
//     try {
//       await axiosInstance.patch("/api/update-PO-status", {
//         fileName,
//         poStatus: newStatus,
//       });
//       alert(`PO Status updated to '${newStatus}' for File: ${fileName}`);
//       fetchStockData();
//     } catch (error) {
//       console.error("Error updating PO status:", error);
//     } finally {
//       setUpdatingStatus(false);
//     }
//   };

//     const handleRedirect = (path) => {
//     navigate(path);
//   };
//   return (
//     <div>
//       <WIPHeader />
//       <div className="d-flex justify-content-end mb-3 mt-4" style={{marginRight: "40px"}}>
//         <button
//           className="btn btn-secondary "
//           onClick={() => handleRedirect("/rm-shortage")}
//           style={{marginRight: "10px"}}
//         >
//           RM Shortage →
//         </button>
//         <button
//           className="btn btn-secondary"
//           onClick={() => handleRedirect("/box-rm-shortage")}
//         >
//           BOX RM Shortage →
//         </button>
//       </div>
//       <div className="container mt-4">
//         <h1 className="mb-4">Stock Management</h1>
     
//         <div className="table-responsive">
//           <table className="table table-bordered table-striped">
//             <thead className="table-dark">
//               <tr>
//                 <th>Sr No</th>
//                 <th>File Name</th>
//                 <th>Stock In Hand</th>
//                 <td>Plan Qty</td>
//                 <th>Uploaded Date</th>
//                 <th>PO Status</th>
//               </tr>
//             </thead>
//             <tbody>
//               {stockData.map((row, index) => (
//                 <tr key={index}>
//                   <td>{index + 1}</td>
//                   <td>
//                     <button
//                       onClick={() => navigate(`/stock-details/${encodeURIComponent(row.File_Name)}`)}
//                       style={{
//                         background: "none",
//                         border: "none",
//                         color: "blue",
//                         textDecoration: "None",
//                         cursor: "pointer",
//                       }}
//                     >
//                       {row.File_Name}
//                     </button>
//                   </td>
//                   <td>
//                     {row["STOCK IN HAND"] || "N/A"}
//                   </td>
//                   <td>{row.Plan_Qty || "N/A"}</td>
//                   <td>{row.Uploaded_Date}</td>
//                   <td>
//                     <select
//                       className="form-select form-select-sm"
//                       value={row.PO_STATUS || "PO Not Raised"}
//                       onChange={(e) => updateStockStatus(row.File_Name, e.target.value)}
//                       disabled={row.PO_STATUS === "PO Raised" || updatingStatus}
//                       style={{
//                         backgroundColor: row.PO_STATUS === "PO Raised" ? "green" : "red",
//                         color: "white",
//                         fontWeight: "bold",
//                         cursor: row.PO_STATUS === "PO Raised" ? "not-allowed" : "pointer",
//                       }}
//                     >
//                       <option value="PO Not Raised">PO Not Raised</option>
//                       <option value="PO Raised">PO Raised</option>
//                     </select>
//                   </td>
//                 </tr>
//               ))}
//             </tbody>
//           </table>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default Stock;


import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import axiosInstance from "../axiosConfig";
import WIPHeader from "../components/WIP-Herder";
import DataTable from "react-data-table-component";

const Stock = () => {
  const [stockData, setStockData] = useState([]);
  const [aggregatedStock, setAggregatedStock] = useState([]);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [poNumbers, setPoNumbers] = useState({});
  const navigate = useNavigate();


    // ** Check Session & Redirect if Not Authenticated **
    const checkAuth = useCallback(() => {
      const authData = sessionStorage.getItem("auth");
      if (!authData) {
        window.location.href = "/wip-login"; // Redirect to login
        return;
      }
  
      const { loggedIn, expiryTime } = JSON.parse(authData);
      if (!loggedIn || Date.now() > expiryTime) {
        sessionStorage.removeItem("auth"); // Clear session
        window.location.href = "/wip-login"; // Redirect to login
      }
    }, []);
  

  // ** Fetch Stock File Data **
  const fetchStockData = useCallback(async () => {
    try {
      const response = await axiosInstance.get("/api/get-RM-file-Status");
      setStockData(response.data);
    } catch (error) {
      console.error("Error fetching stock data:", error);
    }
  }, []);

  // ** Fetch Aggregated Stock Data **
  const fetchAggregatedStock = useCallback(async () => {
    try {
      const response = await axiosInstance.get("/api/get-aggregated-stock");
      setAggregatedStock(response.data);
    } catch (error) {
      console.error("Error fetching aggregated stock data:", error);
    }
  }, []);

  useEffect(() => {
    fetchStockData();
    fetchAggregatedStock();
  }, [fetchStockData, fetchAggregatedStock]);

  // ** Map Aggregated Data **
  const getAggregatedData = (fileName, key) => {
    const found = aggregatedStock.find((item) => item.File_Name === fileName);
    return found ? found[key] : "N/A";
  };

  // ** Handle PO Status Update **
  const updateStockStatus = async (fileName, newStatus) => {
    if (!fileName) return;
    setUpdatingStatus(true);
    try {
      await axiosInstance.patch("/api/update-PO-status", {
        fileName,
        poStatus: newStatus,
      });
      alert(`PO Status updated to '${newStatus}' for File: ${fileName}`);
      fetchStockData();
    } catch (error) {
      console.error("Error updating PO status:", error);
    } finally {
      setUpdatingStatus(false);
    }
  };

   // ** Handle PO Number Update (onBlur) **
   const updatePoNumber = async (fileName, newPoNumber) => {
    try {
      await axiosInstance.patch("/api/update-po-number", {
        fileName,
        PO_Number: newPoNumber || null, // Allow NULL values
      });

      // Update UI Immediately
      setPoNumbers((prev) => ({ ...prev, [fileName]: newPoNumber || "" }));
      alert(`PO Number updated for File: ${fileName} -> ${newPoNumber || "NULL"}`);
    } catch (error) {
      console.error("Error updating PO Number:", error);
    }
  };

      // ** Run Session Check & Fetch Data **
      useEffect(() => {
        checkAuth(); // Initial session check
        fetchStockData(); // Fetch data
    
        const interval = setInterval(checkAuth, 1000); // Check session every second
        return () => clearInterval(interval); // Cleanup on component unmount
      }, [checkAuth, fetchStockData]);

  // ** Table Columns **
  const columns = [
    { name: "Sr", selector: (_, index) => index + 1, sortable: true, width: "70px" },
    {
      name: "File Name",
      cell: (row) => (
        <button
          onClick={() => navigate(`/stock-details/${encodeURIComponent(row.File_Name)}`)}
          style={{
            background: "none",
            border: "none",
            color: "blue",
            textDecoration: "None",
            textTransform: "uppercase",
            cursor: "pointer",
          }}
        >
          {row.File_Name}
        </button>
      ),
      sortable: true,
    },
    // { name: "Stock In Hand", selector: (row) => getAggregatedData(row.File_Name, "Total_Stock_In_Hand"), sortable: true },
    { name: "Plan Qty", selector: (row) => getAggregatedData(row.File_Name, "Total_Plan_Qty"), sortable: true },
    {
      name: "Shortage",
      selector: (row) => getAggregatedData(row.File_Name, "Total_Shortage"),
      sortable: true,
      cell: (row) => (
        <span style={{ color: "red", fontWeight: "bold" }}>
          {getAggregatedData(row.File_Name, "Total_Shortage")}
        </span>
      ),
    },
    { name: "Uploaded Date", selector: (row) => row.Uploaded_Date, sortable: true },
    {
      name: "PO Number",
      cell: (row) => (
        <input
          type="text"
          className="form-control"
          placeholder="Enter PO Number"
          value={poNumbers[row.File_Name] ?? row.PO_Number ?? ""}
          onBlur={(e) => updatePoNumber(row.File_Name, e.target.value)}
          onChange={(e) => setPoNumbers({ ...poNumbers, [row.File_Name]: e.target.value })}
          style={{ width: "140px", fontSize: "14px" }}
        />
      ),
      sortable: true,
    },
    {
      name: "PO Status",
      cell: (row) => (
        <select
          className="form-select form-select-sm"
          value={row.PO_STATUS || "PO Not Raised"}
          onChange={(e) => updateStockStatus(row.File_Name, e.target.value)}
          disabled={row.PO_STATUS === "PO Raised" || updatingStatus}
          style={{
            backgroundColor: row.PO_STATUS === "PO Raised" ? "green" : "red",
            color: "white",
            fontWeight: "bold",
            cursor: row.PO_STATUS === "PO Raised" ? "not-allowed" : "pointer",
          }}
        >
          <option value="PO Not Raised">PO Not Raised</option>
          <option value="PO Raised">PO Raised</option>
        </select>
      ),
      sortable: true,
    },
  ];

  return (
    <div>
      <WIPHeader />
      <div className="d-flex justify-content-end mt-4" style={{ marginRight: "40px" }}>
        <button className="btn btn-secondary" onClick={() => navigate("/rm-shortage")} style={{ marginRight: "10px" }}>
          RM Shortage →
        </button>
        <button className="btn btn-secondary" onClick={() => navigate("/box-rm-shortage")}>
          Inventory →
        </button>
      </div>

      <div className="p-4" style={{marginTop: "-30px"}}>
        <h1 className="mb-4">Stock Management</h1>

        {/* ✅ DataTable Integration */}
        <DataTable
          columns={columns}
          data={stockData}
          pagination
          highlightOnHover
        />
      </div>
    </div>
  );
};

export default Stock;
