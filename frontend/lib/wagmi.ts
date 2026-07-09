import { createConfig, http } from "wagmi";
import { celo } from "wagmi/chains";
import { injected, metaMask, walletConnect } from "wagmi/connectors";

const wcProjectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID;

export const wagmiConfig = createConfig({
  chains: [celo],
  // injected() is first so MiniPay/Valora in-app browsers auto-connect on load.
  connectors: [
    injected(),
    metaMask(),
    ...(wcProjectId ? [walletConnect({ projectId: wcProjectId })] : []),
  ],
  transports: { [celo.id]: http("https://forno.celo.org") },
});
