import CountdownSection from '@/components/CountdownSection';

export default function ScheduleSection() {
  const scheduleData = [
    {
      date: 'TUESDAY',
      day: 'Oct 14',
      events: [
        {
          title: 'MOONSHOT MIXER',
          type: 'mixer',
          span: 'full'
        }
      ]
    },
    {
      date: 'WEDNESDAY',
      day: 'Oct 15',
      events: [
        {
          title: 'GOVT & REGULATION CONFERENCE (+ROUNDTABLES)',
          type: 'conference',
          span: 'single'
        },
        {
          title: 'EMERGING TECH FEST: AI',
          type: 'festival',
          span: 'single'
        },
        {
          title: 'FUEL: THE INVESTOR CONFERENCE',
          type: 'conference',
          span: 'single'
        },
        {
          title: 'STARTUP FESTIVAL',
          type: 'festival',
          span: 'single'
        },
        {
          title: 'BIG TECH & ENTERPRISE',
          type: 'conference',
          span: 'single'
        },
        {
          title: 'TRADE ROUNDTABLE',
          type: 'roundtable',
          span: 'single'
        }
      ]
    }
  ];

  return (
    <div className="bg-white">
      {/* Countdown Section */}
      <CountdownSection />
      
      <div className="py-16 px-8">
        <div className="max-w-7xl mx-auto">
          {/* Main Heading */}
          <div className="text-center mb-12">
            <h2 className="text-6xl font-black text-[#2C3E50] mb-4">
              Schedule of Events
            </h2>
          </div>

        {/* Schedule Table */}
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          {/* Table Header */}
          <div className="bg-[#2C3E50] text-white p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="bg-[#50C878] px-4 py-2 rounded">
                  <span className="text-white font-bold">» » »</span>
                </div>
                <h3 className="text-2xl font-bold">Moonshot 2025</h3>
              </div>
            </div>
          </div>

          {/* Schedule Content */}
          <div className="p-0">
            {scheduleData.map((day, dayIndex) => (
              <div key={dayIndex} className="border-b border-gray-200 last:border-b-0">
                <div className="flex">
                  {/* Date Column */}
                  <div className="w-1/4 bg-[#F8D7DA] p-6 border-r border-gray-200">
                    <div className="text-center">
                      <div className="text-sm font-medium text-[#2C3E50] mb-1">
                        {day.date}
                      </div>
                      <div className="text-2xl font-bold text-[#2C3E50]">
                        {day.day}
                      </div>
                    </div>
                  </div>

                  {/* Events Column */}
                  <div className="w-3/4 p-6">
                    {day.events.length === 1 ? (
                      /* Single Full-Width Event */
                      <div className="bg-[#F8D7DA] rounded-lg p-6 text-center">
                        <h4 className="text-xl font-bold text-[#2C3E50]">
                          {day.events[0].title}
                        </h4>
                      </div>
                    ) : (
                      /* Multiple Events Grid */
                      <div className="grid grid-cols-3 gap-4">
                        {day.events.map((event, eventIndex) => (
                          <div key={eventIndex} className="bg-[#FDF5E6] rounded-lg p-4 text-center relative">
                            <h4 className="text-sm font-bold text-[#2C3E50] leading-tight">
                              {event.title}
                            </h4>

                            {/* Get Tickets Button for TRADE ROUNDTABLE */}
                            {event.title === 'TRADE ROUNDTABLE' && (
                              <div className="absolute -bottom-2 -right-2">
                                <button className="bg-[#FDF5E6] hover:bg-[#F5E6D3] text-[#2C3E50] font-bold py-2 px-4 rounded-lg shadow-lg flex items-center space-x-2 transition-colors">
                                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                    <path d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4V5h12v10z" />
                                    <path d="M6 7h8v2H6V7zm0 3h8v2H6v-2z" />
                                  </svg>
                                  <span className="text-xs">Get Tickets</span>
                                </button>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Additional Information */}
        <div className="mt-12 text-center">
          <div className="bg-gray-50 rounded-lg p-8 max-w-4xl mx-auto">
            <h3 className="text-2xl font-bold text-[#2C3E50] mb-4">
              Event Details & Information
            </h3>
            <p className="text-gray-700 mb-6">
              All events will take place at the EKO Convention Centre, Lagos.
              Detailed schedules and speaker information will be available closer to the event date.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button className="bg-[#6A28D7] hover:bg-[#5A1FA6] text-white font-bold py-3 px-6 rounded-lg transition-colors">
                Download Full Schedule
              </button>
              <button className="bg-[#50C878] hover:bg-[#45B06A] text-white font-bold py-3 px-6 rounded-lg transition-colors">
                View Speaker Lineup
              </button>
            </div>
          </div>
        </div>
        </div>
      </div>
    </div>
  );
}
