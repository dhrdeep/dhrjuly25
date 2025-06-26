import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from './lib/queryClient';
import Layout from './components/Layout';
import HomePage from './pages/HomePage';
import TrackIdentPage from './pages/TrackIdentPageOriginal';
import DHR1Page from './pages/DHR1Page';
import DHR2Page from './pages/DHR2Page';
import VIPPage from './pages/VIPPage';
import ForumPage from './pages/ForumPage';
import UploadPage from './pages/UploadPage';
import ShopPage from './pages/ShopPage';
import SimpleAdminPage from './pages/SimpleAdminPage';
import AdminDashboard from './pages/AdminDashboard';
import VIPAdminPage from './pages/VIPAdminPage';
import BulkImportPage from './pages/BulkImportPage';
import StorageSetupPage from './pages/StorageSetupPage';
import UserManagementPage from './pages/UserManagementPage';
import PlayerPopoutPage from './pages/PlayerPopoutPage';

import PatreonCallbackPage from './pages/PatreonCallbackPage';
import SyncPage from './pages/SyncPage';

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <Layout>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/track-ident" element={<TrackIdentPage />} />
            <Route path="/dhr1" element={<DHR1Page />} />
            <Route path="/dhr2" element={<DHR2Page />} />
            <Route path="/vip" element={<VIPPage />} />
            <Route path="/forum" element={<ForumPage />} />
            <Route path="/upload" element={<UploadPage />} />
            <Route path="/shop" element={<ShopPage />} />
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/admin-dashboard" element={<AdminDashboard />} />
            <Route path="/vip-admin" element={<VIPAdminPage />} />
            <Route path="/bulk-import" element={<BulkImportPage />} />
            <Route path="/storage-setup" element={<StorageSetupPage />} />
            <Route path="/user-management" element={<UserManagementPage />} />
            <Route path="/player" element={<PlayerPopoutPage />} />

            <Route path="/sync" element={<SyncPage />} />
            <Route path="/auth/patreon/callback" element={<PatreonCallbackPage />} />
          </Routes>
        </Layout>
      </Router>
    </QueryClientProvider>
  );
}

export default App;