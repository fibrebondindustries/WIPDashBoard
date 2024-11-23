import React, { useState, useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../axiosConfig';
import { AuthContext } from '../AuthContext';
import '../assets/CSS/login.css';



function Login() {
    const [redirectTimer, setRedirectTimer] = useState(120); // Timer in seconds
    const [formData, setFormData] = useState({
        identifier: '', // Can be Email or EmployeeID
        Password: '',
    });
    const [error, setError] = useState('');
    const navigate = useNavigate();
    const { user, login } = useContext(AuthContext); // Use AuthContext

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
    };

  
    // useEffect(() => {
    //     if (user) {
    //         // If a user is already logged in, redirect based on their role
    //         navigate(user.Auth === 'User' ? '/User-dashboard' : '/Admin-dashboard');
    //     }
    // }, [user, navigate]); // Dependencies ensure this runs only when `user` or `navigate` changes

    useEffect(() => {
        if (redirectTimer > 0) {
            const timer = setTimeout(() => setRedirectTimer(redirectTimer - 1), 1000); // Decrement every second
            return () => clearTimeout(timer); // Cleanup on unmount
        } else {
            // Redirect after the timer reaches 0
            if (user?.Auth === 'User') {
                navigate('/User-dashboard');
            } else {
                navigate('/Admin-dashboard');
            }
        }
    }, [redirectTimer, navigate, user]);


    const getISTTime = () => {
        const now = new Date();
        // Convert the time to IST
        const offset = 5.5 * 60 * 60 * 1000; // IST is UTC + 5:30
        const istTime = new Date(now.getTime() + offset);
        return istTime.toISOString().replace('T', ' ').slice(0, 19); // Format as 'YYYY-MM-DD HH:MM:SS'
    };

    
    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const response = await axiosInstance.post('/api/login', {
                identifier: formData.identifier,
                Password: formData.Password,
            });
            // alert(response.data.message);

            const userData = response.data.user;

            // Save user data and login time in local storage
            // const loginTime = new Date().toISOString();
            const loginTime = getISTTime(); // Use IST time

            localStorage.setItem('loginTime', loginTime);
            login(userData); // Set user in AuthContext

           // Show success alert
           showAlert('Login successful! Redirecting...', 'success');

           setTimeout(() => {
            // Redirect based on the user's role
            console.log('Redirecting now...'); // Debugging
            if (userData.Auth === 'User') {
                navigate('/User-dashboard');
            } else {
                navigate('/Admin-dashboard');
            }
        }, 2000);
        } catch (err) {
            setError(err.response?.data?.error || 'Something went wrong');
        }
    };


    const showAlert = (message, type) => {
        const alertPlaceholder = document.getElementById('alertPlaceholder');
        const alertHTML = `
            <div class="alert alert-${type} alert-dismissible fade show" role="alert">
                <strong>${type === 'success' ? 'Success!' : 'Error!'}</strong> ${message}
                <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
            </div>`;
        alertPlaceholder.innerHTML = alertHTML;
    };

    return (
        <div className="login-container">
            <div id="alertPlaceholder"></div> {/* Placeholder for alerts */}
            <div className="login-card">
                <h2>Login</h2>
                
                {error && <div style={{ color: 'red', marginBottom: '10px' }}>{error}</div>}
                <form className="login-form" onSubmit={handleSubmit}>
                    <input
                        type="text"
                        id="identifier"
                        name="identifier"
                        placeholder="Email or Employee ID"
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
