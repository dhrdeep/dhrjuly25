import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from './lib/queryClient';
import Layout from './components/Layout';
import HomePage from './pages/HomePage';

import DHR1Page from './pages/DHR1Page';
import DHR2Page from './pages/DHR2Page';
import VIPPage from './pages/VIPPage';
import ForumPage from './pages/ForumPage';
import UploadPage from './pages/UploadPage';
import ShopPage from './pages/ShopPage';
import SimpleAdminPage from './pages/SimpleAdminPage';
import AdminDashboard from './pages/AdminDashboard';
import AdminTestPage from './pages/AdminTestPage';
import VIPAdminPage from './pages/VIPAdminPage';
import BulkImportPage from './pages/BulkImportPage';
import StorageSetupPage from './pages/StorageSetupPage';
import UserManagementPage from './pages/UserManagementPage';
import PlayerPopoutPage from './pages/PlayerPopoutPage';

import TrackHistoryPage from './pages/TrackHistoryPage';
import LiveMonitorPage from './pages/LiveMonitorPage';
import GoogleAdsAdminPage from './pages/GoogleAdsAdminPage';

import PatreonCallbackPage from './pages/PatreonCallbackPage';
import SyncPage from './pages/SyncPage';
import PatreonManagementPage from './pages/PatreonManagementPage';
import BmacManagementPage from './pages/BmacManagementPage';
import AdminUserManagement from './pages/AdminUserManagement';
import LoginPage from './pages/LoginPage';
import { ProtectedRoute } from './components/ProtectedRoute';

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <Layout>
          <Routes>
            <Route path="/" element={<HomePage />} />

            <Route path="/dhr1" element={
              <ProtectedRoute requiredTier="dhr1" pageName="DHR1 Premium Channel">
                <DHR1Page />
              </ProtectedRoute>
            } />
            <Route path="/dhr2" element={
              <ProtectedRoute requiredTier="dhr2" pageName="DHR2 Exclusive Channel">
                <DHR2Page />
              </ProtectedRoute>
            } />
            <Route path="/vip" element={
              <ProtectedRoute requiredTier="vip" pageName="VIP Content Library">
                <VIPPage />
              </ProtectedRoute>
            } />
            <Route path="/forum" element={<ForumPage />} />
            <Route path="/upload" element={<UploadPage />} />
            <Route path="/shop" element={<ShopPage />} />
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/admin-dashboard" element={<AdminDashboard />} />
            <Route path="/admin-test" element={<AdminTestPage />} />
            <Route path="/vip-admin" element={<VIPAdminPage />} />
            <Route path="/bulk-import" element={<BulkImportPage />} />
            <Route path="/storage-setup" element={<StorageSetupPage />} />
            <Route path="/user-management" element={<UserManagementPage />} />
            <Route path="/player" element={<PlayerPopoutPage />} />

            <Route path="/track-history" element={<TrackHistoryPage />} />
            <Route path="/live-monitor" element={<LiveMonitorPage />} />
            <Route path="/google-ads-admin" element={<GoogleAdsAdminPage />} />

            <Route path="/sync" element={<SyncPage />} />
            <Route path="/patreon-management" element={<PatreonManagementPage />} />
            <Route path="/bmac-management" element={<BmacManagementPage />} />
            <Route path="/admin-user-management" element={<AdminUserManagement />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/auth/patreon/callback" element={<PatreonCallbackPage />} />
          </Routes>
        </Layout>
      </Router>
    </QueryClientProvider>
  );
}

export default App;