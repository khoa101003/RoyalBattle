import { _decorator, Component, Node, sys, director } from 'cc';
import { Player, Room, RoomStatus } from '../Interfaces/Room';
import { dir } from 'console';
const { ccclass, property } = _decorator;

// Import socket.io-client - global io variable should be available when properly loaded
declare const io: any;

@ccclass('NetworkManager')
export class NetworkManager extends Component {
    private static instance: NetworkManager | null = null;
    private socket: any;
    private isConnected: boolean = false;
    private currentTurn: number = 0;

    @property
    serverUrl: string = 'http://localhost:3000';

    @property
    debugMode: boolean = true;

    private playerData: Player | null = null;
    private roomId: string | null = null;

    onLoad() {
        if (NetworkManager.instance) {
            this.node.destroy();
            return;
        }

        console.log("Scene: ", director.getScene().name);
        console.log("NetworkManager: ", this.node.name);
        console.log("NetworkManager: ", this.node.parent);

        NetworkManager.instance = this;
        this.node._persistNode = true;
        director.addPersistRootNode(this.node);
        const tmp = Math.random().toString(36).substring(2, 15);
        this.playerData = {
            id: tmp,
            name: tmp,
            isReady: false,
        };
        // Load socket.io and connect immediately

        this.loadSocketIO();
    }

    public static getInstance(): NetworkManager {
        return NetworkManager.instance;
    }

    loadSocketIO() {
        this.log('Loading Socket.IO client script...');
        const script = document.createElement('script');
        script.src = 'https://cdn.socket.io/4.8.1/socket.io.min.js';
        script.crossOrigin = 'anonymous';

        script.onload = () => {
            this.log('Socket.IO client script loaded successfully');
            this.connectToServer();
        };

        script.onerror = (error) => {
            console.error('Failed to load Socket.IO client script:', error);
        };

        document.head.appendChild(script);
    }

    connectToServer() {
        try {
            this.log('Attempting to connect to server:', this.serverUrl);

            this.socket = io(this.serverUrl, {
                transports: ['websocket', 'polling'],
                reconnectionAttempts: 5,
                reconnectionDelay: 1000,
                timeout: 10000
            });

            this.socket.on('connect', () => {
                this.isConnected = true;
                this.log('Connected to server successfully');
                // Update the player ID with the socket ID once connected
                this.playerData = {
                    ...this.playerData,
                    id: this.socket.id
                };
            });

            this.socket.on('connect_error', (error) => {
                console.error('Connection error:', error);
                this.log('Failed to connect to server');
            });

            this.socket.on('disconnect', () => {
                this.isConnected = false;
                this.log('Disconnected from server');
            });

            this.socket.on('room_joined', (data: { roomId: string, players: any[], status: string }) => {
                this.log('Room joined:', data);
                this.roomId = data.roomId;
            });


            // Add turn response handler
            /*this.socket.on('turn_response', (data) => {
                console.log("Turn reponse from server: ", data.turn);
                this.currentTurn = data.turn;
                this.log('Received turn:', data.turn);
                // Emit an event that other components can listen to
                //director.emit('turn_updated', data.turn);
            });*/

            // Add turn changed handler
            this.socket.on('turn_changed', (turn: number) => {
                // Update local turn state
                this.currentTurn = turn;
                console.log('Turn changed to:', turn);
                // Emit an event that other components can listen to
                director.emit('turn_updated', turn);
            });

            this.socket.on('player_action', (data) => {
                //data{player, roomId, action, data}
                director.emit('player_action', data);
            });

        } catch (e) {
            console.error('Error initializing Socket.IO connection:', e);
        }
    }

    public getSocket() {
        return this.socket;
    }

    public isSocketConnected(): boolean {
        return this.socket?.connected || false;
    }

    private log(...args: any[]) {
        if (this.debugMode) {
            console.log('[NetworkManager]', ...args);
        }
    }

    // Room-related methods with error checking
    public findRoom(playerData: any) {
        if (!this.socket?.connected) {
            console.error('Cannot find room: Socket not connected');
            return;
        }
        this.socket.emit('find_room', playerData);
    }

    public setPlayerReady(roomId: string) {
        if (!this.socket?.connected) {
            console.error('Cannot set ready: Socket not connected');
            return;
        }
        this.socket.emit('player_ready', { roomId });
    }

    public getPlayerData() {
        return this.playerData;
    }


    public getTurn(): Promise<number> {
        return new Promise((resolve, reject) => {
            if (!this.socket?.connected) {
                console.error('Cannot get turn: Socket not connected');
                resolve(0);
                return;
            }

            console.log("Getting turn for room:", this.roomId);

            // Add timeout to prevent hanging
            const timeout = setTimeout(() => {
                console.log("Turn request timed out");
                resolve(0);
            }, 5000);

            // Set up a one-time listener for the response
            this.socket.once('turn_response', (data: { turn: number }) => {
                clearTimeout(timeout); // Clear timeout when we get response
                console.log("Received turn response:", data.turn);
                this.currentTurn = data.turn;
                resolve(data.turn);
            });

            // Request the turn
            console.log("Requesting turn for room:", this.roomId);
            this.socket.emit('get_turn', {
                roomId: this.roomId,
                player: this.playerData
            });
        });
    }

    public getCurrentTurn(): number {
        return this.currentTurn;
    }

    public changeTurn() {
        if (!this.socket?.connected || !this.roomId) {
            console.error('Cannot change turn: Socket not connected or room not set');
            return;
        }
        this.socket.emit('change_turn', { roomId: this.roomId });
    }

    public action(action: string, data: any) {
        if (!this.socket?.connected) {
            console.error('Cannot send action: Socket not connected');
            return;
        }
        console.log("Sending action:", action, "with data:", data, "roomId:", this.roomId);
        this.socket.emit('action', { player: this.playerData, roomId: this.roomId, action, data });
    }
}
