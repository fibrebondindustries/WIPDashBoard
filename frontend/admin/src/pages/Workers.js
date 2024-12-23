import React, { useState, useEffect, useCallback } from "react";
import Header from "../components/Header";
import Sidebar from "../components/Sidebar";
import axiosInstance from "../axiosConfig";
import DataTable from "react-data-table-component";

function Workers() {
  const [departments, setDepartments] = useState([]); // Department data
  const [isSidebarVisible, setIsSidebarVisible] = useState(true);
  const [loading, setLoading] = useState(false);
  const [selectedDepartment, setSelectedDepartment] = useState(null); // Selected department for the modal
  const [lotQuantity, setLotQuantity] = useState(""); // Lot quantity input
  const [showModal, setShowModal] = useState(false); // Modal visibility
  const [clearSelectedRows] = useState(false); // Clear rows after selection  //setClearSelectedRows
  const [searchText, setSearchText] = useState(""); // Search text
  const [filteredData, setFilteredData] = useState([]);


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

  // Fetch department data
  const fetchDepartments = useCallback(async () => {
    try {
      setLoading(true);
  
      // Fetch department data
      const departmentsResponse = await axiosInstance.get("/api/departments/worker-requirements");
  
      // Fetch WIP data
      const wipResponse = await axiosInstance.get("/api/wip");
  
      // Map WIP data to match department data
      const updatedDepartments = departmentsResponse.data.map((department) => {
        const wipData = wipResponse.data.data.find(
          (wip) => wip.DEPARTMENT === department.DEPARTMENT
        );
  
        return {
          ...department,
          Quantity: wipData ? wipData.Quantity : "N/A", // Add Quantity from WIP data
        };
      });
  
      setDepartments(updatedDepartments); // Update state with merged data
    } catch (error) {
      console.error("Error fetching department or WIP data:", error);
      showAlert("Failed to fetch data. Please try again.", "danger");
    } finally {
      setLoading(false);
    }
  },[]);

  
  // Approve extra time
  const handleApproveExtraTime = async (departmentName, extraTime) => {
    try {
      setLoading(true);
      const response = await axiosInstance.post("/api/departments/approve-extra-time", {
        departmentName,
        extraTime,
      });
      showAlert(response.data.message || "Extra time approved successfully!", "success");
      fetchDepartments(); // Refresh table data
    } catch (error) {
      console.error("Error approving extra time:", error);
      showAlert("Failed to approve extra time. Please try again.", "danger");
    } finally {
      setLoading(false);
    }
  };

    // Fetch data on component load
    useEffect(() => {
      fetchDepartments();
    }, [fetchDepartments]); // Dependency: fetchDepartments (memoized)

  // Update resources
  const updateResources = async () => {
    try {
      setLoading(true);
      await axiosInstance.post("/api/departments/update-resources");
      showAlert("Resources updated successfully!", "success");
      fetchDepartments(); // Refresh the table data
    } catch (error) {
      console.error("Error updating resources:", error);
      showAlert("Failed to update resources. Please try again.", "danger");
    } finally {
      setLoading(false);
    }
  };

  // Handle form submission for updating lot quantity
  const handleUpdateLotQuantity = async () => {
    if (!lotQuantity || !selectedDepartment) {
      showAlert("Please enter a valid quantity.", "danger");
      return;
    }

    try {
      setLoading(true);
      await axiosInstance.put("/api/departments/update-lot", {
        DepartmentName: selectedDepartment.DepartmentName,
        LotQuantity: parseInt(lotQuantity),
      });
      showAlert("Lot quantity updated successfully!", "success");
      setShowModal(false);
      setSelectedDepartment(null);
      setLotQuantity("");
      fetchDepartments(); // Refresh the table data
    } catch (error) {
      console.error("Error updating lot quantity:", error);
      showAlert("Failed to update lot quantity. Please try again.", "danger");
    } finally {
      setLoading(false);
    }
  };


  //  // Handle search filtering
  useEffect(() => {
    const filtered = departments.filter((item) =>
      (item.DEPARTMENT || "").toLowerCase().includes(searchText.toLowerCase())
    );
    setFilteredData(filtered);
  }, [searchText, departments]);
  
  //  useEffect(() => {
  //   const filtered = departments.filter((item) =>
  //     item.DepartmentName.toLowerCase().includes(searchText.toLowerCase()),
      
  //   );
  //   setFilteredData(filtered);
  // }, [searchText, departments]);

  // Define columns for DataTable
  // const columns = [
    
  //   { name: "DEPARTMENT NAME", selector: (row) => row.DepartmentName, sortable: true },
  //   { name: "LOT QUANTITY", selector: (row) => row.LotQuantity, sortable: true },
  //   { name: "REQUIRED RESOURCE", selector: (row) => row.RequiredResource, sortable: true },
  //   { name: "AVAILABLE RESOURCE", selector: (row) => row.AvailableResource, sortable: true },
  //   {
  //     name: "To Fill",
  //     selector: (row) => row.ToFill,
  //     sortable: true,
  //     cell: (row) => (
  //       <span style={{ color: row.ToFill > 0 ? "red" : "green" }}>
  //         {row.ToFill}
  //       </span>
  //     ),
  //   },
  // ];

  const columns = [
    { name: "DEPARTMENT NAME", selector: (row) => row.DEPARTMENT, sortable: true },
    { name: "QUANTITY", selector: (row) => row.TotalQuantity, sortable: true },
    {
      name: "UPDATED QUANTITY",
      selector: (row) => (row.Quantity !== null ? row.Quantity : "0"), // Handle null value
      sortable: true,
    },
    
    { name: "REQUIRED RESOURCE", selector: (row) => row.RequiredResource, sortable: true },
    { name: "AVAILABLE RESOURCE", selector: (row) => row.AvailableResource, sortable: true },
    {
      name: "TO FILL",
      selector: (row) => row.ToFill,
      cell: (row) => (
        <span style={{ color: row.ToFill > 0 ? "red" : "green" }}>
          {row.ToFill}
        </span>
      ),
    },
    {
      name: "REQUIRED EXTRA TIME",
      selector: (row) => row.RequiredExtraTime,
      cell: (row) =>
        row.RequiredExtraTime > 0 ? (
          <>
            {`${row.RequiredExtraTime} mins `}
            <button
              className="btn btn-sm btn-outline-success ms-2"
              onClick={() => handleApproveExtraTime(row.DEPARTMENT, row.RequiredExtraTime)}
            >
              ✔
            </button>
          </>
        ) : (
          "No Extra Time"
        ),
    },
  ];
  
  
  // const handleSendToDatabase = async () => {
  //   try {
  //     setLoading(true);
  
  //     // First, trigger updateResources to update the department data
  //     // await updateResources();
  
  //     // Prepare payload for the API
  //     const payload = departments.map((department) => ({
  //       departmentName: department.DEPARTMENT,
  //       availableResource: department.AvailableResource,
  //       toFill: department.ToFill,
  //     }));
  
  //     // Send data to the backend
  //     const response = await axiosInstance.post("/api/departments/save-resources", payload);
  
  //      showAlert(response.data.message || "Resources saved to the database successfully!", "success");
  //   } catch (error) {
  //     console.error("Error saving resources to the database:", error);
  //     showAlert("Failed to save resources to the database. Please try again.", "danger");
  //   } finally {
  //     setLoading(false);
  //   }
  // };


  const handleSendToDatabase = async () => {
    try {
      setLoading(true);
  
      // Prepare payload for the API
      const payload = departments.map((department) => ({
        departmentName: department.DEPARTMENT,
        availableResource: department.AvailableResource,
        toFill: department.ToFill,
        quantity: department.Quantity !== null ? department.Quantity : 0, // Include Quantity
        requiredExtraTime:
          department.RequiredExtraTime === "No Extra Time" ? 0 : department.RequiredExtraTime, // Include RequiredExtraTime
      }));
  
      // Send data to the backend
      const response = await axiosInstance.post("/api/departments/save-resources", payload);
  
      showAlert(response.data.message || "Resources saved to the database successfully!", "success");
    } catch (error) {
      console.error("Error saving resources to the database:", error);
      showAlert("Failed to save resources to the database. Please try again.", "danger");
    } finally {
      setLoading(false);
    }
  };
  
  
  

  const toggleSidebar = () => {
    setIsSidebarVisible(!isSidebarVisible);
  };
  

  return (
    <div className="d-flex">
      <div className={isSidebarVisible ? "sidebar-container" : "sidebar-hidden"}>
        <Sidebar />
      </div>
      <div className="flex-grow-1">
        <Header toggleSidebar={toggleSidebar} isSidebarVisible={isSidebarVisible} />
        <main className="main-container p-4">
          <div id="alertPlaceholder"></div>

          <div className="d-flex justify-content-between align-items-center">
            <h2 className="mb-5">Manage Workers</h2>
            <div>
            
              <button
              className="btn btn-success me-2"
              onClick={handleSendToDatabase}
              disabled={loading}
            >
              {loading ? "Processing..." : "Update Quantity & Resources"}
            </button>

             <button
                className="btn btn-success me-2"
                onClick={updateResources}
                disabled={loading}
              >
                {loading ? "Updating..." : "Update Table"}
              </button>
            </div>
          </div>
          <div className="mb-3">
            <input
              type="text"
              className="form-control"
              placeholder="Search department"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              style={{width:"auto"}}
            />
          </div>
          <DataTable
            columns={columns}
            data={filteredData}
            pagination
            progressPending={loading}
            // selectableRows
            onSelectedRowsChange={(state) => {
              if (state.selectedRows.length > 0) {
                setSelectedDepartment(state.selectedRows[0]); // Select the first user from selected rows
              } else {
                setSelectedDepartment(null);
              }
            }}
            clearSelectedRows={clearSelectedRows} // Clear selected rows
          />

          {/* Modal for updating lot quantity */}
          {showModal && (
            <div className="modal d-block" style={{ backgroundColor: "rgba(0, 0, 0, 0.5)" }}>
              <div className="modal-dialog">
                <div className="modal-content">
                  <div className="modal-header">
                    <h5 className="modal-title">Update Lot Quantity</h5>
                    <button className="btn-close" onClick={() => setShowModal(false)}></button>
                  </div>
                  <div className="modal-body">
                    <p>
                      Update lot quantity for <strong>{selectedDepartment?.DepartmentName}</strong>:
                    </p>
                    <input
                      type="number"
                      className="form-control"
                      placeholder="Enter new lot quantity"
                      value={lotQuantity}
                      onChange={(e) => setLotQuantity(e.target.value)}
                    />
                  </div>
                  <div className="modal-footer">
                    <button className="btn btn-secondary" onClick={() => setShowModal(false)}>
                      Close
                    </button>
                    <button
                      className="btn btn-primary"
                      onClick={handleUpdateLotQuantity}
                      disabled={loading}
                    >
                      {loading ? "Updating..." : "Submit"}
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

export default Workers;
