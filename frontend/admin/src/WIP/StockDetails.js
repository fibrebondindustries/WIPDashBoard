import React, { useState, useEffect, useCallback } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import axiosInstance from "../axiosConfig";
import WIPHeader from "../components/WIP-Herder";

const StockDetails = () => {
  const [details, setDetails] = useState([]);
  const [searchParams] = useSearchParams(); // Parse query params
  const joNo = searchParams.get("joNo"); // Extract `joNo` from query params
  const navigate = useNavigate();

  const fetchStockDetails = useCallback(async () => {
    if (!joNo) return; // Ensure `joNo` is present
    try {
      const response = await axiosInstance.get(`/api/stockData?joNo=${joNo}`);
      setDetails(response.data);
    } catch (error) {
      console.error("Error fetching stock details:", error);
    }
  }, [joNo]);

  useEffect(() => {
    fetchStockDetails();
  }, [fetchStockDetails]);

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


  const formatDate = (dateString) => {
    if (!dateString) return "Invalid Date";
    const [day, month, year] = dateString.split("/").map(Number);
    const parsedDate = new Date(year, month - 1, day);
    return isNaN(parsedDate)
      ? "Invalid Date"
      : parsedDate.toLocaleDateString("en-GB");
  };

  const renderRows = () => {
    return details.map((row, index) => {
      const isShortage = row.isShortage;
      const shortageValue = parseFloat(row.shortage) || 0;

      let rowClass = "";
      if (isShortage) {
        rowClass = "table-danger";
      } else if (shortageValue > 0) {
        rowClass = "table-warning";
      }

      return (
        <tr key={index} className={rowClass}>
          <td>{index + 1}</td>
          <td>{row["JO NO"]}</td>
          <td>{formatDate(row["JO DATE"])}</td>
          <td>{row["PROCESS NAME"]}</td>
          <td>{row["PRODUCT"]}</td>
          <td>{row["CLR"]}</td>
          <td>{row["ITEM NAME"]}</td>
          <td>{row["RM ITEM DESCRIPTION"]}</td>
          <td>{row["SIZE"]}</td>
          <td>{row["QUANTITY REQ-1"]}</td>
          <td>{row["STOCK IN HAND"]}</td>
        </tr>
      );
    });
  };

  return (
    <div className="">
      <WIPHeader/>
    <div className="container mt-4">
      <style>{`
        .navbar {
          box-shadow: 0 1px 5px rgba(0, 0, 0, 0.2);
          z-index: 100;
          position: sticky;
        }
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
        .btn-secondary {
          margin-bottom: 15px;
        }
      `}</style>

      <h1 className="text-center">Stock Details</h1>

      <button
        className="btn btn-secondary btn-sm"
        onClick={() => navigate(-1)}
      >
        &#8592; Back
      </button>

      <div className="table-responsive">
        <table className="table table-bordered table-striped mt-4">
          <thead>
            <tr>
              <th>Sr No</th>
              <th>JO No</th>
              <th>JO Date</th>
              <th>Process Name</th>
              <th>Product</th>
              <th>CLR</th>
              <th>Item Name</th>
              <th>RM Item Description</th>
              <th>Size</th>
              <th>Req</th>
              <th>Avail</th>
            </tr>
          </thead>
          <tbody>
            {details.length > 0 ? (
              renderRows()
            ) : (
              <tr>
                <td colSpan="11" className="text-center text-danger">
                  No Data Found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
    </div>
  );
};

export default StockDetails;
