import React, { useState, useEffect, useMemo, useRef, useCallback } from "react";
import {
  P2PlayLobby,
  RoomCodeBadge,
  type PeerManagerLike,
  type ChatMessage,
} from "p2play-core";
import { loadProfile } from "p2play-core/session";
import { SoundToggle } from "p2play-core/ui";
import { TextChatPanel } from "p2play-core/chat";
import { LogOut, MessageSquare, RotateCcw } from "lucide-react";
import { usePeer } from "./hooks/usePeer";
import { useGame } from "./hooks/useGame";
import { useSoundEffects } from "./hooks/useSoundEffects";
import { LobbyConfigPanel } from "./components/game/LobbyConfigPanel";
import { CandidateScreen } from "./components/game/CandidateScreen";
import { PresenterDesk } from "./components/game/PresenterDesk";
import { VictoryGameOverModal } from "./components/game/VictoryGameOverModal";
import type { JokerType } from "./core/types";

export interface AppProps {
  isEmbedded?: boolean;
  externalPeerManager?: PeerManagerLike;
  onExit?: () => void;
  playerName?: string;
  playerAvatar?: string;
}

const MILLIONAIRE_AVATARS = ["💰", "👑", "🎙️", "🎓", "🧠", "✨"];

export function App({
  isEmbedded,
  externalPeerManager,
  onExit,
  playerName = "Joueur",
  playerAvatar = "💰",
}: AppProps) {
  const { peerManager, myPeerId, status, error, hostGame, joinGame, disconnect } = usePeer({
    externalPeerManager,
  });

  const [soundMuted, setSoundMuted] = useState(false);
  const soundEffects = useSoundEffects(!soundMuted);

  const handleSoundEffectTriggered = useCallback(
    (soundType: string) => {
      if (soundType === "suspense") {
        soundEffects.playFinalAnswerSound();
      } else if (soundType === "correct") {
        soundEffects.playCorrectSound();
      } else if (soundType === "wrong") {
        soundEffects.playWrongSound();
      } else if (soundType === "joker") {
        soundEffects.playJokerSound();
      } else if (soundType === "victory") {
        soundEffects.playVictorySound();
      } else if (soundType === "select") {
        soundEffects.playSelectSound();
      }
    },
    [soundEffects]
  );

  const isHost = peerManager.isHost;
  const { gameState, sendAction, getConnectedPeers, resetToLobby, clearFullSession } = useGame({
    peerManager,
    myPeerId: myPeerId || "local",
    isHost,
    onSoundEffectTriggered: handleSoundEffectTriggered,
  });

  const [chosenProfile, setChosenProfile] = useState<{ username: string; avatar: string }>(() => {
    const saved = loadProfile();
    return {
      username: saved?.username || playerName,
      avatar: saved?.avatar || playerAvatar,
    };
  });

  const [showChat, setShowChat] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);

  const activeMyPeerId = myPeerId || "local";

  // Prevent infinite loop by registering profile only when key changes
  const registeredKeyRef = useRef<string>("");
  useEffect(() => {
    const currentKey = `${activeMyPeerId}_${chosenProfile.username}_${chosenProfile.avatar}`;
    if (activeMyPeerId && chosenProfile.username && registeredKeyRef.current !== currentKey) {
      registeredKeyRef.current = currentKey;
      sendAction("REGISTER_PROFILE", {
        username: chosenProfile.username,
        avatar: chosenProfile.avatar,
      });
    }
  }, [activeMyPeerId, chosenProfile.username, chosenProfile.avatar, sendAction]);

  const getPlayerName = (peerId: string) => {
    if (gameState.playerProfiles && gameState.playerProfiles[peerId]?.username) {
      return gameState.playerProfiles[peerId].username;
    }
    if (peerManager.getTrustedUsername) {
      const trusted = peerManager.getTrustedUsername(peerId);
      if (trusted && !trusted.startsWith("Joueur_")) return trusted;
    }
    const lobbyPlayer = peerManager.lobbyPlayers?.find((p) => p.peerId === peerId);
    if (lobbyPlayer?.username) return lobbyPlayer.username;
    if (peerId === activeMyPeerId) return chosenProfile.username;
    return `Joueur ${peerId.slice(0, 4)}`;
  };

  const isPresenter =
    gameState.config.presenterMode === "HOST_PRESENTER" &&
    gameState.config.presenterPeerId === activeMyPeerId;

  const presenterName =
    gameState.config.presenterMode === "HOST_PRESENTER" && gameState.config.presenterPeerId
      ? getPlayerName(gameState.config.presenterPeerId)
      : "Automatique (Moteur)";

  // Memoize soundManagerAdapter object to prevent infinite re-render loop in SoundToggle
  const soundManagerAdapter = useMemo(
    () => ({
      setEnabled: (enabled: boolean) => setSoundMuted(!enabled),
    }),
    []
  );

  // Chat message listener (single insertion with resolved pseudos)
  useEffect(() => {
    peerManager.onChatReceived = (msg: any) => {
      const resolvedSender =
        (msg.senderPeerId && getPlayerName(msg.senderPeerId)) ||
        (msg.sender && !msg.sender.startsWith("Joueur_") ? msg.sender : null) ||
        getPlayerName(activeMyPeerId);

      setChatMessages((prev) => [
        ...prev,
        {
          type: "CHAT",
          sender: resolvedSender,
          time: new Date(msg.timestamp || Date.now()).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          }),
          text: msg.text,
        },
      ]);
    };
    return () => {
      peerManager.onChatReceived = null;
    };
  }, [peerManager, activeMyPeerId, gameState.playerProfiles]);

  const handleSendChat = (text: string) => {
    const senderName = getPlayerName(activeMyPeerId);
    peerManager.sendChat(senderName, text);
  };

  const handleHost = (username: string, avatar: string) => {
    registeredKeyRef.current = "";
    clearFullSession();
    setChosenProfile({ username, avatar });
    hostGame(undefined, { username, avatar });
  };

  const handleJoin = (username: string, avatar: string, code: string) => {
    registeredKeyRef.current = "";
    clearFullSession();
    setChosenProfile({ username, avatar });
    joinGame(code, { username, avatar });
  };

  const handleDisconnect = () => {
    registeredKeyRef.current = "";
    clearFullSession();
    setChatMessages([]);
    disconnect();
  };

  // 1. Initial Home / Creation Screen
  if (!isEmbedded && status !== "CONNECTED") {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#040919] via-[#070e28] to-[#02050e] text-slate-100 p-4 md:p-8 flex items-center justify-center relative overflow-hidden bg-cover bg-center bg-no-repeat" style={{ backgroundImage: `linear-gradient(to bottom, rgba(4, 9, 25, 0.85), rgba(7, 14, 40, 0.95)), url('quiz_studio_bg.jpg')` }}>
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-amber-500/15 rounded-full blur-3xl pointer-events-none animate-pulse" />
        <div className="absolute bottom-10 right-10 w-80 h-80 bg-blue-600/15 rounded-full blur-3xl pointer-events-none" />

        <P2PlayLobby
          title="DES MILLIONS DANS LA POCHE !"
          subtitle="Le Grand Quiz P2P de 15 questions au sommet"
          bannerEmoji="💰"
          avatars={MILLIONAIRE_AVATARS}
          theme="amber"
          status={status}
          error={error}
          joinLayout="side-by-side"
          onHost={handleHost}
          onJoin={handleJoin}
          classes={{
            root: "w-full max-w-lg mx-auto p-6 md:p-8 rounded-3xl bg-[#0b1736]/95 backdrop-blur-2xl border-2 border-amber-500/50 shadow-2xl text-center space-y-6 shadow-amber-500/10 relative z-10",
            title: "text-2xl md:text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-amber-400 to-amber-500 tracking-tight",
            subtitle: "text-xs font-bold text-amber-400/80 uppercase tracking-widest mt-1",
            input: "w-full bg-[#050b18] border border-amber-500/40 rounded-xl px-4 py-3 text-slate-100 placeholder-slate-500 focus:border-amber-400 focus:outline-none text-sm font-semibold",
            createButton: "w-full bg-gradient-to-r from-amber-500 via-amber-400 to-amber-600 text-slate-950 font-extrabold py-3.5 px-6 rounded-xl shadow-lg shadow-amber-500/25 hover:from-amber-400 hover:to-amber-500 transition-all cursor-pointer border border-amber-300/40",
            joinGroup: "flex flex-row items-center gap-2 w-full mt-2",
            joinInput: "flex-1 min-w-0 bg-[#050b18] border border-amber-500/40 rounded-xl px-3 py-2.5 text-slate-100 placeholder-slate-500 focus:border-amber-400 focus:outline-none text-xs md:text-sm font-semibold uppercase tracking-wider text-center",
            joinButton: "shrink-0 bg-slate-900/90 text-amber-300 font-bold py-2.5 px-4 rounded-xl border border-amber-500/30 hover:bg-slate-800 transition-all cursor-pointer text-xs md:text-sm whitespace-nowrap",
            urlNotice: "p-5 bg-slate-950/80 border border-amber-500/40 rounded-2xl text-left space-y-4 shadow-inner",
          }}
        />
      </div>
    );
  }

  const currentDisplayName = getPlayerName(activeMyPeerId);

  // 2. Connected Room (Lobby Config + Game Screen)
  return (
    <div className="min-h-screen bg-gradient-to-b from-[#040919] via-[#070e28] to-[#02050e] text-slate-100 p-4 md:p-6 space-y-6 selection:bg-amber-500 selection:text-black relative bg-cover bg-center bg-no-repeat" style={{ backgroundImage: `linear-gradient(to bottom, rgba(4, 9, 25, 0.88), rgba(7, 14, 40, 0.95)), url('quiz_studio_bg.jpg')` }}>
      {/* Header Bar */}
      <header className="max-w-6xl mx-auto flex items-center justify-between bg-[#0b1736]/95 backdrop-blur-xl border border-amber-500/40 p-3 md:p-4 rounded-2xl shadow-2xl">
        <div className="flex items-center gap-3">
          <span className="text-2xl">{chosenProfile.avatar}</span>
          <div>
            <h1 className="font-extrabold text-amber-400 text-sm md:text-base tracking-wide">
              Des Millions Dans la Poche !
            </h1>
            <p className="text-xs text-slate-400 font-medium">
              {isPresenter ? "🎙️ Présentateur (Régie)" : `🎓 Candidat • Présenté par ${presenterName}`} • {currentDisplayName}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <RoomCodeBadge code={peerManager.hostPeerId || activeMyPeerId} label="Salon" accentClassName="text-amber-400" />

          {/* Return to Lobby button reserved exclusively for Host during an active game */}
          {isHost && gameState.phase !== "LOBBY" && (
            <button
              onClick={() => sendAction("RESET_LOBBY")}
              className="p-2 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/40 transition-all text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-md"
              title="Ramener tout le monde au salon de configuration (Hôte uniquement)"
            >
              <RotateCcw className="w-4 h-4" /> Salon (Hôte)
            </button>
          )}

          {/* Text Chat Button visible when connected to the room */}
          <button
            onClick={() => setShowChat((v) => !v)}
            className={`p-2 rounded-xl border transition-all text-xs font-bold flex items-center gap-1.5 cursor-pointer ${
              showChat
                ? "bg-amber-500 text-slate-950 border-amber-400"
                : "bg-slate-800/80 hover:bg-slate-700 text-amber-400 border-amber-500/30"
            }`}
          >
            <MessageSquare className="w-4 h-4" /> Chat ({chatMessages.length})
          </button>

          <SoundToggle soundManager={soundManagerAdapter} />

          {isEmbedded && onExit ? (
            <button
              onClick={() => {
                handleDisconnect();
                onExit();
              }}
              className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-amber-400 border border-amber-500/30 transition-all text-xs font-bold flex items-center gap-1.5 cursor-pointer"
            >
              <LogOut className="w-4 h-4" /> Hub
            </button>
          ) : (
            <button
              onClick={handleDisconnect}
              className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-red-400 border border-red-500/30 transition-all text-xs font-bold flex items-center gap-1.5 cursor-pointer"
            >
              <LogOut className="w-4 h-4" /> Quitter
            </button>
          )}
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-6xl mx-auto relative">
        {gameState.phase === "LOBBY" ? (
          <LobbyConfigPanel
            config={gameState.config}
            isHost={isHost}
            myPeerId={activeMyPeerId}
            connectedPeers={getConnectedPeers()}
            getPlayerName={getPlayerName}
            onChangeConfig={(partial) => sendAction("CHANGE_CONFIG", { config: partial })}
            onStartGame={(candidatePeerIds) => sendAction("START_GAME", { candidatePeerIds })}
          />
        ) : isPresenter ? (
          <PresenterDesk
            gameState={gameState}
            getPlayerName={getPlayerName}
            onLockFinalAnswer={() => sendAction("LOCK_FINAL_ANSWER")}
            onRevealResult={() => {
              sendAction("PRESENTER_REVEAL");
            }}
            onNextQuestion={() => sendAction("NEXT_QUESTION")}
            onPlaySoundEffect={(type) => {
              sendAction("PLAY_SOUND_EFFECT", { soundType: type });
            }}
          />
        ) : (
          <CandidateScreen
            gameState={gameState}
            myPeerId={activeMyPeerId}
            isPresenter={isPresenter}
            getPlayerName={getPlayerName}
            onSelectChoice={(index) => {
              sendAction("SELECT_ANSWER", { selectedIndex: index });
            }}
            onLockFinalAnswer={() => {
              sendAction("LOCK_FINAL_ANSWER");
            }}
            onRevealResult={() => {
              sendAction("PRESENTER_REVEAL");
            }}
            onNextQuestion={() => sendAction("NEXT_QUESTION")}
            onTriggerJoker={(type: JokerType) => {
              sendAction("TRIGGER_JOKER", { jokerType: type });
            }}
            onWalkAway={() => sendAction("WALK_AWAY")}
          />
        )}

        {/* Floating / Sidebar Text Chat Panel */}
        {showChat && (
          <div className="fixed bottom-4 right-4 z-40 w-80 md:w-96 shadow-2xl animate-in slide-in-from-bottom-5 duration-200">
            <TextChatPanel
              messages={chatMessages}
              onSend={handleSendChat}
              scrollbarAccent="amber"
              title="Chat du Salon"
              className="bg-[#0b1736]/95 border-2 border-amber-500/50 rounded-2xl p-4 shadow-2xl backdrop-blur-xl text-slate-100"
            />
          </div>
        )}
      </main>

      {/* End Game Modal */}
      <VictoryGameOverModal
        phase={gameState.phase}
        earnings={gameState.earnings}
        isHost={isHost}
        onResetLobby={() => sendAction("RESET_LOBBY")}
      />
    </div>
  );
}
