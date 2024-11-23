// import { createContext, useState } from 'react';

// export const AuthContext = createContext();

// export const AuthProvider = ({ children }) => {
//     const [user, setUser] = useState(null);

//     const login = (userData) => {
//         setUser(userData);
//         localStorage.setItem('user', JSON.stringify(userData));
//     };

//     const logout = () => {
//         setUser(null);
//         localStorage.removeItem('user');
//     };

//     return (
//         <AuthContext.Provider value={{ user, login, logout }}>
//             {children}
//         </AuthContext.Provider>
//     );
// };


// import React, { createContext, useState } from 'react';

// export const AuthContext = createContext();

// export const AuthProvider = ({ children }) => {
//     const [user, setUser] = useState(() => {
//         // Retrieve the user from local storage if it exists
//         const savedUser = localStorage.getItem('user');
//         return savedUser ? JSON.parse(savedUser) : null;
//     });

//     const login = (userData) => {
//         // Save only required fields in local storage
//         const { Name, Email, EmployeeID } = userData;
//         const minimalUser = { Name, Email, EmployeeID };
//         setUser(minimalUser);
//         localStorage.setItem('user', JSON.stringify(minimalUser)); // Save only minimal data in local storage
//     };

//     const logout = () => {
//         setUser(null);
//         localStorage.removeItem('user'); // Remove user from local storage
//     };

//     return (
//         <AuthContext.Provider value={{ user, login, logout }}>
//             {children}
//         </AuthContext.Provider>
//     );
// };


import React, { createContext, useState, useEffect } from 'react';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(() => {
        const savedUser = localStorage.getItem('user');
        return savedUser ? JSON.parse(savedUser) : null;
    });

    const login = (userData) => {
        const { Name, Email, EmployeeID } = userData;
        const minimalUser = { Name, Email, EmployeeID, Auth: userData.Auth }; // Include Auth for routing
        setUser(minimalUser);
        localStorage.setItem('user', JSON.stringify(minimalUser));
    };

    const logout = () => {
        setUser(null);
        localStorage.removeItem('user');
        localStorage.removeItem('loginTime'); // Remove login time
    };

    useEffect(() => {
        // Check if the user session is valid (optional for advanced session expiration handling)
        const loginTime = localStorage.getItem('loginTime');
        if (loginTime) {
            const timeElapsed = new Date() - new Date(loginTime);
            const sessionDuration = 24 * 60 * 60 * 1000; // Example: 24 hours
            if (timeElapsed > sessionDuration) {
                logout(); // Clear session if expired
            }
        }
    }, []); // Run only once on mount

    return (
        <AuthContext.Provider value={{ user, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
};
