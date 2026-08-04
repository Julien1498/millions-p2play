import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import type { PeerManagerLike } from "p2play-core";
import { App } from "./App";
import "./index.css";

export function mount(
  element: HTMLElement,
  options: {
    peerId: string;
    playerName?: string;
    playerAvatar?: string;
    externalPeerManager?: PeerManagerLike;
    isEmbedded?: boolean;
    onExit?: () => void;
  }
) {
  const styleId = "game-style-millions";
  if (!document.getElementById(styleId)) {
    const link = document.createElement("link");
    link.id = styleId;
    link.rel = "stylesheet";
    link.href = "/games/millions/style.css";
    document.head.appendChild(link);
  }

  const root = createRoot(element);
  root.render(
    <StrictMode>
      <App
        isEmbedded={true}
        externalPeerManager={options.externalPeerManager}
        onExit={options.onExit}
        playerName={options.playerName}
        playerAvatar={options.playerAvatar}
      />
    </StrictMode>
  );

  return () => root.unmount();
}

// Expose on global window object for Hub P2Play dynamic loading
(window as any).mountMillions = mount;

const rootEl = document.getElementById("root");
const mode = (import.meta as any).env?.MODE;
if (mode !== "lib" && rootEl && rootEl.children.length === 0) {
  createRoot(rootEl).render(
    <StrictMode>
      <App />
    </StrictMode>
  );
}
