'use client';

import { useState } from 'react';

export default function SpeakersSection() {
  const [currentSlide, setCurrentSlide] = useState(0);

  const speakers = [
    {
      name: 'Dr Bosun Tijani',
      title: 'Minister of Communications, Innovation and Digital Economy of Nigeria',
      image: '/placeholder-speaker.jpg'
    },
    {
      name: 'Dr. Jumoke Oduwole',
      title: 'Minister of Trade, Industry and Investment, Nigeria',
      image: '/placeholder-speaker.jpg'
    },
    {
      name: 'HM. Salima Bah',
      title: 'Minister of Communication, Technology and Innovation, Sierra Leone',
      image: '/placeholder-speaker.jpg'
    },
    {
      name: 'Dr. Aminu Maida',
      title: 'Executive Vice Chairman (EVC), Nigerian Communications Commission (NCC)',
      tag: 'GOVERNMENT, POLICY & REGULATION',
      featured: true,
      image: '/placeholder-speaker.jpg'
    },
    {
      name: 'Mr. Carlos Ra',
      title: 'Deputy High Comm',
      image: '/placeholder-speaker.jpg'
    }
  ];

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % speakers.length);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + speakers.length) % speakers.length);
  };

  return (
    <div className="bg-white py-8">
      {/* Marquee Header */}
      <div className="bg-gray-900 py-4 overflow-hidden mb-8">
        <div className="flex animate-marquee whitespace-nowrap">
          <span className="text-4xl font-black text-white italic mx-4">
            SPEAKERS • MEET OUR SPEAKERS • MEET OUR SPEAKERS • MEET OUR SPEAKERS • MEET OUR SPEAKERS •
          </span>
        </div>
      </div>

      {/* Speakers Carousel */}
      <div className="relative bg-[#6A28D7] py-16 px-8">
        {/* Purple Background with Stripes */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{
            backgroundImage: 'repeating-linear-gradient(90deg, transparent, transparent 40px, rgba(255,255,255,0.1) 40px, rgba(255,255,255,0.1) 80px)',
          }}></div>
        </div>

        <div className="relative z-10 max-w-7xl mx-auto">
          <div className="grid grid-cols-4 gap-6">
            {/* Speaker Cards */}
            {speakers.slice(0, 4).map((speaker, index) => (
              <div key={index} className={speaker.featured ? "col-span-1" : "col-span-1"}>
                {speaker.featured ? (
                  /* Featured Speaker Card */
                  <div className="bg-[#6A28D7] text-white p-6 rounded-lg relative">
                    <div className="mb-4">
                      <div className="w-full h-48 bg-gray-300 rounded-lg mb-4 flex items-center justify-center">
                        <span className="text-gray-600">Speaker Photo</span>
                      </div>
                    </div>
                    <h3 className="text-2xl font-bold mb-2">{speaker.name}</h3>
                    <p className="text-sm mb-4">{speaker.title}</p>
                    {speaker.tag && (
                      <div className="bg-yellow-500 text-black px-3 py-1 rounded font-bold text-xs inline-block mb-4">
                        {speaker.tag}
                      </div>
                    )}
                    <button className="text-white flex items-center space-x-2">
                      <span>↓</span>
                      <span>View Bio</span>
                    </button>
                  </div>
                ) : (
                  /* Regular Speaker Card */
                  <div className="bg-white rounded-lg overflow-hidden shadow-lg">
                    <div className="relative">
                      <div className="w-full h-64 bg-gray-300 flex items-center justify-center">
                        <span className="text-gray-600">Speaker Photo</span>
                      </div>
                      {/* Wave Pattern Overlay */}
                      <div className="absolute bottom-0 left-0 right-0">
                        <svg viewBox="0 0 100 30" preserveAspectRatio="none" className="w-full h-16">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <g key={i}>
                              <path
                                d={`M${i * 20},15 Q${i * 20 + 5},10 ${i * 20 + 10},15 T${i * 20 + 20},15 L${i * 20 + 20},30 L${i * 20},30 Z`}
                                fill={i % 2 === 0 ? '#50C878' : '#6A28D7'}
                                opacity="0.8"
                              />
                            </g>
                          ))}
                        </svg>
                      </div>
                    </div>
                    <div className="bg-[#6A28D7] text-white p-4 text-center">
                      <h3 className="font-bold text-lg mb-1">{speaker.name}</h3>
                      <p className="text-xs">{speaker.title}</p>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Navigation */}
          <div className="flex items-center justify-center mt-8 space-x-4">
            <button
              onClick={prevSlide}
              className="bg-[#50C878] hover:bg-[#45B06A] text-white p-3 rounded transition-colors"
            >
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            </button>

            {/* Pagination Dots */}
            <div className="flex space-x-2">
              {speakers.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentSlide(index)}
                  className={`w-3 h-3 rounded-full transition-colors ${index === currentSlide ? 'bg-yellow-500' : 'bg-gray-400'
                    }`}
                />
              ))}
            </div>

            <button
              onClick={nextSlide}
              className="bg-[#50C878] hover:bg-[#45B06A] text-white p-3 rounded transition-colors"
            >
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* View All Speakers Section */}
      <div className="relative bg-[#6A28D7] py-8 px-8">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="bg-white rounded px-8 py-4">
            <button className="text-2xl font-bold text-black hover:text-[#6A28D7] transition-colors">
              View all speakers
            </button>
          </div>
          <button className="bg-yellow-400 hover:bg-yellow-500 text-white font-bold py-4 px-8 rounded flex items-center space-x-3 transition-colors">
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
              <path d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4V5h12v10z" />
              <path d="M6 7h8v2H6V7zm0 3h8v2H6v-2z" />
            </svg>
            <span>Get Tickets</span>
          </button>
        </div>
      </div>
    </div>
  );
}

