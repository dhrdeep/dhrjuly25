import React, { useState } from 'react';
import { Cloud, Database, Settings, Check, AlertCircle, Info } from 'lucide-react';

export default function StorageSetupPage() {
  const [s3Settings, setS3Settings] = useState({
    accessKey: '',
    secretKey: '',
    bucket: 'dhrmixes',
    region: 'lon1',
    endpoint: 'lon1.digitaloceanspaces.com'
  });

  const [testStatus, setTestStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');
  const [testMessage, setTestMessage] = useState('');

  const handleTestConnection = async () => {
    setTestStatus('testing');
    setTestMessage('');

    try {
      const response = await fetch('/api/test-storage', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(s3Settings),
      });

      const data = await response.json();

      if (response.ok) {
        setTestStatus('success');
        setTestMessage('Connection successful! DigitalOcean Spaces is properly configured.');
      } else {
        setTestStatus('error');
        setTestMessage(data.error || 'Connection failed');
      }
    } catch (error) {
      setTestStatus('error');
      setTestMessage('Network error occurred while testing connection');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <header className="text-center mb-8">
          <h1 className="text-4xl font-black bg-gradient-to-r from-blue-300 to-blue-500 bg-clip-text text-transparent mb-2">
            Storage Configuration
          </h1>
          <p className="text-gray-300">
            Configure and test your DigitalOcean Spaces file hosting settings
          </p>
        </header>

        {/* Current Status */}
        <div className="bg-gray-800/40 backdrop-blur-xl rounded-2xl p-6 border border-blue-400/20 mb-6">
          <div className="flex items-center space-x-3 mb-4">
            <Database className="h-6 w-6 text-blue-400" />
            <h2 className="text-xl font-bold text-white">Current Configuration</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-slate-700/30 rounded-lg p-4">
              <div className="text-sm text-gray-400 mb-1">Storage Provider</div>
              <div className="text-white font-medium">DigitalOcean Spaces</div>
            </div>
            <div className="bg-slate-700/30 rounded-lg p-4">
              <div className="text-sm text-gray-400 mb-1">Bucket</div>
              <div className="text-white font-medium">dhrmixes</div>
            </div>
            <div className="bg-slate-700/30 rounded-lg p-4">
              <div className="text-sm text-gray-400 mb-1">Region</div>
              <div className="text-white font-medium">LON1 (London)</div>
            </div>
            <div className="bg-slate-700/30 rounded-lg p-4">
              <div className="text-sm text-gray-400 mb-1">Status</div>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                <span className="text-green-400 font-medium">Active</span>
              </div>
            </div>
          </div>
        </div>

        {/* Configuration Form */}
        <div className="bg-gray-800/40 backdrop-blur-xl rounded-2xl p-6 border border-blue-400/20 mb-6">
          <div className="flex items-center space-x-3 mb-6">
            <Settings className="h-6 w-6 text-blue-400" />
            <h2 className="text-xl font-bold text-white">DigitalOcean Spaces Settings</h2>
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Access Key ID
                </label>
                <input
                  type="text"
                  value={s3Settings.accessKey}
                  onChange={(e) => setS3Settings({...s3Settings, accessKey: e.target.value})}
                  className="w-full px-3 py-2 bg-gray-700/50 border border-gray-600/30 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-400/50"
                  placeholder="DO00XXXXXXXXXXXXXXXXXXXX"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Secret Access Key
                </label>
                <input
                  type="password"
                  value={s3Settings.secretKey}
                  onChange={(e) => setS3Settings({...s3Settings, secretKey: e.target.value})}
                  className="w-full px-3 py-2 bg-gray-700/50 border border-gray-600/30 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-400/50"
                  placeholder="Enter secret key"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Bucket Name
                </label>
                <input
                  type="text"
                  value={s3Settings.bucket}
                  onChange={(e) => setS3Settings({...s3Settings, bucket: e.target.value})}
                  className="w-full px-3 py-2 bg-gray-700/50 border border-gray-600/30 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-400/50"
                  placeholder="dhrmixes"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Region
                </label>
                <select
                  value={s3Settings.region}
                  onChange={(e) => setS3Settings({...s3Settings, region: e.target.value})}
                  className="w-full px-3 py-2 bg-gray-700/50 border border-gray-600/30 rounded-lg text-white focus:outline-none focus:border-blue-400/50"
                >
                  <option value="lon1">LON1 - London</option>
                  <option value="nyc3">NYC3 - New York</option>
                  <option value="sfo3">SFO3 - San Francisco</option>
                  <option value="sgp1">SGP1 - Singapore</option>
                  <option value="fra1">FRA1 - Frankfurt</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Endpoint
                </label>
                <input
                  type="text"
                  value={s3Settings.endpoint}
                  onChange={(e) => setS3Settings({...s3Settings, endpoint: e.target.value})}
                  className="w-full px-3 py-2 bg-gray-700/50 border border-gray-600/30 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-400/50"
                  placeholder="lon1.digitaloceanspaces.com"
                />
              </div>
            </div>

            <button
              onClick={handleTestConnection}
              disabled={testStatus === 'testing'}
              className="w-full flex items-center justify-center space-x-2 px-6 py-3 bg-blue-500/20 hover:bg-blue-500/30 disabled:bg-gray-500/20 disabled:text-gray-400 text-blue-300 border border-blue-400/30 rounded-lg transition-all"
            >
              <Cloud className="h-5 w-5" />
              <span>{testStatus === 'testing' ? 'Testing Connection...' : 'Test Connection'}</span>
            </button>

            {testStatus !== 'idle' && (
              <div className={`p-4 rounded-lg border ${
                testStatus === 'success' 
                  ? 'bg-green-900/30 border-green-400/30 text-green-300'
                  : testStatus === 'error'
                  ? 'bg-red-900/30 border-red-400/30 text-red-300'
                  : 'bg-blue-900/30 border-blue-400/30 text-blue-300'
              }`}>
                <div className="flex items-center space-x-2">
                  {testStatus === 'success' && <Check className="h-5 w-5" />}
                  {testStatus === 'error' && <AlertCircle className="h-5 w-5" />}
                  {testStatus === 'testing' && <Settings className="h-5 w-5 animate-spin" />}
                  <span className="font-medium">
                    {testStatus === 'success' && 'Connection Successful'}
                    {testStatus === 'error' && 'Connection Failed'}
                    {testStatus === 'testing' && 'Testing...'}
                  </span>
                </div>
                {testMessage && <p className="mt-2">{testMessage}</p>}
              </div>
            )}
          </div>
        </div>

        {/* Information Panel */}
        <div className="bg-blue-900/20 backdrop-blur-xl rounded-2xl p-6 border border-blue-400/20">
          <div className="flex items-center space-x-3 mb-4">
            <Info className="h-6 w-6 text-blue-400" />
            <h2 className="text-xl font-bold text-blue-300">Setup Information</h2>
          </div>
          
          <div className="space-y-4 text-gray-300">
            <div>
              <h3 className="font-bold text-blue-200 mb-2">How to Get DigitalOcean Spaces Credentials:</h3>
              <ol className="list-decimal list-inside space-y-1 text-sm">
                <li>Log in to your DigitalOcean account</li>
                <li>Navigate to Spaces in the left sidebar</li>
                <li>Click on "Manage Keys" or "API" section</li>
                <li>Generate a new Spaces access key</li>
                <li>Copy the Access Key ID and Secret Access Key</li>
              </ol>
            </div>
            
            <div>
              <h3 className="font-bold text-blue-200 mb-2">Current Configuration:</h3>
              <ul className="list-disc list-inside space-y-1 text-sm">
                <li>Files are stored in the "dhrmixes" Space</li>
                <li>VIP users can stream and download content directly</li>
                <li>All files are secured with signed URLs</li>
                <li>Daily download limits are enforced (2 per day for VIP)</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}