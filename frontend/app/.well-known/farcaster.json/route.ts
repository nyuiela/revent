function withValidProperties(
  properties: Record<string, undefined | string | string[]>,
) {
  return Object.fromEntries(
    Object.entries(properties).filter(([key, value]) => {
      if (Array.isArray(value)) {
        return value.length > 0;
      }
      return !!value;
    }),
  );
}

// export async function GET() {
//   // Temporary redirect to Farcaster Hosted Manifest
//   const hostedManifestUrl = "https://api.farcaster.xyz/miniapps/hosted-manifest/0198f492-50fa-8ec5-436d-4d7c1783c395";

//   return Response.json({
//     accountAssociation: {
//       header: process.env.FARCASTER_HEADER,
//       payload: process.env.FARCASTER_PAYLOAD,
//       signature: process.env.FARCASTER_SIGNATURE,
//     },
//     frame: withValidProperties({
//       version: "1",
//       name: process.env.NEXT_PUBLIC_ONCHAINKIT_PROJECT_NAME,
//       subtitle: process.env.NEXT_PUBLIC_APP_SUBTITLE,
//       description: process.env.NEXT_PUBLIC_APP_DESCRIPTION,
//       screenshotUrls: [],
//       iconUrl: process.env.NEXT_PUBLIC_APP_ICON,
//       splashImageUrl: process.env.NEXT_PUBLIC_APP_SPLASH_IMAGE,
//       splashBackgroundColor: process.env.NEXT_PUBLIC_SPLASH_BACKGROUND_COLOR,
//       homeUrl: URL,
//       webhookUrl: `${URL}/api/webhook`,
//       primaryCategory: process.env.NEXT_PUBLIC_APP_PRIMARY_CATEGORY,
//       tags: [],
//       heroImageUrl: process.env.NEXT_PUBLIC_APP_HERO_IMAGE,
//       tagline: process.env.NEXT_PUBLIC_APP_TAGLINE,
//       ogTitle: process.env.NEXT_PUBLIC_APP_OG_TITLE,
//       ogDescription: process.env.NEXT_PUBLIC_APP_OG_DESCRIPTION,
//       ogImageUrl: process.env.NEXT_PUBLIC_APP_OG_IMAGE,
//       requiredChains: [
//         "eip155:8453"
//       ],
//       requiredCapabilities: [
//         "actions.signIn",
//         "wallet.getEthereumProvider",
//         "actions.swapToken"
//       ]
//     }),
//   });
// }


export async function GET() {
  // Temporary redirect to Farcaster Hosted Manifest
  const hostedManifestUrl = "https://api.farcaster.xyz/miniapps/hosted-manifest/0198f492-50fa-8ec5-436d-4d7c1783c395";

  return Response.redirect(hostedManifestUrl, 307);
}
