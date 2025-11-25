// src/App.jsx
import React from 'react';
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  Link,
  useNavigate,
} from 'react-router-dom';
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

import EventsList from './pages/EventsList';
import EventDetail from './pages/EventDetail';
import PostEvent from './pages/PostEvent';
import MyEvents from './pages/MyEvents';
import EventRegistrants from './pages/EventRegistrants';

// === GROUP / FORUM PAGES ===
import Groups from './pages/Groups';
import GroupDetail from './pages/GroupDetail';
import GroupFeed from './pages/GroupFeed';
import GroupPostDetail from './pages/GroupPostDetail';
import GroupMembers from './pages/GroupMembers';

import './App.css';

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-black to-gray-900">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-400"></div>
      </div>
    );
  }
  return user ? children : <Navigate to="/login" replace />;
};

const PublicRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-black to-gray-900">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-400"></div>
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
    <nav className="w-full bg-gradient-to-r from-gray-900 to-black border-b border-yellow-500/30 shadow-lg">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
        {/* LEFT */}
        <div className="flex items-center gap-8 text-sm">
          <Link
            to="/dashboard"
            className="text-2xl font-extrabold tracking-tight gradient-text-blue-yellow hover:scale-105 transition-transform duration-200"
          >
            UILinkUp
          </Link>

          <div className="flex items-center gap-6">
            <Link 
              to="/dashboard" 
              className="text-gray-300 hover:text-yellow-400 transition-colors duration-200 font-medium flex items-center gap-2 group"
            >
              <div className="w-2 h-2 bg-blue-400 rounded-full group-hover:bg-yellow-400 transition-colors"></div>
              Dashboard
            </Link>
            
            <Link 
              to="/users" 
              className="text-gray-300 hover:text-yellow-400 transition-colors duration-200 font-medium flex items-center gap-2 group"
            >
              <div className="w-2 h-2 bg-blue-400 rounded-full group-hover:bg-yellow-400 transition-colors"></div>
              Users
            </Link>
            
            <Link 
              to="/connections" 
              className="text-gray-300 hover:text-yellow-400 transition-colors duration-200 font-medium flex items-center gap-2 group"
            >
              <div className="w-2 h-2 bg-blue-400 rounded-full group-hover:bg-yellow-400 transition-colors"></div>
              Connections
            </Link>
            
            <Link 
              to="/messages" 
              className="text-gray-300 hover:text-yellow-400 transition-colors duration-200 font-medium flex items-center gap-2 group"
            >
              <div className="w-2 h-2 bg-blue-400 rounded-full group-hover:bg-yellow-400 transition-colors"></div>
              Messages
            </Link>

            {/* JOBS DROPDOWN */}
            <div className="relative group">
              <span className="text-gray-300 hover:text-yellow-400 transition-colors duration-200 font-medium cursor-pointer flex items-center gap-2">
                <div className="w-2 h-2 bg-blue-400 rounded-full group-hover:bg-yellow-400 transition-colors"></div>
                Jobs ▾
              </span>

              <div
                className="absolute left-0 mt-3 w-56 bg-gray-800 border border-yellow-500/30 rounded-xl shadow-2xl 
                            opacity-0 invisible group-hover:opacity-100 group-hover:visible 
                            transition-all duration-200 z-50 backdrop-blur-sm"
              >
                <Link
                  to="/jobs"
                  className="block px-4 py-3 hover:bg-yellow-500/10 text-gray-300 hover:text-yellow-400 transition-all duration-200 border-b border-gray-700 first:rounded-t-xl"
                >
                  🔍 Jobs List
                </Link>
                <Link
                  to="/jobs/new"
                  className="block px-4 py-3 hover:bg-yellow-500/10 text-gray-300 hover:text-yellow-400 transition-all duration-200 border-b border-gray-700"
                >
                  💼 Post Job
                </Link>
                <Link
                  to="/jobs/me/posted"
                  className="block px-4 py-3 hover:bg-yellow-500/10 text-gray-300 hover:text-yellow-400 transition-all duration-200 border-b border-gray-700"
                >
                  📋 My Posted Jobs
                </Link>
                <Link
                  to="/jobs/me/applied"
                  className="block px-4 py-3 hover:bg-yellow-500/10 text-gray-300 hover:text-yellow-400 transition-all duration-200 last:rounded-b-xl"
                >
                  📄 My Applications
                </Link>
              </div>
            </div>

            {/* EVENTS DROPDOWN */}
            <div className="relative group">
              <span className="text-gray-300 hover:text-yellow-400 transition-colors duration-200 font-medium cursor-pointer flex items-center gap-2">
                <div className="w-2 h-2 bg-blue-400 rounded-full group-hover:bg-yellow-400 transition-colors"></div>
                Events ▾
              </span>

              <div
                className="absolute left-0 mt-3 w-52 bg-gray-800 border border-yellow-500/30 rounded-xl shadow-2xl 
                            opacity-0 invisible group-hover:opacity-100 group-hover:visible 
                            transition-all duration-200 z-50 backdrop-blur-sm"
              >
                <Link
                  to="/events"
                  className="block px-4 py-3 hover:bg-yellow-500/10 text-gray-300 hover:text-yellow-400 transition-all duration-200 border-b border-gray-700 first:rounded-t-xl"
                >
                  📅 Events List
                </Link>
                <Link
                  to="/events/new"
                  className="block px-4 py-3 hover:bg-yellow-500/10 text-gray-300 hover:text-yellow-400 transition-all duration-200 border-b border-gray-700"
                >
                  🎉 Create Event
                </Link>
                <Link
                  to="/events/me"
                  className="block px-4 py-3 hover:bg-yellow-500/10 text-gray-300 hover:text-yellow-400 transition-all duration-200 last:rounded-b-xl"
                >
                  👤 My Events
                </Link>
              </div>
            </div>

            {/* GROUPS / FORUM DROPDOWN */}
            <div className="relative group">
              <span className="text-gray-300 hover:text-yellow-400 transition-colors duration-200 font-medium cursor-pointer flex items-center gap-2">
                <div className="w-2 h-2 bg-blue-400 rounded-full group-hover:bg-yellow-400 transition-colors"></div>
                Groups & Forum ▾
              </span>

              <div
                className="absolute left-0 mt-3 w-56 bg-gray-800 border border-yellow-500/30 rounded-xl shadow-2xl 
                            opacity-0 invisible group-hover:opacity-100 group-hover:visible 
                            transition-all duration-200 z-50 backdrop-blur-sm"
              >
                <Link
                  to="/groups"
                  className="block px-4 py-3 hover:bg-yellow-500/10 text-gray-300 hover:text-yellow-400 transition-all duration-200 border-b border-gray-700 first:rounded-t-xl"
                >
                  👥 Groups Directory
                </Link>
                <Link
                  to="/groups/feed"
                  className="block px-4 py-3 hover:bg-yellow-500/10 text-gray-300 hover:text-yellow-400 transition-all duration-200 last:rounded-b-xl"
                >
                  💬 Forum Feed
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3 bg-gray-800/50 px-4 py-2 rounded-xl border border-yellow-500/20">
            <div className="w-8 h-8 bg-gradient-to-br from-yellow-400 to-yellow-500 rounded-full flex items-center justify-center text-black font-bold text-sm">
              {(user?.name || 'U').charAt(0).toUpperCase()}
            </div>
            <Link
              to="/profile"
              className="text-sm text-gray-300 hover:text-yellow-400 transition-colors duration-200 font-medium"
            >
              {user?.name || 'Profile'}
            </Link>
          </div>
          
          <button
            onClick={handleLogout}
            className="text-sm px-4 py-2 rounded-xl bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white font-medium transition-all duration-200 shadow-lg hover:shadow-xl hover:scale-105 flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
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
          {/* AUTH */}
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

          {/* CORE PAGES */}
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

          {/* JOBS */}
          <Route
            path="/jobs"
            element={
              <ProtectedRoute>
                <JobsList />
              </ProtectedRoute>
            }
          />
          <Route
            path="/jobs/new"
            element={
              <ProtectedRoute>
                <PostJob />
              </ProtectedRoute>
            }
          />
          <Route
            path="/jobs/:jobId/applicants"
            element={
              <ProtectedRoute>
                <JobApplicants />
              </ProtectedRoute>
            }
          />
          <Route
            path="/jobs/:jobId"
            element={
              <ProtectedRoute>
                <JobDetail />
              </ProtectedRoute>
            }
          />
          <Route
            path="/jobs/me/posted"
            element={
              <ProtectedRoute>
                <MyJobs />
              </ProtectedRoute>
            }
          />
          <Route
            path="/jobs/me/applied"
            element={
              <ProtectedRoute>
                <MyApplications />
              </ProtectedRoute>
            }
          />

          {/* EVENTS */}
          <Route
            path="/events"
            element={
              <ProtectedRoute>
                <EventsList />
              </ProtectedRoute>
            }
          />
          <Route
            path="/events/new"
            element={
              <ProtectedRoute>
                <PostEvent />
              </ProtectedRoute>
            }
          />
          <Route
            path="/events/:eventId"
            element={
              <ProtectedRoute>
                <EventDetail />
              </ProtectedRoute>
            }
          />
          <Route
            path="/events/me"
            element={
              <ProtectedRoute>
                <MyEvents />
              </ProtectedRoute>
            }
          />
          <Route
            path="/events/:eventId/registrants"
            element={
              <ProtectedRoute>
                <EventRegistrants />
              </ProtectedRoute>
            }
          />

          {/* GROUPS / FORUM */}
          <Route
            path="/groups"
            element={
              <ProtectedRoute>
                <Groups />
              </ProtectedRoute>
            }
          />
          <Route
            path="/groups/feed"
            element={
              <ProtectedRoute>
                <GroupFeed />
              </ProtectedRoute>
            }
          />
          <Route
            path="/groups/:groupId"
            element={
              <ProtectedRoute>
                <GroupDetail />
              </ProtectedRoute>
            }
          />
          <Route
            path="/groups/:groupId/posts/:postId"
            element={
              <ProtectedRoute>
                <GroupPostDetail />
              </ProtectedRoute>
            }
          />
          <Route
            path="/groups/:groupId/members"
            element={
              <ProtectedRoute>
                <GroupMembers />
              </ProtectedRoute>
            }
          />

          {/* ROOT */}
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;