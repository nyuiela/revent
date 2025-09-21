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

// Function to get the last event ID from the subgraph
export async function getLastEventId(): Promise<number> {
  try {
    const { request } = await import('graphql-request');
    const client = new (await import('graphql-request')).GraphQLClient(eventUrl, { headers: eventHeaders });
    const data = await client.request(lastEventIdQuery) as { eventCreateds: { eventId: string }[] };

    if (data.eventCreateds && data.eventCreateds.length > 0) {
      const lastEventId = parseInt(data.eventCreateds[0].eventId);
      console.log('Last event ID from subgraph:', lastEventId);
      return lastEventId;
    }

    console.log('No events found in subgraph, starting from 0');
    return 0;
  } catch (error) {
    console.error('Error fetching last event ID from subgraph:', error);
    // Return 0 as fallback if subgraph query fails
    return 0;
  }
}

export { namesQuery, url, headers, eventUrl, eventHeaders, lastEventIdQuery }