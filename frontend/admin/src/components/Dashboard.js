// import React from 'react';
// // import { AuthContext } from '../AuthContext';
// import Header from '../components/Header'

// function Dashboard() {
//     // const { user, logout } = useContext(AuthContext);

//     return (
     
//         <div>
//             <Header /> {/* Include the Header */}
//             <main>
//                 {/*
//                 <h1>Welcome to the Dashboard!</h1>
//                 <p>Email: {user?.Email}</p>
//            <button className="btn btn-danger mt-3" onClick={logout}>
//                 Logout
//              </button> */}
//             </main>
//          </div>  
//     );
// }

// export default Dashboard;

// import React, { useState } from "react";
// import Header from "../components/Header";
// import Sidebar from "../components/Sidebar"; // Import the Sidebar component

// function Dashboard() {
//   const [isSidebarVisible, setIsSidebarVisible] = useState(true); // Sidebar visibility state

//   const toggleSidebar = () => {
//     setIsSidebarVisible(!isSidebarVisible); // Toggle the sidebar state
//   };

//   return (
//     <div className="d-flex">
//       {/* Sidebar */}
//       <div className={isSidebarVisible ? "sidebar-container" : "sidebar-hidden"}>
//         <Sidebar />
//       </div>

//       {/* Main Content */}
//       <div className="flex-grow-1">
//         <div className="d-flex align-items-center p-3" style={{ backgroundColor: "#f8f9fa" }}>
//           {/* Hamburger Menu */}
//           <button
//             className="btn btn-link"
//             onClick={toggleSidebar}
//             style={{ fontSize: "24px", border: "none", background: "black", cursor: "pointer" }}
//           >
//             <i className="bi bi-list"></i> {/* Bootstrap Icon for Hamburger Menu */}
//           </button>
       
//         </div>
//         <Header />
//         <main className="p-4">
//           {/* Main Content */}
//           <h1>Welcome to the Dashboard!</h1>
//           <p>This is the main dashboard content area.</p>
//         </main>
//       </div>
//     </div>
//   );
// }

// export default Dashboard;


import React, { useState } from "react";
import Header from "../components/Header";
import Sidebar from "../components/Sidebar"; // Import the Sidebar component

function Dashboard() {
  const [isSidebarVisible, setIsSidebarVisible] = useState(true); // Sidebar visibility state

  const toggleSidebar = () => {
    setIsSidebarVisible(!isSidebarVisible); // Toggle the sidebar state
  };

  return (
    <div className="d-flex">
      {/* Sidebar */}
      <div className={isSidebarVisible ? "sidebar-container" : "sidebar-hidden"}>
        <Sidebar />
      </div>

      {/* Main Content */}
      <div className="flex-grow-1">
        {/* Pass toggleSidebar and isSidebarVisible to Header */}
        <Header toggleSidebar={toggleSidebar} isSidebarVisible={isSidebarVisible} />
        <main className="p-4">
          <h1>Welcome to the Dashboard!</h1>
          <p>This is the main dashboard content area.</p>
        </main>
      </div>
    </div>
  );
}

export default Dashboard;
