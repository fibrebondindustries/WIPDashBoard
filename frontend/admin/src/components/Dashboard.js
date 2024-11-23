import React, { useContext } from 'react';
import { AuthContext } from '../AuthContext';

function Dashboard() {
    const { user, logout } = useContext(AuthContext);

    return (
        <div>
            <h1>Welcome, {user?.Name}!</h1>
            <p>Email: {user?.Email}</p>
            <button className="btn btn-danger mt-3" onClick={logout}>
                Logout
            </button>
        </div>
    );
}

export default Dashboard;
