///supervisor Home page
import React, { useState, useEffect, useCallback, useContext } from "react";
import Header from "../components/Header";
import "../assets/CSS/Dashboard.css";
import axiosInstance from "../axiosConfig";
import { AuthContext } from "../AuthContext";
import Sidebar from "../components/Sidebar";

function TicketHome() {
  const { user } = useContext(AuthContext); // Get logged-in user data
  const [tickets, setTickets] = useState([]); // All tickets
  const [filteredTickets, setFilteredTickets] = useState([]); // Filtered tickets
  const [isSidebarVisible, setIsSidebarVisible] = useState(true);
  const [showModal, setShowModal] = useState(false); // Modal state
  const [formData, setFormData] = useState({
    Category: "",
    Subject: "",
    Brief_Description: "",
    Supervisor_Name: user?.Name || "", // Pre-fill Supervisor Name from user context
    Priority: "",
  });
  const [filters, setFilters] = useState({
    searchQuery: "",
    fromDate: "",
    toDate: "",
  });

  const toggleSidebar = () => {
    setIsSidebarVisible(!isSidebarVisible);
  };

  // Memoize the fetchTickets function
  const fetchTickets = useCallback(async () => {
    try {
      const response = await axiosInstance.get("/api/tickets", {
        params: { EmployeeID: user?.EmployeeID }, // Pass EmployeeID as query parameter
      });
      setTickets(response.data);
      setFilteredTickets(response.data); // Initialize filtered tickets
    } catch (error) {
      console.error("Error fetching tickets:", error);
      alert("Failed to fetch tickets.");
    }
  }, [user?.EmployeeID]);

  useEffect(() => {
    fetchTickets();
  }, [fetchTickets]); // Fetch tickets when user data changes or fetchTickets changes

  // Handle Input Changes for Filters
  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Memoize applyFilters to prevent recreation on every render
  const applyFilters = useCallback(() => {
    const { searchQuery, fromDate, toDate } = filters;

    const filtered = tickets.filter((ticket) => {
      const ticketDate = new Date(ticket.RaiseDate);

      const matchesSearch =
        searchQuery === "" ||
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
          .includes(searchQuery.toLowerCase());

      const matchesDate =
        (fromDate === "" || ticketDate >= new Date(fromDate)) &&
        (toDate === "" || ticketDate <= new Date(toDate));

      return matchesSearch && matchesDate;
    });

    setFilteredTickets(filtered);
  }, [filters, tickets]);

  useEffect(() => {
    applyFilters();
  }, [filters, applyFilters]);

  // Handle Input Changes for Modal Form
  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Submit New Ticket
  const handleFormSubmit = async (e) => {
    e.preventDefault();
    try {
      const requestData = {
        ...formData,
        EmployeeID: user?.EmployeeID, // Add EmployeeID dynamically
      };
      await axiosInstance.post("/api/tickets", requestData);
      alert("Ticket created successfully!");
      setShowModal(false);
      fetchTickets(); // Refresh tickets after creation
      setFormData({
        Category: "",
        Subject: "",
        Brief_Description: "",
        Supervisor_Name: user?.Name || "", // Reset Supervisor Name
        Priority: "",
      });
    } catch (error) {
      console.error("Error creating ticket:", error);
      alert("Failed to create ticket.");
    }
  };

  // Function to confirm ticket deletion
const confirmTicket = async (id) => {
  if (!window.confirm("Are you sure you want to confirm this ticket?")) return;

  try {
    await axiosInstance.post(`/api/tickets/confirm/${id}`);
    // alert("Ticket confirmed and moved to solved tickets.");
    fetchTickets(); // Refresh the tickets after confirmation
  } catch (error) {
    console.error("Error confirming ticket:", error);
    alert("Failed to confirm ticket.");
  }
};


  return (
    <div className="d-flex dashboard">
      <div className={isSidebarVisible ? "sidebar-container" : "sidebar-hidden"}>
        <Sidebar />
      </div>
      <div className="flex-grow-1">
      <Header toggleSidebar={toggleSidebar} isSidebarVisible={isSidebarVisible} />
        <main className="main-container p-4" style={{height:"-webkit-fill-available"}}>
          <div className="container mt-0">
            {/* Filter Section */}
            <div className="d-flex justify-content-end mb-3">
              <button
                className="btn btn-primary"
                onClick={() => setShowModal(true)}
              >
                Raise a Ticket
              </button>
            </div>

            <div
              className="card p-3 mb-3"
              style={{ backgroundColor: "aliceblue" }}
            >
              <div className="d-flex align-items-center mb-2">
                <input
                  type="text"
                  name="searchQuery"
                  value={filters.searchQuery}
                  onChange={handleFilterChange}
                  className="form-control me-2"
                  placeholder="Search..."
                />
                <input
                  type="date"
                  name="fromDate"
                  value={filters.fromDate}
                  onChange={handleFilterChange}
                  className="form-control me-2"
                />
                <input
                  type="date"
                  name="toDate"
                  value={filters.toDate}
                  onChange={handleFilterChange}
                  className="form-control me-2"
                />
                <button
                  className="btn btn-success me-2"
                  onClick={() => window.location.reload()}
                >
                  Reset⟳
                </button>
              </div>
            </div>

            {/* Tickets Table */}
            <div className="table-responsive">
              <table className="table table-bordered">
                <thead>
                  <tr>
                    <th>Ticket Number</th>
                    <th>Category</th>
                    <th>Subject</th>
                    <th>Brief Description</th>
                    <th>Supervisor Name</th>
                    <th>Priority</th>
                    <th>Status</th>
                    <th>Raise Date</th>
                    <th>Approve Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTickets.length > 0 ? (
                    filteredTickets.map((ticket) => (
                      <tr key={ticket.ID}>
                        <td>{ticket.ID}</td>
                        <td>{ticket.Category}</td>
                        <td>{ticket.Subject}</td>
                        <td>{ticket.Brief_Description}</td>
                        <td>{ticket.Supervisor_Name}</td>
                        <td>{ticket.Priority}</td>
                        <td>{ticket.Status}</td>
                        <td>
                          {new Date(ticket.RaiseDate).toLocaleDateString(
                            "en-GB",
                            {
                              day: "2-digit",
                              month: "2-digit",
                              year: "numeric",
                            }
                          )}
                        </td>
                        <td>
                        {ticket.Status === "Resolved" && (
                          <button
                            className="btn btn-success btn-sm"
                            onClick={() => confirmTicket(ticket.ID)}
                          >
                            Confirm
                          </button>
                        )}
                      </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="8" className="text-center">
                        No Tickets Available
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </main>
      </div>

      {/* Raise Ticket Modal */}
      {showModal && (
        <div className="modal show" style={{ display: "block" }}>
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Raise a Ticket</h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setShowModal(false)}
                ></button>
              </div>
              <form onSubmit={handleFormSubmit}>
                <div className="modal-body">
                  <div className="mb-3">
                    <label className="form-label">Category</label>
                    <input
                      type="text"
                      name="Category"
                      value={formData.Category}
                      onChange={handleFormChange}
                      className="form-control"
                      placeholder="Enter Category"
                      required
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Subject</label>
                    <input
                      type="text"
                      name="Subject"
                      value={formData.Subject}
                      onChange={handleFormChange}
                      className="form-control"
                      placeholder="Enter Subject"
                      required
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Brief Description</label>
                    <textarea
                      name="Brief_Description"
                      value={formData.Brief_Description}
                      onChange={handleFormChange}
                      className="form-control"
                      placeholder="Enter Brief Description"
                      rows="3"
                      required
                    ></textarea>
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Priority</label>
                    <select
                      name="Priority"
                      value={formData.Priority}
                      onChange={handleFormChange}
                      className="form-select"
                      required
                    >
                      <option value="">Select Priority</option>
                      <option value="Low">Low</option>
                      <option value="Medium">Medium</option>
                      <option value="High">High</option>
                    </select>
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="submit" className="btn btn-primary">
                    Submit
                  </button>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => setShowModal(false)}
                  >
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

export default TicketHome;
