import { _decorator, Component, Node, Label, Button, director } from 'cc';
import { NetworkManager } from '../Network/NetworkManager';
const { ccclass, property } = _decorator;

interface Player {
    id: string;
    name: string;
    isReady: boolean;
}

interface RoomData {
    roomId: string;
    players: Player[];
    status: string;
}

@ccclass('RoomSceneController')
export class RoomSceneController extends Component {
    @property(Label)
    statusLabel: Label = null!;

    @property(Label)
    player1Label: Label = null!;

    @property(Label)
    player2Label: Label = null!;

    @property(Button)
    readyButton: Button = null!;

    @property(Node)
    networkManager: Node = null!;

    private network: NetworkManager = null!;
    private currentRoom: any = null;
    private isReady: boolean = false;

    start() {
        this.network = NetworkManager.getInstance();
        this.tryConnectWithRetry();
    }

    private tryConnectWithRetry(attempts = 0, maxAttempts = 10) {
        if (attempts >= maxAttempts) {
            console.error('Failed to connect after maximum attempts');
            if (this.statusLabel) {
                this.statusLabel.string = 'Failed to connect to server';
            }
            return;
        }

        if (this.network && this.network.getSocket()) {
            this.setupNetworkEvents();
            try {
                this.findRoom();
            } catch (error) {
                if (this.statusLabel) {
                    this.statusLabel.string = 'Connecting to server... (Attempt ' + (attempts + 1) + ')';
                }
                // Retry after 1 second
                this.scheduleOnce(() => {
                    this.tryConnectWithRetry(attempts + 1, maxAttempts);
                }, 1);
            }
        } else {
            if (this.statusLabel) {
                this.statusLabel.string = 'Connecting to server... (Attempt ' + (attempts + 1) + ')';
            }
            // Retry after 1 second
            this.scheduleOnce(() => {
                this.tryConnectWithRetry(attempts + 1, maxAttempts);
            }, 1);
        }
    }

    private setupNetworkEvents() {
        const socket = this.network.getSocket();
        if (!socket) {
            console.error('Socket not initialized');
            return;
        }

        socket.on('room_joined', (data: any) => {
            this.currentRoom = data;
            this.updateUI();
        });

        socket.on('player_joined', (data: any) => {
            if (this.currentRoom) {
                this.currentRoom.players = [...this.currentRoom.players, data.player];
                this.currentRoom.status = data.roomStatus;
                this.updateUI();
            }
        });

        socket.on('room_status_update', (data: any) => {
            if (this.currentRoom) {
                this.currentRoom.players = data.players;
                this.currentRoom.status = data.status;
                this.updateUI();

                if (data.status === 'in_game') {
                    this.startGame();
                }
            }
        });

        socket.on('player_left', (data: any) => {
            if (this.currentRoom) {
                this.currentRoom.players = this.currentRoom.players.filter(p => p.id !== data.playerId);
                this.currentRoom.status = data.roomStatus;
                this.updateUI();
            }
        });
    }

    private findRoom() {
        this.network.findRoom({
            name: 'Player ' + Math.floor(Math.random() * 1000)
        });
    }

    private updateUI() {
        if (!this.currentRoom) return;

        if (this.statusLabel) {
            this.statusLabel.string = `Room Status: ${this.currentRoom.status}`;
        }

        const player1 = this.currentRoom.players[0];
        const player2 = this.currentRoom.players[1];

        if (this.player1Label) {
            this.player1Label.string = player1 ?
                `${player1.name} ${player1.isReady ? '(Ready)' : ''}` :
                'Waiting for player...';
        }

        if (this.player2Label) {
            this.player2Label.string = player2 ?
                `${player2.name} ${player2.isReady ? '(Ready)' : ''}` :
                'Waiting for player...';
        }

        if (this.readyButton) {
            this.readyButton.interactable = !this.isReady;
        }
    }

    public onReadyButtonClicked() {
        if (!this.currentRoom || this.isReady) return;

        this.network.setPlayerReady(this.currentRoom.roomId);
        this.isReady = true;
        if (this.readyButton) {
            this.readyButton.interactable = false;
        }
    }

    private startGame() {
        director.loadScene('mainScene');
    }

    onDestroy() {
        const socket = this.network.getSocket();
        if (socket) {
            socket.off('room_joined');
            socket.off('player_joined');
            socket.off('room_status_update');
            socket.off('player_left');
        }
    }
} 