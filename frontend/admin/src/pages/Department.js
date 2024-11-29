import React, { useState, useEffect } from "react";
import Header from "../components/Header";
import Sidebar from "../components/Sidebar";
import axiosInstance from "../axiosConfig";
import DataTable from "react-data-table-component";

function Department() {
  const [users, setUsers] = useState([]); // User data
  const [presentEmployees, setPresentEmployees] = useState([]); // Present employees data
  const [selectedUser, setSelectedUser] = useState(null); // Selected user for operations
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showRestoreModal, setShowRestoreModal] = useState(false);
  const [temporaryDepartment, setTemporaryDepartment] = useState(""); // Temporary department input
  const [isSidebarVisible, setIsSidebarVisible] = useState(true);
  const [clearSelectedRows, setClearSelectedRows] = useState(false);
  const [searchText, setSearchText] = useState(""); // Search text
  const [filteredUsers, setFilteredUsers] = useState([]); // Filtered data for the table
  // useEffect(() => {
  //   fetchUsers();
  //   fetchPresentEmployees();
  //   fetchTemporaryDepartments(); // Fetch temporary department data
  // }, []);

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

  useEffect(() => {
    // Fetch users and temporary departments sequentially
    const fetchData = async () => {
      await fetchUsers(); // Fetch all users first
      await fetchPresentEmployees();
      await fetchTemporaryDepartments(); // Fetch and merge temporary department data
    };
  
    fetchData();
  }, []);

  
  // Fetch All Users
  const fetchUsers = async () => {
    try {
      const response = await axiosInstance.get("/api/AllUsers");
      setUsers(
        response.data.map((user) => ({
          ...user,
          TemporaryDepartment: "N/A", // Initialize without temporary department
        }))
      );
    } catch (error) {
      console.error("Error fetching users:", error);
    }
  };
  
  // const fetchUsers = async () => {
  //   try {
  //     const response = await axiosInstance.get("/api/AllUsers");
  //     setUsers(response.data);
  //   } catch (error) {
  //     console.error("Error fetching users:", error);
  //   }
  // };

  // Fetch Present Employees
  const fetchPresentEmployees = async () => {
    try {
      const response = await axiosInstance.get("/api/presentEmployees");
      setPresentEmployees(response.data);
    } catch (error) {
      console.error("Error fetching present employees:", error);
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
    }, 2000);
  };

  // // Check if Employee is Present
  // const isEmployeePresent = (employeeID) => {
  //   return presentEmployees.some((employee) => employee.EmployeeID === employeeID);
  // };
  const isEmployeePresent = (employeeID) => {
    // console.log("Checking for EmployeeID:", employeeID);
    const found = presentEmployees.some((employee) => {
      // console.log("Checking employee:", employee);
      return employee.EmployeeID === employeeID && employee.PresentEmployees > 0;
    });
    // console.log("Is Employee Present:", found);
    return found;
  };
  
  const handleCloseAssignModal = () => {
    setShowAssignModal(false);
    setSelectedUser(null); // Clear the selected user
    setTemporaryDepartment(""); // Reset the temporary department field
    setClearSelectedRows(!clearSelectedRows); // Trigger clearing selected rows
  };
  
  const handleCloseRestoreModal = () => {
    setSelectedUser(null); // Reset the selected user
    setClearSelectedRows(!clearSelectedRows); // Trigger clearing selected rows
    setShowRestoreModal(false); // Close the modal
  };
  

 const handleAssignDepartment = async () => {
      // Get the logged-in user's name from localStorage
    const loggedInUser = JSON.parse(localStorage.getItem("user"));
    const assignedBy = loggedInUser?.Name || "Unknown Admin";

    if (!temporaryDepartment) {
      showAlert("Please select a department", "danger");
      return;
    }
    if (!isEmployeePresent(selectedUser?.EmployeeID)) {
      showAlert("This employee is not present today", "danger");
      return;
    }
  
    try {
      await axiosInstance.post("/api/assignTemporaryDepartment", {
        EmployeeID: selectedUser.EmployeeID,
        TemporaryDepartment: temporaryDepartment,
        AssignedBy: assignedBy, // Replace with dynamic admin name if needed
      });
      showAlert("Employee assigned to temporary department successfully!", "success");
      // setShowAssignModal(false);
      handleCloseAssignModal(); // Reset and close the modal
      // fetchUsers();
      // fetchPresentEmployees();
      fetchTemporaryDepartments(); // Fetch updated temporary department data
    } catch (error) {
      console.error("Error assigning department:", error);
      showAlert("Failed to assign department.", "danger");
    }
  };
  

  // Restore Department
  const handleRestoreDepartment = async () => {
    try {
      await axiosInstance.post("/api/restoreDepartment", {
        EmployeeID: selectedUser.EmployeeID,
      });
      showAlert("Employee restored to original department successfully!", "success");
      setShowRestoreModal(false);
      // fetchUsers();
      // fetchPresentEmployees();
      fetchTemporaryDepartments(); // Fetch updated temporary department data
    } catch (error) {
      console.error("Error restoring department:", error);
      showAlert("Failed to restore department.", "danger");
    }
  };

  // Define Columns for DataTable
  // const columns = [
  //   { name: "NAME", selector: (row) => row.Name, sortable: true },
  //   { name: "EMAIL", selector: (row) => row.Email, sortable: true },
  //   { name: "MOBILE", selector: (row) => row.Mobile, sortable: true },
  //   { name: "AUTH", selector: (row) => row.Auth, sortable: true },
  //   { name: "EMPLOYEE ID", selector: (row) => row.EmployeeID, sortable: true },
  //   { name: "DEPARTMENT", selector: (row) => row.Department, sortable: true },
  // ];

  const columns = [
    { name: "NAME", selector: (row) => row.Name, sortable: true },
    { name: "EMAIL", selector: (row) => row.Email, sortable: true },
    { name: "MOBILE", selector: (row) => row.Mobile, sortable: true },
    { name: "AUTH", selector: (row) => row.Auth, sortable: true },
    { name: "EMPLOYEE ID", selector: (row) => row.EmployeeID, sortable: true },
    { name: "DEPARTMENT", selector: (row) => row.Department, sortable: true },
    {
      name: "ASSIGNED",
      selector: (row) => row.TemporaryDepartment,
      sortable: true,
      cell: (row) => (
        <span
          style={{
            color: row.TemporaryDepartment !== "N/A" ? "red" : "black",
          }}
        >
          {row.TemporaryDepartment}
        </span>
      ),
    },
  ];
  

  const toggleSidebar = () => {
    setIsSidebarVisible(!isSidebarVisible);
  };

  // const fetchTemporaryDepartments = async () => {
  //   try {
  //     const response = await axiosInstance.get("/api/temporaryDepartments");
  //     const temporaryData = response.data;
  
  //     // Merge temporary department data into users
  //     setUsers((prevUsers) =>
  //       prevUsers.map((user) => {
  //         const tempDept = temporaryData.find(
  //           (temp) => temp.EmployeeID === user.EmployeeID
  //         );
  //         return {
  //           ...user,
  //           TemporaryDepartment: tempDept
  //             ? tempDept.TemporaryDepartment || "N/A"
  //             : "N/A",
  //         };
  //       })
  //     );
  //   } catch (error) {
  //     console.error("Error fetching temporary departments:", error);
  //   }
  // };
  
  const fetchTemporaryDepartments = async () => {
    try {
      const response = await axiosInstance.get("/api/temporaryDepartments");
      const temporaryData = response.data;
  
      // Merge temporary department data into users
      setUsers((prevUsers) =>
        prevUsers.map((user) => {
          const tempDept = temporaryData.find(
            (temp) => temp.EmployeeID === user.EmployeeID
          );
          return {
            ...user,
            TemporaryDepartment: tempDept
              ? tempDept.TemporaryDepartment || "N/A"
              : "N/A",
          };
        })
      );
    } catch (error) {
      console.error("Error fetching temporary departments:", error);
      // Set default if there's an error fetching temporary departments
      setUsers((prevUsers) =>
        prevUsers.map((user) => ({
          ...user,
          TemporaryDepartment: "N/A",
        }))
      );
    }
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

          <div className="d-flex justify-content-between align-items-center">
            <h1 className="mb-5">Department Management</h1>
            <div>
              <p>
                <strong>Present Employees:</strong>{" "}
                {presentEmployees.reduce((acc, curr) => acc + curr.PresentEmployees, 0)}
              </p>
            </div>
            <div className="d-flex gap-2">
              <button
                className="btn btn-outline-primary mb-5"
                onClick={() => {
                  if (selectedUser) {
                    setShowAssignModal(true);
                  } else {
                    showAlert("Please select a user to assign!", "danger");
                  }
                }}
              >
                Assign Department
              </button>
              <button
                className="btn btn-outline-success mb-5"
                onClick={() => {
                  if (selectedUser) {
                    setShowRestoreModal(true);
                  } else {
                    showAlert("Please select a user to restore!", "danger");
                  }
                }}
              >
                Restore Department
              </button>
            </div>
          </div>
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
            onSelectedRowsChange={(state) => {
              if (state.selectedRows.length > 0) {
                setSelectedUser(state.selectedRows[0]); // Select the first user from selected rows
              } else {
                setSelectedUser(null);
              }
            }}
            clearSelectedRows={clearSelectedRows} // Clear selected rows
          />


          {/* Assign Modal */}
          {showAssignModal && (
            <div className="modal d-block" style={{ backgroundColor: "rgba(0, 0, 0, 0.5)" }}>
              <div className="modal-dialog">
                <div className="modal-content">
                  <div className="modal-header">
                    <h5 className="modal-title">Assign Temporary Department</h5>
                    {/* <button className="btn-close" onClick={() => setShowAssignModal(false)}></button> */}
                    <button className="btn-close" onClick={handleCloseAssignModal}></button>
                  </div>
                  <div className="modal-body">
                    <p>
                      Assign a temporary department to <strong>{selectedUser?.Name}</strong> (
                      {selectedUser?.EmployeeID}):
                    </p>
                    <select
                      className="form-control"
                      value={temporaryDepartment}
                      onChange={(e) => setTemporaryDepartment(e.target.value)}
                    >
                      <option value="">Select Department</option>
                      <option value="FOAM CUTTING">FOAM CUTTING</option>
                      <option value="GLUING">GLUING</option>
                      <option value="BELT CUTTING DEPT">BELT CUTTING DEPT</option>
                      <option value="PRESSING">PRESSING</option>
                      <option value="SEWING DEPARTMENT">SEWING DEPARTMENT</option>
              
                    </select>
                  </div>
                  <div className="modal-footer">
                  <button className="btn btn-secondary" onClick={handleCloseAssignModal}>
                    Close
                  </button>
                    <button className="btn btn-primary" onClick={handleAssignDepartment}>
                      Assign Department
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Restore Modal */}
          {showRestoreModal && (
            <div className="modal d-block" style={{ backgroundColor: "rgba(0, 0, 0, 0.5)" }}>
              <div className="modal-dialog">
                <div className="modal-content">
                  <div className="modal-header">
                    <h5 className="modal-title">Restore Original Department</h5>
                    <button className="btn-close" onClick={() => setShowRestoreModal(false)}></button>
                  </div>
                  <div className="modal-body">
                    <p>
                      Restore <strong>{selectedUser?.Name}</strong> ({selectedUser?.EmployeeID}) to
                      their original department?
                    </p>
                  </div>
                  <div className="modal-footer">
                  <button className="btn btn-secondary" onClick={handleCloseRestoreModal}>
                    Close
                  </button>

                    <button className="btn btn-success" onClick={handleRestoreDepartment}>
                      Restore Department
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

export default Department;
