import React from 'react';
import {  Routes, Route, BrowserRouter } from 'react-router-dom';
import Login from './components/Login';
// import Signup from './components/Signup';
import Dashboard from './pages/Dashboard';
import ProtectedRoute from './ProtectedRoute';
import UserDashboard from './components/UserDashboard';
import UserManagement from "./pages/UserManagement";
import Department from './pages/Department'
import Workers from './pages/Workers';
import WIPLogin from './WIP/Login'; // Importing the new Login component
import WIPDashboard from './WIP/WIPHome';

function App() {
    return (
        <BrowserRouter>
            <div className="">
                <Routes>
                    {/* Define all your routes */}
                    <Route path="/" element={<Login />} />
                    {/* <Route path="/signup" element={<Signup />} /> */}
                    <Route
                        path="/Admin-dashboard"
                        element={
                            <ProtectedRoute>
                                <Dashboard />
                            </ProtectedRoute>
                        }
                    />
                     <Route
                        path="/User-dashboard"
                        element={
                            <ProtectedRoute>
                                <UserDashboard />
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/users"
                        element={
                            <ProtectedRoute>
                                <UserManagement  />
                            </ProtectedRoute>
                        }
                    />
                     <Route
                        path="/department"
                        element={
                            <ProtectedRoute>
                                <Department  />
                            </ProtectedRoute>
                        }
                    />
                     <Route
                        path="/workers"
                        element={
                            <ProtectedRoute>
                                <Workers  />
                            </ProtectedRoute>
                        }
                    />
                      {/* New Routes for WIP */}
                      <Route path="/wip-login" element={<WIPLogin />} />
                      <Route path="/wip-dashboard" element={<WIPDashboard />} />

                </Routes>
            </div>
        </BrowserRouter>
    );
}

export default App;
