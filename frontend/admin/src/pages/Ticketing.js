// import React, { useState, useEffect } from "react";
// // import WIPHeader from "../components/WIP-Herder";
// import DataTable from "react-data-table-component";
// import axiosInstance from "../axiosConfig";
// import "../assets/CSS/Dashboard.css";
// import Header from "../components/Header";
// import Sidebar from "../components/Sidebar";

// function AdminTicketManagement() {
//   const [isSidebarVisible, setIsSidebarVisible] = useState(true);
//   const [tickets, setTickets] = useState([]); // Ticket data
//   const [filteredTickets, setFilteredTickets] = useState([]); // Filtered tickets
//   const [searchText, setSearchText] = useState(""); // Search input
//   const [selectedRows, setSelectedRows] = useState([]); // Selected rows
//   const [toggleClearSelectedRows, setToggleClearSelectedRows] = useState(false);
//   const [showModal, setShowModal] = useState(false); // Modal visibility
//   const [formData, setFormData] = useState({
//     Category: "",
//     Subject: "",
//     Brief_Description: "",
//     Supervisor_Name: "",
//     Priority: "",
//   });
//   const [selectedTicketId, setSelectedTicketId] = useState(null); // Ticket ID for update

//   const toggleSidebar = () => {
//     setIsSidebarVisible(!isSidebarVisible);
//   };

//   // Fetch tickets
//   const fetchTickets = async () => {
//     try {
//       const response = await axiosInstance.get("/api/tickets");
//       setTickets(response.data);
//       setFilteredTickets(response.data);
//     } catch (error) {
//       console.error("Error fetching tickets:", error);
//     }
//   };

//   useEffect(() => {
//     fetchTickets();
//   }, []);

//   // Search functionality
//   useEffect(() => {
//     const filtered = tickets.filter(
//       (ticket) =>
//         ticket.Category?.toLowerCase().includes(searchText.toLowerCase()) ||
//         ticket.Subject?.toLowerCase().includes(searchText.toLowerCase()) ||
//         ticket.Supervisor_Name?.toLowerCase().includes(searchText.toLowerCase()) ||
//         ticket.Priority?.toLowerCase().includes(searchText.toLowerCase())
//     );
//     setFilteredTickets(filtered);
//   }, [searchText, tickets]);

//   // Input change handler
//   const handleChange = (e) => {
//     const { name, value } = e.target;
//     setFormData((prev) => ({ ...prev, [name]: value }));
//   };

//   // Add/Update Ticket
//   const handleSubmit = async (e) => {
//     e.preventDefault();
//     try {
//       if (selectedTicketId) {
//         await axiosInstance.put(`/api/tickets/${selectedTicketId}`, formData);
//         alert("Ticket updated successfully!");
//       } else {
//         await axiosInstance.post("/api/tickets", formData);
//         alert("Ticket created successfully!");
//       }
//       fetchTickets();
//       setShowModal(false);
//       resetForm();
//     } catch (error) {
//       console.error("Error saving ticket:", error);
//       alert("Failed to save ticket!");
//     }
//   };

//   // Delete Ticket
//   const handleDelete = async () => {
//     if (selectedRows.length === 0) {
//       alert("Please select a ticket to delete!");
//       return;
//     }
//     const confirmDelete = window.confirm("Are you sure you want to delete the selected ticket?");
//     if (!confirmDelete) return;

//     try {
//       const ticketId = selectedRows[0].ID;
//       await axiosInstance.delete(`/api/tickets/${ticketId}`);
//       alert("Ticket deleted successfully!");
//       fetchTickets();
//       setSelectedRows([]);
//       setToggleClearSelectedRows(!toggleClearSelectedRows);
//     } catch (error) {
//       console.error("Error deleting ticket:", error);
//       alert("Failed to delete ticket!");
//     }
//   };

//   // Edit Ticket
//   const handleEdit = () => {
//     if (selectedRows.length === 0) {
//       alert("Please select a ticket to update!");
//       return;
//     }
//     const ticketToEdit = selectedRows[0];
//     setFormData({
//       Category: ticketToEdit.Category,
//       Subject: ticketToEdit.Subject,
//       Brief_Description: ticketToEdit.Brief_Description,
//       Supervisor_Name: ticketToEdit.Supervisor_Name,
//       Priority: ticketToEdit.Priority,
//     });
//     setSelectedTicketId(ticketToEdit.ID);
//     setShowModal(true);
//   };

//   const resetForm = () => {
//     setFormData({
//       Category: "",
//       Subject: "",
//       Brief_Description: "",
//       Supervisor_Name: "",
//       Priority: "",
//     });
//     setSelectedTicketId(null);
//     setSelectedRows([]);
//     setToggleClearSelectedRows(!toggleClearSelectedRows);
//   };

//   // Table columns
//   const columns = [
//     { name: "Category", selector: (row) => row.Category, sortable: true },
//     { name: "Subject", selector: (row) => row.Subject, sortable: true },
//     { name: "Supervisor", selector: (row) => row.Supervisor_Name, sortable: true },
//     { name: "Priority", selector: (row) => row.Priority, sortable: true },
//     { name: "Status", selector: (row) => row.Status, sortable: true },
//   ];

//   return (
//     <div className="d-flex dashboard">
//        <div className={isSidebarVisible ? "sidebar-container" : "sidebar-hidden"}>
//         <Sidebar />
//       </div>
//       <div className="flex-grow-1">
//       <Header
//           toggleSidebar={toggleSidebar}
//           isSidebarVisible={isSidebarVisible}
//         />
//         <main className="main-container p-4">
//           <div className="d-flex justify-content-between mb-3">
//             <h2>Ticket Management</h2>
//             <div>
//               <button className="btn btn-outline-primary me-2" onClick={() => setShowModal(true)}>
//                 Add Ticket
//               </button>
//               <button className="btn btn-outline-primary me-2" onClick={handleEdit}>
//                 Update Ticket
//               </button>
//               <button className="btn btn-outline-danger" onClick={handleDelete}>
//                 Delete Ticket
//               </button>
//             </div>
//           </div>

//           <div className="mb-3">
//             <input
//               type="text"
//               className="form-control"
//               placeholder="Search Tickets..."
//               value={searchText}
//               onChange={(e) => setSearchText(e.target.value)}
//               style={{width:"auto"}}
//             />
//           </div>

//           <DataTable
//             columns={columns}
//             data={filteredTickets}
//             pagination
//             selectableRows
//             onSelectedRowsChange={(state) => setSelectedRows(state.selectedRows)}
//             clearSelectedRows={toggleClearSelectedRows}
//           />
//         </main>
//       </div>

//       {/* Modal for Add/Update Ticket */}
//       {showModal && (
//         <div className="modal d-block" style={{ backgroundColor: "rgba(0, 0, 0, 0.5)" }}>
//           <div className="modal-dialog">
//             <div className="modal-content">
//               <div className="modal-header">
//                 <h5 className="modal-title">{selectedTicketId ? "Update Ticket" : "Add New Ticket"}</h5>
//                 <button className="btn-close" onClick={() => setShowModal(false)}></button>
//               </div>
//               <form onSubmit={handleSubmit}>
//                 <div className="modal-body">
//                   <input type="text" name="Category" placeholder="Category" value={formData.Category} onChange={handleChange} className="form-control mb-2" required />
//                   <input type="text" name="Subject" placeholder="Subject" value={formData.Subject} onChange={handleChange} className="form-control mb-2" required />
//                   <textarea name="Brief_Description" placeholder="Brief Description" value={formData.Brief_Description} onChange={handleChange} className="form-control mb-2" required></textarea>
//                   <input type="text" name="Supervisor_Name" placeholder="Supervisor Name" value={formData.Supervisor_Name} onChange={handleChange} className="form-control mb-2" required />
//                   <select name="Priority" value={formData.Priority} onChange={handleChange} className="form-control mb-2" required>
//                     <option value="">Select Priority</option>
//                     <option value="Low">Low</option>
//                     <option value="Medium">Medium</option>
//                     <option value="High">High</option>
//                   </select>
//                 </div>
//                 <div className="modal-footer">
//                   <button type="submit" className="btn btn-primary">
//                     Save
//                   </button>
//                   <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>
//                     Close
//                   </button>
//                 </div>
//               </form>
//             </div>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// }

// export default AdminTicketManagement;


import React, { useState, useEffect, useCallback  } from "react";
import DataTable from "react-data-table-component";
import axiosInstance from "../axiosConfig";
import "../assets/CSS/Dashboard.css";
import Header from "../components/Header";
import Sidebar from "../components/Sidebar";

function AdminTicketManagement() {
  const [isSidebarVisible, setIsSidebarVisible] = useState(true);
  const [tickets, setTickets] = useState([]);
  const [filteredTickets, setFilteredTickets] = useState([]);
  const [searchText, setSearchText] = useState("");
  const [filters, setFilters] = useState({ fromDate: "", toDate: "" });
  const [selectedRows, setSelectedRows] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    Category: "",
    Subject: "",
    Brief_Description: "",
    Supervisor_Name: "",
    Priority: "",
  });
  const [selectedTicketId, setSelectedTicketId] = useState(null);
  const [toggleClearSelectedRows, setToggleClearSelectedRows] = useState(false);

  const toggleSidebar = () => setIsSidebarVisible(!isSidebarVisible);

  // Fetch Tickets
  const fetchTickets = async () => {
    try {
      const response = await axiosInstance.get("/api/ticketsAdmin");
      setTickets(response.data);
      setFilteredTickets(response.data);
    } catch (error) {
      console.error("Error fetching tickets:", error);
    }
  };

  useEffect(() => {
    fetchTickets();
  }, []);

  // Search & Date Range Filtering
// Inside your component
const applyFilters = useCallback(() => {
  const { fromDate, toDate } = filters;

  const filtered = tickets.filter((ticket) => {
    const ticketDate = new Date(ticket.RaiseDate);

    const matchesSearch =
      searchText === "" ||
      [
        ticket.ID,
        ticket.Category,
        ticket.Subject,
        ticket.Brief_Description,
        ticket.Supervisor_Name,
        ticket.Priority,
        ticket.Status,
      ]
        .join(" ")
        .toLowerCase()
        .includes(searchText.toLowerCase());

    const matchesDate =
      (fromDate === "" || ticketDate >= new Date(fromDate)) &&
      (toDate === "" || ticketDate <= new Date(toDate));

    return matchesSearch && matchesDate;
  });

  setFilteredTickets(filtered);
}, [tickets, filters, searchText]); // Add proper dependencies here

useEffect(() => {
  applyFilters();
}, [applyFilters]); // use applyFilters as a dependency

  // Update Ticket Status Inline
  // const handleStatusChange = async (id, newStatus) => {
  //   try {
  //     await axiosInstance.patch(`/api/tickets/${id}`, { Status: newStatus });
     
  //     fetchTickets();
      
  //   } catch (error) {
  //     console.error("Error updating status:", error);
  //     alert("Failed to update status");
  //   }
  // };
  const handleStatusChange = async (id, newStatus) => {
    try {
      await axiosInstance.patch(`/api/tickets/${id}`, { Status: newStatus });
      showAlert(`Status updated to "${newStatus}" successfully!`, "success");
      fetchTickets();
    } catch (error) {
      console.error("Error updating status:", error);
      showAlert("Failed to update status. Please try again!", "danger");
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
    setTimeout(() => {
      alertPlaceholder.innerHTML = "";
    }, 3000);
  };
    
  
  // Delete Ticket
  const handleDelete = async () => {
    if (selectedRows.length === 0) {
      alert("Please select a ticket to delete!");
      return;
    }
    const confirmDelete = window.confirm("Are you sure you want to delete the selected ticket?");
    if (!confirmDelete) return;

    try {
      const ticketId = selectedRows[0].ID;
      await axiosInstance.delete(`/api/tickets/${ticketId}`);
      alert("Ticket deleted successfully!");
      fetchTickets();
      setSelectedRows([]);
      setToggleClearSelectedRows(!toggleClearSelectedRows);
    } catch (error) {
      console.error("Error deleting ticket:", error);
      alert("Failed to delete ticket!");
    }
  };

  // Update Modal Logic
  const handleEdit = () => {
    if (selectedRows.length === 0) return alert("Select a ticket to update!");
    const ticketToEdit = selectedRows[0];
    setFormData({
      Category: ticketToEdit.Category,
      Subject: ticketToEdit.Subject,
      Brief_Description: ticketToEdit.Brief_Description,
      Supervisor_Name: ticketToEdit.Supervisor_Name,
      Priority: ticketToEdit.Priority,
    });
    setSelectedTicketId(ticketToEdit.ID);
    setShowModal(true);
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    try {
      await axiosInstance.put(`/api/tickets/${selectedTicketId}`, formData);
      alert("Ticket updated successfully!");
      fetchTickets();
      setShowModal(false);
    } catch (error) {
      console.error("Error updating ticket:", error);
    }
  };

  // Reset Filters
  const resetFilters = () => {
    setSearchText("");
    setFilters({ fromDate: "", toDate: "" });
    fetchTickets();
  };

  // Table Columns
  const columns = [
    { name: "Ticket Number", selector: (row) => row.ID, sortable: true },
    { name: "Category", selector: (row) => row.Category, sortable: true },
    { name: "Subject", selector: (row) => row.Subject, sortable: true },
    { name: "Brief Description", selector: (row) => row.Brief_Description, sortable: true },
    { name: "Supervisor Name", selector: (row) => row.Supervisor_Name, sortable: true },
    { name: "Priority", selector: (row) => row.Priority, sortable: true },
    {
      name: "Status",
      cell: (row) => (
        <select
          value={row.Status}
          onChange={(e) => handleStatusChange(row.ID, e.target.value)}
          className="form-select form-select-sm bg-info text-black"
        >
          <option value="Open">Open</option>
          <option value="In Progress">In Progress</option>
          <option value="Resolved">Resolved</option>
          {/* <option value="Closed">Closed</option> */}
        </select>
      ),
    },
    { name: "Raise Date", selector: (row) => row.RaiseDate.split("T")[0], sortable: true },
  ];

  return (
    <div className="d-flex dashboard">
      <div className={isSidebarVisible ? "sidebar-container" : "sidebar-hidden"}>
        <Sidebar />
      </div>
      <div className="flex-grow-1">
        <Header toggleSidebar={toggleSidebar} isSidebarVisible={isSidebarVisible} />
        <div id="alertPlaceholder"></div>
        <main className="main-container p-4">
          <div className="d-flex justify-content-between mb-3">
            <h2>Ticket Management</h2>
            <div>
              <button className="btn btn-primary me-2" onClick={handleEdit} style={{display:"none"}}>
                Update Ticket
              </button>
              <button className="btn btn-outline-danger me-2" onClick={handleDelete} style={{display:"none"}}>
                 Delete Ticket
               </button>
              {/* <button className="btn btn-secondary" onClick={resetFilters}>
                Reload ⟳
              </button> */}
            </div>
          </div>

          <div className="d-flex mb-3 justify-content-end">
            <input
              type="text"
              className="form-control me-2"
              placeholder="Search..."
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              style={{width:"auto"}}
            />
            <input
              type="date"
              className="form-control me-2"
              value={filters.fromDate}
              onChange={(e) => setFilters({ ...filters, fromDate: e.target.value })}
              style={{width:"auto"}}
            />
            <input
              type="date"
              className="form-control me-2"
              value={filters.toDate}
              onChange={(e) => setFilters({ ...filters, toDate: e.target.value })}
              style={{width:"auto"}}
            />
            <button className="btn btn-success" onClick={resetFilters}>
            Reload⟳
            </button>
          </div>

          <DataTable
            columns={columns}
            data={filteredTickets}
            pagination
            // selectableRows
            onSelectedRowsChange={(state) => setSelectedRows(state.selectedRows)}
            clearSelectedRows={toggleClearSelectedRows}
          />
        </main>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="modal show d-block" style={{ backgroundColor: "rgba(0, 0, 0, 0.5)" }}>
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5>Update Ticket</h5>
                <button className="btn-close" onClick={() => setShowModal(false)}></button>
              </div>
              <form onSubmit={handleFormSubmit}>
                <div className="modal-body">
                  <input type="text" name="Category" placeholder="Category" value={formData.Category} onChange={(e) => setFormData({ ...formData, Category: e.target.value })} className="form-control mb-2" />
                  <input type="text" name="Subject" placeholder="Subject" value={formData.Subject} onChange={(e) => setFormData({ ...formData, Subject: e.target.value })} className="form-control mb-2" />
                  <textarea name="Brief_Description" placeholder="Brief Description" value={formData.Brief_Description} onChange={(e) => setFormData({ ...formData, Brief_Description: e.target.value })} className="form-control mb-2" />
                  <input type="text" name="Supervisor_Name" placeholder="Supervisor Name" value={formData.Supervisor_Name} onChange={(e) => setFormData({ ...formData, Supervisor_Name: e.target.value })} className="form-control mb-2" />
                  <select name="Priority" value={formData.Priority} onChange={(e) => setFormData({ ...formData, Priority: e.target.value })} className="form-control mb-2">
                    <option value="">Select Priority</option>
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                  </select>
                </div>
                <div className="modal-footer">
                  <button type="submit" className="btn btn-primary">
                    Save
                  </button>
                  <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>
                    Close
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminTicketManagement;
