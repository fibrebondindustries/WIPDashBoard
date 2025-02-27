import React, { useState, useContext, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axiosInstance from "../axiosConfig";
import { AuthContext } from "../AuthContext";
import "../assets/CSS/login.css";
import loginLogo from "../assets/Img/loginLogo.png";

function Login() {
  const [formData, setFormData] = useState({
    identifier: "", // Can be Email or EmployeeID
    Password: "",
  });
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const { login } = useContext(AuthContext); // Use AuthContext
  const [capsLockOn, setCapsLockOn] = useState(false); // Track Caps Lock
  // Redirect users if they are already logged in
  useEffect(() => {
    const loginTime = localStorage.getItem("loginTime");
    const userData = JSON.parse(localStorage.getItem("userData"));

    if (loginTime && userData) {
      // Check user role and redirect accordingly
      if (userData.Auth === "User") {
        navigate("/User-dashboard");
      } else if (userData.Auth === "Admin") {
        navigate("/Main-dashboard");
      }
    }
  }, [navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleKeyDown = (e) => {
    setCapsLockOn(e.getModifierState("CapsLock"));
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
      // //   Check for active session using /presentEmployees API
      // const activeSessionResponse = await axiosInstance.get("/api/presentEmployees");
      // const activeEmployees = activeSessionResponse.data;

      // // Check if the entered identifier exists in the list of active employees
      // const isActive = activeEmployees.some(
      //   (employee) => employee.EmployeeID === formData.identifier
      // );

      // if (isActive) {
      //   showAlert("This user is already logged in. Please log out first.", "danger");
      //   return; // Stop further processing
      // }
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

      // setTimeout(() => {
      //   // Redirect based on the user's role
      //   if (userData.Auth === "User") {
      //     navigate("/User-dashboard");
      //   } else {
      //     navigate("/Main-dashboard");
      //   }
      // }, 2000);
      setTimeout(() => {
        if (userData.Auth === "User") {
            navigate("/User-dashboard");
        } else if (userData.Auth === "Admin") {
            navigate("/Main-dashboard");
        } else if (userData.Auth === "Supervisor") {
            navigate("/Main-dashboard"); // Redirect Supervisor to TicketHome
        }else if (userData.Auth === "SuperAdmin") {
          navigate("/Main-dashboard"); // Redirect Supervisor to TicketHome
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

  const handleRedirect = () => {
    navigate("/wip-login");  // Redirects to the other login page
  };

  return (   
    <div className="">
       <button 
          className="btn btn-secondary btn-sm"
          style={{ position: "absolute", top: "10px", right: "10px" }} 
          onClick={handleRedirect}
        >
         RM  →
        </button>
    <div className="login-container">
      <div id="alertPlaceholder"></div> {/* Placeholder for alerts */}
      <div className="login-card">
        {/* <h2>Login</h2> */}
        <img
          src={loginLogo}
          class="img-fluid rounded-circle mb-2"
          alt="Logo"
          style={{height:"65px", width:"65px"}}
        />
        

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
            onKeyDown={handleKeyDown}  // Check Caps Lock state
            required
          />
           {/* Show warning if Caps Lock is ON */}
           {capsLockOn && (
            <p style={{ color: "red", fontSize: "12px", marginTop: "5px" }}>
              ⚠️ Caps Lock is ON!
            </p>
          )}
          <button type="submit">Login</button>
        </form>
      </div>
        {/* New Button for Redirecting to /wip-login */}
        
    </div>
    </div>
  );
}

export default Login;
