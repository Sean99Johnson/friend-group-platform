import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';

// Auth Components
import ProtectedRoute from './components/auth/ProtectedRoute';

// Layout Components
import Layout from './components/layout/Layout';

// Pages
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Profile from './pages/Profile';

// Placeholder pages (to be built in later phases)
const PlaceholderPage = ({ title }) => (
  <div className="text-center py-12">
    <h1 className="text-3xl font-bold text-gray-900 mb-4">{title}</h1>
    <p className="text-gray-600">This page will be built in a future development phase.</p>
  </div>
);

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="App">
          <Routes>
            {/* Public Routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />

            {/* Protected Routes */}
            <Route path="/" element={
              <ProtectedRoute>
                <Layout>
                  <Navigate to="/dashboard" replace />
                </Layout>
              </ProtectedRoute>
            } />
            
            <Route path="/dashboard" element={
              <ProtectedRoute>
                <Layout>
                  <Dashboard />
                </Layout>
              </ProtectedRoute>
            } />

            <Route path="/profile" element={
              <ProtectedRoute>
                <Layout>
                  <Profile />
                </Layout>
              </ProtectedRoute>
            } />

            {/* Placeholder routes for future development */}
            <Route path="/groups" element={
              <ProtectedRoute>
                <Layout>
                  <PlaceholderPage title="Groups" />
                </Layout>
              </ProtectedRoute>
            } />

            <Route path="/groups/create" element={
              <ProtectedRoute>
                <Layout>
                  <PlaceholderPage title="Create Group" />
                </Layout>
              </ProtectedRoute>
            } />

            <Route path="/events" element={
              <ProtectedRoute>
                <Layout>
                  <PlaceholderPage title="Events" />
                </Layout>
              </ProtectedRoute>
            } />

            <Route path="/events/create" element={
              <ProtectedRoute>
                <Layout>
                  <PlaceholderPage title="Create Event" />
                </Layout>
              </ProtectedRoute>
            } />

            <Route path="/leaderboard" element={
              <ProtectedRoute>
                <Layout>
                  <PlaceholderPage title="Leaderboard" />
                </Layout>
              </ProtectedRoute>
            } />

            <Route path="/settings" element={
              <ProtectedRoute>
                <Layout>
                  <PlaceholderPage title="Settings" />
                </Layout>
              </ProtectedRoute>
            } />

            {/* Catch all route */}
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;