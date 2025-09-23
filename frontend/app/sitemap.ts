import type { MetadataRoute } from 'next'

async function getEventSlugs(): Promise<string[]> {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://revents.io'
    const response = await fetch(`${baseUrl}/api/events/graph?limit=500`, {
      next: { revalidate: 900 } // Revalidate every 15 minutes
    })

    if (!response.ok) {
      console.warn('Failed to fetch events for sitemap:', response.status)
      return []
    }

    const data = await response.json()
    return (data.events || [])
      .map((event: any) => event.slug)
      .filter(Boolean)
  } catch (error) {
    console.warn('Error fetching events for sitemap:', error)
    return []
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://revents.io'
  const now = new Date().toISOString()

  // Static pages
  const staticPages = [
    {
      url: baseUrl,
      lastModified: now,
      changeFrequency: 'daily' as const,
      priority: 1,
    },
    {
      url: `${baseUrl}/events`,
      lastModified: now,
      changeFrequency: 'daily' as const,
      priority: 0.9,
    },
    {
      url: `${baseUrl}/events/create`,
      lastModified: now,
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    },
    {
      url: `${baseUrl}/profile`,
      lastModified: now,
      changeFrequency: 'weekly' as const,
      priority: 0.7,
    },
  ]

  // Dynamic event pages
  const eventSlugs = await getEventSlugs()
  const eventPages = eventSlugs.map((slug) => ({
    url: `${baseUrl}/${slug}`,
    lastModified: now,
    changeFrequency: 'daily' as const,
    priority: 0.8,
  }))

  return [...staticPages, ...eventPages]
}
