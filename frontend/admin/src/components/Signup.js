import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../axiosConfig'; // Import Axios instance


function Signup() {
    const [formData, setFormData] = useState({
        Name: '',
        Email: '',
        Mobile: '',
        Password: '',
        Auth: '',
        EmployeeID: '',
    });
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const response = await axiosInstance.post('/api/signup', formData); // Use Axios instance
            alert(response.data.message); // Success message
            navigate('/'); // Redirect to Login page
        } catch (err) {
            setError(err.response?.data?.error || 'Something went wrong');
        }
    };

    return (
        <div className="card">
            <div className="card-body">
                <h2 className="text-center">Signup</h2>
                {error && <div className="alert alert-danger">{error}</div>}
                <form onSubmit={handleSubmit}>
                    <div className="mb-3">
                        <label>Name</label>
                        <input
                            type="text"
                            className="form-control"
                            name="Name"
                            value={formData.Name}
                            onChange={handleChange}
                            required
                        />
                    </div>
                    <div className="mb-3">
                        <label>Email</label>
                        <input
                            type="email"
                            className="form-control"
                            name="Email"
                            value={formData.Email}
                            onChange={handleChange}
                            required
                        />
                    </div>
                    <div className="mb-3">
                        <label>Mobile</label>
                        <input
                            type="text"
                            className="form-control"
                            name="Mobile"
                            value={formData.Mobile}
                            onChange={handleChange}
                            required
                        />
                    </div>
                    <div className="mb-3">
                        <label>Password</label>
                        <input
                            type="password"
                            className="form-control"
                            name="Password"
                            value={formData.Password}
                            onChange={handleChange}
                            required
                        />
                    </div>
                    <div className="mb-3">
                        <label>Auth</label>
                        <input
                            type="text"
                            className="form-control"
                            name="Auth"
                            value={formData.Auth}
                            onChange={handleChange}
                            required
                        />
                    </div>
                    <div className="mb-3">
                        <label>Employee ID</label>
                        <input
                            type="text"
                            className="form-control"
                            name="EmployeeID"
                            value={formData.EmployeeID}
                            onChange={handleChange}
                            required
                        />
                    </div>
                    <button type="submit" className="btn btn-primary w-100">
                        Signup
                    </button>
                </form>
            </div>
        </div>
    );
}

export default Signup;
