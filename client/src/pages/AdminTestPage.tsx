import React, { useState } from 'react';
import { Users, RefreshCw, CheckCircle, AlertCircle, Music, Upload, Cloud, Settings } from 'lucide-react';
import { Link } from 'wouter';
import SharedBackground from '../components/SharedBackground';

interface TestResult {
  name: string;
  status: 'loading' | 'success' | 'error';
  message: string;
}

export default function AdminTestPage() {
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [isTestingAll, setIsTestingAll] = useState(false);

  const updateTestResult = (name: string, status: 'loading' | 'success' | 'error', message: string) => {
    setTestResults(prev => {
      const existing = prev.find(r => r.name === name);
      if (existing) {
        existing.status = status;
        existing.message = message;
        return [...prev];
      }
      return [...prev, { name, status, message }];
    });
  };

  const testEndpoint = async (name: string, url: string, method: 'GET' | 'POST' = 'GET', body?: any) => {
    updateTestResult(name, 'loading', 'Testing...');
    try {
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: body ? JSON.stringify(body) : undefined
      });
      
      const data = await response.json();
      
      if (response.ok) {
        updateTestResult(name, 'success', `✓ Working - ${data.message || 'Success'}`);
      } else {
        updateTestResult(name, 'error', `✗ Failed - ${data.error || 'Unknown error'}`);
      }
    } catch (error) {
      updateTestResult(name, 'error', `✗ Error - ${error instanceof Error ? error.message : 'Connection failed'}`);
    }
  };

  const runAllTests = async () => {
    setIsTestingAll(true);
    setTestResults([]);

    // Test all admin endpoints
    await testEndpoint('Admin Stats', '/api/admin/stats');
    await testEndpoint('DigitalOcean Spaces Sync', '/api/sync-space', 'POST');
    await testEndpoint('User List', '/api/admin/users');
    await testEndpoint('VIP Mixes', '/api/vip-mixes');
    await testEndpoint('Download Limits Test', '/api/download-limits/demo_user');
    
    setIsTestingAll(false);
  };

  const testPatreonSync = async () => {
    await testEndpoint('Patreon Sync', '/api/sync-patreon', 'POST');
  };

  const testBmacSync = async () => {
    const apiKey = prompt('Enter BMAC API Key for testing:');
    if (apiKey) {
      await testEndpoint('BMAC Sync', '/api/sync-bmac', 'POST', { apiKey });
    }
  };

  const adminPages = [
    { name: 'Admin Dashboard', href: '/admin-dashboard', icon: Settings },
    { name: 'Sync System', href: '/sync', icon: RefreshCw },
    { name: 'VIP Admin', href: '/vip-admin', icon: Music },
    { name: 'User Management', href: '/user-management', icon: Users },
    { name: 'Bulk Import', href: '/bulk-import', icon: Upload },
    { name: 'Storage Setup', href: '/storage-setup', icon: Cloud },
  ];

  return (
    <div className="min-h-screen text-white py-8 px-4 relative">
      <SharedBackground intensity="subtle" />
      <div className="max-w-6xl mx-auto relative z-10">
        
        <header className="text-center mb-8">
          <h1 className="text-4xl font-black bg-gradient-to-r from-orange-300 to-orange-500 bg-clip-text text-transparent mb-4">
            DHR Admin System Test
          </h1>
          <p className="text-gray-300">Comprehensive Testing Of All Admin Functionality</p>
        </header>

        {/* Test Controls */}
        <div className="bg-gray-800/40 backdrop-blur-xl rounded-2xl p-6 border border-orange-400/20 mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-white">System Tests</h2>
            <button
              onClick={runAllTests}
              disabled={isTestingAll}
              className="px-4 py-2 bg-orange-500 hover:bg-orange-600 disabled:bg-gray-600 rounded-lg transition-colors text-white flex items-center space-x-2"
            >
              {isTestingAll ? <RefreshCw className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4" />}
              <span>{isTestingAll ? 'Testing...' : 'Run All Tests'}</span>
            </button>
          </div>

          <div className="grid md:grid-cols-2 gap-4 mb-6">
            <button
              onClick={testPatreonSync}
              className="p-3 bg-orange-500/20 hover:bg-orange-500/30 rounded-lg border border-orange-400/30 text-left"
            >
              <div className="font-medium text-orange-300">Test Patreon Sync</div>
              <div className="text-sm text-gray-400">Check Patreon API integration</div>
            </button>

            <button
              onClick={testBmacSync}
              className="p-3 bg-blue-500/20 hover:bg-blue-500/30 rounded-lg border border-blue-400/30 text-left"
            >
              <div className="font-medium text-blue-300">Test BMAC Sync</div>
              <div className="text-sm text-gray-400">Check Buy Me a Coffee API</div>
            </button>
          </div>

          {/* Test Results */}
          {testResults.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-lg font-semibold text-white">Test Results</h3>
              {testResults.map((result, index) => (
                <div key={index} className={`p-3 rounded-lg border ${
                  result.status === 'success' ? 'bg-green-500/20 border-green-400/30' :
                  result.status === 'error' ? 'bg-red-500/20 border-red-400/30' :
                  'bg-gray-500/20 border-gray-400/30'
                }`}>
                  <div className="flex items-center space-x-2">
                    {result.status === 'loading' && <RefreshCw className="h-4 w-4 animate-spin text-gray-400" />}
                    {result.status === 'success' && <CheckCircle className="h-4 w-4 text-green-400" />}
                    {result.status === 'error' && <AlertCircle className="h-4 w-4 text-red-400" />}
                    <span className="font-medium text-white">{result.name}</span>
                  </div>
                  <div className="text-sm text-gray-300 mt-1">{result.message}</div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Admin Page Navigation Test */}
        <div className="bg-gray-800/40 backdrop-blur-xl rounded-2xl p-6 border border-orange-400/20">
          <h2 className="text-xl font-bold text-white mb-4">Admin Page Navigation Test</h2>
          <p className="text-gray-300 mb-6">Click Each Button To Test Admin Page Routing</p>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {adminPages.map((page, index) => {
              const Icon = page.icon;
              return (
                <Link key={index} to={page.href}>
                  <div className="p-4 bg-gray-700/30 hover:bg-gray-700/50 rounded-xl border border-gray-600/30 hover:border-orange-400/30 transition-all cursor-pointer">
                    <div className="flex items-center space-x-3">
                      <Icon className="h-5 w-5 text-orange-400" />
                      <div>
                        <div className="font-medium text-white">{page.name}</div>
                        <div className="text-xs text-gray-400">{page.href}</div>
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>

        {/* Subscriber Permission Mapping */}
        <div className="bg-gray-800/40 backdrop-blur-xl rounded-2xl p-6 border border-orange-400/20 mt-8">
          <h2 className="text-xl font-bold text-white mb-4">Subscriber Permission Mapping</h2>
          <div className="grid md:grid-cols-2 gap-6">
            
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-orange-300">Patreon Tiers → DHR Access</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between p-2 bg-gray-700/30 rounded">
                  <span className="text-gray-300">€3+ Patron</span>
                  <span className="text-orange-400">DHR1 Access</span>
                </div>
                <div className="flex justify-between p-2 bg-gray-700/30 rounded">
                  <span className="text-gray-300">€5+ Patron</span>
                  <span className="text-amber-400">DHR2 Access</span>
                </div>
                <div className="flex justify-between p-2 bg-gray-700/30 rounded">
                  <span className="text-gray-300">€10+ Patron</span>
                  <span className="text-yellow-400">VIP Access</span>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-blue-300">BMAC Support → DHR Access</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between p-2 bg-gray-700/30 rounded">
                  <span className="text-gray-300">€5+ Total</span>
                  <span className="text-orange-400">DHR1 Access</span>
                </div>
                <div className="flex justify-between p-2 bg-gray-700/30 rounded">
                  <span className="text-gray-300">€15+ Total</span>
                  <span className="text-amber-400">DHR2 Access</span>
                </div>
                <div className="flex justify-between p-2 bg-gray-700/30 rounded">
                  <span className="text-gray-300">€30+ Total</span>
                  <span className="text-yellow-400">VIP Access</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}