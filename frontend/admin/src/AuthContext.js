import React, { createContext, useState, useEffect } from 'react';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(() => {
        const savedUser = localStorage.getItem('user');
        return savedUser ? JSON.parse(savedUser) : null;
    });
   
    const login = (userData) => {
        const { Name, EmployeeID, Auth, Department  } = userData;
        const minimalUser = { Name, EmployeeID, Auth, Department  }; // Include Auth for routing
        setUser(minimalUser);
        localStorage.setItem('user', JSON.stringify(minimalUser));

        // Set session expiration (24 hours from now)
        const sessionExpiration = new Date(new Date().getTime() + 12 * 60 * 60 * 1000); // + 24 * 60 * 60 * 1000); // 24 hours
        localStorage.setItem('sessionExpiration', sessionExpiration.toISOString());
        // localStorage.setItem('loginTime', new Date().toISOString()); // Optional: store login time
    };

    const logout = () => {
        setUser(null);
        localStorage.removeItem('user');
        localStorage.removeItem('loginTime');
        localStorage.removeItem('sessionExpiration');
        localStorage.removeItem('userData');
    };

    useEffect(() => {
        const checkSessionExpiration = () => {
            const sessionExpiration = localStorage.getItem('sessionExpiration');
            if (!sessionExpiration) return;

            const currentTime = new Date();
            if (currentTime > new Date(sessionExpiration)) {
                logout(); // Log out if the session has expired
            }
        };

        // Check session expiration immediately
        checkSessionExpiration();

        // Optionally, set an interval to check periodically
        const interval = setInterval(checkSessionExpiration, 60 * 1000); // Every 1 minute
        return () => clearInterval(interval); // Cleanup on unmount
    }, []); // Run only once on mount

    return (
        <AuthContext.Provider value={{ user, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
};
