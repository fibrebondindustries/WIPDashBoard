import React, { useState, useEffect } from "react";
import Header from "../components/Header";
import "../assets/CSS/Dashboard.css";
import axiosInstance from "../axiosConfig";
import Sidebar from "../components/Sidebar";
import DataTable from "react-data-table-component";

const OrderDispatch = () => {
  const [srpOrder, setSrpOrder] = useState([]); // Store order dispatch data
  const [isSidebarVisible, setIsSidebarVisible] = useState(true);
  const [loading, setLoading] = useState(false);
  const [startDate, setStartDate] = useState(""); // Start Date for filtering
  const [endDate, setEndDate] = useState(""); // End Date for filtering
  const [filteredData, setFilteredData] = useState([]); // Store filtered data
  const [statusFilter, setStatusFilter] = useState(""); // New Status Filter
  const [searchLotId, setSearchLotId] = useState(""); // Search filter for Lot ID
  const toggleSidebar = () => {
    setIsSidebarVisible(!isSidebarVisible);
  };

  // Fetch order dispatch data from API
  const fetchSrpOrder = async () => {
    setLoading(true);
    try {
      const response = await axiosInstance.get("/api/srpReport"); // Updated API
      // console.log("Fetched Order Dispatch:", response.data); // Debug data
      setSrpOrder(response.data);
      setFilteredData(response.data); // Set initial filtered data
    } catch (error) {
      console.error("Error fetching order dispatch data:", error);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchSrpOrder();
  }, []);

  // Handle status update
  const handleStatusUpdate = async (id, newStatus) => {
    try {
      if (!id) {
        alert("Invalid ID");
        return;
      }

      await axiosInstance.patch(`/api/srpReport/${id}`, { STATUS: newStatus }); // Updated API
      alert("Status updated successfully");
      fetchSrpOrder(); // Refresh the list after update
    } catch (error) {
      console.error("Error updating status:", error);
      alert("Failed to update status.");
    }
  };

  // Handle row deletion (Soft Delete)
  const handleDeleteRow = async (id) => {
    if (!window.confirm("Are you sure you want to delete this record?")) return;

    try {
      await axiosInstance.delete(`/api/srpReport/${id}`); // Soft delete API
      alert("Record deleted successfully!");
      fetchSrpOrder(); // Refresh the data after deleting
    } catch (error) {
      console.error("Error deleting record:", error);
      alert("Failed to delete record.");
    }
  };

    // Handle Filtering (Date Range + Status)
      useEffect(() => {
        let filtered = srpOrder;

        if (startDate && endDate) {
          filtered = filtered.filter((item) => {
            const itemDate = new Date(item["RECEIVED DATE"]);
            return itemDate >= new Date(startDate) && itemDate <= new Date(endDate);
          });
        }

        if (statusFilter) {
          filtered = filtered.filter((item) => item["STATUS"] === statusFilter);
        }
        if (searchLotId) {
          filtered = filtered.filter((item) => item["LOT ID"].toLowerCase().includes(searchLotId.toLowerCase()));
        }

        setFilteredData(filtered);
      }, [startDate, endDate, statusFilter, searchLotId, srpOrder]);

      // Reset Date Filters
      const resetFilters = () => {
        setStartDate("");
        setEndDate("");
        setStatusFilter("");
        setSearchLotId("");
        setFilteredData(srpOrder);
      };


   // Handle remark update
  //  const handleRemarkUpdate = async (id, newRemark) => {
  //   try {
  //     await axiosInstance.patch(`/api/srpReport/remark_admin/${id}`, { admin_REMARK: newRemark });
      
  //     // Update the UI after a successful update
  //     setSrpOrder((prevOrders) =>
  //       prevOrders.map((order) =>
  //         order.ID === id ? { ...order, admin_REMARK: newRemark } : order
  //       )
  //     );
  //     setFilteredData((prevFiltered) =>
  //       prevFiltered.map((order) =>
  //         order.ID === id ? { ...order, admin_REMARK: newRemark } : order
  //       )
  //     );
  //   } catch (error) {
  //     console.error("Error updating remark:", error);
  //     alert("Failed to update remark.");
  //   }
  // };

  const handleRemarkUpdate = (id, newRemark) => {
    if (!id) return;
    
    setSrpOrder((prevOrders) =>
      prevOrders.map((order) =>
        order.ID === id ? { ...order, admin_REMARK: newRemark } : order
      )
    );
  
    setFilteredData((prevFiltered) =>
      prevFiltered.map((order) =>
        order.ID === id ? { ...order, admin_REMARK: newRemark } : order
      )
    );
  
    clearTimeout(window.remarkTimeout);
    window.remarkTimeout = setTimeout(async () => {
      try {
        await axiosInstance.patch(`/api/srpReport/remark_admin/${id}`, { admin_REMARK: newRemark });
      } catch (error) {
        console.error("Error updating remark:", error);
        alert("Failed to update remark.");
      }
    }, 800); // API call triggers after 800ms of inactivity
  };

  
  // DataTable columns
  const columns = [
    {
      name: "Lot ID",width: "159px",
      selector: (row) =>(
        <span
        data-bs-toggle="tooltip"
        data-bs-placement="top"
        title={row["LOT ID"]}
        >
          {row["LOT ID"]}
          </span>
      ), //row["LOT ID"],
      sortable: true,
    },
    {
      name: "GRN No",width: "110px",
      selector: (row) => row["GRN NO."],
      sortable: true,
    },
    {
      name: "Received Date", width: "125px",
      selector: (row) => row["RECEIVED DATE"],
      sortable: true,
    },
    {
      name: "Quantity", width: "100px",
      selector: (row) => row["TOTAL QUANTITY"],
      sortable: true,
    },//row["user_REMARK"],
    {
      name: "Issue",
      selector: (row) => (
        <span
      data-bs-toggle="tooltip"
      data-bs-placement="top"
      title={row.user_REMARK || "N/A"} // Tooltip still shows "N/A" if remark is missing
      style={{ cursor: "pointer" }}
    >
      {row.user_REMARK && row.user_REMARK.trim() !== "" ? row.user_REMARK : "N/A"}
    </span>

      ),
      sortable: true,
    },
    {
      name: "Status",
      cell: (row) => (
        <select
          className="form-select form-select-sm bg-info text-black"
          value={row["STATUS"]}
          onChange={(e) => handleStatusUpdate(row.ID, e.target.value)}
        >
          <option value="NOT DISPATCHED">Not Dispatched</option>
          <option value="READY TO DISPATCH">Ready to Dispatch</option>
          <option value="DISPATCHED" style={{display:"none"}}>Dispatched</option>
        </select>
      ),
      sortable: true,
    },

    {
      name: "Add Remark",
      cell: (row) => (
        <textarea
          className="form-control"
          rows="1"
          value={row["admin_REMARK"] || ""}
          onChange={(e) => handleRemarkUpdate(row.ID, e.target.value)}
          placeholder="Enter remark..."
          style={{ fontSize: "14px" }}
        />
      ),
      ignoreRowClick: true,
      allowOverflow: true,
    },
    {
      name: "Action",
      cell: (row) => (
        <button
          className="btn btn-danger btn-sm"
          onClick={() => handleDeleteRow(row.ID)}
        >
          Delete
        </button>
      ),
      ignoreRowClick: true,
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
          <div className=" mt-0">
            <h3 className="mb-4">Order Dispatch</h3>
             {/* Date Range Filters*/}
             <div className="row mb-4">
              <div className="col-lg-2 col-md-3 col-sm-6">
                <label className="form-label">Start Date:</label>
                <input
                  type="date"
                  className="form-control"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>

              <div className="col-lg-2 col-md-3 col-sm-6">
                <label className="form-label">End Date:</label>
                <input
                  type="date"
                  className="form-control"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>

              <div className="col-lg-2 col-md-3 col-sm-6">
                <label className="form-label">Status:</label>
                <select
                  className="form-control"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <option value="">All</option>
                  <option value="NOT DISPATCHED">Not Dispatched</option>
                  <option value="READY TO DISPATCH">Ready to Dispatch</option>
                  <option value="DISPATCHED">Dispatched</option>
                </select>
              </div>

              <div className="col-lg-3 col-md-3 col-sm-6">
                <label className="form-label">Search Lot ID:</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Enter Lot ID..."
                  value={searchLotId}
                  onChange={(e) => setSearchLotId(e.target.value)}
                />
              </div>

              {/* Reset Button - Aligned properly */}
              <div className="col-lg-1 col-md-12 text-end d-flex align-items-end">
                <button className="btn btn-secondary w-100" onClick={resetFilters}>
                  Reset
                </button>
              </div>
            </div>


              {/* Date Range Filters */}
              {/* <div className="row mb-4 align-items-end">
                <div className="col-md-3">
                  <label className="form-label">Start Date:</label>
                  <input
                    type="date"
                    className="form-control"
                    style={{ width: "141px" }}
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                  />
                </div>

                <div className="col-md-3">
                  <label className="form-label">End Date:</label>
                  <input
                    type="date"
                    className="form-control"
                    style={{ width: "141px" }}
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                  />
                </div>

                <div className="col-md-3">
                  <label className="form-label">Status:</label>
                  <select
                    className="form-control"
                    value={statusFilter}
                    style={{ width: "155px" }}
                    onChange={(e) => setStatusFilter(e.target.value)}
                  >
                    <option value="">All</option>
                    <option value="NOT DISPATCHED">Not Dispatched</option>
                    <option value="READY TO DISPATCH">Ready to Dispatch</option>
                    <option value="DISPATCHED">Dispatched</option>
                  </select>
                </div>

                <div className="col-md-3">
                  <label className="form-label">Search Lot ID:</label>
                  <input
                    type="text"
                    className="form-control"
                    style={{ width: "160px" }}
                    placeholder="Enter Lot ID..."
                    value={searchLotId}
                    onChange={(e) => setSearchLotId(e.target.value)}
                  />
                </div>
              </div> */}

              {/* Reset Button - Placed in a separate row for better alignment */}
              {/* <div className="row">
                <div className="col-md-12 text-end">
                  <button className="btn btn-secondary" onClick={resetFilters}>
                    Reset
                  </button>
                </div>
              </div> */}


            {loading ? (
              <p className="text-center mt-4">Loading...</p>
            ) : filteredData.length > 0 ? (
              <DataTable
                columns={columns}
                data={filteredData}
                pagination
                highlightOnHover
                pointerOnHover
                // striped
                //dense
              />
            ) : (
              <p className="text-center mt-4">No order dispatch data available.</p>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default OrderDispatch;
