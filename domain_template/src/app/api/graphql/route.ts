import { NextRequest } from "next/server";
import { graphql, buildSchema } from "graphql";

// Simple GraphQL schema and resolver using the provided sample structure
const schema = buildSchema(`
  scalar JSON

  type Nameserver { ldhName: String! }
  type Chain { name: String! }
  type Token {
    chain: Chain!
    ownerAddress: String!
    tokenAddress: String!
    tokenId: String!
    createdAt: String!
    expiresAt: String!
    networkId: String!
    openseaCollectionSlug: String
    orderbookDisabled: Boolean
    startsAt: String
    type: String!
  }
  type DsKey { algorithm: Int!, digest: String!, digestType: Int!, keyTag: Int! }
  type NameItem {
    name: String!
    nameservers: [Nameserver!]!
    expiresAt: String!
    tokenizedAt: String!
    transferLock: Boolean!
    tokens: [Token!]!
    isFractionalized: Boolean!
    eoi: Boolean!
    claimedBy: String!
    dsKeys: [DsKey!]!
  }
  type Names { items: [NameItem!]! }
  type Data { names: Names! }
  type Query { data: Data! }
`);

// Sample data in-memory
const sampleData = {
  data: {
    names: {
      items: [
        {
          name: "flipnaururyan.ai",
          nameservers: [
            { ldhName: "ns1-stage.d3.dev" },
            { ldhName: "ns2-stage.d3.dev" },
          ],
          expiresAt: "2027-09-07T16:00:58.000Z",
          tokenizedAt: "2025-09-07T16:02:12.790Z",
          transferLock: false,
          tokens: [
            {
              chain: { name: "Doma Testnet" },
              ownerAddress:
                "eip155:97476:0xfBcd711C910f3f6f24d2a655057b918Ea92e65A8",
              tokenAddress: "0x424bDf2E8a6F52Bd2c1C81D9437b0DC0309DF90f",
              tokenId:
                "13235211693820225204799566792073188123564899145936821149609226765505597220573",
              createdAt: "2025-09-07T16:02:14.305Z",
              expiresAt: "2027-09-07T16:00:58.000Z",
              networkId: "eip155:97476",
              openseaCollectionSlug: null,
              orderbookDisabled: null,
              startsAt: null,
              type: "OWNERSHIP",
            },
          ],
          isFractionalized: false,
          eoi: false,
          claimedBy:
            "eip155:97476:0xfBcd711C910f3f6f24d2a655057b918Ea92e65A8",
          dsKeys: [
            {
              algorithm: 13,
              digest:
                "0x65feae899fbfdda5dc0607e4d7241cfd79e0ee16f28c77a65f9733f216d34a06",
              digestType: 2,
              keyTag: 1498,
            },
            {
              algorithm: 13,
              digest:
                "0x288c24e7afa55e92f8e9b11d9bc8a86b5ac38aa5f6364291bfb417fb656b0e79a5e3764d359e9920331163410fe9ab37",
              digestType: 4,
              keyTag: 1498,
            },
          ],
        },
      ],
    },
  },
};

const rootValue = {
  data: () => sampleData.data,
};

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { query, variables } = body;
  const result = await graphql({ schema, source: query, rootValue, variableValues: variables });
  return new Response(JSON.stringify(result), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}

export async function GET() {
  // Provide basic schema info on GET for quick checks
  return new Response("GraphQL endpoint. Use POST with { query, variables }.", { status: 200 });
}


