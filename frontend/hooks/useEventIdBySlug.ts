import { useQuery } from '@tanstack/react-query'

type ApiResponse = {
  event?: { id?: string; eventId?: string; slug?: string }
  error?: string
}

export function useEventIdBySlug(slug: string | undefined) {
  const { data, isLoading, error, refetch, isFetching } = useQuery<ApiResponse>({
    queryKey: ['eventIdBySlug', slug],
    queryFn: async () => {
      if (!slug) return { event: undefined }
      const res = await fetch(`/api/events/slug/${encodeURIComponent(slug)}`)
      if (!res.ok) {
        return { error: await res.text() }
      }
      return res.json()
    },
    enabled: Boolean(slug),
    staleTime: 60_000,
    gcTime: 5 * 60_000,
    refetchOnWindowFocus: false,
  })

  const eventId = data?.event?.eventId || data?.event?.id || undefined

  return { eventId, isLoading, isFetching, error, refetch }
}

export default useEventIdBySlug


