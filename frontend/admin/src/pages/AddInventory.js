import React, { useState, useEffect, useCallback } from "react";
import Header from "../components/Header";
import "../assets/CSS/Dashboard.css";
import axiosInstance from "../axiosConfig";
import Sidebar from "../components/Sidebar";
import DataTable from "react-data-table-component";

const AddInventory = () => {
  const [inventory, setInventory] = useState([]); // All records
  const [isSidebarVisible, setIsSidebarVisible] = useState(true);
  const [supervisorNames, setSupervisorNames] = useState([]);  // Supervisor names for dropdown
  const [formData, setFormData] = useState({
    jobOrderNo: "",
    jobOrderDate: "",
    supervisor: "",
    rawMaterial: "",
    status: "",
  }); // Form data for add/update
  const [isEditing, setIsEditing] = useState(false); // Toggle between add and edit
  const [editingId, setEditingId] = useState(null); // ID for the record being edited
  const [showModal, setShowModal] = useState(false); // Modal state

  const toggleSidebar = () => {
    setIsSidebarVisible(!isSidebarVisible);
  };
  // Fetch all inventory records
  const fetchInventory = async () => {
    try {
      const response = await axiosInstance.get("/api/noke-inventory");
      setInventory(response.data);
    } catch (error) {
      console.error("Error fetching inventory:", error);
    //   alert("Failed to fetch inventory records.");
    }
  };

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

  useEffect(() => {
    fetchInventory();
    fetchSupervisorNames();
  }, [fetchSupervisorNames]);

   

  // Handle input changes in the form
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Handle form submission for add/update
  const handleFormSubmit = async (e) => {
    e.preventDefault();

    try {
      if (isEditing) {
        // Update record
        await axiosInstance.patch(`/api/noke-inventory/${editingId}`, formData);
        alert("Record updated successfully!");
      } else {
        // Add new record
        await axiosInstance.post("/api/noke-inventory", formData);
        alert("Record added successfully!");
      }

      setShowModal(false);
      setFormData({
        jobOrderNo: "",
        jobOrderDate: "",
        supervisor: "",
        rawMaterial: "",
        status: "Not Use",
      });
      setIsEditing(false);
      fetchInventory();
    } catch (error) {
      console.error("Error submitting form:", error);
      alert("Failed to submit form.");
    }
  };

  // Handle delete action
  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this record?")) return;

    try {
      await axiosInstance.delete(`/api/noke-inventory/${id}`);
      alert("Record deleted successfully!");
      fetchInventory();
    } catch (error) {
      console.error("Error deleting record:", error);
      alert("Failed to delete record.");
    }
  };

  // Open modal for editing
  const handleEdit = (record) => {
    setFormData({
      jobOrderNo: record["JOB ORDER NO"],
      jobOrderDate: record["JOB ORDER DATE"],
      supervisor: record["SUPERVISOR"],
      rawMaterial: record["RAW MATERIAL"],
    //   status: record["STATUS"],
    });
    setEditingId(record.ID);
    setIsEditing(true);
    setShowModal(true);
  };

  // Open modal for adding
  const handleAdd = () => {
    setFormData({
      jobOrderNo: "",
      jobOrderDate: "",
      supervisor: "",
      rawMaterial: "",
      status: "Not Use",
    });
    setIsEditing(false);
    setShowModal(true);
  };

  // DataTable columns
  const columns = [
    {
      name: "Job Order No",
      selector: (row) => row["JOB ORDER NO"],
      sortable: true,
    },
    {
      name: "Job Order Date",
      selector: (row) => row["JOB ORDER DATE"],
      sortable: true,
    },
    {
      name: "Supervisor",
      selector: (row) => row["SUPERVISOR"],
      sortable: true,
    },
    {
      name: "Raw Material",
      selector: (row) => row["RAW MATERIAL"],
      sortable: true,
    },
    {
      name: "Status",
      selector: (row) => row["STATUS"],
      sortable: true,
    },
    {
      name: "Actions",
      cell: (row) => (
        <>
          <button
            className="btn btn-primary btn-sm me-2"
            onClick={() => handleEdit(row)}
          >
            Edit
          </button>
          <button
            className="btn btn-danger btn-sm"
            onClick={() => handleDelete(row.ID)}
          >
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
        <main className="main-container p-4" style={{ height: "-webkit-fill-available" }}>
       <div class="d-flex justify-content-end mb-3">          
      <button className="btn btn-outline-success mb-3" onClick={handleAdd}>
        Add New Record
      </button>
      </div>  
      <DataTable columns={columns} data={inventory} pagination />
      </main>
      </div>
      {/* Modal for Add/Edit */}
      {showModal && (
        <div className="modal show" style={{ display: "block" }}>
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">
                  {isEditing ? "Edit Record" : "Add Record"}
                </h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setShowModal(false)}
                ></button>
              </div>
              <form onSubmit={handleFormSubmit}>
                <div className="modal-body">
                  <div className="mb-3">
                    <label className="form-label">Job Order No</label>
                    <input
                      type="text"
                      name="jobOrderNo"
                      value={formData.jobOrderNo}
                      onChange={handleInputChange}
                      className="form-control"
                      required
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Job Order Date</label>
                    <input
                      type="date"
                      name="jobOrderDate"
                      value={formData.jobOrderDate}
                      onChange={handleInputChange}
                      className="form-control"
                      required
                    />
                  </div>
                  {/* <div className="mb-3">
                    <label className="form-label">Supervisor</label>
                    <input
                      type="text"
                      name="supervisor"
                      value={formData.supervisor}
                      onChange={handleInputChange}
                      className="form-control"
                      required
                    />
                  </div> */}
                  <div className="mb-3">
                    <label className="form-label">Supervisor Name</label>
                    <select
                      name="supervisor"
                      value={formData.supervisor}
                      onChange={handleInputChange}
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
                    <label className="form-label">Raw Material</label>
                    <input
                      type="text"
                      name="rawMaterial"
                      value={formData.rawMaterial}
                      onChange={handleInputChange}
                      className="form-control"
                      required
                    />
                  </div>
                   {/* Hide status field when editing */}
                   {!isEditing && (
                  <div className="mb-3">
                    <label className="form-label">Status</label>
                    <input
                      type="text"
                      name="status"
                      value={formData.status}
                      onChange={handleInputChange}
                      className="form-control"
                      required
                    readOnly
                    />
                  </div>
                )}
                </div>
                <div className="modal-footer">
                  <button type="submit" className="btn btn-primary">
                    {isEditing ? "Update" : "Add"}
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
};

export default AddInventory;
