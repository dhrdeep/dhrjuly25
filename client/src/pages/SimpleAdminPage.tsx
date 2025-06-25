import React from 'react';

export default function SimpleAdminPage() {
  // Redirect to comprehensive admin dashboard
  React.useEffect(() => {
    window.location.replace('/admin-dashboard');
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6 flex items-center justify-center">
      <div className="text-center">
        <div className="text-white text-2xl font-bold mb-4">Redirecting to New Admin Dashboard...</div>
        <div className="text-gray-400 mb-8">Enhanced admin interface with comprehensive management tools</div>
        <div className="bg-gray-800/50 rounded-lg p-6 max-w-md mx-auto">
          <h3 className="text-orange-400 font-bold mb-4">Available Features:</h3>
          <ul className="text-left text-gray-300 space-y-2">
            <li>• Complete sync system (Patreon, BMAC, Spaces)</li>
            <li>• VIP content management</li>
            <li>• User management with filtering</li>
            <li>• Bulk import functionality</li>
            <li>• Storage configuration</li>
          </ul>
        </div>
      </div>
    </div>
  );
}