// import React, { useState, useEffect, useCallback } from "react";
// import axiosInstance from "../axiosConfig";
// import WIPHeader from "../components/WIP-Herder";

// const RMShortage = () => {
//   const [shortageData, setShortageData] = useState([]);
//   const [searchTerm, setSearchTerm] = useState("");

//   const fetchShortageData = useCallback(async () => {
//     try {
//       const response = await axiosInstance.get("/api/RMshortage");
//       setShortageData(response.data);
//     } catch (error) {
//       console.error("Error fetching shortage data:", error);
//     }
//   }, []);

//   useEffect(() => {
//     fetchShortageData();
//   }, [fetchShortageData]);

//   // Function to check session on page load
// const checkAuth = useCallback(() => {
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

      

//   const handleSearch = (e) => {
//     setSearchTerm(e.target.value.toLowerCase());
//   };

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

//       <h1 className="text-center">RM Shortage</h1>

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
//                   <td>{row["ITEM NAME"]}</td>
//                   <td>{row["RM ITEM DESCRIPTION"]}</td>
//                   <td>{row.req.toFixed(2)}</td>
//                   <td>{row.available.toFixed(2)}</td>
//                   <td>{row.shortage.toFixed(2)}</td>
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

// export default RMShortage;


import React, { useState, useEffect, useCallback } from "react";
import axiosInstance from "../axiosConfig";
import WIPHeader from "../components/WIP-Herder";
import DataTable from "react-data-table-component";

const RMShortage = () => {
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
  

  // ** Fetch RM Shortage Data **
  const fetchShortageData = useCallback(async () => {
    try {
      const response = await axiosInstance.get("/api/RMshortage");
      setShortageData(response.data);
    } catch (error) {
      console.error("Error fetching shortage data:", error);
    }
  }, []);

  useEffect(() => {
    fetchShortageData();
  }, [fetchShortageData]);

  // ** Function to filter table data **
  const filteredData = shortageData.filter((row) =>
    row["KD_CODE"].toLowerCase().includes(searchTerm)
  );

    // ** Run Session Check & Fetch Data **
    useEffect(() => {
      checkAuth(); // Initial session check
      fetchShortageData(); // Fetch data
  
      const interval = setInterval(checkAuth, 1000); // Check session every second
      return () => clearInterval(interval); // Cleanup on component unmount
    }, [checkAuth, fetchShortageData]);
  // ** Define Table Columns **
  const columns = [
    { name: "Sr No", selector: (_, index) => index + 1, sortable: true, width: "80px" },
    { 
      name: "Item Discription", 
      selector: (row) =>  (
        <span
        data-toggle="tooltip"
        title={row.Iteam}
        >
          {row.Iteam}
        </span>
      ), 
      sortable: true 
    },
    { name: "Item Name", selector: (row) => row.KD_CODE || "N/A", sortable: true },  
    { 
      name: "RM Item Code", 
      selector: (row) => row.Rm_Item_Code || "N/A", 
      sortable: true 
    },
   
    { 
      name: "Unit", 
      selector: (row) => row.Unit || "N/A", 
      sortable: true 
    },
    { 
      name: "Plan Qty", 
      selector: (row) => row.Total_Plan_Qty, 
      sortable: true 
    },
    { 
      name: "STOCK IN HAND", 
      selector: (row) => row.Total_Stock_In_Hand || 0, 
      sortable: true 
    },
   
    { 
      name: "Uploaded Date", 
      selector: (row) => (
        <span
        data-toggle="tooltip"
        data-placement="top"
        title={row.Latest_Uploaded_Date}        
        >
         {row.Latest_Uploaded_Date}

        </span>
      ), 
      sortable: true 
    }
  ];

  return (
    <>
      <WIPHeader />
      <div className="p-4">
        <h1 className=" mb-4">RM Shortage</h1>

        <div className="d-flex justify-content-between align-items-center mb-3">
          <button className="btn btn-secondary btn-sm" onClick={() => window.history.back()}>
            &#8592; Back
          </button>
          <input
            type="text"
            className="form-control w-25"
            placeholder="Search Item Name"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {/* ✅ DataTable Integration */}
        <DataTable
          columns={columns}
          data={filteredData}
          pagination
          highlightOnHover
        />
      </div>
    </>
  );
};

export default RMShortage;
