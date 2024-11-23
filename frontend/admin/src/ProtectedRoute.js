import React, { useContext } from 'react';
import { Navigate } from 'react-router-dom';
import { AuthContext } from './AuthContext';

function ProtectedRoute({ children }) {
    const { user } = useContext(AuthContext);

    if (!user) {
        return <Navigate to="/" />; // Redirect to login if not authenticated
    }

    return children;
}

export default ProtectedRoute;
