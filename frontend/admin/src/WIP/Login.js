import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import loginLogo from "../assets/Img/loginLogo.png";

const Login = () => {
    const [pin, setPin] = useState("");
    const [errorMessage, setErrorMessage] = useState("");
    const navigate = useNavigate();

    const handleLogin = (event) => {
        event.preventDefault();

        const correctPin1 = "112024"; // Hardcoded PIN for Admin Dashboard
        const correctPin2 = "112244"; // Hardcoded PIN for Stock Dashboard
        // const correctPin3 = "122024"; // Hardcoded PIN for Ticket Dashboard

        if (pin === correctPin1) {
            // Set session storage with a timestamp for 12 hours
            const expiryTime = Date.now() + 12 * 60 * 60 * 1000;
            sessionStorage.setItem("auth", JSON.stringify({ loggedIn: true, expiryTime }));
            navigate("/wip-dashboard"); // Redirect to Admin Dashboard
        } else if (pin === correctPin2) {
            // Set session storage with a timestamp for 12 hours
            const expiryTime = Date.now() + 12 * 60 * 60 * 1000;
            sessionStorage.setItem("auth", JSON.stringify({ loggedIn: true, expiryTime }));
            navigate("/Stock"); // Redirect to User Dashboard
        } 
        // else if (pin === correctPin3) {
        //     // Set session storage with a timestamp for 12 hours
        //     const expiryTime = Date.now() + 12 * 60 * 60 * 1000;
        //     sessionStorage.setItem("auth", JSON.stringify({ loggedIn: true, expiryTime }));
        //     navigate("/ticket-home"); // Redirect to User Dashboard
        // }
         else {
            setErrorMessage("Incorrect PIN. Try again.");
        }
    };

    // Inline styles
    const containerStyle = {
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        height: "100vh",
        backgroundColor: "#f9f9f9",
    };

    const cardStyle = {
        backgroundColor: "#fff",
        padding: "20px",
        borderRadius: "8px",
        boxShadow: "0 4px 8px rgba(0, 0, 0, 0.1)",
        textAlign: "center",
        width: "100%",
        maxWidth: "400px",
    };

    const inputStyle = {
        padding: "10px",
        marginBottom: "12px",
        border: "1px solid #ddd",
        borderRadius: "4px",
        width: "100%",
        outline: "none",
    };

    const buttonStyle = {
        backgroundColor: "#555",
        color: "#fff",
        padding: "10px",
        border: "none",
        borderRadius: "4px",
        cursor: "pointer",
        width: "100%",
        marginTop: "10px",
    };

    const errorStyle = {
        color: "red",
        marginTop: "10px",
    };

    return (
        <div style={containerStyle}>
            <div style={cardStyle}>
                 <img
                          src={loginLogo}
                          class="img-fluid rounded-circle mb-2"
                          alt="Logo"
                          style={{height:"50px", width:"50px"}}
                        />
                <h2>Enter PIN to Access</h2>
                <form onSubmit={handleLogin}>
                    <input
                        type="password"
                        placeholder="Enter PIN"
                        value={pin}
                        onChange={(e) => setPin(e.target.value)}
                        required
                        style={inputStyle}
                    />
                    <button type="submit" style={buttonStyle}>
                        Login
                    </button>
                    {errorMessage && <p style={errorStyle}>{errorMessage}</p>}
                </form>
            </div>
        </div>
    );
};

export default Login;
