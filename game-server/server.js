const express = require('express');
const app = express();
const http = require('http').createServer(app);
const cors = require('cors');
const io = require('socket.io')(http, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    },
    allowEIO3: true,
    transports: ['websocket', 'polling'],
    pingInterval: 10000,
    pingTimeout: 5000
});
const RoomManager = require('./roomManager');

const roomManager = new RoomManager();

// Enhanced CORS configuration
app.use(cors({
    origin: '*',  // Allow all origins
    methods: ['GET', 'POST'],
    credentials: true
}));

// Serve static files
app.use(express.static('public'));

app.get('/', (req, res) => {
    res.send('Game server is running!');
});

// Explicitly set headers for CORS preflight requests
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.header('Access-Control-Allow-Credentials', 'true');

    if (req.method === 'OPTIONS') {
        // Handle preflight requests
        res.sendStatus(200);
    } else {
        next();
    }
});

// Error handling for Socket.IO
io.engine.on('connection_error', (err) => {
    console.error('Connection error:', err);
});

// Socket.IO connection handling
io.on('connection', (socket) => {
    console.log('A user connected:', socket.id);

    // Join or create a room
    socket.on('find_room', (playerData) => {
        const player = {
            id: socket.id,
            name: playerData.name,
            isReady: false,
            turn: 1,  // First player gets turn 1
        };

        const room = roomManager.findOrCreateRoom(player);
        if (room.players.length === 2) {
            // Second player gets turn 2
            room.players[1].turn = 2;
        }
        socket.join(room.id);

        // Notify the player about room status
        socket.emit('room_joined', {
            roomId: room.id,
            players: room.players,
            status: room.status
        });

        // Notify other players in the room
        socket.to(room.id).emit('player_joined', {
            player: player,
            roomStatus: room.status
        });
    });

    // Player ready status
    socket.on('player_ready', (data) => {
        console.log('Player ready:', socket.id);
        const room = roomManager.setPlayerReady(data.roomId, socket.id);
        if (room) {
            io.to(room.id).emit('room_status_update', {
                players: room.players,
                status: room.status
            });
        }
    });

    // Handle disconnection
    socket.on('disconnect', () => {
        console.log('User disconnected:', socket.id);

        // Find and update room
        for (const [roomId, room] of roomManager.rooms) {
            if (room.players.some(p => p.id === socket.id)) {
                const updatedRoom = roomManager.removePlayer(roomId, socket.id);
                if (updatedRoom) {
                    io.to(roomId).emit('player_left', {
                        playerId: socket.id,
                        roomStatus: updatedRoom.status
                    });
                }
                break;
            }
        }
    });
    socket.on('action', (data) => {
        //data{player, roomId, action, data}
        console.log('Action:', data);
        const room = roomManager.getRoom(data.roomId);
        if (room) {
            room.players.forEach(player => {
                if (player.id !== data.player.id) {
                    console.log('Sending player heal action to:', player.id);
                    socket.to(player.id).emit('player_action', data);
                }
            });
        }
    });
    socket.on('get_turn', (data) => {
        console.log('Get turn request:', data);
        const room = roomManager.getRoom(data.roomId);
        if (!room) {
            console.log('Room not found:', data.roomId);
            socket.emit('turn_response', { turn: 0 });
            return;
        }

        let playerTurn = 0;
        const player = room.players.find(p => p.id === socket.id);
        if (player) {
            playerTurn = player.turn;
            console.log('Found player turn:', playerTurn);
        } else {
            console.log('Player not found in room');
        }

        // Always emit a response
        console.log('Sending turn response:', playerTurn);
        socket.emit('turn_response', { turn: playerTurn });
    });
    socket.on('change_turn', (data) => {
        const room = roomManager.getRoom(data.roomId);
        if (room) {
            // Swap turns between players
            console.log('Changing turn for room:', data.roomId);
            room.players.forEach(player => {
                player.turn = player.turn === 1 ? 2 : 1;
            });
            room.players.forEach(player => {
                console.log('Sending turn changed to:', player.id, room.players[0].turn);
                io.to(player.id).emit('turn_changed', room.players[0].turn);
            });
        }
    });
    /*socket.on('player_action', (data) => {
        //data{player, roomId, action, data}
        console.log('Player action:', data);

    });*/
});

// Start the server
const PORT = process.env.PORT || 3000;
http.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
    console.log(`Access your game at http://localhost:${PORT}`);
});

// Handle server errors
http.on('error', (error) => {
    console.error('Server error:', error);
});
