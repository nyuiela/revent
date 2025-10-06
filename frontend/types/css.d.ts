// CSS module declarations to suppress TypeScript import errors
declare module "*.css" {
  const content: Record<string, string>;
  export default content;
}

declare module "mapbox-gl/dist/mapbox-gl.css";
declare module "@coinbase/onchainkit/styles.css";
declare module "ethereum-identity-kit/css";
