export const mockEvents = [
    {
      title: "Web3 Developer Meetup",
      description: "Join us for an exciting evening of Web3 development discussions, networking, and hands-on workshops. Learn about the latest trends in blockchain development, DeFi protocols, and NFT innovations.",
      date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // YYYY-MM-DD format
      time: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toTimeString().slice(0, 5), // HH:MM format
      category: "Technology",
      location: "San Francisco, CA",
      lat: 37.7749,
      lng: -122.4194,
      coordinates: { lat: 37.7749, lng: -122.4194 },
      startDateTime: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 16), // 7 days from now
      endDateTime: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000 + 3 * 60 * 60 * 1000).toISOString().slice(0, 16), // 3 hours later
      maxParticipants: 150,
      eventType: "in-person" as const,
      isLive: false,
      platforms: ["Discord", "Zoom"],
      totalRewards: 1000,
      hosts: [
        {
          name: "Alex Chen",
          avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face",
          role: "Lead Developer",
          bio: "Blockchain developer with 5+ years experience",
          social: {
            twitter: "https://twitter.com/alexchen",
            linkedin: "https://linkedin.com/in/alexchen"
          }
        }
      ],
      agenda: [
        {
          title: "Welcome & Introductions",
          description: "Meet the speakers and get an overview of the evening",
          startTime: "18:00",
          endTime: "18:30",
          speakers: ["Alex Chen"]
        },
        {
          title: "Web3 Development Trends",
          description: "Latest trends in blockchain development",
          startTime: "18:30",
          endTime: "19:30",
          speakers: ["Alex Chen", "Sarah Johnson"]
        }
      ],
      sponsors: [
        {
          name: "Ethereum Foundation",
          logo: "https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=100&h=100&fit=crop",
          link: "https://ethereum.org"
        }
      ],
      socialLinks: {
        twitter: "https://twitter.com/web3meetup",
        discord: "https://discord.gg/web3dev",
        website: "https://web3devmeetup.com"
      },
      tickets: {
        available: true,
        types: [
          { type: "Early Bird", price: 0.005, currency: "ETH", quantity: 50, perks: ["Limited early bird tickets"] },
          { type: "General Admission", price: 0.01, currency: "ETH", quantity: 100, perks: ["Standard event access"] }
        ]
      }
    },
    {
      title: "DeFi Summit 2024",
      description: "The premier DeFi conference bringing together industry leaders, developers, and enthusiasts. Explore the future of decentralized finance with keynote speakers, panel discussions, and networking opportunities.",
      date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      time: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toTimeString().slice(0, 5),
      category: "Finance",
      location: "New York, NY",
      lat: 40.7128,
      lng: -74.0060,
      coordinates: { lat: 40.7128, lng: -74.0060 },
      startDateTime: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().slice(0, 16), // 14 days from now
      endDateTime: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000 + 8 * 60 * 60 * 1000).toISOString().slice(0, 16), // 8 hours later
      maxParticipants: 500,
      eventType: "in-person" as const,
      isLive: true,
      platforms: ["YouTube Live", "Twitter Spaces"],
      totalRewards: 5000,
      hosts: [
        {
          name: "Maria Rodriguez",
          avatar: "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=100&h=100&fit=crop&crop=face",
          role: "Conference Director",
          bio: "DeFi expert and conference organizer",
          social: {
            twitter: "https://twitter.com/mariarodriguez",
            linkedin: "https://linkedin.com/in/mariarodriguez"
          }
        }
      ],
      agenda: [
        {
          title: "Opening Keynote",
          description: "The Future of Decentralized Finance",
          startTime: "09:00",
          endTime: "10:00",
          speakers: ["Maria Rodriguez", "John Smith"]
        },
        {
          title: "Panel: DeFi Innovations",
          description: "Latest innovations in DeFi protocols",
          startTime: "10:30",
          endTime: "12:00",
          speakers: ["Alice Johnson", "Bob Wilson", "Carol Davis"]
        }
      ],
      sponsors: [
        {
          name: "Uniswap",
          logo: "https://images.unsplash.com/photo-1518546305927-5a555bb7020d?w=100&h=100&fit=crop",
          link: "https://uniswap.org"
        },
        {
          name: "Compound",
          logo: "https://images.unsplash.com/photo-1559526324-4b87b5e36e44?w=100&h=100&fit=crop",
          link: "https://compound.finance"
        }
      ],
      socialLinks: {
        twitter: "https://twitter.com/defisummit2024",
        discord: "https://discord.gg/defisummit",
        website: "https://defisummit2024.com"
      },
      tickets: {
        available: true,
        types: [
          { type: "VIP Pass", price: 0.1, currency: "ETH", quantity: 50, perks: ["VIP access with premium perks"] },
          { type: "Standard Pass", price: 0.05, currency: "ETH", quantity: 300, perks: ["Full conference access"] },
          { type: "Student Pass", price: 0.02, currency: "ETH", quantity: 150, perks: ["Discounted student tickets"] }
        ]
      }
    },
    {
      title: "NFT Art Gallery Opening",
      description: "Experience the intersection of art and technology at our exclusive NFT gallery opening. Featuring works from renowned digital artists and emerging creators in the Web3 space.",
      date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      time: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toTimeString().slice(0, 5),
      category: "Art & Culture",
      location: "Los Angeles, California, United States",
      lat: 34.0522,
      lng: -118.2437,
      coordinates: { lat: 34.0522, lng: -118.2437 },
      startDateTime: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().slice(0, 16), // 3 days from now
      endDateTime: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000 + 4 * 60 * 60 * 1000).toISOString().slice(0, 16), // 4 hours later
      maxParticipants: 200,
      eventType: "hybrid" as const,
      isLive: true,
      platforms: ["Instagram Live", "Twitch"],
      totalRewards: 2500,
      hosts: [
        {
          name: "David Kim",
          avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face",
          role: "Gallery Curator",
          bio: "Digital art curator and NFT expert",
          social: {
            twitter: "https://twitter.com/davidkim",
            website: "https://davidkim.art"
          }
        }
      ],
      agenda: [
        {
          title: "Gallery Tour",
          description: "Exclusive tour of featured NFT artworks",
          startTime: "19:00",
          endTime: "20:00",
          speakers: ["David Kim"]
        },
        {
          title: "Artist Panel",
          description: "Meet the featured digital artists",
          startTime: "20:30",
          endTime: "21:30",
          speakers: ["Sarah Chen", "Mike Johnson", "Lisa Wang"]
        }
      ],
      sponsors: [
        {
          name: "OpenSea",
          logo: "https://images.unsplash.com/photo-1551434678-e076c223a692?w=100&h=100&fit=crop",
          link: "https://opensea.io"
        }
      ],
      socialLinks: {
        twitter: "https://twitter.com/nftgalleryla",
        discord: "https://discord.gg/nftgallery",
        website: "https://nftgalleryla.com"
      },
      tickets: {
        available: true,
        types: [
          { type: "Artist Pass", price: 0.01, currency: "ETH", quantity: 50, perks: ["Special pricing for artists"] },
          { type: "General Admission", price: 0.02, currency: "ETH", quantity: 150, perks: ["Standard gallery access"] }
        ]
      }
    },
    {
      title: "Blockchain Gaming Tournament",
      description: "Compete in the ultimate blockchain gaming tournament featuring popular Web3 games. Prizes include NFTs, tokens, and exclusive gaming items. All skill levels welcome!",
      date: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      time: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toTimeString().slice(0, 5),
      category: "Gaming & Esports",
      location: "Austin, TX",
      lat: 30.2672,
      lng: -97.7431,
      coordinates: { lat: 30.2672, lng: -97.7431 },
      startDateTime: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString().slice(0, 16), // 10 days from now
      endDateTime: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000 + 6 * 60 * 60 * 1000).toISOString().slice(0, 16), // 6 hours later
      maxParticipants: 100,
      eventType: "online" as const,
      isLive: true,
      platforms: ["Twitch", "YouTube Gaming"],
      totalRewards: 10000,
      hosts: [
        {
          name: "Jessica Park",
          avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop&crop=face",
          role: "Tournament Director",
          bio: "Professional esports organizer and blockchain gaming expert",
          social: {
            twitter: "https://twitter.com/jessicapark",
            twitch: "https://twitch.tv/jessicapark"
          }
        }
      ],
      agenda: [
        {
          title: "Tournament Kickoff",
          description: "Welcome and tournament rules overview",
          startTime: "14:00",
          endTime: "14:30",
          speakers: ["Jessica Park"]
        },
        {
          title: "Round 1 - Elimination",
          description: "First round of tournament matches",
          startTime: "15:00",
          endTime: "17:00",
          speakers: ["Jessica Park", "Pro Gamers"]
        }
      ],
      sponsors: [
        {
          name: "Axie Infinity",
          logo: "https://images.unsplash.com/photo-1611224923853-80b023f02d71?w=100&h=100&fit=crop",
          link: "https://axieinfinity.com"
        }
      ],
      socialLinks: {
        twitter: "https://twitter.com/blockchaingaming",
        discord: "https://discord.gg/blockchaingaming",
        website: "https://blockchaingaming.tournament"
      },
      tickets: {
        available: true,
        types: [
          { type: "Competitor Pass", price: 0.03, currency: "ETH", quantity: 80, perks: ["Tournament participation"] },
          { type: "Spectator Pass", price: 0.01, currency: "ETH", quantity: 20, perks: ["Watch the tournament"] }
        ]
      }
    },
    {
      title: "Crypto Investment Workshop",
      description: "Learn the fundamentals of cryptocurrency investment from industry experts. Topics include portfolio management, risk assessment, and market analysis strategies.",
      date: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      time: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toTimeString().slice(0, 5),
      category: "Education",
      location: "Chicago, Illinois, United States",
      lat: 41.8781,
      lng: -87.6298,
      coordinates: { lat: 41.8781, lng: -87.6298 },
      startDateTime: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString().slice(0, 16), // 5 days from now
      endDateTime: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000 + 2 * 60 * 60 * 1000).toISOString().slice(0, 16), // 2 hours later
      maxParticipants: 75,
      eventType: "hybrid" as const,
      isLive: false,
      platforms: ["Zoom", "Teams"],
      totalRewards: 500,
      hosts: [
        {
          name: "Michael Thompson",
          avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face",
          role: "Investment Advisor",
          bio: "Certified financial advisor specializing in crypto investments",
          social: {
            linkedin: "https://linkedin.com/in/michaelthompson",
            website: "https://cryptoadvisor.com"
          }
        }
      ],
      agenda: [
        {
          title: "Introduction to Crypto Investment",
          description: "Basics of cryptocurrency and blockchain technology",
          startTime: "10:00",
          endTime: "11:00",
          speakers: ["Michael Thompson"]
        },
        {
          title: "Portfolio Management Strategies",
          description: "How to build and manage a crypto portfolio",
          startTime: "11:15",
          endTime: "12:15",
          speakers: ["Michael Thompson", "Sarah Davis"]
        }
      ],
      sponsors: [
        {
          name: "Coinbase",
          logo: "https://images.unsplash.com/photo-1518546305927-5a555bb7020d?w=100&h=100&fit=crop",
          link: "https://coinbase.com"
        }
      ],
      socialLinks: {
        twitter: "https://twitter.com/cryptoworkshop",
        discord: "https://discord.gg/cryptoworkshop",
        website: "https://cryptoworkshop.com"
      },
      tickets: {
        available: true,
        types: [
          { type: "Workshop Access", price: 0.015, currency: "ETH", quantity: 75, perks: ["Full workshop participation"] }
        ]
      }
    }
  ];