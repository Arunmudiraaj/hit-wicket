// src/utils/storage.ts
const KEYS = {
  LAST_GAME_ID: "lastGameId",
  PLAYER_ID: "playerId",
  PLAYER_NAME: "playerName",
  GUEST_TOKEN: "guestToken",
};

export const storage = {
  setLastGameId: (id: string) => localStorage.setItem(KEYS.LAST_GAME_ID, id),
  getLastGameId: () => localStorage.getItem(KEYS.LAST_GAME_ID),
  clearLastGameId: () => localStorage.removeItem(KEYS.LAST_GAME_ID),

  setPlayerId: (id: string) => localStorage.setItem(KEYS.PLAYER_ID, id),
  getPlayerId: () => localStorage.getItem(KEYS.PLAYER_ID),

  setPlayerName: (name: string) => localStorage.setItem(KEYS.PLAYER_NAME, name),
  getPlayerName: () => localStorage.getItem(KEYS.PLAYER_NAME),

  setGuestToken: (token: string) => localStorage.setItem(KEYS.GUEST_TOKEN, token),
  getGuestToken: () => localStorage.getItem(KEYS.GUEST_TOKEN),

  KEYS,
};
