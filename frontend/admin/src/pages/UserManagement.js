import React, { useState, useEffect } from "react";
import Header from "../components/Header";
import Sidebar from "../components/Sidebar";
import axiosInstance from "../axiosConfig";
import DataTable from "react-data-table-component";

function UserManagement() {
  const [users, setUsers] = useState([]); // User data
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    mobile: "",
    password: "",
    auth: "",
    employeeID: "",
    department: "",
  });
  const [selectedUserId, setSelectedUserId] = useState(null); // Selected user for update/delete
  const [showModal, setShowModal] = useState(false);
  const [isSidebarVisible, setIsSidebarVisible] = useState(true);
  const [selectedRows, setSelectedRows] = useState([]); // For row selection
  const [toggleClearSelectedRows, setToggleClearSelectedRows] = useState(false);
  const [searchText, setSearchText] = useState(""); // Search text
  const [filteredUsers, setFilteredUsers] = useState([]); // Filtered data for the table

  useEffect(() => {
    fetchUsers();
  }, []);


  useEffect(() => {
    // Filter the users based on search text
    const filtered = users.filter(
      (user) =>
        (user.Name && user.Name.toLowerCase().includes(searchText.toLowerCase())) ||
        (user.Email && user.Email.toLowerCase().includes(searchText.toLowerCase())) ||
        (user.Mobile && user.Mobile.toString().includes(searchText.toLowerCase())) ||
        (user.Auth && user.Auth.toLowerCase().includes(searchText.toLowerCase())) ||
        (user.EmployeeID && user.EmployeeID.toLowerCase().includes(searchText.toLowerCase())) ||
        (user.Department && user.Department.toLowerCase().includes(searchText.toLowerCase()))
    );
    setFilteredUsers(filtered);
  }, [searchText, users]);
  


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
        <strong>${type === "success" ? "Success!" : "Error!"}</strong> ${message}
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
      Email: formData.email,
      Mobile: formData.mobile,
      Password: formData.password,
      Auth: formData.auth,
      EmployeeID: formData.employeeID,
      Department: formData.department,
    };

    try {
      if (selectedUserId) {
        // Update user
        await axiosInstance.put(`/api/users/${selectedUserId}`, transformedData);
        showAlert("User updated successfully!", "success");
      } else {
        // Add new user
        await axiosInstance.post("/api/signup", transformedData);
        showAlert("User added successfully!", "success");
      }
      fetchUsers();
      setShowModal(false);
      resetForm();
    } catch (error) {
      console.error("Error saving user:", error.response?.data || error.message);
      showAlert("An error occurred while saving the user.", "danger");
    }
  };

  const handleDeleteUser = async () => {
    if (selectedRows.length === 0) {
      showAlert("Please select a user to delete!", "danger");
      return;
    }

    try {
      // Assuming your backend can handle batch deletes; if not, loop through selectedRows
      await axiosInstance.delete(`/api/users/${selectedRows[0].id}`);
      showAlert("User deleted successfully!", "success");
      fetchUsers();
      setSelectedRows([]);
      setToggleClearSelectedRows(!toggleClearSelectedRows);
    } catch (error) {
      console.error("Error deleting user:", error.response?.data || error.message);
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
    setSelectedUserId(userToEdit.id);
    setFormData({
      name: userToEdit.Name,
      email: userToEdit.Email,
      mobile: userToEdit.Mobile,
      password: "",
      auth: userToEdit.Auth,
      employeeID: userToEdit.EmployeeID,
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
      email: "",
      mobile: "",
      password: "",
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
    // { name: "Sr", selector: (row, index) => index + 1, sortable: true },
    { name: "NAME", selector: (row) => row.Name, sortable: true },
    { name: "EMAIL", selector: (row) => row.Email, sortable: true },
    { name: "MOBILE", selector: (row) => row.Mobile, sortable: true },
    { name: "AUTH", selector: (row) => row.Auth, sortable: true },
    { name: "EMPLOYEE ID", selector: (row) => row.EmployeeID, sortable: true },
    { name: "DEPARTMENT", selector: (row) => row.Department, sortable: true },
  ];

  const handleSelectedRowsChange = (state) => {
    setSelectedRows(state.selectedRows);
  };

  return (
    <div className="d-flex">
      <div className={isSidebarVisible ? "sidebar-container" : "sidebar-hidden"}>
        <Sidebar />
      </div>
      <div className="flex-grow-1">
        <Header toggleSidebar={toggleSidebar} isSidebarVisible={isSidebarVisible} />
        <main className="p-4">
        <div id="alertPlaceholder"></div>
          {/* <h1>User Management</h1>
          <div id="alertPlaceholder"></div>

          <button className="btn btn-outline-primary mb-3 me-2" onClick={() => setShowModal(true)}>
            Add New User
          </button>
          <button className="btn btn-outline-primary mb-3 me-2" onClick={handleUpdateUser}>
            Update User
          </button>
          <button className="btn btn-outline-danger mb-3" onClick={handleDeleteUser}>
            Delete User
          </button> */}
          <div className="d-flex justify-content-between align-items-center">
            <h1 className="mb-5">User Management</h1>
            <div className="d-flex gap-2">
            <button className="btn btn-outline-primary mb-5 " onClick={handleAddUserClick}>
            Add New User
          </button>
          <button className="btn btn-outline-primary mb-5 " onClick={handleUpdateUser}>
            Update User
          </button>
          <button className="btn btn-outline-danger mb-5" onClick={handleDeleteUser}>
            Delete User
          </button>
            </div>
        </div>


          {showModal && (
            <div className="modal d-block" style={{ backgroundColor: "rgba(0, 0, 0, 0.5)" }}>
              <div className="modal-dialog">
                <div className="modal-content">
                  <div className="modal-header">
                    <h5 className="modal-title">{selectedUserId ? "Update User" : "Add New User"}</h5>
                    <button className="btn-close" onClick={() => setShowModal(false)}></button>
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
                        />
                      </div>
                      <div className="mb-3">
                        <label className="form-label">Email</label>
                        <input
                          type="email"
                          className="form-control"
                          name="email"
                          value={formData.email}
                          onChange={handleInputChange}
                          required
                        />
                      </div>
                      <div className="mb-3">
                        <label className="form-label">Mobile</label>
                        <input
                          type="tel"
                          className="form-control"
                          name="mobile"
                          value={formData.mobile}
                          onChange={handleInputChange}
                          required
                        />
                      </div>
                      <div className="mb-3">
                        <label className="form-label">Password</label>
                        <input
                          type="password"
                          className="form-control"
                          name="password"
                          value={formData.password}
                          onChange={handleInputChange}
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
                          <option value="Admin">Admin</option>
                          <option value="User">User</option>
                        </select>
                      </div>
                      <div className="mb-3">
                        <label className="form-label">Employee ID</label>
                        <input
                          type="text"
                          className="form-control"
                          name="employeeID"
                          value={formData.employeeID}
                          onChange={handleInputChange}
                        />
                      </div>
                      <div className="mb-3">
                        <label className="form-label">Department</label>
                        <input
                          type="text"
                          className="form-control"
                          name="department"
                          value={formData.department}
                          onChange={handleInputChange}
                        />
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
              style={{width:"auto"}}
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
