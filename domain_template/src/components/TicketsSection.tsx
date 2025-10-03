export default function TicketsSection() {
  const ticketPasses = [
    {
      title: 'REGULAR PASS',
      description: 'Meet the biggest players in Africa\'s innovation and business community',
      benefits: [
        'Access to all sessions',
        'Access to the networking area',
        'Event Merch'
      ],
      price: '₦ 40,000',
      featured: false
    },
    {
      title: 'PRIME PASS',
      description: 'Network with potential investors, headline speakers and ignite your business\'s potential for groundbreaking success!',
      benefits: [
        'Lunch/Buffet on both days',
        'Access to Exclusive Mixers on both days',
        'Access to the VIP lounge'
      ],
      price: '₦ 200,000',
      featured: false
    },
    {
      title: 'INVESTOR PASS',
      description: 'The Investor Pass gives you front-row access to Africa\'s boldest ideas connecting you with top startups, founders, and fellow investors.',
      benefits: [
        'Access to Investor Deal Rooms',
        'Access to Investor bundle (Guide and Dealbook)',
        'Access to the Startup Brochure'
      ],
      price: '₦ 350,000',
      featured: true
    }
  ];

  return (
    <div className="bg-[#90EE90] py-16 px-8">
      <div className="max-w-7xl mx-auto">
        {/* Main Heading */}
        <div className="text-center mb-12">
          <h2 className="text-6xl font-black text-[#2C3E50] mb-4">
            Tickets
          </h2>
        </div>

        {/* Ticket Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {ticketPasses.map((pass, index) => (
            <div key={index} className="bg-white rounded-lg shadow-lg p-8 relative">
              {/* Card Header */}
              <div className="mb-6">
                <h3 className="text-2xl font-bold text-gray-900 mb-4">
                  {pass.title}
                </h3>
                <p className="text-gray-700 text-sm leading-relaxed">
                  {pass.description}
                </p>
              </div>

              {/* Benefits List */}
              <div className="mb-8">
                <ul className="space-y-3">
                  {pass.benefits.map((benefit, benefitIndex) => (
                    <li key={benefitIndex} className="flex items-start">
                      <span className="text-[#2C3E50] mr-3 mt-1">•</span>
                      <span className="text-gray-700 text-sm">{benefit}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Price */}
              <div className="mb-6">
                <div className="text-3xl font-bold text-[#2C3E50]">
                  {pass.price}
                </div>
              </div>

              {/* Get Tickets Button (only for Investor Pass) */}
              {pass.featured && (
                <div className="absolute bottom-6 right-6">
                  <button className="bg-[#FF8C00] hover:bg-[#E67E00] text-white font-bold py-3 px-6 rounded flex items-center space-x-2 transition-colors shadow-lg">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4V5h12v10z" />
                      <path d="M6 7h8v2H6V7zm0 3h8v2H6v-2z" />
                    </svg>
                    <span>Get Tickets</span>
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Additional CTA Section */}
        <div className="text-center mt-12">
          <div className="bg-white rounded-lg shadow-lg p-8 max-w-2xl mx-auto">
            <h3 className="text-2xl font-bold text-[#2C3E50] mb-4">
              Ready to Join Africa's Tech Revolution?
            </h3>
            <p className="text-gray-700 mb-6">
              Choose your pass and be part of the most important tech event in Africa.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button className="bg-[#6A28D7] hover:bg-[#5A1FA6] text-white font-bold py-4 px-8 rounded-lg transition-colors">
                View All Passes
              </button>
              <button className="bg-[#50C878] hover:bg-[#45B06A] text-white font-bold py-4 px-8 rounded-lg transition-colors">
                Contact Sales
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
