export const GAME_EVENTS = {
    // client -> server
    PLAY_NEW_GAME: "game:play_new_game",
    // JOIN_GAME: "game:join",
    // REJOIN_GAME: "game:rejoin",
    LEAVE_GAME: "game:leave",
    PLAY_CHOICE: "player:choice",
    REQUEST_STATE: "game:request_state",

    // server -> client
    GAME_STATE_UPDATE_EVENT: "game:update",
    GAME_ENDED: "game:ended",
    GAME_ERROR: "game:error",
  };
  