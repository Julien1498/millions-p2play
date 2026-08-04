import type { GameConfig, JokerType } from "../core/types";

export type ClientActionType =
  | "CHANGE_CONFIG"
  | "ASSIGN_PRESENTER"
  | "ASSIGN_CANDIDATE"
  | "START_GAME"
  | "REVEAL_NEXT_CHOICE"
  | "REVEAL_ALL_CHOICES"
  | "SELECT_ANSWER"
  | "LOCK_FINAL_ANSWER"
  | "PRESENTER_REVEAL"
  | "TRIGGER_JOKER"
  | "NEXT_QUESTION"
  | "WALK_AWAY"
  | "SUBMIT_AUDIENCE_VOTE"
  | "REGISTER_PROFILE"
  | "RESET_LOBBY"
  | "PLAY_SOUND_EFFECT";

export interface ClientActionEnvelope {
  type: ClientActionType;
  senderPeerId: string;
  payload?: any;
}

export interface ChangeConfigPayload {
  config: Partial<GameConfig>;
}

export interface AssignRolePayload {
  targetPeerId: string;
}

export interface SelectAnswerPayload {
  selectedIndex: number;
}

export interface TriggerJokerPayload {
  jokerType: JokerType;
}

export interface SubmitAudienceVotePayload {
  choiceIndex: number;
}

export interface RegisterProfilePayload {
  username: string;
  avatar?: string;
}

export interface PlaySoundEffectPayload {
  soundType: string;
}
