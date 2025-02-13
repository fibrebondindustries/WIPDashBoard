import React, { useState, useEffect } from "react";
import Header from "../components/Header";
import Sidebar from "../components/Sidebar";
import axiosInstance from "../axiosConfig";
import DataTable from "react-data-table-component";

function UserManagement() {
  const [departments, setDepartments] = useState([]);

  const [users, setUsers] = useState([]); // User data
  const [formData, setFormData] = useState({
    name: "",
    password: "", 
    oldPassword: "", // New field for old password
    auth: "",
    employeeID: "",
    newEmployeeID: "",
    department: "",
  });
  const [selectedUserId, setSelectedUserId] = useState(null); // Selected user for update/delete
  const [showModal, setShowModal] = useState(false);
  const [isSidebarVisible, setIsSidebarVisible] = useState(true);
  const [selectedRows, setSelectedRows] = useState([]); // For row selection
  const [toggleClearSelectedRows, setToggleClearSelectedRows] = useState(false);
  const [searchText, setSearchText] = useState(""); // Search text
  const [filteredUsers, setFilteredUsers] = useState([]); // Filtered data for the table

  // Get the user object from localStorage
  const user = JSON.parse(localStorage.getItem("user"));

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    // Filter the users based on search text
    const filtered = users.filter(
      (user) =>
        (user.Name &&
          user.Name.toLowerCase().includes(searchText.toLowerCase())) ||
        (user.Auth &&
          user.Auth.toLowerCase().includes(searchText.toLowerCase())) ||
        (user.EmployeeID &&
          user.EmployeeID.toLowerCase().includes(searchText.toLowerCase())) ||
        (user.Department &&
          user.Department.toLowerCase().includes(searchText.toLowerCase()))
    );
    setFilteredUsers(filtered);
  }, [searchText, users]);

  const fetchDepartments = async () => {
    try {
      const response = await axiosInstance.get("/api/departments");
      setDepartments(response.data);
    } catch (error) {
      console.error("Error fetching departments:", error);
    }
  };

  useEffect(() => {
    fetchDepartments();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await axiosInstance.get("/api/AllUsers");
      setUsers(response.data);
    } catch (error) {
      console.error("Error fetching users:", error);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
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

  const handleFormSubmit = async (e) => {
    e.preventDefault();

    const transformedData = {
      Name: formData.name,
      // Email: formData.email,     
      Password: formData.password, // Include password (may be empty)
      OldPassword: formData.oldPassword, // Include old password
      Auth: formData.auth,
      EmployeeID: formData.employeeID,
      NewEmployeeID: selectedUserId ? formData.newEmployeeID : undefined, // Only include newEmployeeID during updates
      Department: formData.department,
    };

    try {
      if (selectedUserId) {
        // Update user
        transformedData.EmployeeID = formData.employeeID;
        transformedData.NewEmployeeID =
          formData.newEmployeeID || formData.employeeID;
        const response = await axiosInstance.put(
          `/api/users/${selectedUserId}`,
          transformedData
        );

        // Check for error response from backend
        if (response.data.error) {
          showAlert(response.data.error, "danger");
        } else {
          showAlert("User updated successfully!", "success");
        }
      } else {
        // Add new user
        await axiosInstance.post("/api/signup", transformedData);
        showAlert("User added successfully!", "success");
      }

      fetchUsers();
      setShowModal(false);
      resetForm();
    } catch (error) {
      console.error(
        "Error saving user:",
        error.response?.data || error.message
      );
      showAlert(
        error.response?.data?.error ||
          "An error occurred while saving the user.",
        "danger"
      );
    }
  };

  const handleDeleteUser = async () => {
    if (selectedRows.length === 0) {
      showAlert("Please select a user to delete!", "danger");
      return;
    }

    // Get the name of the user being deleted
    const userToDelete = selectedRows[0].Name;

    // Show a confirmation dialog
    const confirmDelete = window.confirm(
      `Are you sure you want to delete this user: ${userToDelete}?`
    );

    if (!confirmDelete) {
      return; // Exit if the user cancels the action
    }

    try {
      // Assuming your backend can handle batch deletes; if not, loop through selectedRows
      await axiosInstance.delete(`/api/users/${selectedRows[0].EmployeeID}`);
      showAlert("User deleted successfully!", "success");
      fetchUsers();
      setSelectedRows([]);
      setToggleClearSelectedRows(!toggleClearSelectedRows);
    } catch (error) {
      console.error(
        "Error deleting user:",
        error.response?.data || error.message
      );
      showAlert("An error occurred while deleting the user.", "danger");
    }
  };

  const handleUpdateUser = () => {
    if (selectedRows.length === 0) {
      showAlert("Please select a user to update!", "danger");
      return;
    }

    if (selectedRows.length > 1) {
      showAlert("Select only one user to update!", "danger");
      return;
    }

    const userToEdit = selectedRows[0];
    setSelectedUserId(userToEdit.EmployeeID);
    setFormData({
      name: userToEdit.Name,
      password: "",
      oldPassword:"", 
      auth: userToEdit.Auth,
      employeeID: userToEdit.EmployeeID,
      newEmployeeID: userToEdit.EmployeeID,
      department: userToEdit.Department,
    });
    setShowModal(true);
  };

  const handleAddUserClick = () => {
    resetForm(); // Clear the form data
    setShowModal(true); // Open the modal
  };
  const resetForm = () => {
    setFormData({
      name: "",
      password: "",
      oldPassword: "",
      auth: "",
      employeeID: "",
      department: "",
    });
    setSelectedUserId(null);
    setSelectedRows([]);
    setToggleClearSelectedRows(!toggleClearSelectedRows);
  };

  const toggleSidebar = () => {
    setIsSidebarVisible(!isSidebarVisible);
  };

  // Define columns for DataTable
  const columns = [
    { name: "NAME", selector: (row) => row.Name, sortable: true },
    { name: "AUTH", selector: (row) => row.Auth, sortable: true },
    { name: "EMPLOYEE ID", selector: (row) => row.EmployeeID, sortable: true },
    { name: "DEPARTMENT", selector: (row) => row.Department, sortable: true },
  ];

  const handleSelectedRowsChange = (state) => {
    setSelectedRows(state.selectedRows);
  };


  return (
    <div className="d-flex">
      <div
        className={isSidebarVisible ? "sidebar-container" : "sidebar-hidden"}
      >
        <Sidebar />
      </div>
      <div className="flex-grow-1">
        <Header
          toggleSidebar={toggleSidebar}
          isSidebarVisible={isSidebarVisible}
        />
        <main className="main-container p-4">
          <div id="alertPlaceholder"></div>
          <div className="d-flex justify-content-between align-items-center">
            <h2 className="mb-5">Manage Users</h2>
            <div className="d-flex gap-2">
              <button
                className="btn btn-outline-primary mb-5 "
                onClick={handleAddUserClick}
              >
                Add New User
              </button>
              <button
                className="btn btn-outline-primary mb-5 "
                onClick={handleUpdateUser}
              >
                Update User
              </button>
              {/* <button
                className="btn btn-outline-danger mb-5"
                onClick={handleDeleteUser}
              >
                Delete User
              </button> */}
              {user?.Auth === "SuperAdmin" && ( // Show button only if Auth is "SuperAdmin"
                <button
                  className="btn btn-outline-danger mb-5"
                  onClick={handleDeleteUser}
                >
                  Delete User
                </button>
              )}
            </div>
          </div>

          {showModal && (
            <div
              className="modal d-block"
              style={{ backgroundColor: "rgba(0, 0, 0, 0.5)" }}
            >
              <div className="modal-dialog">
                <div className="modal-content">
                  <div className="modal-header">
                    <h5 className="modal-title">
                      {selectedUserId ? "Update User" : "Add New User"}
                    </h5>
                    <button
                      className="btn-close"
                      onClick={() => setShowModal(false)}
                    ></button>
                  </div>
                  <form onSubmit={handleFormSubmit}>
                    <div className="modal-body">
                      <div className="mb-3">
                        <label className="form-label">Name</label>
                        <input
                          type="text"
                          className="form-control"
                          name="name"
                          value={formData.name}
                          onChange={handleInputChange}
                          required
                          placeholder="Enter Name"
                        />
                      </div>
                      {/* 07 jan 2025 -------- yogesh  */}
                      {selectedUserId && (
                        <div className="mb-3">
                          <label className="form-label">Old Password</label>
                          <input
                            type="text"
                            className="form-control"
                            name="oldPassword"
                            value={formData.oldPassword}
                            onChange={handleInputChange}
                            placeholder="Enter Old Password"
                          />
                        </div>
                      )}

                      <div className="mb-3">
                        <label className="form-label">Password</label>
                        <input
                          type="password"
                          className="form-control"
                          name="password"
                          value={formData.password}
                          onChange={handleInputChange}
                          placeholder={
                            selectedUserId
                              ? "Leave blank to keep the same password"
                              : "Enter a new password"
                          }
                        />
                      </div>
                      <div className="mb-3">
                        <label className="form-label">Auth</label>
                        <select
                          className="form-control"
                          name="auth"
                          value={formData.auth}
                          onChange={handleInputChange}
                          required
                        >
                          <option value="">Select Role</option>
                        
                          <option value="Supervisor">Supervisor</option>
                          {user?.Auth === "SuperAdmin" && (
                            <>
                          <option value="Admin">Admin</option>                    
                          <option value="SuperAdmin">SuperAdmin</option>
                            </>
                          )}
                          <option value="User">User</option>
                        </select>
                      </div>
                      <div className="mb-3">
                        <label className="form-label">
                          {selectedUserId ? "New Employee ID" : "Employee ID"}
                        </label>
                        <input
                          type="text"
                          className="form-control"
                          name={selectedUserId ? "newEmployeeID" : "employeeID"} // Use newEmployeeID during updates
                          value={
                            selectedUserId
                              ? formData.newEmployeeID
                              : formData.employeeID
                          } // Conditional value
                          onChange={handleInputChange}
                          placeholder={
                            selectedUserId
                              ? "Enter New Employee ID"
                              : "Enter Employee ID"
                          }
                          required
                        />
                      </div>

                      <div className="mb-3">
                        <label className="form-label">Department</label>
                        <select
                          className="form-control"
                          name="department"
                          value={formData.department}
                          onChange={handleInputChange}
                          required
                        >
                          <option value="">Select Department</option>
                          <option value="None">None</option>
                          <option value="Reserve">Reserve worker</option>
                          <option value="Store">STORE</option>
                          {departments.map((dept, index) => (
                            <option key={index} value={dept}>
                              {dept}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                    <div className="modal-footer">
                      <button
                        type="button"
                        className="btn btn-secondary"
                        onClick={() => setShowModal(false)}
                      >
                        Close
                      </button>
                      <button type="submit" className="btn btn-primary">
                        Save
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          )}
          <div className="mb-3">
            <input
              type="text"
              className="form-control"
              placeholder="Search Users..."
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              style={{ width: "auto" }}
            />
          </div>
          <DataTable
            columns={columns}
            data={filteredUsers}
            pagination
            selectableRows
            onSelectedRowsChange={handleSelectedRowsChange}
            clearSelectedRows={toggleClearSelectedRows}
          />
        </main>
      </div>
    </div>
  );
}

export default UserManagement;
