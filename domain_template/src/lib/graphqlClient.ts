import { GraphQLClient } from "graphql-request";

export const endpoint = 'https://api-testnet.doma.xyz/graphql';
export const headers = { 
  'content-type': 'application/json', 
  'api-key': process.env.NEXT_PUBLIC_API_KEY || 'v1.84fc9a80cce2f402611693e608104892715c09f9c1be4cd8da4c17d47e89a0b9'
}

export const graphqlClient = new GraphQLClient(endpoint, {
  headers,
});

export async function requestGraphQL<T>(query: string, variables?: Record<string, unknown>) {
  try {
    return await graphqlClient.request<T>(query, variables);
  } catch (error) {
    console.error('GraphQL request failed:', error);
    throw error;
  }
}


