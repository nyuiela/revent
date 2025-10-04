import { headers } from 'next/headers';
// import { getTenantConfig } from '@/lib/config';
// import { redirect } from 'next/navigation';
import HomePageClient from '@/components/HomePageClient';

export default async function Home() {
  // const headersList = await headers();
  // const tenant = headersList.get('x-tenant');

  // try {
  //   const config = await getTenantConfig(null, tenant || undefined);

  //   // If this is a tenant-specific site, redirect to dashboard
  //   if (tenant && config.configSource !== 'env') {
  //     redirect('/dashboard');
  //   }

  //   // MOONSHOT 2025 Landing Page
  //   return <HomePageClient />;

  // } catch (error) {
  // Fallback for when config fails to load
  return (
    <HomePageClient />
    // <div className="min-h-screen bg-[#6A28D7] flex items-center justify-center">
    //   <div className="text-center text-white">
    //     <h1 className="text-4xl font-bold mb-4">MOONSHOT 2025</h1>
    //     <p className="text-xl mb-8">Loading your event configuration...</p>
    //     <a
    //       href="/dashboard"
    //       className="inline-block bg-[#50C878] hover:bg-[#45B06A] text-white font-semibold py-3 px-6 rounded-lg transition-colors"
    //     >
    //       Continue to Dashboard
    //     </a>
    //   </div>
    // </div>
  );
  // }
}