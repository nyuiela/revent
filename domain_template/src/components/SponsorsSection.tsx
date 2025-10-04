export default function SponsorsSection() {
  const sponsors = [
    {
      name: 'Fincra',
      logo: 'F',
      color: 'purple',
      description: null
    },
    {
      name: 'Raenest',
      logo: 'R',
      color: 'blue',
      description: null
    },
    {
      name: 'Cardtonic',
      logo: 'C',
      color: 'blue',
      description: 'Cardtonic is the best platform to get virtual dollar cards, trade gift cards, pay bills and buy gadgets.',
      website: 'www.cardtonic.com',
      badge: 'FINANCIAL INSTITUTION',
      special: true
    },
    {
      name: 'Luno',
      logo: 'L',
      color: 'blue',
      description: null
    },
    {
      name: 'Roqqu',
      logo: 'R',
      color: 'blue',
      description: null
    },
    {
      name: 'Opay',
      logo: 'O',
      color: 'green',
      description: null
    },
    {
      name: 'Busha',
      logo: 'B',
      color: 'green',
      description: null
    },
    {
      name: 'Flutterwave',
      logo: 'F',
      color: 'orange',
      description: null
    },
    {
      name: 'Interswitch',
      logo: 'I',
      color: 'red',
      description: null,
      hasButton: true
    }
  ];

  const getLogoColor = (color: string) => {
    switch (color) {
      case 'purple': return 'bg-purple-500';
      case 'blue': return 'bg-blue-500';
      case 'green': return 'bg-green-500';
      case 'orange': return 'bg-orange-500';
      case 'red': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  return (
    <div className="bg-[#FF8C00] py-8 sm:py-12 md:py-16 px-4 sm:px-6 md:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Section Title */}
        <div className="mb-8 sm:mb-10 md:mb-12">
          <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black text-white text-center">
            PLATINUM SPONSORS
          </h2>
        </div>

        {/* Sponsors Grid */}
        <div className="bg-white rounded-lg shadow-lg p-4 sm:p-6 md:p-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 md:gap-8">
            {sponsors.map((sponsor, index) => (
              <div key={index} className={`text-center ${sponsor.special ? 'bg-orange-100 p-4 sm:p-6 rounded-lg' : 'p-3 sm:p-4'} relative`}>
                {/* Logo */}
                <div className={`w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 ${getLogoColor(sponsor.color)} rounded-full mx-auto mb-3 sm:mb-4 flex items-center justify-center`}>
                  <span className="text-white text-lg sm:text-xl md:text-2xl font-bold">{sponsor.logo}</span>
                </div>

                {/* Special Badge for Cardtonic */}
                {sponsor.badge && (
                  <div className="bg-white text-black px-2 sm:px-3 py-1 rounded text-xs font-bold mb-2 inline-block">
                    {sponsor.badge}
                  </div>
                )}

                {/* Sponsor Name */}
                <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-2">
                  {sponsor.name}
                </h3>

                {/* Description for Cardtonic */}
                {sponsor.description && (
                  <div className="text-xs sm:text-sm text-gray-700 mb-2">
                    {sponsor.description}
                  </div>
                )}

                {/* Website for Cardtonic */}
                {sponsor.website && (
                  <div className="text-xs text-blue-600 mb-3 sm:mb-4">
                    {sponsor.website}
                  </div>
                )}

                {/* Get Tickets Button for Interswitch */}
                {sponsor.hasButton && (
                  <div className="absolute -bottom-1 -right-1 sm:-bottom-2 sm:-right-2">
                    <button className="bg-yellow-400 hover:bg-yellow-500 text-black font-bold py-1 sm:py-2 px-2 sm:px-4 rounded-lg shadow-lg flex items-center space-x-1 sm:space-x-2 transition-colors text-xs sm:text-sm">
                      <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="currentColor" viewBox="0 0 20 20">
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
        </div>

        {/* Additional Information */}
        <div className="mt-8 sm:mt-10 md:mt-12 text-center">
          <div className="bg-white rounded-lg shadow-lg p-4 sm:p-6 md:p-8 max-w-4xl mx-auto">
            <h3 className="text-xl sm:text-2xl font-bold text-[#2C3E50] mb-3 sm:mb-4">
              Become a Sponsor
            </h3>
            <p className="text-sm sm:text-base text-gray-700 mb-4 sm:mb-6">
              Join Africa&apos;s most important tech event and connect with the continent&apos;s leading innovators, entrepreneurs, and investors.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center">
              <button className="bg-[#FF8C00] hover:bg-[#E67E00] text-white font-bold py-2 sm:py-3 px-4 sm:px-6 rounded-lg transition-colors text-sm sm:text-base">
                View Sponsorship Packages
              </button>
              <button className="bg-[#6A28D7] hover:bg-[#5A1FA6] text-white font-bold py-2 sm:py-3 px-4 sm:px-6 rounded-lg transition-colors text-sm sm:text-base">
                Contact Sales Team
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
