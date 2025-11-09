// src/App.jsx
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Link, useNavigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';

import Login from './components/auth/Login';
import Register from './components/auth/Register';

import Dashboard from './pages/Dashboard';
import Profile from './pages/Profile';
import Users from './pages/Users';
import UserProfile from './pages/UserProfile';
import Connections from './pages/Connections';
import Messages from './pages/Messages';

import JobsList from './pages/JobsList';
import JobDetail from './pages/JobDetail';
import PostJob from './pages/PostJob';
import MyJobs from './pages/MyJobs';
import MyApplications from './pages/MyApplications';
import JobApplicants from './pages/JobApplicants'; 

import './App.css';

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }
  return user ? children : <Navigate to="/login" replace />;
};

const PublicRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }
  return !user ? children : <Navigate to="/dashboard" replace />;
};

function Nav() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  if (!user) return null;

  const handleLogout = () => {
    logout?.();
    navigate('/login', { replace: true });
  };

  return (
    <nav className="w-full bg-white border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-12 flex items-center justify-between">
        <div className="flex items-center gap-4 text-sm">
          <Link to="/dashboard" className="text-xl font-extrabold tracking-tight mr-4">
            UILinkUp
          </Link>
          <Link to="/dashboard" className="hover:text-blue-600">Dashboard</Link>
          <Link to="/users" className="hover:text-blue-600">Users</Link>
          <Link to="/connections" className="hover:text-blue-600">Connections</Link>
          <Link to="/messages" className="hover:text-blue-600">Messages</Link>
          <span className="mx-2 text-gray-300">|</span>
          <Link to="/jobs" className="hover:text-blue-600 font-medium">Jobs</Link>
          <Link to="/jobs/new" className="hover:text-blue-600">Post Job</Link>
          <Link to="/jobs/me/posted" className="hover:text-blue-600">My Posted Jobs</Link>
          <Link to="/jobs/me/applied" className="hover:text-blue-600">My Applications</Link>
        </div>
        <div className="flex items-center gap-3">
          <Link to="/profile" className="text-sm text-gray-700 hover:text-blue-600">
            {user?.name || 'Profile'}
          </Link>
          <button
            onClick={handleLogout}
            className="text-sm px-3 py-1.5 rounded bg-gray-100 hover:bg-gray-200"
          >
            Logout
          </button>
        </div>
      </div>
    </nav>
  );
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <Nav />
        <Routes>
          <Route
            path="/login"
            element={
              <PublicRoute>
                <Login />
              </PublicRoute>
            }
          />
          <Route
            path="/register"
            element={
              <PublicRoute>
                <Register />
              </PublicRoute>
            }
          />

          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            }
          />
          <Route
            path="/users"
            element={
              <ProtectedRoute>
                <Users />
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile/:userId"
            element={
              <ProtectedRoute>
                <UserProfile />
              </ProtectedRoute>
            }
          />
          <Route
            path="/connections"
            element={
              <ProtectedRoute>
                <Connections />
              </ProtectedRoute>
            }
          />
          <Route
            path="/messages"
            element={
              <ProtectedRoute>
                <Messages />
              </ProtectedRoute>
            }
          />

          {/* Jobs List */}
          <Route
            path="/jobs"
            element={
              <ProtectedRoute>
                <JobsList />
              </ProtectedRoute>
            }
          />

          {/* Post Job */}
          <Route
            path="/jobs/new"
            element={
              <ProtectedRoute>
                <PostJob />
              </ProtectedRoute>
            }
          />

          {/* MUST COME FIRST */}
          <Route
            path="/jobs/:jobId/applicants"
            element={
              <ProtectedRoute>
                <JobApplicants />
              </ProtectedRoute>
            }
          />

          {/* Job Detail */}
          <Route
            path="/jobs/:jobId"
            element={
              <ProtectedRoute>
                <JobDetail />
              </ProtectedRoute>
            }
          />

          {/* My posted jobs */}
          <Route
            path="/jobs/me/posted"
            element={
              <ProtectedRoute>
                <MyJobs />
              </ProtectedRoute>
            }
          />

          {/* My applications */}
          <Route
            path="/jobs/me/applied"
            element={
              <ProtectedRoute>
                <MyApplications />
              </ProtectedRoute>
            }
          />

          <Route path="/" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
