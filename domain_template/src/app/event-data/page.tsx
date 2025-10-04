import EventDataDisplay from '@/components/EventDataDisplay';

export default function EventDataPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Event Data Dashboard</h1>
          <p className="text-gray-600">Real-time data from the smart contract</p>
        </div>

        <EventDataDisplay />
      </div>
    </div>
  );
}


