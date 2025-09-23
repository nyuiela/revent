import { gql } from "graphql-request";
const url = 'https://api-testnet.doma.xyz/graphql'
const headers = { 'content-type': 'application/json', 'api-key': 'v1.84fc9a80cce2f402611693e608104892715c09f9c1be4cd8da4c17d47e89a0b9' }
const namesQuery = gql`{
  names {
    items {
      name
      nameservers {
        ldhName
      }
      expiresAt
      tokenizedAt
      transferLock
      tokens {
        chain {
          name
        }
        ownerAddress
        tokenAddress
        tokenId
        createdAt
        expiresAt
        networkId
        openseaCollectionSlug
        orderbookDisabled
        ownerAddress
        startsAt
        type
      }
      isFractionalized
      eoi
      claimedBy
      dsKeys {
        algorithm
        digest
        digestType
        keyTag
      }
      fractionalTokenInfo {
        address
        boughtOutAt
        boughtOutBy
        boughtOutTxHash
        buyoutPrice
        chain {
          name
        }
        fractionalizedAt
        fractionalizedBy
        fractionalizedTxHash
        id
        launchpadAddress
        poolAddress
        status
        vestingWalletAddress
        params {
          finalLaunchpadPrice
          initialLaunchpadPrice
          initialPoolPrice
          initialValuation
          launchEndDate
          launchStartDate
          launchpadData
          launchpadFeeBps
          launchpadSupply
          launchpadType
          name
          poolFeeBps
          poolSupply
          symbol
          totalSupply
          vestingCliffSeconds
          vestingDurationSeconds
          decimals
        }
      }
    }
  }
}`

// Event subgraph configuration
const eventUrl = 'https://api.studio.thegraph.com/query/87766/stream/version/latest';
const eventHeaders = {
  'Authorization': 'Bearer 6abc6de0d06cbf79f985314ef9647365',
  'Content-Type': 'application/json'
};

// Query to get the last event ID
const lastEventIdQuery = gql`
  query GetLastEventId {
    eventCreateds(first: 1, orderBy: eventId, orderDirection: desc) {
      eventId
    }
  }
`;

// Function to get the last event ID from the subgraph with fallback
export async function getLastEventId(): Promise<number> {
  try {
    // Fast path: try our own events API (same source used by hooks)
    const apiTimeout = new Promise((_, reject) => setTimeout(() => reject(new Error('Events API timeout')), 3000))
    const apiDataPromise = fetch('/api/events/graph')
      .then(r => {
        if (!r.ok) throw new Error('Events API failed')
        return r.json()
      })
      .then((d: { events?: Array<{ id?: string }> }) => {
        const ids = (d.events || [])
          .map(e => (e && typeof e.id === 'string' ? parseInt(e.id, 10) : NaN))
          .filter(n => Number.isFinite(n)) as number[]
        if (ids.length > 0) return Math.max(...ids)
        return null
      })

    const apiResult = await Promise.race([apiDataPromise, apiTimeout]) as number | null
    if (typeof apiResult === 'number' && Number.isFinite(apiResult)) {
      if (typeof window !== 'undefined') localStorage.setItem('lastEventId', String(apiResult))
      return apiResult
    }

    // Subgraph fallback
    const { request } = await import('graphql-request');
    const client = new (await import('graphql-request')).GraphQLClient(eventUrl, { headers: eventHeaders });

    // Add timeout to prevent hanging
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Graph API timeout')), 3000)
    );

    const dataPromise = client.request(lastEventIdQuery) as Promise<{ eventCreateds: { eventId: string }[] }>;

    const data = await Promise.race([dataPromise, timeoutPromise]) as { eventCreateds: { eventId: string }[] };

    if (data.eventCreateds && data.eventCreateds.length > 0) {
      const lastEventId = parseInt(data.eventCreateds[0].eventId);
      console.log('Last event ID from subgraph:', lastEventId);

      // Cache the result
      if (typeof window !== 'undefined') {
        localStorage.setItem('lastEventId', lastEventId.toString());
      }

      return lastEventId;
    }

    console.log('No events found in subgraph, starting from 0');
    return 0;
  } catch (error) {
    console.error('Error fetching last event ID from subgraph, using fallback:', error);

    // Handle rate limiting specifically
    if (error instanceof Error && error.message.includes('429')) {
      console.log('Rate limited by Graph API, using cached or fallback ID');
    }

    // Try to use cached ID if available
    if (typeof window !== 'undefined') {
      const cachedId = localStorage.getItem('lastEventId');
      if (cachedId) {
        const cached = parseInt(cachedId);
        console.log('Using cached event ID due to API error:', cached);
        return cached;
      }
    }

    // Return a timestamp-based fallback to avoid conflicts
    const fallbackId = Math.floor(Date.now() / 1000) % 1000000; // Use last 6 digits of timestamp
    console.log('Using fallback event ID:', fallbackId);

    // Cache the fallback
    if (typeof window !== 'undefined') {
      localStorage.setItem('lastEventId', fallbackId.toString());
    }

    return fallbackId;
  }
}

// Function to update the cached last event ID
export function updateLastEventId(eventId: number) {
  if (typeof window !== 'undefined') {
    localStorage.setItem('lastEventId', eventId.toString());
    console.log('Updated cached event ID to:', eventId);
  }
}

export { namesQuery, url, headers, eventUrl, eventHeaders, lastEventIdQuery }