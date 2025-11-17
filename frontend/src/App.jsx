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

// === GROUP / FORUM PAGES (pastikan file-file ini ada) ===
import Groups from './pages/Groups'; // list groups + mungkin quick actions
import GroupDetail from './pages/GroupDetail'; // detail 1 group + posts overview
import GroupFeed from './pages/GroupFeed'; // global forum feed
import GroupPostDetail from './pages/GroupPostDetail'; // detail satu post & replies
import GroupMembers from './pages/GroupMembers';

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
      <div className="max-w-7xl mx-auto px-4 h-12 flex items-center justify-between">
        {/* LEFT */}
        <div className="flex items-center gap-6 text-sm">
          <Link
            to="/dashboard"
            className="text-xl font-extrabold tracking-tight"
          >
            UILinkUp
          </Link>

          <Link to="/dashboard" className="hover:text-blue-600">
            Dashboard
          </Link>
          <Link to="/users" className="hover:text-blue-600">
            Users
          </Link>
          <Link to="/connections" className="hover:text-blue-600">
            Connections
          </Link>
          <Link to="/messages" className="hover:text-blue-600">
            Messages
          </Link>

          {/* JOBS DROPDOWN */}
          <div className="relative group">
            <span className="cursor-pointer hover:text-blue-600 font-medium">
              Jobs ▾
            </span>

            <div
              className="absolute left-0 mt-2 w-48 bg-white border rounded shadow-lg 
                            opacity-0 invisible group-hover:opacity-100 group-hover:visible 
                            transition-all duration-150 z-20"
            >
              <Link
                to="/jobs"
                className="block px-3 py-2 hover:bg-gray-50 text-sm"
              >
                Jobs List
              </Link>
              <Link
                to="/jobs/new"
                className="block px-3 py-2 hover:bg-gray-50 text-sm"
              >
                Post Job
              </Link>
              <Link
                to="/jobs/me/posted"
                className="block px-3 py-2 hover:bg-gray-50 text-sm"
              >
                My Posted Jobs
              </Link>
              <Link
                to="/jobs/me/applied"
                className="block px-3 py-2 hover:bg-gray-50 text-sm"
              >
                My Applications
              </Link>
            </div>
          </div>

          {/* EVENTS DROPDOWN */}
          <div className="relative group">
            <span className="cursor-pointer hover:text-blue-600 font-medium">
              Events ▾
            </span>

            <div
              className="absolute left-0 mt-2 w-44 bg-white border rounded shadow-lg 
                            opacity-0 invisible group-hover:opacity-100 group-hover:visible 
                            transition-all duration-150 z-20"
            >
              <Link
                to="/events"
                className="block px-3 py-2 hover:bg-gray-50 text-sm"
              >
                Events List
              </Link>
              <Link
                to="/events/new"
                className="block px-3 py-2 hover:bg-gray-50 text-sm"
              >
                Create Event
              </Link>
              <Link
                to="/events/me"
                className="block px-3 py-2 hover:bg-gray-50 text-sm"
              >
                My Events
              </Link>
            </div>
          </div>

          {/* GROUPS / FORUM DROPDOWN */}
          <div className="relative group">
            <span className="cursor-pointer hover:text-blue-600 font-medium">
              Groups & Forum ▾
            </span>

            <div
              className="absolute left-0 mt-2 w-52 bg-white border rounded shadow-lg 
                            opacity-0 invisible group-hover:opacity-100 group-hover:visible 
                            transition-all duration-150 z-20"
            >
              <Link
                to="/groups"
                className="block px-3 py-2 hover:bg-gray-50 text-sm"
              >
                Groups Directory
              </Link>
              <Link
                to="/groups/feed"
                className="block px-3 py-2 hover:bg-gray-50 text-sm"
              >
                Forum Feed
              </Link>
            </div>
          </div>
        </div>

        {/* RIGHT */}
        <div className="flex items-center gap-3">
          <Link
            to="/profile"
            className="text-sm text-gray-700 hover:text-blue-600"
          >
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
          {/* MUST COME FIRST: applicants route */}
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
