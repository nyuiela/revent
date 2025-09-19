import { headers } from 'next/headers';
import { getTenantConfig } from '@/lib/config';
import { redirect } from 'next/navigation';

export default async function Home() {
  const headersList = await headers();
  const tenant = headersList.get('x-tenant');
  
  try {
    const config = await getTenantConfig(null, tenant || undefined);
    
    // If this is a tenant-specific site, redirect to dashboard
    if (tenant && config.configSource !== 'env') {
      redirect('/dashboard');
    }
    
    // Default landing page for main site
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
        {/* Header with Theme Toggle */}
        <div className="flex justify-end p-4">
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-2">
            <a href="/dashboard" className="text-white hover:text-gray-200 mr-4 transition-colors">
              Dashboard
            </a>
            <a href="/gallery" className="text-white hover:text-gray-200 transition-colors">
              Gallery
            </a>
          </div>
        </div>
        
        <div className="container mx-auto px-4 py-16">
          <div className="text-center">
            <h1 className="text-5xl font-bold text-white mb-6">
              Welcome to {config.name}
            </h1>
            <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
              {config.description || 'Create and manage your events with ease'}
            </p>
            <div className="space-x-4 flex items-center">
              <a 
                href="/dashboard" 
                className="inline-block bg-purple-600 hover:bg-purple-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
              >
                Go to Dashboard
              </a>
              <a 
                href="/gallery" 
                className="inline-block bg-transparent border-2 border-white text-white hover:bg-white hover:text-purple-900 font-semibold py-3 px-6 rounded-lg transition-colors"
              >
                View Gallery
              </a>
            </div>
          </div>
          
          {config.features?.streaming && (
            <div className="mt-16 text-center">
              <h2 className="text-3xl font-bold text-white mb-8">Live Streaming</h2>
              <div className="bg-black rounded-lg p-8 max-w-4xl mx-auto">
                <div className="aspect-video bg-gray-800 rounded-lg flex items-center justify-center">
                  <p className="text-gray-400">Stream placeholder - Configure your streaming setup</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    );
    
  } catch (error) {
    // Fallback for when config fails to load
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-white mb-4">Revent Events</h1>
          <p className="text-gray-300 mb-8">Loading your event configuration...</p>
          <a 
            href="/dashboard" 
            className="inline-block bg-purple-600 hover:bg-purple-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
          >
            Continue to Dashboard
          </a>
        </div>
      </div>
    );
  }
}