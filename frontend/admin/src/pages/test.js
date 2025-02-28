
import React, { useContext, useEffect, useState } from "react";
import axiosInstance from "../axiosConfig";
import { AuthContext } from "../AuthContext";
import Logo from "../assets/Img/Logo-1.png";
import User from "../assets/Img/User.gif";
import DataTable from "react-data-table-component";

function UserDashboard() {
  const { user, logout } = useContext(AuthContext);
  const [department, setDepartment] = useState("Not Assigned");
  const [temporaryDepartment, setTemporaryDepartment] = useState("Not Assigned");
  const [workerData, setWorkerData] = useState([]);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  useEffect(() => {
    const fetchWorkerData = async () => {
      try {
        const response = await axiosInstance.get("api/worker-wages");
        const filteredData = response.data.filter(
          (item) => item.EmployeeID === user?.EmployeeID
        );
        setWorkerData(filteredData);
      } catch (error) {
        console.error("Error fetching worker wages data:", error);
      }
    };
    
    fetchWorkerData();
    
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [user?.EmployeeID]);

  const columns = [
    { name: "LOT NUMBER", selector: (row) => row["LOT NUMBER"], sortable: true },
    { name: "PROCESS NAME", selector: (row) => row["PROCESS NAME"], sortable: true },
    { name: "WORKER NAME", selector: (row) => row.Name, sortable: true },
    { name: "AMOUNT", selector: (row) => row.AMOUNT, sortable: true },
    { name: "QTY", selector: (row) => row.QTY, sortable: true },
  ];

  return (
    <div>
      <nav className="navbar navbar-expand-lg bg-body-tertiary">
        <div className="container-fluid">
          <a className="navbar-brand">
            <img src={Logo} className="img-fluid rounded-top" alt="Logo" style={{ height: "40px", marginLeft: "40px" }} />
          </a>
          <button className="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarSupportedContent" aria-controls="navbarSupportedContent" aria-expanded="false" aria-label="Toggle navigation">
            <span className="navbar-toggler-icon"></span>
          </button>
          <div className="collapse navbar-collapse" id="navbarSupportedContent"></div>
        </div>
        <div className="collapse navbar-collapse" id="navbarSupportedContent">
          <ul className="navbar-nav me-auto mb-2 mb-lg-0"></ul>
          <span>Welcome, {user?.Name}! </span>
          <div className="dropdown">
            <a className="d-flex align-items-center text-decoration-none dropdown-toggle" role="button" id="dropdownMenuLink" data-bs-toggle="dropdown" aria-expanded="false">
              <img src={User} alt="Profile" className="rounded-circle" style={{ width: "40px", height: "40px" }} />
            </a>
            <ul className="dropdown-menu dropdown-menu-end" aria-labelledby="dropdownMenuLink">
              <li>
                <a className="dropdown-item text-danger" onClick={logout}>Logout</a>
              </li>
            </ul>
          </div>
        </div>
      </nav>

      <div className="container mt-4">
        {!isMobile ? (
          <DataTable columns={columns} data={workerData} pagination highlightOnHover />
        ) : (
          <div className="row">
            {workerData.map((item, index) => (
              <div className="col-12 mb-3" key={index}>
                <div className="card p-3 shadow-sm">
                  <h5 className="card-title">{item["LOT NUMBER"]}</h5>
                  <p className="card-text"><strong>Process:</strong> {item["PROCESS NAME"]}</p>
                  <p className="card-text"><strong>Worker:</strong> {item.Name}</p>
                  <p className="card-text"><strong>Amount:</strong> {item.AMOUNT}</p>
                  <p className="card-text"><strong>Quantity:</strong> {item.QTY}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default UserDashboard;
