import React, { useState, useEffect } from "react";
import Header from "../components/Header";
import Sidebar from "../components/Sidebar";
import axiosInstance from "../axiosConfig";
import DataTable from "react-data-table-component";

const LoopiCheckingView = () => {
  const [loopiData, setLoopiData] = useState([]); // Stores all records
  const [isSidebarVisible, setIsSidebarVisible] = useState(true);
  const [supervisorNames, setSupervisorNames] = useState([]); // Dropdown for supervisors
  const [formData, setFormData] = useState({
    Lot_ID: "",
    Quantity: "",
    Hours: "",
    Process_name: "",
    Current_Supervisor: "",
  });
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [showModal, setShowModal] = useState(false);

  // Toggle sidebar visibility
  const toggleSidebar = () => setIsSidebarVisible(!isSidebarVisible);

  // **Fetch all records**
  const fetchLoopiData = async () => {
    try {
      // Retrieve user data from local storage
      const userData = JSON.parse(localStorage.getItem("user"));
      const supervisorName = userData?.Name; // Extract the name
  
      if (!supervisorName) {
        console.error("No supervisor name found in local storage.");
        return;
      }
  
      // Fetch filtered data based on logged-in supervisor
      const response = await axiosInstance.get(`/api/loopi-checking?supervisor=${encodeURIComponent(supervisorName)}`);
  
      setLoopiData(response.data);
    } catch (error) {
      console.error("Error fetching Loopi Checking records:", error);
      alert("Failed to fetch records.");
    }
  };
  
//   const fetchLoopiData = async () => {
//     try {
//       const response = await axiosInstance.get("/api/loopi-checking");
//       setLoopiData(response.data);
//     } catch (error) {
//       console.error("Error fetching Loopi Checking records:", error);
//       alert("Failed to fetch records.");
//     }
//   };

  // **Fetch all supervisor names**
  const fetchSupervisors = async () => {
    try {
      const response = await axiosInstance.get("/api/AllSupervisorName");
      setSupervisorNames(response.data);
    } catch (error) {
      console.error("Error fetching supervisors:", error);
      alert("Failed to fetch supervisors.");
    }
  };

  useEffect(() => {
    fetchLoopiData();
    fetchSupervisors();
  }, []);

  // **Handle input change**
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };



  // **Submit Form (Add or Update)**
  const handleFormSubmit = async (e) => {
    e.preventDefault();

    try {
      if (isEditing) {
        // Update record with Supervisor Auto-Swap
        await axiosInstance.put(`/api/loopi-checking/${editingId}`, formData);
        showAlert("Record updated successfully!", "success");
      } else {
        // Add new record
        await axiosInstance.post("/api/loopi-checking", formData);
        showAlert("Record added successfully!", "success");
      }

      setShowModal(false);
      resetForm();
      fetchLoopiData();
    } catch (error) {
      console.error("Error submitting form:", error);
      showAlert("Failed to submit record.", "danger");
    }
  };

  // **Delete a record**
  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this record?")) return;

    try {
      await axiosInstance.delete(`/api/loopi-checking/${id}`);
      showAlert("Record deleted successfully!", "success");
      fetchLoopiData();
    } catch (error) {
      console.error("Error deleting record:", error);
      showAlert("Failed to delete record.", "danger");
    }
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

  // **Edit a record**
  const handleEdit = (record) => {
    setFormData({
      Lot_ID: record["Lot_ID"],
      Quantity: record["Quantity"],
      Hours: record["Hours"],
      Process_name: record["Process_name"],
      Current_Supervisor: record["Current_Supervisor"],
    });
    setEditingId(record.ID);
    setIsEditing(true);
    setShowModal(true);
  };

  // **Reset Form**
  const resetForm = () => {
    setFormData({
      Lot_ID: "",
      Quantity: "",
      Hours: "",
      Process_name: "",
      Current_Supervisor: "",
    });
    setIsEditing(false);
  };

  // **Columns for DataTable**
  const columns = [
    {
      name: "Lot ID",
      selector: (row) => row["Lot_ID"],
      sortable: true,
    },
    {
      name: "Quantity",
      selector: (row) => row["Quantity"],
      sortable: true,
    },
    {
      name: "Hours",
      selector: (row) => row["Hours"],
      sortable: true,
    },
    {
      name: "Process Name",
      selector: (row) => row["Process_name"],
      sortable: true,
    },
    {
      name: "Previous Supervisor",
      selector: (row) => row["Previous_Supervisor"] || "N/A",
      sortable: true,
    },
    {
      name: "Current Supervisor",
      selector: (row) => row["Current_Supervisor"],
      sortable: true,
    },
    {
      name: "Actions",
      cell: (row) => (
        <>
          <button className="btn btn-primary btn-sm me-2" onClick={() => handleEdit(row)}>
            Edit
          </button>
          <button className="btn btn-danger btn-sm" style={{display:"none"}} onClick={() => handleDelete(row.ID)}>
            Delete
          </button>
        </>
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
        <div id="alertPlaceholder"></div>
          <div className="d-flex justify-content-between align-items-center mb-3">
            <h3>Loopi Checking</h3>
            <button className="btn btn-outline-success" onClick={() => setShowModal(true)} style={{display:"none"}}>
              Add New Record
            </button>
          </div>

          <DataTable columns={columns} data={loopiData} pagination />

          {/* Modal for Add/Edit */}
          {showModal && (
            <div className="modal show" style={{ display: "block" }}>
              <div className="modal-dialog">
                <div className="modal-content">
                  <div className="modal-header">
                    <h5 className="modal-title">{isEditing ? "Edit Record" : "Add Record"}</h5>
                    <button type="button" className="btn-close" onClick={() => setShowModal(false)}></button>
                  </div>
                  <form onSubmit={handleFormSubmit}>
                    <div className="modal-body">
                      <div className="mb-3">
                        <label className="form-label">Lot ID</label>
                        <input
                          type="text"
                          name="Lot_ID"
                          value={formData.Lot_ID}
                          onChange={handleInputChange}
                          className="form-control"
                          required
                        />
                      </div>
                      <div className="mb-3">
                        <label className="form-label">Quantity</label>
                        <input
                          type="number"
                          name="Quantity"
                          value={formData.Quantity}
                          onChange={handleInputChange}
                          className="form-control"
                          required
                        />
                      </div>
                      <div className="mb-3">
                        <label className="form-label">Hours</label>
                        <input
                          type="number"
                          name="Hours"
                          value={formData.Hours}
                          onChange={handleInputChange}
                          className="form-control"
                          required
                        />
                      </div>
                      <div className="mb-3">
                        <label className="form-label">Process Name</label>
                        <input
                          type="text"
                          name="Process_name"
                          value={formData.Process_name}
                          onChange={handleInputChange}
                          className="form-control"
                          required
                        />
                      </div>
                      <div className="mb-3">
                        <label className="form-label">Current Supervisor</label>
                        <select
                          name="Current_Supervisor"
                          value={formData.Current_Supervisor}
                          onChange={handleInputChange}
                          className="form-control"
                          required
                        >
                          <option value="">Select Supervisor</option>
                          {supervisorNames.map((sup, index) => (
                            <option key={index} value={sup.SupervisorName}>
                              {sup.SupervisorName}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                    <div className="modal-footer">
                      <button type="submit" className="btn btn-primary">{isEditing ? "Update" : "Add"}</button>
                      <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Close</button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default LoopiCheckingView;
