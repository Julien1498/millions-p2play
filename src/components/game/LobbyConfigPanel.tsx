import React, { useEffect, useState } from "react";
import { Mic, UserCheck, Play, Sparkles, Users, AlertCircle } from "lucide-react";
import { GlassCard } from "../ui/GlassCard";
import { Button } from "../ui/Button";
import { fetchCategoriesFromAPI, type QuizzCategory } from "../../core/apiQuizz";
import type { GameConfig, PresenterMode } from "../../core/types";

export interface LobbyConfigPanelProps {
  config: GameConfig;
  isHost: boolean;
  myPeerId: string;
  connectedPeers: string[];
  getPlayerName: (peerId: string) => string;
  onChangeConfig: (partial: Partial<GameConfig>) => void;
  onStartGame: (candidatePeerIds: string[]) => void;
}

export function LobbyConfigPanel({
  config,
  isHost,
  myPeerId,
  connectedPeers,
  getPlayerName,
  onChangeConfig,
  onStartGame,
}: LobbyConfigPanelProps) {
  const [categories, setCategories] = useState<QuizzCategory[]>([]);
  const [hasInitializedCandidates, setHasInitializedCandidates] = useState<boolean>(false);

  useEffect(() => {
    fetchCategoriesFromAPI().then(setCategories);
  }, []);

  // Deduplicate all player IDs and sort alphabetically for all clients
  const rawList = [myPeerId, ...connectedPeers];
  const allPlayers = Array.from(new Set(rawList))
    .filter((id) => id !== "local" || rawList.filter((x) => x !== "local").length === 0)
    .sort((a, b) => getPlayerName(a).localeCompare(getPlayerName(b), undefined, { sensitivity: "base" }));

  // Auto-assign host as presenter if presenterMode is HOST_PRESENTER but no presenter is assigned yet
  useEffect(() => {
    if (isHost && config.presenterMode === "HOST_PRESENTER" && !config.presenterPeerId) {
      onChangeConfig({ presenterPeerId: myPeerId });
    }
  }, [isHost, config.presenterMode, config.presenterPeerId, myPeerId, onChangeConfig]);

  const eligibleCandidates = allPlayers.filter(
    (peerId) => config.presenterMode !== "HOST_PRESENTER" || config.presenterPeerId !== peerId
  );

  // Auto-initialize candidatePeerIds to ALL eligible candidates on first load
  useEffect(() => {
    if (
      isHost &&
      !hasInitializedCandidates &&
      eligibleCandidates.length > 0 &&
      (!config.candidatePeerIds || config.candidatePeerIds.length === 0)
    ) {
      setHasInitializedCandidates(true);
      onChangeConfig({ candidatePeerIds: eligibleCandidates });
    }
  }, [isHost, hasInitializedCandidates, eligibleCandidates, config.candidatePeerIds, onChangeConfig]);

  // Use candidatePeerIds as explicitly set by the host (supporting empty array [])
  const selectedCandidates = Array.isArray(config.candidatePeerIds)
    ? config.candidatePeerIds.filter((id) => eligibleCandidates.includes(id))
    : eligibleCandidates;

  const areAllCandidatesSelected =
    eligibleCandidates.length > 0 &&
    selectedCandidates.length === eligibleCandidates.length;

  const handleModeChange = (mode: PresenterMode) => {
    if (!isHost) return;
    const presenterPeerId = mode === "HOST_PRESENTER" ? (config.presenterPeerId || myPeerId) : null;
    onChangeConfig({ presenterMode: mode, presenterPeerId });
  };

  const handleToggleCandidate = (peerId: string) => {
    if (!isHost) return;
    let nextCandidates: string[];
    if (selectedCandidates.includes(peerId)) {
      nextCandidates = selectedCandidates.filter((id) => id !== peerId);
    } else {
      nextCandidates = [...selectedCandidates, peerId];
    }
    onChangeConfig({ candidatePeerIds: nextCandidates });
  };

  const handleToggleAllCandidates = () => {
    if (!isHost) return;
    if (areAllCandidatesSelected) {
      onChangeConfig({ candidatePeerIds: [] });
    } else {
      onChangeConfig({ candidatePeerIds: eligibleCandidates });
    }
  };

  const isPresenterValid =
    config.presenterMode !== "HOST_PRESENTER" || Boolean(config.presenterPeerId);
  const isCandidatesValid = selectedCandidates.length > 0;
  const canStartGame = isPresenterValid && isCandidatesValid;

  const handleStart = () => {
    if (!canStartGame) return;
    onStartGame(selectedCandidates);
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-in fade-in duration-300">
      <div className="text-center space-y-2">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-sm font-semibold">
          <Sparkles className="w-4 h-4" /> Le Grand Quiz P2P
        </div>
        <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-amber-400 to-amber-500">
          Des Millions Dans la Poche !
        </h1>
        <p className="text-slate-400 text-sm">
          Définissez les rôles et la catégorie avant de vous lancer à l'assaut de la pyramide !
        </p>
      </div>

      <GlassCard className="space-y-6">
        {/* 1. Mode Selector */}
        <div className="space-y-3">
          <label className="text-sm font-bold text-amber-400 uppercase tracking-wider block">
            1. Mode de jeu (Présentateur)
          </label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <button
              onClick={() => handleModeChange("HOST_PRESENTER")}
              disabled={!isHost}
              className={`p-4 rounded-xl border text-left transition-all flex items-start gap-3 ${
                config.presenterMode === "HOST_PRESENTER"
                  ? "bg-amber-500/15 border-amber-400 shadow-lg shadow-amber-500/10"
                  : "bg-slate-900/60 border-slate-700/60 text-slate-400 hover:border-slate-600"
              }`}
            >
              <Mic className={`w-6 h-6 shrink-0 mt-0.5 ${config.presenterMode === "HOST_PRESENTER" ? "text-amber-400" : "text-slate-500"}`} />
              <div>
                <div className="font-bold text-slate-100 text-base">Avec Présentateur (Régie)</div>
                <div className="text-xs text-slate-400 mt-1">
                  Un joueur devient le présentateur principal. Il lit la question et gère le suspense !
                </div>
              </div>
            </button>

            <button
              onClick={() => handleModeChange("AUTO_PRESENTER")}
              disabled={!isHost}
              className={`p-4 rounded-xl border text-left transition-all flex items-start gap-3 ${
                config.presenterMode === "AUTO_PRESENTER"
                  ? "bg-amber-500/15 border-amber-400 shadow-lg shadow-amber-500/10"
                  : "bg-slate-900/60 border-slate-700/60 text-slate-400 hover:border-slate-600"
              }`}
            >
              <UserCheck className={`w-6 h-6 shrink-0 mt-0.5 ${config.presenterMode === "AUTO_PRESENTER" ? "text-amber-400" : "text-slate-500"}`} />
              <div>
                <div className="font-bold text-slate-100 text-base">Sans Présentateur (Automatique)</div>
                <div className="text-xs text-slate-400 mt-1">
                  Le moteur gère l'affichage, les chronos et les révélations en mode 100% automatique.
                </div>
              </div>
            </button>
          </div>
        </div>

        {/* 2. Presenter Selection */}
        {config.presenterMode === "HOST_PRESENTER" && (
          <div className="space-y-3 pt-3 border-t border-slate-800">
            <div className="flex items-center justify-between">
              <label className="text-sm font-bold text-amber-400 uppercase tracking-wider block">
                2. Désigner le Présentateur (Obligatoire)
              </label>
              {!config.presenterPeerId && (
                <span className="text-xs text-amber-400 flex items-center gap-1 font-semibold">
                  <AlertCircle className="w-3.5 h-3.5" /> Veuillez choisir un présentateur
                </span>
              )}
            </div>
            <div className="flex flex-wrap gap-2">
              {allPlayers.map((peerId) => (
                <button
                  key={peerId}
                  onClick={() => isHost && onChangeConfig({ presenterPeerId: peerId })}
                  disabled={!isHost}
                  className={`px-4 py-2 rounded-lg text-sm font-semibold border transition-all ${
                    config.presenterPeerId === peerId
                      ? "bg-amber-500 text-slate-950 border-amber-400 font-extrabold shadow-lg shadow-amber-500/20"
                      : "bg-slate-800/60 border-slate-700 text-slate-300 hover:border-slate-500"
                  }`}
                >
                  🎙️ {getPlayerName(peerId)}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* 3. Category Selection */}
        <div className="space-y-3 pt-3 border-t border-slate-800">
          <label className="text-sm font-bold text-amber-400 uppercase tracking-wider block">
            3. Catégorie de Questions (QuizzAPI v2)
          </label>
          <select
            value={config.categoryFilter}
            onChange={(e) => isHost && onChangeConfig({ categoryFilter: e.target.value })}
            disabled={!isHost}
            className="w-full bg-slate-900/90 border border-slate-700 rounded-xl px-4 py-3 text-slate-100 focus:border-amber-400 focus:outline-none text-sm font-medium"
          >
            <option value="all">🌐 Toutes les catégories (Culture Générale, Histoire, Science, ...)</option>
            {categories.map((c) => (
              <option key={c.id} value={c.slug}>
                📚 {c.name}
              </option>
            ))}
          </select>
        </div>

        {/* 4. Candidate(s) Selection */}
        <div className="space-y-3 pt-3 border-t border-slate-800">
          <div className="flex items-center justify-between">
            <label className="text-sm font-bold text-amber-400 uppercase tracking-wider block">
              4. Choisir les Candidats (Au moins 1 obligatoire)
            </label>
            {isHost && eligibleCandidates.length > 0 && (
              <button
                onClick={handleToggleAllCandidates}
                className="text-xs text-amber-400 hover:underline flex items-center gap-1 font-semibold cursor-pointer"
              >
                <Users className="w-3.5 h-3.5" />
                {areAllCandidatesSelected ? "🚫 Tout désélectionner" : "👥 Sélectionner TOUS les joueurs"}
              </button>
            )}
          </div>

          {!isCandidatesValid && (
            <div className="text-xs text-red-400 flex items-center gap-1.5 font-semibold bg-red-500/10 p-2.5 rounded-xl border border-red-500/30">
              <AlertCircle className="w-4 h-4 shrink-0" /> Veuillez sélectionner au moins 1 candidat pour lancer la partie.
            </div>
          )}

          <div className="flex flex-wrap gap-2">
            {eligibleCandidates.map((peerId) => {
              const isSelected = selectedCandidates.includes(peerId);
              return (
                <button
                  key={peerId}
                  onClick={() => handleToggleCandidate(peerId)}
                  disabled={!isHost}
                  className={`px-4 py-2 rounded-lg text-sm font-semibold border transition-all ${
                    isSelected
                      ? "bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 border-amber-300 font-extrabold shadow-lg shadow-amber-500/20"
                      : "bg-slate-800/60 border-slate-700 text-slate-300 hover:border-slate-500"
                  }`}
                >
                  🎓 {getPlayerName(peerId)} {isSelected ? "✓" : ""}
                </button>
              );
            })}
          </div>
        </div>

        {/* Start Action */}
        <div className="pt-4 border-t border-slate-800 flex justify-end">
          {isHost ? (
            <Button size="lg" onClick={handleStart} disabled={!canStartGame}>
              <Play className="w-5 h-5 fill-current" /> Lancer la Partie ! ({selectedCandidates.length} candidat{selectedCandidates.length > 1 ? "s" : ""})
            </Button>
          ) : (
            <div className="text-slate-400 text-sm italic">
              En attente du lancement par l'hôte du salon...
            </div>
          )}
        </div>
      </GlassCard>
    </div>
  );
}
