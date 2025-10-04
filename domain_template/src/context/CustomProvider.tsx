// "use server";
// import { headers } from "next/headers";
import { ContextProvider } from "./ContextProvider";

async function CustomWagmiProvider({ children }: { children: React.ReactNode }) {
  // const headersObj = await headers();
  // const cookies = headersObj.get('cookie')

  return (
    <ContextProvider cookies={null}>
      {children}
    </ContextProvider>
  )
}

export default CustomWagmiProvider