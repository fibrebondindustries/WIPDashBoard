// import React, { useContext } from 'react';
// import { useNavigate } from 'react-router-dom';
// import axiosInstance from '../axiosConfig';
// import { AuthContext } from '../AuthContext';

// function UserDashboard() {
//     const { user, logout } = useContext(AuthContext);
//     const navigate = useNavigate();


//     const getISTTime = () => {
//         const now = new Date();
//         // Convert the time to IST
//         const offset = 5.5 * 60 * 60 * 1000; // IST is UTC + 5:30
//         const istTime = new Date(now.getTime() + offset);
//         return istTime.toISOString().replace('T', ' ').slice(0, 19); // Format as 'YYYY-MM-DD HH:MM:SS'
//     };

    
//     const handleLogout = async () => {
//         const logoutTime = getISTTime(); // Use IST time
//         const loginTime = localStorage.getItem('loginTime');

//         try {
//             // Send login and logout times to the server
//             await axiosInstance.post('/api/userActivity', {
//                 EmployeeID: user?.EmployeeID,
//                 loginTime,
//                 logoutTime,
//             });

//             // Clear local storage and context
//             localStorage.removeItem('loginTime');
//             localStorage.removeItem('user');
//             // login(null); // Clear user data in AuthContext
//             // Clear AuthContext and localStorage
//             logout();
//             // Redirect to login page
//             navigate('/');
//         } catch (err) {
//             console.error('Error logging out:', err);
//         }
//     };

//     return (
//         <div>
//             <h1>Welcome, {user?.Name}!</h1>
//             <p>Employee ID: {user?.EmployeeID}</p>
//             <button className="btn btn-danger mt-3" onClick={handleLogout}>
//                 Logout
//             </button>
//         </div>
//     );
// }

// export default UserDashboard;



import React, { useContext, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../axiosConfig';
import { AuthContext } from '../AuthContext';

function UserDashboard() {
    const { user, logout } = useContext(AuthContext);
    const navigate = useNavigate();

    const getISTTime = () => {
        const now = new Date();
        // Convert the time to IST
        const offset = 5.5 * 60 * 60 * 1000; // IST is UTC + 5:30
        const istTime = new Date(now.getTime() + offset);
        return istTime.toISOString().replace('T', ' ').slice(0, 19); // Format as 'YYYY-MM-DD HH:MM:SS'
    };

    // Wrap handleLogout in useCallback to avoid redefinition on every render
    const handleLogout = useCallback(async () => {
        const logoutTime = getISTTime(); // Use IST time
        const loginTime = localStorage.getItem('loginTime');

        try {
            // Send login and logout times to the server
            await axiosInstance.post('/api/userActivity', {
                EmployeeID: user?.EmployeeID,
                loginTime,
                logoutTime,
            });

            // Clear local storage and context
            localStorage.removeItem('loginTime');
            localStorage.removeItem('user');
            logout();
            navigate('/'); // Redirect to login page
        } catch (err) {
            console.error('Error logging out:', err);
        }
    }, [logout, navigate, user?.EmployeeID]);

    // useEffect(() => {
    //     const sessionExpiration = localStorage.getItem('sessionExpiration');
    //     const currentTime = new Date();

    //     if (!sessionExpiration || currentTime > new Date(sessionExpiration)) {
    //         handleLogout(); // Automatically logout if session expires
    //     }
    // }, [handleLogout]); // Now handleLogout is stable due to useCallback

    useEffect(() => {
        const checkSessionExpiration = () => {
            const sessionExpiration = localStorage.getItem('sessionExpiration');
            const currentTime = new Date();

            if (!sessionExpiration || currentTime > new Date(sessionExpiration)) {
                handleLogout(); // Automatically logout if session expires
                window.location.reload(); // Reload the page after logout
            }
        };

        // Check session expiration immediately
        checkSessionExpiration();

        // Optionally, check periodically (e.g., every 5 seconds)
        const interval = setInterval(checkSessionExpiration, 5000);

        return () => clearInterval(interval); // Cleanup interval on unmount
    }, [handleLogout]);

    return (
        <div>
            <h1>Welcome, {user?.Name}!</h1>
            <p>Employee ID: {user?.EmployeeID}</p>
            <button className="btn btn-danger mt-3" onClick={handleLogout}>
                Logout
            </button>
        </div>
    );
}

export default UserDashboard;
