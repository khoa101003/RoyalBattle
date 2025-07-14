const { v4: uuidv4 } = require('uuid');

class RoomManager {
    constructor() {
        this.rooms = new Map();
        this.waitingPlayers = new Map();
    }

    // Create a new room
    createRoom(player) {
        const roomId = uuidv4();
        player.turn = 1;
        const room = {
            id: roomId,
            players: [player],
            status: 'waiting',
            createdAt: Date.now()
        };
        this.rooms.set(roomId, room);
        return room;
    }

    // Join an existing room
    joinRoom(roomId, player) {
        const room = this.rooms.get(roomId);
        if (!room) return null;
        if (room.players.length >= 2) return null;

        player.turn = 2;
        room.players.push(player);
        if (room.players.length === 2) {
            room.status = 'ready';
        }
        return room;
    }

    // Find or create a room for a player
    findOrCreateRoom(player) {
        // First try to find an existing room with one player
        for (const [roomId, room] of this.rooms) {
            if (room.players.length === 1 && room.status === 'waiting') {
                return this.joinRoom(roomId, player);
            }
        }

        // If no room found, create a new one
        return this.createRoom(player);
    }

    // Player ready status
    setPlayerReady(roomId, playerId) {
        const room = this.rooms.get(roomId);
        if (!room) return null;

        const player = room.players.find(p => p.id === playerId);
        if (player) {
            player.isReady = true;

            // Check if both players are ready
            if (room.players.length === 2 && room.players.every(p => p.isReady)) {
                room.status = 'in_game';
            }
        }
        return room;
    }

    // Remove player from room
    removePlayer(roomId, playerId) {
        const room = this.rooms.get(roomId);
        if (!room) return null;

        room.players = room.players.filter(p => p.id !== playerId);
        if (room.players.length === 0) {
            this.rooms.delete(roomId);
            return null;
        }
        room.status = 'waiting';
        return room;
    }

    changeTurn(roomId) {
        const room = this.rooms.get(roomId);
        if (!room) return null;
        room.players.forEach(player => {
            player.turn = (player.turn % 2) + 1;
        });
    }
    // Get room by ID
    getRoom(roomId) {
        return this.rooms.get(roomId);
    }

    // Get all rooms
    getAllRooms() {
        return Array.from(this.rooms.values());
    }
}

module.exports = RoomManager; 