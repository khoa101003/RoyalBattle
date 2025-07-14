export interface Room {
    id: string;          // Unique room identifier
    players: Player[];   // Array of players (max 2)
    status: RoomStatus;  // WAITING, READY, IN_GAME
    createdAt: number;   // Timestamp for room creation
}

export interface Player {
    id: string;
    name: string;
    isReady: boolean;
    character?: string;  // Selected character
}

export enum RoomStatus {
    WAITING = 'waiting',    // Waiting for players
    READY = 'ready',        // Both players joined and ready
    IN_GAME = 'in_game'     // Game has started
}