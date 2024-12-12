import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import axiosInstance from "../axiosConfig";
import WIPHeader from "../components/WIP-Herder";



const Stock = () => {
  const [stockData, setStockData] = useState([]);
  const navigate = useNavigate();

  const fetchStockData = useCallback(async () => {
    try {
      const response = await axiosInstance.get("/api/stockData");
      processStockData(response.data);
    } catch (error) {
      console.error("Error fetching stock data:", error);
    }
  }, []);

// Function to check session on page load
const checkAuth = useCallback(() => {
    const authData = sessionStorage.getItem("auth");
    if (!authData) {
      // Redirect to login if no session data found
      window.location.href = "/wip-login";
      return;
    }

    const { loggedIn, expiryTime } = JSON.parse(authData);
    if (!loggedIn || Date.now() > expiryTime) {
      // If not logged in or session expired, redirect to login
      sessionStorage.removeItem("auth");
      window.location.href = "/wip-login";
    }
  }, []);

  // Use Effect to start session check on load
  useEffect(() => {
    checkAuth(); // Initial session check on load
    const interval = setInterval(checkAuth, 1000); // Check session every second
    return () => clearInterval(interval); // Cleanup interval on component unmount
  }, [checkAuth]);


  useEffect(() => {
    fetchStockData();
  }, [fetchStockData]);

  const processStockData = (data) => {
    const aggregatedData = {};

    data.forEach((row) => {
      if (row["PROCESS NAME"] && row["PROCESS NAME"].toUpperCase().includes("BOX")) {
        return;
      }

      const joNo = row["JO NO"];
      const totalQuantityShortage = parseFloat(row["Quantity_Shortage"]) || 0;
      const totalShortage = parseFloat(row["shortage"]) || 0;

      if (!aggregatedData[joNo]) {
        aggregatedData[joNo] = {
          joNo,
          joDate: row["JO DATE"] || "",
          quantityShortage: 0,
          shortage: 0,
        };
      }
      aggregatedData[joNo].quantityShortage += totalQuantityShortage;
      aggregatedData[joNo].shortage += totalShortage;
    });

    setStockData(Object.values(aggregatedData));
  };

  const handleRowClick = (joNo) => {
    navigate(`/stock-details?joNo=${encodeURIComponent(joNo)}`);
  };

  const handleRedirect = (path) => {
    navigate(path);
  };

  return (
    <div className="">
        <WIPHeader/>
    <div className="container mt-4">
      <style>{`
        .table td {
          font-size: 14px;
          padding: 6px 10px;
          vertical-align: middle;
          white-space: normal;
          text-align: left;
        }
        .table th {
          font-size: 15px;
          padding: 13px 10px;
          text-align: start;
          white-space: nowrap;
          font-family: fangsong;
          background-color: darkgray !important;
        }
        h1 {
          font-family: fangsong;
          font-weight: bold;
        }
        #backToTopBtn {
          display: none;
          position: fixed;
          bottom: 20px;
          right: 20px;
          z-index: 99;
          font-size: 13px;
          background-color: #333;
          color: white;
          border: none;
          border-radius: 20px;
          padding: 10px 15px;
          cursor: pointer;
          box-shadow: 0 2px 5px rgba(0, 0, 0, 0.2);
          transition: background-color 0.3s;
        }
        #backToTopBtn:hover {
          background-color: #555;
        }
        @media (max-width: 768px) {
          #backToTopBtn {
            display: none !important;
          }
        }
        .btn-secondary {
          margin-top: -35px;
          margin-right: 5px;
          text-decoration: none;
        }
      `}</style>

      <h1>Stock Management</h1>
      <div className="d-flex justify-content-end mb-3">
        <button
          className="btn btn-secondary"
          onClick={() => handleRedirect("/rm-shortage")}
        >
          RM Shortage →
        </button>
        <button
          className="btn btn-secondary"
          onClick={() => handleRedirect("/box-rm-shortage")}
        >
          BOX RM Shortage →
        </button>
      </div>
      <div className="table-responsive">
        <table className="table table-bordered table-striped">
          <thead>
            <tr>
              <th>Sr No</th>
              <th>Job Order No</th>
              <th>Job Order Date</th>
              <th>Quantity Shortage</th>
              <th>Quantity Status</th>
            </tr>
          </thead>
          <tbody>
            {stockData.map((row, index) => {
              const quantityShortage = row.quantityShortage ?? 0;
              const shortage = row.shortage ?? 0;

              let statusText, statusClass;
              if (quantityShortage !== 0) {
                statusText = "Shortage";
                statusClass = "text-danger";
              } else if (quantityShortage === 0 && shortage !== 0) {
                statusText = "Potential Shortage";
                statusClass = "text-warning";
              } else {
                statusText = "Satisfied";
                statusClass = "text-success";
              }

              return (
                <tr key={index} onClick={() => handleRowClick(row.joNo)}>
                  <td>{index + 1}</td>
                  <td>
                    <a href={`/stock-details?joNo=${encodeURIComponent(row.joNo)}`}>
                      {row.joNo}
                    </a>
                  </td>
                  <td>
                    {row.joDate
                      ? new Date(row.joDate).toLocaleDateString()
                      : "Invalid Date"}
                  </td>
                  <td>{quantityShortage.toFixed(2)}</td>
                  <td className={statusClass}>{statusText}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
    </div>
  );
};

export default Stock;
