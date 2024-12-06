import React, { useState, useContext, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axiosInstance from "../axiosConfig";
import { AuthContext } from "../AuthContext";
import "../assets/CSS/login.css";

function Login() {
  const [formData, setFormData] = useState({
    identifier: "", // Can be Email or EmployeeID
    Password: "",
  });
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const { login } = useContext(AuthContext); // Use AuthContext

  // Redirect users if they are already logged in
  useEffect(() => {
    const loginTime = localStorage.getItem("loginTime");
    const userData = JSON.parse(localStorage.getItem("userData"));

    if (loginTime && userData) {
      // Check user role and redirect accordingly
      if (userData.Auth === "User") {
        navigate("/User-dashboard");
      } else if (userData.Auth === "Admin") {
        navigate("/Admin-dashboard");
      }
    }
  }, [navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const getISTTime = () => {
    const now = new Date();
    // Convert the time to IST
    const offset = 5.5 * 60 * 60 * 1000; // IST is UTC + 5:30
    const istTime = new Date(now.getTime() + offset);
    return istTime.toISOString().replace("T", " ").slice(0, 19); // Format as 'YYYY-MM-DD HH:MM:SS'
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
        //03 Dec
        // Check for active session using /presentEmployees API
      const activeSessionResponse = await axiosInstance.get("/api/presentEmployees");
      const activeEmployees = activeSessionResponse.data;

      // Check if the entered identifier exists in the list of active employees
      const isActive = activeEmployees.some(
        (employee) => employee.EmployeeID === formData.identifier
      );

      if (isActive) {
        showAlert("This user is already logged in. Please log out first.", "danger");
        return; // Stop further processing
      }
      //end


      const response = await axiosInstance.post("/api/login", {
        identifier: formData.identifier,
        Password: formData.Password,
      });

      const userData = response.data.user;
      const loginTime = getISTTime(); // Use IST time

      // Save user data and login time in local storage
      localStorage.setItem("loginTime", loginTime);
      localStorage.setItem("userData", JSON.stringify(userData));
      login(userData); // Set user in AuthContext

      // Show success alert
      showAlert("Login successful! Redirecting...", "success");

      setTimeout(() => {
        // Redirect based on the user's role
        if (userData.Auth === "User") {
          navigate("/User-dashboard");
        } else {
          navigate("/Admin-dashboard");
        }
      }, 2000);
    } catch (err) {
      setError(err.response?.data?.error || "Something went wrong");
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

  return (
    <div className="login-container">
      <div id="alertPlaceholder"></div> {/* Placeholder for alerts */}
      <div className="login-card">
        <h2>Login</h2>

        {error && (
          <div style={{ color: "red", marginBottom: "10px" }}>{error}</div>
        )}
        <form className="login-form" onSubmit={handleSubmit}>
          <input
            type="text"
            id="identifier"
            name="identifier"
            placeholder="Employee ID"
            value={formData.identifier}
            onChange={handleChange}
            required
          />
          <input
            type="password"
            id="password"
            name="Password"
            placeholder="Password"
            value={formData.Password}
            onChange={handleChange}
            required
          />
          <button type="submit">Login</button>
        </form>
      </div>
    </div>
  );
}

export default Login;
