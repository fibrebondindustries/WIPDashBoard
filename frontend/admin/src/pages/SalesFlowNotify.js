import React, { useState, useEffect, useCallback } from "react";
import Header from "../components/Header";
import "../assets/CSS/Dashboard.css";
import axiosInstance from "../axiosConfig";
import Sidebar from "../components/Sidebar";
import DataTable from "react-data-table-component";

function SalesFlowNotify() {
  // const user = JSON.parse(localStorage.getItem("user")); // Get logged-in user data
  const [remarks, setRemarks] = useState([]); // All remarks
  const [filteredRemarks, setFilteredRemarks] = useState([]); // Filtered remarks
  const [isSidebarVisible, setIsSidebarVisible] = useState(true);
  const [showModal, setShowModal] = useState(false); // Modal state
  const [showUpdateModal, setShowUpdateModal] = useState(false); // Update modal state
  const [selectedRow, setSelectedRow] = useState(null); // Selected row for update
  const [supervisorNames, setSupervisorNames] = useState([]);  // Supervisor names for dropdown
  const [departments, setDepartments] = useState([]); // Departments for dropdown
  const [filters, setFilters] = useState({
    searchQuery: "",
    fromDate: "",
    toDate: "",
  });

  const initialFormData = {
    SupervisorName: "", // Pre-fill Supervisor Name from local storage
    Department: "",
    Quantity: "",
    Remark: "",
    Subject: "",
  };

  const [formData, setFormData] = useState(initialFormData);

  const toggleSidebar = () => {
    setIsSidebarVisible(!isSidebarVisible);
  };

  // Fetch all remarks for the logged-in user
  const fetchRemarks = useCallback(async () => {
    try {
      const response = await axiosInstance.get("/api/remarks");
      // const userRemarks = response.data.filter(
      //   (remark) => remark.SupervisorName === user?.Name // Filter by logged-in user's name
      // );
      // setRemarks(userRemarks);
      // setFilteredRemarks(userRemarks);
      setRemarks(response.data); // Set all remarks
      // setFilteredRemarks(userRemarks); // Initialize filtered remarks
    } catch (error) {
    //   console.error("Error fetching remarks:", error);
    //   alert("Failed to fetch remarks.");
    }
  }, []); // user?.Name

    // Fetch supervisor names
    const fetchSupervisorNames = useCallback(async () => {
      try {
        const response = await axiosInstance.get("/api/AllSupervisorName");
        setSupervisorNames(response.data);
      } catch (error) {
        console.error("Error fetching supervisor names:", error);
        alert("Failed to fetch supervisor names.");
      }
    }, []);

    // Fetch departments
  const fetchDepartments = useCallback(async () => {
    try {
      const response = await axiosInstance.get("/api/departments");
      setDepartments(response.data);
    } catch (error) {
      console.error("Error fetching departments:", error);
      alert("Failed to fetch departments.");
    }
  }, []);

  useEffect(() => {
    fetchRemarks();
    fetchSupervisorNames();
    fetchDepartments();
  }, [fetchRemarks, fetchSupervisorNames, fetchDepartments]);

  // Handle input changes for filters
  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Apply filters (search and date range)
  useEffect(() => {
    const { searchQuery, fromDate, toDate } = filters;

    const filtered = remarks.filter((remark) => {
      const remarkDate = new Date(remark.RemarkDate);

      const matchesSearch =
        searchQuery === "" ||
        [
          remark.SupervisorName,
          remark.Department,
          remark.Remark,
          remark.Quantity.toString(),
        ]
          .join(" ")
          .toLowerCase()
          .includes(searchQuery.toLowerCase());

      const matchesDate =
        (fromDate === "" || remarkDate >= new Date(fromDate)) &&
        (toDate === "" || remarkDate <= new Date(toDate));

      return matchesSearch && matchesDate;
    });

    setFilteredRemarks(filtered);
  }, [filters, remarks]);

  // Handle Input Changes for Modal Form
  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const showAlert = (message, type) => {
    const alertPlaceholder = document.getElementById("alertPlaceholder");
    const alertHTML = `
      <div class="alert alert-${type} alert-dismissible fade show" role="alert">
        <strong>${
          type === "success" ? "Success!" : "Error!"
        }</strong> ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
      </div>`;
    alertPlaceholder.innerHTML = alertHTML;
    setTimeout(() => {
      alertPlaceholder.innerHTML = "";
    }, 2000);
  };


  // Clear form data and close modal
  const resetFormAndCloseModal = (closeModalCallback) => {
    setFormData(initialFormData);
    closeModalCallback();
  };

  
  // Submit New Remark
  const handleFormSubmit = async (e) => {
    e.preventDefault();

    // const dataToSend = { ...formData, Subject: "Under Capacity" };
    try {
      await axiosInstance.post("/api/remarks", formData);
      showAlert("Remark added successfully!", "success");
      resetFormAndCloseModal(() => setShowModal(false));
      fetchRemarks(); // Refresh remarks after creation
    } catch (error) {
      console.error("Error creating remark:", error);
      showAlert("Failed to create remark.", "danger");
    }
  };

  // Handle Update Form Submit
  const handleUpdateSubmit = async (e) => {
    e.preventDefault();
    if (!selectedRow) {
      showAlert("No row selected for update!",);
      return;
    }

    // const dataToSend = { ...formData, Subject: "Under Capacity" };
    try {
      await axiosInstance.put(`/api/remarks/${selectedRow.ID}`, formData); // Update the remark
      showAlert("Remark updated successfully!", "success");
      setShowUpdateModal(false); // Close the modal
      resetFormAndCloseModal(() => setShowUpdateModal(false));
      fetchRemarks(); // Refresh remarks after update

    } catch (error) {
    //   console.error("Error updating remark:", error);
      showAlert("Failed to update remark.", "danger");
    }
  };


  // Delete a Remark
  const deleteRemark = async (id) => {
    if (!window.confirm("Are you sure you want to delete this remark?")) return;

    try {
      await axiosInstance.delete(`/api/remarks/${id}`);
      showAlert("Remark deleted successfully!", "success");
      fetchRemarks(); // Refresh remarks after deletion
    } catch (error) {
      console.error("Error deleting remark:", error);
      showAlert("Failed to delete remark.", "danger");
    }
  };

  // Columns for the DataTable
  const columns = [
    {
      name: "Supervisor Name",
      selector: (row) => (
        <span data-bs-toggle="tooltip"
        data-bs-placement="top"
        title={row.SupervisorName}>

        {row.SupervisorName}
        </span>
      ),
    
      sortable: true,
    },
    {
      name: "Department",
      selector: (row) => row.Department,
      sortable: true,
    },
    {
      name: "LOT ID",
      selector: (row) => row.LOT_ID,
      sortable: true,
    },
    {
      name: "ProcessName",
      selector: (row) => row.ProcessName,
      sortable: true,
    },
    {
      name: "Parameters",
      selector: (row) => row.Parameters,
      sortable: true,
    },
    {
      name: "DetailedIssue",
      selector: (row) => (
        <span data-bs-toggle="tooltip"
        data-bs-placement="top"
        title={row.DetailedIssue}>

        {row.DetailedIssue}
        </span>
      ),
    //   row.Remark,
      sortable: false,
    },
    {
      name: "Remark Date",
      selector: (row) => row.RemarkDate,
      // selector: (row) =>
      //   new Date(row.RemarkDate).toLocaleDateString("en-GB", {
      //     day: "2-digit",
      //     month: "2-digit",
      //     year: "numeric",
      //   }), // Format date
      sortable: true,
    },
    {
      name: "Actions",
      cell: (row) => (
        <button
          className="btn btn-danger btn-sm"
          onClick={() => deleteRemark(row.ID)}
        >
          Delete
        </button>
      ),
      ignoreRowClick: false,
      allowOverflow: true,
      button: true,
    },
  ];

  return (
    <div className="d-flex dashboard">
      <div className={isSidebarVisible ? "sidebar-container" : "sidebar-hidden"}>
        <Sidebar />
      </div>
      <div className="flex-grow-1">
        <Header toggleSidebar={toggleSidebar} isSidebarVisible={isSidebarVisible} />
        <main className="main-container p-4" style={{ height: "-webkit-fill-available" }}>
          <div className="container mt-0">
            <div className="d-flex justify-content-between align-items-center">
              <h3 className="mb-5">Notification</h3>
              <div className="d-flex gap-2">
              <button
                className="btn btn-primary"
                onClick={() => setShowModal(true)}
              >
                Add Remark
              </button>
              <button
                  className="btn btn-primary"
                  onClick={() => {
                    if (selectedRow) {
                      setFormData(selectedRow); // Populate the update form with selected row data
                      setShowUpdateModal(true); // Open update modal
                    } else {
                      showAlert("Please select a row to update!", "danger");
                    }
                  }}
                >
                  Update Remark
                </button>
                </div>
            </div>

            {/* Filter Section */}
            <input
                  type="text"
                  name="searchQuery"
                  value={filters.searchQuery}
                  onChange={handleFilterChange}
                  className="form-control me-2 mb-3"
                  style={{ width: "auto" }}
                  placeholder="Search..."
                />

            {/* DataTable */}
            <DataTable
              columns={columns}
              data={filteredRemarks}
              pagination
              selectableRows
              onSelectedRowsChange={(selected) => {
                setSelectedRow(selected.selectedRows[0] || null); // Set the selected row
              }}
            />
          </div>
        </main>
      </div>

      {/* Add Remark Modal */}
      {showModal && (
        <div className="modal show" style={{ display: "block" }}>
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Add Remark</h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => resetFormAndCloseModal(() => setShowModal(false))}
                ></button>
              </div>
              <form onSubmit={handleFormSubmit}>
                <div className="modal-body">
                  {/* <div className="mb-3">
                    <label className="form-label">Supervisor Name</label>
                    <input
                      type="text"
                      name="SupervisorName"
                      placeholder="Enter Supervisor Name"
                      value={formData.SupervisorName}
                      onChange={handleFormChange}
                      className="form-control"
                      
                    />
                  </div> */}
                  <div className="mb-3">
                    <label className="form-label">Supervisor Name</label>
                    <select
                      name="SupervisorName"
                      value={formData.SupervisorName}
                      onChange={handleFormChange}
                      className="form-control"
                      required
                    >
                      <option value="">Select Supervisor</option>
                      {supervisorNames.map((supervisor, index) => (
                        <option key={index} value={supervisor.SupervisorName}>
                          {supervisor.SupervisorName}
                        </option>
                      ))}
                    </select>
                  </div>
                  {/* <div className="mb-3">
                    <label className="form-label">Department</label>
                    <input
                      type="text"
                      name="Department"
                      value={formData.Department}
                      onChange={handleFormChange}
                      className="form-control"
                      placeholder="Enter Department"
                      required
                    />
                  </div> */}
                  <div className="mb-3">
                    <label className="form-label">Department</label>
                    <select
                      name="Department"
                      value={formData.Department}
                      onChange={handleFormChange}
                      className="form-control"
                      required
                    >
                      <option value="">Select Department</option>
                      {departments.map((dept, index) => (
                            <option key={index} value={dept}>
                              {dept}
                            </option>
                      ))}
                    </select>
                  </div>
                   <div className="mb-3">
                    <label className="form-label">Parameters</label>
                    <select
                      name="Parameters"
                      value={formData.Parameters}
                      onChange={handleFormChange}
                      className="form-control"
                      required
                    >
                      <option value="">Select Subject</option>
                      <option value="No Raw Material">No Raw Material</option>
                      <option value="Quality">Quality</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                  <div className="mb-3">
                    <label className="form-label">LOT_ID</label>
                    <input
                      type="text"
                      name="LOT_ID"
                      value={formData.LOT_ID}
                      onChange={handleFormChange}
                      className="form-control"
                      placeholder="Enter LOT_ID"
                      required
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">ProcessName</label>
                    <input
                      type="text"
                      name="ProcessName"
                      value={formData.ProcessName}
                      onChange={handleFormChange}
                      className="form-control"
                      placeholder="Enter Process Name"
                      required
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Detailed Issue</label>
                    <textarea
                      name="DetailedIssue"
                      value={formData.DetailedIssue}
                      onChange={handleFormChange}
                      className="form-control"
                      placeholder="Enter Detailed Issue"
                      rows="3"
                      required
                    ></textarea>
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="submit" className="btn btn-primary">
                    Submit
                  </button>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() =>resetFormAndCloseModal(() => setShowModal(false))}
                  >
                    Close
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Update Remark Modal */}
      {showUpdateModal && (
        <div className="modal show" style={{ display: "block" }}>
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Update Remark</h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => resetFormAndCloseModal(() => setShowUpdateModal(false))}
                ></button>
              </div>
              <form onSubmit={handleUpdateSubmit}>
              <div className="modal-body">
                  {/* <div className="mb-3">
                    <label className="form-label">Supervisor Name</label>
                    <input
                      type="text"
                      name="SupervisorName"
                      placeholder="Enter Supervisor Name"
                      value={formData.SupervisorName}
                      onChange={handleFormChange}
                      className="form-control"
                      
                    />
                  </div> */}
                  <div className="mb-3">
                    <label className="form-label">Supervisor Name</label>
                    <select
                      name="SupervisorName"
                      value={formData.SupervisorName}
                      onChange={handleFormChange}
                      className="form-control"
                      required
                    >
                      <option value="">Select Supervisor</option>
                      {supervisorNames.map((supervisor, index) => (
                        <option key={index} value={supervisor.SupervisorName}>
                          {supervisor.SupervisorName}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Department</label>
                    <select
                      name="Department"
                      value={formData.Department}
                      onChange={handleFormChange}
                      className="form-control"
                      required
                    >
                      <option value="">Select Department</option>
                      {departments.map((dept, index) => (
                            <option key={index} value={dept}>
                              {dept}
                            </option>
                      ))}
                    </select>
                  </div>
                   <div className="mb-3">
                    <label className="form-label">Parameters</label>
                    <select
                      name="Parameters"
                      value={formData.Parameters}
                      onChange={handleFormChange}
                      className="form-control"
                      required
                    >
                      <option value="">Select Subject</option>
                      <option value="No Raw Material">No Raw Material</option>
                      <option value="Quality">Quality</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                  <div className="mb-3">
                    <label className="form-label">LOT_ID</label>
                    <input
                      type="text"
                      name="LOT_ID"
                      value={formData.LOT_ID}
                      onChange={handleFormChange}
                      className="form-control"
                      placeholder="Enter LOT_ID"
                      required
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">ProcessName</label>
                    <input
                      type="text"
                      name="ProcessName"
                      value={formData.ProcessName}
                      onChange={handleFormChange}
                      className="form-control"
                      placeholder="Enter Process Name"
                      required
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Detailed Issue</label>
                    <textarea
                      name="DetailedIssue"
                      value={formData.DetailedIssue}
                      onChange={handleFormChange}
                      className="form-control"
                      placeholder="Enter Detailed Issue"
                      rows="3"
                      required
                    ></textarea>
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="submit" className="btn btn-primary">
                    Update
                  </button>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => resetFormAndCloseModal(() => setShowUpdateModal(false))}
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

export default SalesFlowNotify;
