import { useCallback, useEffect, useRef, useState } from "react";
import type { PeerManagerLike } from "p2play-core";
import { MillionaireEngine } from "../core/millionaireEngine";
import { prepareGameQuestionPool, fetchQuizzesFromAPI } from "../core/apiQuizz";
import { sanitizeGameStateForViewer } from "../network/sanitizer";
import type { GameState } from "../core/types";
import type { ClientActionEnvelope } from "../network/protocol";

export function useGame(options: {
  peerManager: PeerManagerLike;
  myPeerId: string;
  isHost: boolean;
  onSoundEffectTriggered?: (soundType: string) => void;
}) {
  const { peerManager, myPeerId, isHost, onSoundEffectTriggered } = options;
  const engineRef = useRef<MillionaireEngine>(new MillionaireEngine());
  const [gameState, setGameState] = useState<GameState>(engineRef.current.state);

  const resetToLobby = useCallback(() => {
    engineRef.current.resetToLobby();
    setGameState(sanitizeGameStateForViewer(engineRef.current.state, myPeerId));
  }, [myPeerId]);

  // Completely wipe state (including player profiles) when destroying or creating a brand new room session
  const clearFullSession = useCallback(() => {
    engineRef.current.state = engineRef.current.createInitialState();
    setGameState(sanitizeGameStateForViewer(engineRef.current.state, myPeerId));
  }, [myPeerId]);

  // Return all connected room peer IDs excluding myPeerId, synced via WebRTC profiles & lobby presence
  const getConnectedPeers = useCallback(() => {
    const peersSet = new Set<string>();

    if (peerManager.connections) {
      Array.from(peerManager.connections.keys()).forEach((id) => peersSet.add(id));
    }
    if (peerManager.lobbyPlayers) {
      peerManager.lobbyPlayers.forEach((p) => peersSet.add(p.peerId));
    }
    if (gameState.playerProfiles) {
      Object.keys(gameState.playerProfiles).forEach((id) => peersSet.add(id));
    }

    // Explicitly remove all self representations to prevent duplication
    peersSet.delete("local");
    if (myPeerId) peersSet.delete(myPeerId);
    if (peerManager.myPeerId) peersSet.delete(peerManager.myPeerId);
    if (isHost && peerManager.hostPeerId) peersSet.delete(peerManager.hostPeerId);

    return Array.from(peersSet);
  }, [peerManager, gameState.playerProfiles, myPeerId, isHost]);

  const broadcastSanitizedStates = useCallback(
    (rawState: GameState) => {
      if (!isHost) return;
      // Deep clone rawState so React ALWAYS detects mutations and triggers re-render
      const freshCopy: GameState = JSON.parse(JSON.stringify(rawState));
      setGameState(sanitizeGameStateForViewer(freshCopy, myPeerId));

      const connectedPeerIds = getConnectedPeers();
      connectedPeerIds.forEach((peerId) => {
        const sanitized = sanitizeGameStateForViewer(freshCopy, peerId);
        const conn = peerManager.connections.get(peerId);
        if (conn && conn.open) {
          // Send both native STATE_UPDATE and custom GAME_STATE_UPDATE for 100% hub compatibility
          conn.send({
            type: "STATE_UPDATE",
            state: sanitized,
          });
          conn.send({
            type: "GAME_STATE_UPDATE",
            state: sanitized,
          });
        }
      });
    },
    [isHost, myPeerId, peerManager, getConnectedPeers]
  );

  const broadcastSoundEffect = useCallback(
    (soundType: string) => {
      onSoundEffectTriggered?.(soundType);
      if (!isHost) return;
      const connectedPeerIds = getConnectedPeers();
      connectedPeerIds.forEach((peerId) => {
        const conn = peerManager.connections.get(peerId);
        if (conn && conn.open) {
          conn.send({
            type: "PLAY_SOUND_EFFECT",
            soundType,
          });
        }
      });
    },
    [isHost, peerManager, getConnectedPeers, onSoundEffectTriggered]
  );

  const handleHostAction = useCallback(
    async (envelope: ClientActionEnvelope & { rawSenderPeerId?: string }) => {
      if (!isHost) return;
      const engine = engineRef.current;
      const { type, senderPeerId, rawSenderPeerId, payload } = envelope;

      const rawSender = rawSenderPeerId || senderPeerId;

      const isPresenterSender =
        engine.state.config.presenterMode !== "HOST_PRESENTER" ||
        senderPeerId === engine.state.config.presenterPeerId ||
        rawSender === engine.state.config.presenterPeerId ||
        senderPeerId === myPeerId ||
        isHost;

      // Allow any connected player/client in the room to act as candidate
      const isCandidateSender = true;

      switch (type) {
        case "REGISTER_PROFILE":
          if (payload?.username) {
            engine.registerProfile(senderPeerId, payload.username, payload.avatar);
            if (rawSender && rawSender !== senderPeerId) {
              engine.registerProfile(rawSender, payload.username, payload.avatar);
            }
            broadcastSanitizedStates(engine.state);
          }
          break;

        case "CHANGE_CONFIG":
          if ((senderPeerId === myPeerId || isHost) && payload?.config) {
            engine.setConfig(payload.config);
            broadcastSanitizedStates(engine.state);
          }
          break;

        case "START_GAME":
          if (senderPeerId !== myPeerId && !isHost) return;

          if (
            engine.state.config.presenterMode === "HOST_PRESENTER" &&
            !engine.state.config.presenterPeerId
          ) {
            engine.setConfig({ presenterPeerId: myPeerId });
          }

          const candidates =
            payload?.candidatePeerIds ||
            (payload?.candidatePeerId ? [payload.candidatePeerId] : null) ||
            engine.state.config.candidatePeerIds;

          const activeList =
            Array.isArray(candidates) && candidates.length > 0
              ? candidates
              : engine.state.config.candidatePeerIds.length > 0
              ? engine.state.config.candidatePeerIds
              : [];

          if (activeList.length === 0) return;

          const pool = await prepareGameQuestionPool(engine.state.config.categoryFilter);
          engine.startGame(pool, activeList);
          broadcastSanitizedStates(engine.state);
          break;

        case "REVEAL_NEXT_CHOICE":
          if (!isPresenterSender) return;
          if (engine.revealNextChoice()) {
            broadcastSanitizedStates(engine.state);
            broadcastSoundEffect("select");
          }
          break;

        case "REVEAL_ALL_CHOICES":
          if (!isPresenterSender) return;
          if (engine.revealAllChoices()) {
            broadcastSanitizedStates(engine.state);
            broadcastSoundEffect("select");
          }
          break;

        case "SELECT_ANSWER":
          if (!isCandidateSender) return;
          if (typeof payload?.selectedIndex === "number") {
            if (engine.selectAnswer(payload.selectedIndex)) {
              broadcastSanitizedStates(engine.state);
            }
          }
          break;

        case "LOCK_FINAL_ANSWER":
          if (!isCandidateSender) return;
          if (engine.lockFinalAnswer()) {
            broadcastSanitizedStates(engine.state);
            broadcastSoundEffect("suspense");
          }
          break;

        case "PRESENTER_REVEAL":
          if (!isPresenterSender) return;
          if (engine.revealResult()) {
            broadcastSanitizedStates(engine.state);
            if (engine.state.phase === "QUESTION_SUCCESS") {
              broadcastSoundEffect("correct");
            } else if (engine.state.phase === "GAME_OVER") {
              broadcastSoundEffect("wrong");
            } else if (engine.state.phase === "VICTORY") {
              broadcastSoundEffect("victory");
            }
          }
          break;

        case "NEXT_QUESTION":
          if (!isPresenterSender) return;
          if (engine.state.phase === "QUESTION_SUCCESS") {
            engine.nextLevel();
            broadcastSanitizedStates(engine.state);
          }
          break;

        case "TRIGGER_JOKER":
          if (!isCandidateSender) return;
          if (payload?.jokerType) {
            if (payload.jokerType === "SWITCH") {
              const seenIds = new Set<string>(engine.state.usedQuestionIds);
              const seenTexts = new Set<string>(
                engine.state.questionPool.map((q) => q.question.trim().toLowerCase().replace(/\s+/g, " "))
              );
              const [newQ] = await fetchQuizzesFromAPI(
                engine.state.currentQuestion?.difficulty || "normal",
                engine.state.config.categoryFilter,
                1,
                seenIds,
                seenTexts
              );
              if (engine.triggerJoker("SWITCH", newQ)) {
                broadcastSanitizedStates(engine.state);
                broadcastSoundEffect("joker");
              }
            } else {
              if (engine.triggerJoker(payload.jokerType)) {
                broadcastSanitizedStates(engine.state);
                broadcastSoundEffect("joker");
              }
            }
          }
          break;

        case "PLAY_SOUND_EFFECT":
          if (!isPresenterSender) return;
          if (payload?.soundType) {
            broadcastSoundEffect(payload.soundType);
          }
          break;

        case "WALK_AWAY":
          if (!isCandidateSender) return;
          if (engine.walkAway()) {
            broadcastSanitizedStates(engine.state);
          }
          break;

        case "RESET_LOBBY":
          if (senderPeerId === myPeerId || isHost) {
            engine.resetToLobby();
            broadcastSanitizedStates(engine.state);
          }
          break;
      }
    },
    [isHost, myPeerId, broadcastSanitizedStates, broadcastSoundEffect]
  );

  const sendAction = useCallback(
    (actionType: string, payload?: any) => {
      const envelope: ClientActionEnvelope = {
        type: actionType as any,
        senderPeerId: myPeerId,
        payload,
      };

      if (isHost) {
        handleHostAction(envelope);
      } else {
        // Use "ACTION" type so hub-p2play peerManager routes it to hostActionHandler
        // (hub's switch statement only calls hostActionHandler for case 'ACTION')
        peerManager.sendToHost("ACTION", { envelope });
      }
    },
    [isHost, myPeerId, peerManager, handleHostAction]
  );

  useEffect(() => {
    if (isHost) {
      // Robust multi-signature handler to handle both (data, senderPeerId) and (senderPeerId, data) signatures from p2play-core
      peerManager.hostActionHandler = (arg1: any, arg2: any) => {
        let msg = arg1;
        let senderId = typeof arg2 === "string" ? arg2 : typeof arg1 === "string" ? arg1 : null;

        if (typeof arg1 === "string" && typeof arg2 === "object") {
          senderId = arg1;
          msg = arg2;
        }

        // Handle ACTION (hub routing), CLIENT_ACTION (legacy), or direct envelope
        const env = msg?.envelope || (msg?.type === "CLIENT_ACTION" || msg?.type === "ACTION" ? msg?.envelope : null);
        const actualSender = senderId || env?.senderPeerId || "unknown";

        if (env) {
          handleHostAction({
            ...env,
            senderPeerId: actualSender,
            rawSenderPeerId: env.senderPeerId,
          });
        }
      };
    } else {
      const previousStateReceived = peerManager.onStateReceived;
      peerManager.onStateReceived = (state: any) => {
        previousStateReceived?.(state);
        if (state) {
          setGameState(state);
        }
      };

      const previousCustomMessage = peerManager.onCustomMessage;
      peerManager.onCustomMessage = (msg: any) => {
        previousCustomMessage?.(msg);
        if (msg?.type === "GAME_STATE_UPDATE" && msg?.state) {
          setGameState(msg.state);
        } else if (msg?.type === "PLAY_SOUND_EFFECT" && msg?.soundType) {
          onSoundEffectTriggered?.(msg.soundType);
        }
      };
    }

    return () => {
      if (isHost) {
        peerManager.hostActionHandler = null;
      } else {
        peerManager.onStateReceived = null;
        peerManager.onCustomMessage = null;
      }
    };
  }, [peerManager, isHost, handleHostAction, onSoundEffectTriggered]);

  return {
    gameState,
    sendAction,
    isHost,
    getConnectedPeers,
    resetToLobby,
    clearFullSession,
  };
}
