# 💰 Des Millions Dans la Poche ! - P2P Edition

[![Deploy to GitHub Pages](https://github.com/Julien1498/millions-p2play/actions/workflows/deploy.yml/badge.svg)](https://github.com/Julien1498/millions-p2play/actions/workflows/deploy.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-amber.svg)](https://opensource.org/licenses/MIT)

**Des Millions Dans la Poche !** est le grand quiz TV multijoueur Peer-to-Peer standalone basé sur WebRTC, jouable directement dans votre navigateur sans aucun serveur centralisé.

Retrouvez toute l'émotion et le suspense du célèbre jeu télévisé de 15 questions au sommet, avec une régie présentateur en direct, des atouts interactifs et un décor immersif de plateau TV.

---

## 🎮 Démo en Ligne

Jouez directement sur votre navigateur sans aucune installation :
👉 **[Jouer à la démo en ligne](https://julien1498.github.io/millions-p2play/)**

---

## ✨ Fonctionnalités Clés

- **Connexion P2P via [`p2play-core`](https://github.com/gab371/p2play-core)** (≥ v0.7.1) : PeerJS, salon partagé par code de room, avatars, présence en direct et chat textuel.
- **Régie Présentateur Unifiée (`PresenterDesk.tsx`)** :
  - **Mode Régie Présentateur** (un joueur joue le rôle du présentateur TV) ou **Mode Automatique** (moteur autonome).
  - Contrôle d'apparition des 4 choix de réponse **une par une** ou **toutes d'un coup** avec effets sonores.
  - Déclencheur de musique de suspense, verrouillage du "Dernier Mot" et révélation des résultats en plateau.
- **Pyramide des 15 Niveaux & Paliers de Sécurité** :
  - Palier 1 : **800 €** (Niveau 5)
  - Palier 2 : **24 000 €** (Niveau 10)
  - Le Grand Sommet : **1 000 000 €** (Niveau 15)
- **4 Atouts Classiques (Jokers)** :
  - ✂️ **50:50** : Élimine deux mauvaises réponses au hasard.
  - 📞 **Appel à un Ami** : Conseils et indices d'un ami virtuel avec taux de confiance réactif.
  - 👥 **Avis du Public** : Sondage en direct représenté par des statistiques de vote du public.
  - 🔄 **Changement de Question (`SWITCH`)** : Remplace la question en cours par une question inédite.
- **Sécurité Anti-Triche Réseau (Host-Authoritative)** :
  - Masquage intégral de la bonne réponse (`sanitizer.ts`) dans les paquets WebRTC transmis aux candidats (impossible de tricher via les DevTools).
  - Validation stricte des émetteurs réseau (`senderPeerId`).
- **Renouvellement Dynamique des Questions** :
  - Intégration de l'API **QuizzAPI** avec pagination aléatoire et mémoire rolling `localStorage` sur 150 questions pour éliminer la répétition d'une partie à l'autre.
  - Banque locale de secours hors-ligne avec plus de 35 questions réparties sur 11 catégories officielles.
- **Hub P2Play** : Exporté en module autonome pouvant être intégré dans le [hub-p2play](https://github.com/gab371/hub-p2play).

---

## 🛠️ Lancement Local

### Prérequis
- **Node.js** (v20 ou supérieur recommandé)
- **npm**

### Instructions

1. **Cloner le projet** :
   ```bash
   git clone https://github.com/Julien1498/millions-p2play.git
   cd millions-p2play
   ```

2. **Installer les dépendances** :
   ```bash
   npm install
   ```

3. **Lancer le serveur de développement** :
   ```bash
   npm run dev
   ```

4. **Ouvrir dans le navigateur** :
   Ouvrez `http://localhost:5173/` (ou le port indiqué par Vite).
   *Pour tester une partie à plusieurs sur la même machine, ouvrez un deuxième onglet ou une fenêtre de navigation privée.*

5. **Compiler pour la production** :
   ```bash
   npm run build
   # Pour générer également la bibliothèque P2Play Hub :
   npm run build:lib
   ```

---

## 🏛️ Architecture du Projet

Le projet respecte une séparation stricte des responsabilités pour garantir une testabilité et une maintenabilité optimales :

- **`/src/core`** : Moteur de jeu autoritaire pur (`MillionaireEngine.ts`, `ladder.ts`, `jokers.ts`, `apiQuizz.ts`, `fallbackQuestions.ts`) écrit en TypeScript pur, sans aucune dépendance DOM ou réseau.
- **`/src/network`** : Protocole WebRTC (`protocol.ts`) et masquage de sécurité des réponses (`sanitizer.ts`).
- **`/src/hooks`** : Hooks personnalisés (`useGame.ts`, `usePeer.ts`, `useSoundEffects.ts`) connectant le moteur React, le son et le réseau WebRTC.
- **`/src/components`** : Composants d'interface utilisateur React (`PresenterDesk.tsx`, `CandidateScreen.tsx`, `QuestionBox.tsx`, `TVPresenterWidget.tsx`, `MoneyTree.tsx`, `JokersPanel.tsx`, `AudiencePollModal.tsx`, `PhoneFriendModal.tsx`).

Dépendance réseau P2Play :
```json
"p2play-core": "github:gab371/p2play-core#v0.7.1"
```

---

## 📄 Licence

Ce projet est distribué sous licence MIT.
