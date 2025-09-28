function withValidProperties(
  properties: Record<string, undefined | string | string[] | boolean>,
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

export async function GET() {
  // Temporary redirect to Farcaster Hosted Manifest
  const hostedManifestUrl = "https://api.farcaster.xyz/miniapps/hosted-manifest/0198f492-50fa-8ec5-436d-4d7c1783c395";

  return Response.json({
    accountAssociation: {
      header: process.env.FARCASTER_HEADER,
      payload: process.env.FARCASTER_PAYLOAD,
      signature: process.env.FARCASTER_SIGNATURE,
    },
    frame: {
      version: "1",
      name: process.env.NEXT_PUBLIC_ONCHAINKIT_PROJECT_NAME,
      subtitle: process.env.NEXT_PUBLIC_APP_SUBTITLE,
      description: process.env.NEXT_PUBLIC_APP_DESCRIPTION,
      screenshotUrls: ["https://revents.io/screenshot.png", "https://revents.io/screenshot2.png"],
      iconUrl: process.env.NEXT_PUBLIC_APP_ICON,
      splashImageUrl: process.env.NEXT_PUBLIC_APP_SPLASH_IMAGE,
      splashBackgroundColor: process.env.NEXT_PUBLIC_SPLASH_BACKGROUND_COLOR,
      homeUrl: process.env.NEXT_PUBLIC_URL as string,
      webhookUrl: `${process.env.NEXT_PUBLIC_URL}/api/webhook`,
      primaryCategory: process.env.NEXT_PUBLIC_APP_PRIMARY_CATEGORY,
      tags: ["event", "social", "gathering", "memories", "community"],
      heroImageUrl: process.env.NEXT_PUBLIC_APP_HERO_IMAGE,
      tagline: process.env.NEXT_PUBLIC_APP_TAGLINE,
      ogTitle: process.env.NEXT_PUBLIC_APP_OG_TITLE,
      ogDescription: process.env.NEXT_PUBLIC_APP_OG_DESCRIPTION,
      ogImageUrl: process.env.NEXT_PUBLIC_APP_OG_IMAGE,
      noindex: false,
      buttonTitle: "Make memories last",
      "baseBuilder": {
        allowedAddresses: ["0x26Acb30eC215FD5Ed507F95db14b33CAFCEd6472"]
      },
      requiredChains: [
        "eip155:8453"
      ],
      requiredCapabilities: [
        "actions.signIn",
        "wallet.getEthereumProvider",
        "actions.swapToken",
      ]
    },
  });
}

// "accountAssociation": {
//   "header": "eyJmaWQiOjkyNDYzMywidHlwZSI6ImF1dGgiLCJrZXkiOiIweDdiQzQxODY5ZjREMUNDZjE3YjYxNDBGNTI5NzEwMERkYjI5YzRmMjIifQ",
//     "payload": "eyJkb21haW4iOiIifQ",
//       "signature": "7CTYd4ZvBGqIMlg+H/VTyDUX9MgscS5or4YGsuGmfGQIYGtSiWIXc/BhL/7AyhVIwjoyM79WsRzYCZRYOrIjexw="

// export async function GET() {
//   // Temporary redirect to Farcaster Hosted Manifest
//   // const hostedManifestUrl = "https://api.farcaster.xyz/miniapps/hosted-manifest/0198f492-50fa-8ec5-436d-4d7c1783c395";
//   const hostedManifestUrl = "https://api.farcaster.xyz/miniapps/hosted-manifest/01996da9-99c8-5bf4-0195-4a05a5483dfc";

//   return Response.redirect(hostedManifestUrl, 307);
// }
