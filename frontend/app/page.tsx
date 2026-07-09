"use client";

import { useEffect, useRef, useState } from "react";
import { useAccount } from "wagmi";
import Landing from "@/components/Landing";
import GameScreen from "@/components/GameScreen";
import ConnectModal from "@/components/ConnectModal";
import HowToModal from "@/components/HowToModal";

type Screen = "landing" | "game";
type Modal = "connect" | "howto" | null;

export default function Home() {
  const { isConnected } = useAccount();
  const [screen, setScreen] = useState<Screen>("landing");
  const [modal, setModal] = useState<Modal>(null);
  const autoEntered = useRef(false);

  // If a wallet auto-connects (MiniPay/Valora in-app browser), skip straight to the game.
  useEffect(() => {
    if (isConnected && !autoEntered.current) {
      autoEntered.current = true;
      setScreen("game");
    }
  }, [isConnected]);

  if (screen === "game") {
    return <GameScreen onGoLanding={() => setScreen("landing")} />;
  }

  return (
    <>
      <Landing
        onEnterGame={() => setScreen("game")}
        onOpenConnect={() => setModal("connect")}
        onOpenHowTo={() => setModal("howto")}
      />
      {modal === "connect" && <ConnectModal onClose={() => setModal(null)} />}
      {modal === "howto" && <HowToModal onClose={() => setModal(null)} />}
    </>
  );
}
