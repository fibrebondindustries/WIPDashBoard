// import React, { useState, useEffect, useCallback } from "react";
// import axiosInstance from "../axiosConfig";
// import WIPHeader from "../components/WIP-Herder";

// const BoxRMShortage = () => {
//   const [shortageData, setShortageData] = useState([]);
//   const [searchTerm, setSearchTerm] = useState("");

//   // Fetch Box RM Shortage data
//   const fetchShortageData = useCallback(async () => {
//     try {
//       const response = await axiosInstance.get("/api/BOXRMshortage");
//       setShortageData(response.data);
//     } catch (error) {
//       console.error("Error fetching shortage data:", error);
//     }
//   }, []);

//   useEffect(() => {
//     fetchShortageData();
//   }, [fetchShortageData]);

//   // Function to check session on page load
//   const checkAuth = useCallback(() => {
//     const authData = sessionStorage.getItem("auth");
//     if (!authData) {
//       // Redirect to login if no session data found
//       window.location.href = "/wip-login";
//       return;
//     }

//     const { loggedIn, expiryTime } = JSON.parse(authData);
//     if (!loggedIn || Date.now() > expiryTime) {
//       // If not logged in or session expired, redirect to login
//       sessionStorage.removeItem("auth");
//       window.location.href = "/wip-login";
//     }
//   }, []);

//     // Use Effect to start session check on load
//     useEffect(() => {
//         checkAuth(); // Initial session check on load
//         const interval = setInterval(checkAuth, 1000); // Check session every second
//         return () => clearInterval(interval); // Cleanup interval on component unmount
//       }, [checkAuth]);


//   // Handle search input
//   const handleSearch = (e) => {
//     setSearchTerm(e.target.value.toLowerCase());
//   };

//   // Filter data based on search term
//   const filteredData = shortageData.filter((row) =>
//     row["ITEM NAME"].toLowerCase().includes(searchTerm)
//   );

//   return (
//     <>
//     <WIPHeader/>
//     <div className="container mt-4">
//       <style>{`
//         .navbar {
//           box-shadow: 0 1px 5px rgba(0, 0, 0, 0.2);
//           z-index: 100;
//           position: sticky;
//         }
//         .table td {
//           font-size: 14px;
//           padding: 6px 10px;
//           vertical-align: middle;
//           white-space: normal;
//           text-align: left;
//         }
//         .table th {
//           font-size: 15px;
//           padding: 13px 10px;
//           text-align: start;
//           white-space: nowrap;
//           font-family: fangsong;
//           background-color: darkgray !important;
//         }
//         h1 {
//           font-family: fangsong;
//           font-weight: bold;
//         }
//         #backToTopBtn {
//           display: none;
//           position: fixed;
//           bottom: 20px;
//           right: 20px;
//           z-index: 99;
//           font-size: 13px;
//           background-color: #333;
//           color: white;
//           border: none;
//           border-radius: 20px;
//           padding: 10px 15px;
//           cursor: pointer;
//           box-shadow: 0 2px 5px rgba(0, 0, 0, 0.2);
//           transition: background-color 0.3s;
//         }
//         #backToTopBtn:hover {
//           background-color: #555;
//         }
//         @media (max-width: 768px) {
//           #backToTopBtn {
//             display: none !important;
//           }
//         }
//       `}</style>

//       <h1 className="text-center">Box RM Shortage</h1>

//       <div className="container-fluid d-flex justify-content-between align-items-center mt-4">
//         <button
//           className="btn btn-secondary btn-sm"
//           onClick={() => window.history.back()}
//         >
//           &#8592; Back
//         </button>
//         <input
//           type="text"
//           className="form-control w-25"
//           placeholder="Search Item Name"
//           value={searchTerm}
//           onChange={handleSearch}
//         />
//       </div>

//       <div className="table-responsive mt-4">
//         <table className="table table-bordered table-striped">
//           <thead>
//             <tr>
//               <th>Sr No</th>
//               <th>Item Name</th>
//               <th>RM Item Description</th>
//               <th>Required</th>
//               <th>Available</th>
//               <th>Shortage</th>
//             </tr>
//           </thead>
//           <tbody>
//             {filteredData.length > 0 ? (
//               filteredData.map((row, index) => (
//                 <tr key={index}>
//                   <td>{index + 1}</td>
//                   <td>{row["ITEM NAME"] || "N/A"}</td>
//                   <td>{row["RM ITEM DESCRIPTION"] || "N/A"}</td>
//                   <td>{row.req ? row.req.toFixed(2) : "0.00"}</td>
//                   <td>{row.available ? row.available.toFixed(2) : "0.00"}</td>
//                   <td>{row.shortage ? row.shortage.toFixed(2) : "0.00"}</td>
//                 </tr>
//               ))
//             ) : (
//               <tr>
//                 <td colSpan="6" className="text-center text-danger">
//                   No Data Found
//                 </td>
//               </tr>
//             )}
//           </tbody>
//         </table>
//       </div>
//     </div>
//     </>
//   );
// };

// export default BoxRMShortage;

import React, { useState, useEffect, useCallback } from "react";
import axiosInstance from "../axiosConfig";
import WIPHeader from "../components/WIP-Herder";
import DataTable from "react-data-table-component";

const BoxRMShortage = () => {
  const [shortageData, setShortageData] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");

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

  // ** Fetch Box RM Shortage data **
  const fetchShortageData = useCallback(async () => {
    try {
      const response = await axiosInstance.get("/api/BOXRMshortage");
      setShortageData(response.data);
    } catch (error) {
      console.error("Error fetching shortage data:", error);
    }
  }, []);

  // ** Run Session Check & Fetch Data **
  useEffect(() => {
    checkAuth(); // Initial session check
    fetchShortageData(); // Fetch data

    const interval = setInterval(checkAuth, 1000); // Check session every second
    return () => clearInterval(interval); // Cleanup on component unmount
  }, [checkAuth, fetchShortageData]);

  // ** Search Filter **
  const filteredData = shortageData.filter((row) =>
    row["ITEM_NAME"]?.toLowerCase().includes(searchTerm)
  );

  // ** DataTable Columns **
  const columns = [
    { name: "Sr No", selector: (_, index) => index + 1, sortable: true, width: "80px" },
    { name: "Item Name", selector: (row) => row.ITEM_NAME || "N/A", sortable: true },
    { name: "Barcode", selector: (row) => row.BARCODE || "N/A", sortable: true },
    { name: "Item Description", selector: (row) =>(
      <span
      data-toggle="tooltip"
      title={row.ITEM_DESCRIPTION}
      >
        {row.ITEM_DESCRIPTION || "N/A"}
      </span>
    ), sortable: true },
    { name: "Size", selector: (row) => row.SIZE || "N/A", sortable: true },
    { name: "Closing Stock", selector: (row) => row.CLOSING_STOCK || "0", sortable: true }
  ];

  return (
    <>
      <WIPHeader />
      <div className="p-4 mt-4">
        <h1 className="">Box RM Shortage</h1>

        <div className="d-flex justify-content-between align-items-center mt-4">
          <button className="btn btn-secondary btn-sm" onClick={() => window.history.back()}>
            &#8592; Back
          </button>
          <input
            type="text"
            className="form-control w-25"
            placeholder="Search Item Name"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value.toLowerCase())}
          />
        </div>

        {/* ✅ DataTable Integration */}
        <div className="mt-4">
          <DataTable
            columns={columns}
            data={filteredData}
            pagination
            highlightOnHover
          />
        </div>
      </div>
    </>
  );
};

export default BoxRMShortage;
