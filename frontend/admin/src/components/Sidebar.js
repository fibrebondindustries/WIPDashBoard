import React, {useContext,useState, useEffect } from "react";
import { NavLink } from "react-router-dom";
import { AuthContext } from "../AuthContext"; // Import AuthContext
import "../assets/CSS/Sidebar.css"; // Add custom styles here if needed
import logo from "../assets/Img/Logo-1.png";
import axiosInstance from "../axiosConfig";

const Sidebar = () => {
  const { user } = useContext(AuthContext); // Get the user's role from AuthContext
  const [ticketCount, setTicketCount] = useState(0); // State to store ticket count
  const [score, setScore] = useState(null); // State for performance score //// 17 Jan 25 Yogesh
  const [performance, setPerformance] = useState(null); // State for performance percentage //// 17 Jan 25 Yogesh
  const [RMCount, setRMCount] = useState(0); // State for inventory count
  const [NokeData, setNokeData] = useState(0); // State for
  const [LoopiCheckingCount, setLoopiCheckingCount] = useState(0); // State for Loopi Checking Count
  const [SalesFlowCount, setSalesFlowCount] = useState(0); // State for Sales Flow Count
  const [scanCount, setScanCount] = useState(0); // State for Sales Flow Count
  // const [orderCount, setOrderCount] = useState(0); // State for order count
  useEffect(() => {
    // Fetch the ticket count when the component mounts
    const fetchTicketCount = async () => {
      try {
        const response = await axiosInstance.get("/api/ticketsAdmin"); // Use appropriate API for admin tickets
        setTicketCount(response.data.length); // Set the count based on the number of tickets
      } catch (error) {
        console.error("Error fetching ticket count:", error);
      }
    };

    //new code 17 Jan 25 Yogesh
    // Fetch performance data for the logged-in supervisor
    const fetchPerformanceData = async () => {
      try {
        const response = await axiosInstance.get("/api/performance"); // API call for performance
        const data = response.data;

        // Filter performance data for the logged-in supervisor
        const supervisorData = data.find(
          (item) => item.SupervisorName === user?.Name
        );

        // Update state with score and performance
        if (supervisorData) {
          setScore(supervisorData.Score);
          setPerformance(supervisorData.Performance);
        }
      } catch (error) {
        console.error("Error fetching performance data:", error);
      }
    };
///new code end 28 Jan 25
  // Fetch inventory count for the logged-in supervisor
  const fetchInventoryCount = async () => {
    try {
      const response = await axiosInstance.get("/api/noke-inventory"); // API to fetch inventory
      const filteredInventory = response.data.filter(
        (item) => item["SUPERVISOR"] === user?.Name
      ); // Filter by logged-in supervisor's name
      setRMCount(filteredInventory.length); // Set the count of inventory records
    } catch (error) {
      console.error("Error fetching inventory count:", error);
    }
  };

 // Fetch the ticket count when the component mounts
 const fetchNokeCount = async () => {
  try {
    const response = await axiosInstance.get("/api/noke-data"); // Use appropriate API for admin tickets
     setNokeData(response.data.length); // Set the count based on the number of tickets
  } catch (error) {
    console.error("Error fetching ticket count:", error);
  }
};

 // Fetch Loopi Checking Count for the logged-in supervisor// 12 Feb 25
 const fetchLoopiCheckingCount = async () => {
  try {
    const response = await axiosInstance.get("/api/loopi-checking"); // API to fetch Loopi Checking
    const filteredLoopiChecking = response.data.filter(
      (item) => item["Current_Supervisor"] === user?.Name
    ); // Filter by logged-in supervisor's name
    setLoopiCheckingCount(filteredLoopiChecking.length); // Set the count of  records
    console.log("LoopiCheckingCount", filteredLoopiChecking.length);
  } catch (error) {
    console.error("Error fetching LoopiChecking count:", error);
  }
};


// Fetch Sales Flow Count for the admin// 14 Feb 25
const fetchSalesFlowCount = async () => {
  try {
    const response = await axiosInstance.get("/api/sales-flow-Notification"); // Use appropriate API for admin tickets
    setSalesFlowCount(response.data.length); // Set the count based on the number of tickets
  } catch (error) {
    console.error("Error fetching ticket count:", error);
  }
};
// Fetch Scan Count for the admin// 14 Feb 25
const fetchScanCount = async () => {
  try {
    const response = await axiosInstance.get("/api/sales-flow-ScanNotification"); // Use appropriate API for admin tickets
    setScanCount(response.data.length); // Set the count based on the number of tickets
  } catch (error) {
    console.error("Error fetching ticket count:", error);
  }
};

  // Fetch  count for superadmin
    if (user?.Auth === "SuperAdmin") {
      fetchTicketCount();
      // fetchSalesFlowCount();
      
    }
    // Fetch  count for admin
    if (user?.Auth === "Admin") {
      fetchSalesFlowCount();
      fetchScanCount();
    }
    // Fetch  count for supervisor
    //performace data
    if (user?.Auth === "Supervisor") {
      fetchPerformanceData();
      fetchInventoryCount();
      fetchNokeCount();
      fetchLoopiCheckingCount();      
      // fetchScanCount();
      fetchSalesFlowCount();
    }
  }, [user]);


 
  return (
    <div className="d-flex flex-column vh-100 bg-light sidebar">
      <div className=" text-center">
        <a className="navbar-brand" >
          <img
            src={logo}
            className="mt-2"
            alt="Fibre Bond Logo"
            style={{ height: "40px", width: "auto" }}
          />
        </a>
      </div>
      <ul className="nav flex-column NavlinkCss">
        <li className="nav-item">
          <NavLink
            to="/Main-dashboard"
            // className="nav-link"
            className={({ isActive }) =>
              isActive ? "nav-link active" : "nav-link"
            }
            // activeClassName="active"
          >
            <i className="bi bi-speedometer2"></i> Dashboard
          </NavLink>
        </li>

          {(user?.Auth === "Admin" || 
          // (user?.Auth === "SuperAdmin" && user?.EmployeeID !== "33")) && (
            (user?.Auth === "SuperAdmin" && !["33", "34", "35","36"].includes(user?.EmployeeID))) && (
          <li className="nav-item">
            <NavLink
              to="/users"
              className={({ isActive }) =>
                isActive ? "nav-link active" : "nav-link"
              }
            >
              <i className="bi bi-calendar-check"></i> Users
            </NavLink>
          </li>
        )}
        {/* {(user?.Auth === "Admin" || user?.Auth === "SuperAdmin") && ( */}
        {(user?.Auth === "Admin" || 
        // (user?.Auth === "SuperAdmin" && user?.EmployeeID !== "33")) && (
          (user?.Auth === "SuperAdmin" && !["33", "34", "35", "36"].includes(user?.EmployeeID))) && (
          <li className="nav-item">
            <NavLink
              to="/department"
              className={({ isActive }) =>
                isActive ? "nav-link active" : "nav-link"
              }
            >
              <i className="bi bi-calendar-check"></i> Department
            </NavLink>
          </li>
        )}
         {/* {(user?.Auth === "Admin" || user?.Auth === "SuperAdmin") && ( */}
         {(user?.Auth === "Admin" || 
        //  (user?.Auth === "SuperAdmin" && user?.EmployeeID !== "33")) && (
          (user?.Auth === "SuperAdmin" && !["33", "34", "35", "36"].includes(user?.EmployeeID))) && (
          <li className="nav-item">
            <NavLink
              to="/workers"
              className={({ isActive }) =>
                isActive ? "nav-link active" : "nav-link"
              }
            >
              <i className="bi bi-calendar-check"></i> Workers
            </NavLink>
          </li>
        )}
          {/* Ticketing Link - Only Visible to SuperAdmin */}
         {user?.Auth === "SuperAdmin" && (
          <li className="nav-item">
            <NavLink
              to="/ticket-admin"
              className={({ isActive }) =>
                isActive ? "nav-link active" : "nav-link"
              }
            >
              <i className="bi bi-calendar-check"></i> Ticketing{" "}
              {ticketCount > 0 && (
                <span className="badge bg-danger">{ticketCount}</span>
              )}
            </NavLink>
          </li>
        )}
        {user?.Auth === "Supervisor" && (
          <li className="nav-item">
            <NavLink
              to="/ticket-home"
              className={({ isActive }) =>
                isActive ? "nav-link active" : "nav-link"
              }
            >
              <i className="bi bi-calendar-check"></i> Raise Ticket{" "}
              {ticketCount > 0 && (
                <span className="badge bg-danger">{ticketCount}</span>
              )}
            </NavLink>
          </li>
        )}
         {(user?.Auth === "Admin") && (
          <li className="nav-item">
            <NavLink
              to="/remarks"
              className={({ isActive }) =>
                isActive ? "nav-link active" : "nav-link"
              }
            >
              <i className="bi bi-calendar-check"></i> Remarks
            </NavLink>
          </li>
        )}
        {/* Ṇew Module create on 13 fab 25 this will only visible to Ashwini */}
        {user?.Auth === "Admin" && user?.EmployeeID === "1017" && (
          <li className="nav-item">
            <NavLink
              to="/sales-flow"
              className={({ isActive }) =>
                isActive ? "nav-link active" : "nav-link"
              }
            >
              <i className="bi bi-calendar-check"></i> Sales Flow
            </NavLink>
          </li>
        )}

         {/* Ṇew Module create on 13 fab 25 this will only visible to Faizan */}
         {(user?.Auth === "Admin" && user?.EmployeeID === "1018") && (
          <li className="nav-item">
            <NavLink
              to="/sales-scan"
              className={({ isActive }) =>
                isActive ? "nav-link active" : "nav-link"
              }
            >
              <i className="bi bi-calendar-check"></i>Sales Flow{" "}
              {scanCount > 0 && (
                <span className="badge bg-danger">{scanCount}</span>
              )}
            </NavLink>
          </li>
        )}
         {/* Ṇew Module create on 13 fab 25 this will only visible to Ashwini */}
         {user?.Auth === "Supervisor" && user?.EmployeeID === "12" && (
          <li className="nav-item">
            <NavLink
              to="/sales-flowNotify"
              className={({ isActive }) =>
                isActive ? "nav-link active" : "nav-link"
              }
            >
              <i className="bi bi-calendar-check"></i>Sales Flow{" "}
              {SalesFlowCount  > 0 && (
                <span className="badge bg-danger">{SalesFlowCount }</span>
              )}
            </NavLink>
          </li>
        )}
        
       {/* new module created 28 jan 25  only access by monu and siddhu*/}
       {user?.Auth === "Supervisor" && (user?.Name === "MONU" || user?.Name === "SIDDHU") && (
          <li className="nav-item">
            <NavLink
              to="/add-inventory"
              className={({ isActive }) =>
                isActive ? "nav-link active" : "nav-link"
              }
            >
              <i className="bi bi-box-arrow-out"></i> Add Inventory{" "}
              {NokeData > 0 && (
                 <span className="badge bg-danger">{NokeData}</span>
              )}
            </NavLink>
          </li>
          )}

       {user?.Auth === "Supervisor" && user?.Name !== "MONU" && user?.Name !== "SIDDHU" && (
          <li className="nav-item">
            <NavLink
              to="/view-inventory"
              className={({ isActive }) =>
                isActive ? "nav-link active" : "nav-link"
              }
            >
              <i className="bi bi-box-arrow-out"></i> View Inventory {" "}
              {RMCount > 0 && (
                 <span className="badge bg-danger">{RMCount}</span>
              )}
            </NavLink>
          </li>
        )}
        {/* end */}

        {/* New module created 17 Feb 25 for Excel Import */}
        {( 
          (user?.Auth === "Supervisor" || user?.Auth === "Admin") && 
          ["2", "1017", "2918"].includes(user?.EmployeeID)
        ) && (
          <li className="nav-item">
            <NavLink
              to="/excel-import"
              className={({ isActive }) =>
                isActive ? "nav-link active" : "nav-link"
              }
            >
              <i className="bi bi-calendar-check"></i> Excel Import{" "}
            </NavLink>
          </li>
        )}


     {/* New Module create Loopi checking on 11 Feb 25 */}
      {user?.Auth === "Supervisor" &&
        ["MONU", "VIRAT (MAMA)", "SONU"].includes(user?.Name) && (
          <li className="nav-item">
            <NavLink
              to="/loopi-checkingView"
              className={({ isActive }) =>
                isActive ? "nav-link active" : "nav-link"
              }
            >
              <i className="bi bi-calendar-check"></i> Loopi Checking{" "}
              {LoopiCheckingCount > 0 && (
                <span className="badge bg-danger">{LoopiCheckingCount}</span>
              )}
            </NavLink>
          </li>
        )}

      {/*loopi checking  this will be only accessed by ANWAR */}
      {user?.Auth === "Supervisor" && (user?.Name === "ANWAR") && (
          <li className="nav-item">
            <NavLink
              to="/loopi-checking"
              className={({ isActive }) =>
                isActive ? "nav-link active" : "nav-link"
              }
            >
              <i className="bi bi-calendar-check"></i> Loopi Checking{" "}
              {/* {ticketCount > 0 && (
                <span className="badge bg-danger">{ticketCount}</span>
              )} */}
            </NavLink>
          </li>
        )}


        {/* added on 17 jan 25 */}
        {user?.Auth === "Supervisor" && (
          <li className="nav-item">
            <div className="nav-link">
              <i className="bi bi-box-arrow-in"></i>Performance:{" "}
              {performance !== null ? (
                <>
                  <strong style={{
                color:
                performance >= 80
                  ? "green"
                  : performance >= 50
                  ? "orange"
                  : "red", // Color conditions
            }}>{performance}%</strong> (Score:{score})
                </>
              ) : (
                "Loading..."
              )}
            </div>
          </li>
        )}
        {/* end */}
        {/* 29 jan 25 order dispatch module*/}  
        {/* {user?.Auth === "SuperAdmin" && user?.Name !== "Sandeep Maintenance"&& ( */}
        {(user?.Auth === "SuperAdmin" && !["33", "34", "35", "36"].includes(user?.EmployeeID)) && (
          <li className="nav-item">
            <NavLink
              to="/order-dispatch"
              className={({ isActive }) =>
                isActive ? "nav-link active" : "nav-link"
              }
            >
              <i className="bi bi-calendar-check"></i> Order Dispatch{" "}
              {/* {orderCount > 0 && (
                // <span className="badge bg-danger">{orderCount}</span>
              )} */}
            </NavLink>
          </li>
        )}
         {(user?.Auth === "SuperAdmin" && !["33", "34", "35", "36"].includes(user?.EmployeeID)) && (
          <li className="nav-item">
            <NavLink
              to="/RM-Upload"
              className={({ isActive }) =>
                isActive ? "nav-link active" : "nav-link"
              }
            >
              <i className="bi bi-calendar-check"></i> RM Upload{" "}
              {/* {orderCount > 0 && (
                // <span className="badge bg-danger">{orderCount}</span>
              )} */}
            </NavLink>
          </li>
        )}
       
      </ul>
    </div>
  );
};

export default Sidebar;
