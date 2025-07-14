import { _decorator, Component, Node, director, input, Input, KeyCode, PhysicsSystem, EPhysicsDrawFlags, Prefab, instantiate } from 'cc';
import { MouseRaycaster } from '../Mouse/MouseRayCaster';
import { ObjectType } from './ObjectType';
import { HexController } from './HexController';
import { MapController } from './MapController';
import { CharacterController } from './CharacterController';
import { PlayerController } from './PlayerController';
import { SkillButtonsController } from './SkillButtonsController';
import { NetworkManager } from '../Network/NetworkManager';
import { ResourceManager } from '../Managers/ResourceManager';
import { MapGenerator } from '../Generator/MapGenerator';
import { GetFromNode } from '../General/GetFromNode';
import { StatsUI } from '../Managers/StatsUI';
const { ccclass, property } = _decorator;

enum Mode {
    none = 0,
    moving = 1,
    attacking = 2,
}

enum GameMode {
    ONLINE,
    OFFLINE_VS_AI
}

@ccclass('MainSceneController')
export class MainSceneController extends Component {
    private static instance : MainSceneController;
    // (Optional) Define the main menu scene name
    @property({ type: String })
    mainMenuScene: string = "MainMenu"; // Replace with your main menu scene name

    @property({ type: String })
    winScene: string = "winScene"; // Scene to load when player wins

    @property({ type: String })
    loseScene: string = "loseScene"; // Scene to load when player loses

    @property({ type: Node })
    skillButtons: Node = null!;
    @property(MouseRaycaster)
    mouseRaycaster: MouseRaycaster = null!;

    @property(Prefab)
    characterPrefab: Prefab[] = [];

    @property(Prefab)
    wallPrefab: Prefab[] = [];

    @property(Node)
    heathUINode: Node = null!;

    @property(Node)
    mapGeneratorNode: Node = null!;

    @property({ type: Boolean })
    isOfflineMode: boolean = false;

    private selectedCharacter: Node | null = null!;
    private selectedCharacterUI: Node | null = null!;
    private characterController: any = null!;
    private characterContainer: Node = null!;
    private wallContainer: Node = null!;
    private skillButtonsController: any = null!;
    private map: MapController = null!;
    private mapGenerator: MapGenerator = null!;
    private statUI: StatsUI = null!;

    private mode: Mode = 0;
    private hitMask: number = 0;

    private turn: number = 1;
    private gameMode: GameMode = GameMode.ONLINE;

    // Track characters by team
    private team1Characters: PlayerController[] = [];
    private team2Characters: PlayerController[] = [];
    private team1Count: number = 0;
    private team2Count: number = 0;
    private playerTeam: number = 1; // Player's team mask (default to 1)
    private aiTeam: number = 2;     // AI's team mask

    // AI logic timer
    private aiActionDelay: number = 5; // Seconds to wait before AI move
    private aiActionTimer: number = 0;
    private aiActionPending: boolean = false;

    onLoad() {
        //director.addPersistRootNode(this.node);
        MainSceneController.instance = this;
        
        this.map = new MapController(this.wallPrefab);// map before character
        console.log("MainSceneController.onLoad MapController created: ", this.map);
            this.characterContainer = new Node;
            this.characterContainer.name = "CharacterContainer";
            this.wallContainer = new Node;
            this.wallContainer.name = "WallContainer";
            this.node.addChild(this.wallContainer);
            this.node.addChild(this.characterContainer);
            this.characterController = new CharacterController(this.characterPrefab, this.characterContainer);
            if (!this.characterController) {
                console.error("CharacterController component not found on player node.");
            }
        


        if (this.skillButtons) {
            this.skillButtonsController = this.skillButtons.getComponent(SkillButtonsController);
        }

        if (this.heathUINode){
            this.statUI = this.heathUINode.getComponent(StatsUI);
        }

        if (this.mapGeneratorNode) {    
            this.mapGenerator = this.mapGeneratorNode.getComponent(MapGenerator);
        }

        input.on(Input.EventType.KEY_DOWN, this.onKeyDown, this);
        input.on(Input.EventType.MOUSE_DOWN, this.onMouseDown, this);

        director.on('turn_updated', this.updateTurn, this);
        director.on('player_action', this.playerAction, this);
        director.on('character_removed', this.onCharacterRemoved, this);

        this.node.on('new_character_selected', this.onNewCharacterSelected, this);
        //this.node.on('UI_selected_character', this.onUISelectedCharacter, this);

        this.isOfflineMode = !ResourceManager.getInstance().isOnline;
        if (!this.mouseRaycaster)
            this.mouseRaycaster = new MouseRaycaster();
        if (this.isOfflineMode) {
            this.gameMode = GameMode.OFFLINE_VS_AI;
            this.start_offline_game();
        } else {
            this.gameMode = GameMode.ONLINE;
            this.start_online_game();
        }
    }

    onDestroy() {
        // Clean up the keyboard listener
        input.off(Input.EventType.KEY_DOWN, this.onKeyDown, this);
        input.off(Input.EventType.MOUSE_DOWN, this.onMouseDown, this);
        director.off('turn_updated', this.updateTurn, this);
        director.off('player_action', this.playerAction, this);
        director.off('character_removed', this.onCharacterRemoved, this);
    }

    static getInstance(){
        return MainSceneController.instance;
    }
    // Method to track character removal and check for win/lose conditions
    onCharacterRemoved(playerController : PlayerController) {
        console.log("MainSceneController.onCharacterRemoved Character removed: ", playerController.node.name);
        if (playerController) {
            //const playerController = node.getChildByName("PlayerController")?.getComponent(PlayerController);
            if (playerController) {
                this.map.removeCharacter(playerController);
                const mask = playerController.getMask();
                console.log("MainSceneController.onCharacterRemoved Character removed: ", playerController.getMask());
                if (mask === 1) {
                    this.team1Count--;
                    // Remove character from team array
                    const index = this.team1Characters.indexOf(playerController);
                    if (index > -1) {
                        this.team1Characters.splice(index, 1);
                    }
                    console.log(`Team 1 has ${this.team1Count} characters remaining.`);
                } else if (mask === 2) {
                    this.team2Count--;
                    // Remove character from team array
                    const index = this.team2Characters.indexOf(playerController);
                    if (index > -1) {
                        this.team2Characters.splice(index, 1);
                    }
                    console.log(`Team 2 has ${this.team2Count} characters remaining.`);
                }

                // Check win/lose conditions
                this.checkWinLoseCondition();
            }
        }
    }
    onNewCharacterSelected(playerController: PlayerController) {
        this.statUI.onUISelectedCharacter(playerController);
        this.mapGenerator.highlightTile(playerController, this.map, false, playerController.getMask());
    }

    getMapController() : MapController{
        return this.map;
    }
    // Check if either team has been eliminated
    checkWinLoseCondition() {
        if (this.team1Count <= 0) {
            console.log("Team 1 has been eliminated!");
            if (this.playerTeam === 1) {
                this.gameOver(false); // Player lost
            } else {
                this.gameOver(true); // Player won
            }
        } else if (this.team2Count <= 0) {
            console.log("Team 2 has been eliminated!");
            if (this.playerTeam === 2) {
                this.gameOver(false); // Player lost
            } else {
                this.gameOver(true); // Player won
            }
        }
    }

    // Handle game over state
    gameOver(playerWon: boolean) {
        console.log(playerWon ? "Player won!" : "Player lost!");

        // Display a message in console
        const message = playerWon ? "YOU WIN!" : "YOU LOSE!";
        console.log(message);

        // Try to load scene, but catch errors so game doesn't crash
        setTimeout(() => {
            try {
                // Attempt to load the scene
                director.loadScene(playerWon ? this.winScene : this.loseScene);
            } catch (error) {
                // Log error but don't crash
                console.warn("Could not load scene, ignoring error:", error);

                // Fallback to main menu if available
                try {
                    director.loadScene(this.mainMenuScene);
                } catch (innerError) {
                    console.warn("Could not load main menu either, staying on current scene");
                }
            }
        }, 2000);
    }

    addObject(object: ObjectType, q: number, r: number, type: number = 0, mask: number = 0) {
        if (!this.map.checkQR(q, r)) return false;
        if (object == ObjectType.CHARACTER) {
            const tmp = this.characterController.addCharacter(type, q, r, mask);
            if (tmp) {
                console.log("Adding character: ", tmp.name);
                this.map.addObject(object, q, r, tmp);
                //console.log("Added character: ", this.map.getObjectNode(q, r).name);

                // Track team counts and store character references
                if (mask === 1) {
                    this.team1Count++;
                    this.team1Characters.push(tmp);
                } else if (mask === 2) {
                    this.team2Count++;
                    this.team2Characters.push(tmp);
                }
            } else {
                console.log("Character not found at adding object");
            }
        }
        else if (object == ObjectType.WALL) {
            this.map.addObject(object, q, r);
            const node = instantiate(this.wallPrefab[Math.floor(Math.random() * this.wallPrefab.length)]);
            const hexPos = MapGenerator.toXZ(q, r); // Adjust Y position as needed
            node.setPosition(hexPos.x, node.getPosition().y, hexPos.z)
            this.wallContainer.addChild(node);
        }
        else{
            console.log("MainSceneController.addObject objectType not valid!!");
        }
        return true;
    }

    // Replace setupRandomWalls with a fixed wall pattern
    setupFixedWalls() {
        // Clear the map first
        this.map.clearMap();
        const mapController = this.map;
        const mapRadius = mapController.mapRadius;

        // Keep track of positions to avoid duplicates
        const wallPositions = new Set();

        // Define the boundary of the hex grid using cube coordinates
        for (let q = -mapRadius; q <= mapRadius; q++) {
            for (let r = -mapRadius; r <= mapRadius; r++) {
                // Calculate the s coordinate (from q + r + s = 0)
                const s = -q - r;

                // Check if this hex is on the boundary (max(|q|, |r|, |s|) = mapRadius)
                const maxCoord = Math.max(Math.abs(q), Math.abs(r), Math.abs(s));

                if (maxCoord === mapRadius && mapController.inside(q + mapRadius, r + mapRadius)) {
                    const posKey = `${q},${r}`;

                    // Place wall on boundary
                    this.addObject(ObjectType.WALL, q, r);
                    wallPositions.add(posKey);
                }
            }
        }

        // Define fixed wall patterns for the interior
        const fixedWalls = [
            // Center divider walls
            { q: 0, r: 0 },    // Center
            { q: 0, r: 1 },    // Center top
            { q: 0, r: -1 },   // Center bottom
            { q: 1, r: 0 },    // Center right
            { q: -1, r: 0 },   // Center left

            // Team 1 side walls (left)
            { q: -5, r: 3 },
            { q: -4, r: 2 },
            { q: -3, r: 0 },
            { q: -4, r: -1 },
            { q: -6, r: 1 },

            // Team 2 side walls (right)
            { q: 5, r: -3 },
            { q: 4, r: -2 },
            { q: 3, r: 0 },
            { q: 4, r: 1 },
            { q: 6, r: -1 },

            // North region walls
            { q: 2, r: 3 },
            { q: -2, r: 5 },

            // South region walls
            { q: -2, r: -3 },
            { q: 2, r: -5 }
        ];

        // Add all fixed walls
        for (const wall of fixedWalls) {
            if (mapController.inside(wall.q + mapRadius, wall.r + mapRadius)) {
                const posKey = `${wall.q},${wall.r}`;
                if (!wallPositions.has(posKey)) {
                    this.addObject(ObjectType.WALL, wall.q, wall.r);
                    wallPositions.add(posKey);
                }
            }
        }

        console.log(`Successfully placed ${wallPositions.size} walls in total`);
    }

    // Replace setupRandomCharacters with fixed character positions
    setupFixedCharacters() {
        // Reset character counts
        this.team1Count = 0;
        this.team2Count = 0;
        this.team1Characters = [];
        this.team2Characters = [];

        const mapController = this.map;

        // Define fixed positions for Team 1 characters (left side)
        const team1Positions = [
            { q: -7, r: 7, type: 0 },   // Barbarian 1
            { q: -6, r: 6, type: 3 },   // Rogue 1
            { q: -8, r: 5, type: 0 },   // Barbarian 2
            { q: -7, r: 4, type: 3 },   // Rogue 2
            { q: -5, r: 4, type: 0 }    // Barbarian 3
        ];

        // Define fixed positions for Team 2 characters (right side)
        const team2Positions = [
            { q: 7, r: -7, type: 1 },   // Knight 1
            { q: 6, r: -6, type: 2 },   // Mage 1
            { q: 8, r: -5, type: 1 },   // Knight 2
            { q: 7, r: -4, type: 2 },   // Mage 2
            { q: 5, r: -4, type: 1 }    // Knight 3
        ];

        // Add Team 1 characters
        for (const pos of team1Positions) {
            // Check if position is valid and empty
            if (mapController.inside(pos.q + mapController.mapRadius, pos.r + mapController.mapRadius) &&
                mapController.getObject(pos.q, pos.r) === ObjectType.NONE) {

                // Add the character
                this.addObject(ObjectType.CHARACTER, pos.q, pos.r, pos.type, 1);
            }
        }

        // Add Team 2 characters
        for (const pos of team2Positions) {
            // Check if position is valid and empty
            if (mapController.inside(pos.q + mapController.mapRadius, pos.r + mapController.mapRadius) &&
                mapController.getObject(pos.q, pos.r) === ObjectType.NONE) {

                // Add the character
                this.addObject(ObjectType.CHARACTER, pos.q, pos.r, pos.type, 2);
            }
        }

        console.log(`Team 1 (Barbarians & Rogues): ${this.team1Count} characters`);
        console.log(`Team 2 (Knights & Mages): ${this.team2Count} characters`);
    }

    // Update start_offline_game and start_online_game to use the fixed setup methods
    start_offline_game() {
        // Reset character counts
        this.team1Count = 0;
        this.team2Count = 0;
        this.team1Characters = [];
        this.team2Characters = [];

        // Player is always team 1 in offline mode
        this.playerTeam = 1;
        this.aiTeam = 2;
        this.turn = this.playerTeam;

        // Set up fixed walls and characters
        this.setupFixedWalls();
        this.setupFixedCharacters();

        console.log(`Offline game started - Player: Team ${this.playerTeam} (${this.team1Count} characters), AI: Team ${this.aiTeam} (${this.team2Count} characters)`);
    }

    start_online_game() {
        // Reset character counts
        this.team1Count = 0;
        this.team2Count = 0;
        this.team1Characters = [];
        this.team2Characters = [];

        // Set up fixed walls and characters
        this.setupFixedWalls();
        this.setupFixedCharacters();

        this.checkTurn();
        this.turn = 1;

        console.log(`Online game started with Team 1: ${this.team1Count} characters, Team 2: ${this.team2Count} characters`);
    }

    async checkTurn() {
        if (this.gameMode === GameMode.ONLINE) {
            this.playerTeam = await NetworkManager.getInstance().getTurn();
            console.log("Turn: ", this.playerTeam);
        }
    }

    updateTurn(data: any) {
        console.log("Turn updated: ", data);
        this.turn = data;

        // Check if it's AI's turn in offline mode
        if (this.gameMode === GameMode.OFFLINE_VS_AI && this.turn === this.aiTeam) {
            this.aiActionTimer = 0;
            this.aiActionPending = true;
        }
    }

    changeTurn() {
        if (this.gameMode === GameMode.ONLINE) {
            NetworkManager.getInstance().changeTurn();
        } else {
            // In offline mode, manually switch turns
            this.turn = this.turn === 1 ? 2 : 1;
            director.emit('turn_updated', this.turn);
        }
    }

    // AI logic implementation - Fixed version
    executeAITurn() {
        console.log("AI turn starting");

        // Simulate AI thinking time
        if (this.team2Characters.length === 0) {
            console.log("No AI characters left");
            this.changeTurn();
            return;
        }

        // Select the AI character with the best strategic position
        let selectedAICharacter = this.selectBestAICharacter();

        if (!selectedAICharacter) {
            console.log("No suitable AI character found");
            this.changeTurn();
            return;
        }

        const aiController = selectedAICharacter.getComponent(PlayerController);

        if (!aiController) {
            console.log("No controller for AI character");
            this.changeTurn();
            return;
        }

        // Try to execute the best action for this character
        let actionTaken = this.executeAIAction(selectedAICharacter, aiController);

        // If no action was taken, try another character
        if (!actionTaken && this.team2Characters.length > 1) {
            // Try with a different character
            for (const aiChar of this.team2Characters) {
                if (aiChar.node === selectedAICharacter) continue;

                
                if (aiChar) {
                    actionTaken = this.executeAIAction(aiChar.node, aiChar);
                    if (actionTaken) break;
                }
            }
        }

        // End AI turn after a delay
        setTimeout(() => {
            this.changeTurn();
        }, 1000);
    }

    // Helper method to select the best AI character for this turn
    selectBestAICharacter() {
        if (this.team2Characters.length === 0) return null;

        let bestCharacter = null;
        let bestScore = -Infinity;

        // Try to find a character that can attack
        for (const aiChar of this.team2Characters) {
            //const aiController = aiChar.getChildByName("PlayerController")?.getComponent(PlayerController);
            if (!aiChar) continue;

            const aiQR = aiChar.getQR();

            // Calculate a score for this character based on:
            // 1. Can it attack an enemy?
            // 2. How close is it to enemies?
            // 3. How much health does it have?
            let score = aiChar.health / 20; // Base score from health

            // Check if it can attack any enemy
            let canAttack = false;
            let nearestEnemyDistance = Infinity;

            for (const playerChar of this.team1Characters) {
                //const playerController = playerChar.getChildByName("PlayerController")?.getComponent(PlayerController);
                if (!playerChar) continue;

                const playerQR = playerChar.getQR();

                // Distance in hex grid
                const distance = Math.max(
                    Math.abs(aiQR.q - playerQR.q),
                    Math.abs(aiQR.r - playerQR.r),
                    Math.abs((aiQR.q + aiQR.r) - (playerQR.q + playerQR.r))
                );

                // Update nearest enemy
                if (distance < nearestEnemyDistance) {
                    nearestEnemyDistance = distance;
                }

                // Check if in attack range
                if (distance <= aiChar.range_attack) {
                    canAttack = true;
                    // Huge score bonus for being able to attack
                    score += 50;
                    // Extra bonus for attacking low health enemies
                    score += (100 - aiChar.health) / 10;
                }
            }

            // Factor in distance to enemies (being closer is better for most units)
            if (!canAttack) {
                // Closer to enemies is better, but not too much
                score += (10 - Math.min(10, nearestEnemyDistance)) * 2;
            }

            // Special handling for low health
            if (aiChar.health < 30) {
                // Low health units prefer to stay away unless they can attack
                if (!canAttack) {
                    score -= 15;
                }
            }

            if (score > bestScore) {
                bestScore = score;
                bestCharacter = aiChar;
            }
        }

        // If we couldn't find a good character, just pick the first one
        if (!bestCharacter && this.team2Characters.length > 0) {
            bestCharacter = this.team2Characters[0];
        }

        return bestCharacter;
    }

    // Execute the best action for an AI character
    executeAIAction(aiCharacter: Node, aiController: PlayerController): boolean {
        // Try actions in priority order: Attack, Heal, Move
        const aiQR = aiController.getQR();
        let actionTaken = false;

        // 1. HEAL if health is low and we have the ability
        if (aiController.health < 40) {
            console.log(`AI healing character at ${aiQR.q},${aiQR.r} (Health: ${aiController.health})`);
            aiController.heal();
            return true;
        }

        // 2. ATTACK if any enemy is in range
        for (const playerChar of this.team1Characters) {
            //const playerController = playerChar.getChildByName("PlayerController")?.getComponent(PlayerController);
            if (!playerChar) continue;

            const playerQR = playerChar.getQR();

            // Calculate hex distance
            const distance = Math.max(
                Math.abs(aiQR.q - playerQR.q),
                Math.abs(aiQR.r - playerQR.r),
                Math.abs((aiQR.q + aiQR.r) - (playerQR.q + playerQR.r))
            );

            // Attack if in range
            if (distance <= aiController.range_attack) {
                console.log(`AI attacking player at ${playerQR.q},${playerQR.r} from ${aiQR.q},${aiQR.r}`);
                aiController.attackOther(playerChar);
                return true;
            }
        }

        // 3. MOVE toward nearest player if we can't attack
        // Find nearest player character
        let nearestPlayer = null;
        let shortestDistance = Infinity;

        for (const playerChar of this.team1Characters) {
            //const playerController = playerChar.getChildByName("PlayerController")?.getComponent(PlayerController);
            if (!playerChar) continue;

            const playerQR = playerChar.getQR();

            // Use pathfinding to get real distance
            const path = this.map.pathToQR(aiQR.q, aiQR.r, playerQR.q, playerQR.r, true);
            const distance = path.length;

            if (distance > 0 && distance < shortestDistance) {
                shortestDistance = distance;
                nearestPlayer = playerQR;
            }
        }

        // Move toward player if found
        if (nearestPlayer) {
            const path = this.map.pathToQR(
                aiQR.q, aiQR.r,
                nearestPlayer.q, nearestPlayer.r,
                true
            );

            if (path.length > 0) {
                // Calculate how many steps we can move (limited by range_move)
                path.pop(); // Remove last element which is the starting point
                const movesToMake = Math.min(aiController.range_move, path.length);

                if (movesToMake > 0) {
                    // Get destination coordinates after moving along path
                    let destQ = aiQR.q;
                    let destR = aiQR.r;

                    // Apply the moves to get final position
                    for (let i = 0; i < movesToMake; i++) {
                        const moveDir = path[path.length - 1 - i];
                        switch (moveDir) {
                            case 0: // RIGHT
                                destQ += 1; break;
                            case 1: // LEFT
                                destQ -= 1; break;
                            case 2: // UPRIGHT
                                destQ += 1; destR -= 1; break;
                            case 3: // BOTTOMRIGHT
                                destR += 1; break;
                            case 4: // UPLEFT
                                destR -= 1; break;
                            case 5: // BOTTOMLEFT
                                destQ -= 1; destR += 1; break;
                        }
                    }

                    // Verify destination is valid and empty
                    if (this.map.getObject(destQ, destR) === ObjectType.NONE) {
                        console.log(`AI moving from (${aiQR.q},${aiQR.r}) to (${destQ},${destR})`);
                        aiController.moveToHex(destQ, destR);
                        return true;
                    } else {
                        console.log(`AI movement destination occupied: (${destQ},${destR})`);
                    }
                }
            }
        }

        console.log("AI couldn't find a valid action");
        return false;
    }

    update(deltaTime: number) {
        // Handle AI turns in offline mode
        if (this.gameMode === GameMode.OFFLINE_VS_AI && this.aiActionPending) {
            this.aiActionTimer += deltaTime;

            if (this.aiActionTimer >= this.aiActionDelay) {
                this.aiActionPending = false;
                this.executeAITurn();
            }
        }
    }

    playerAction(data: any) {
        // Online mode player actions
        //data{player, roomId, action, data}
        //data.data{QR, QR_target}
        console.log("Player action received:", data);
        if (data.action == "heal") {
            try {
                const mapRadius = this.map.mapRadius;
                console.log("Map radius:", mapRadius);
                console.log("Adjusted coordinates:", data.data.QR.q + mapRadius, data.data.QR.r + mapRadius);
                const character = this.map.getObjectNode(data.data.QR.q, data.data.QR.r);
                if (character) {
                    console.log("Healing character found:", character.name);
                    GetFromNode.playerController(character).heal();
                }
                else {
                    console.log("Character not found at coordinates:", data.data.QR.q, data.data.QR.r);
                }
            }
            catch (error) {
                console.error("Error in heal action:", error);
            }
            this.setToNoneMode();
        } else if (data.action == "attack") {
            console.log("Enemy attack action: ", data);
            const character = this.map.getObjectNode(data.data.QR.q, data.data.QR.r);
            if (character) {
                GetFromNode.playerController(character)
                    .attackOther(GetFromNode.playerController(this.map.getObjectNode(data.data.QR_target.q, data.data.QR_target.r)));
            }
            this.setToNoneMode();
        } else if (data.action == "move") {
            console.log("Enemy move action: ", data);
            const character = this.map.getObjectNode(data.data.QR.q, data.data.QR.r);
            if (character) {
                GetFromNode.playerController(character)
                    .moveToHex(data.data.QR_target.q, data.data.QR_target.r);
            }
            this.setToNoneMode();
        }
    }

    getSelectedCharacter() {
        return this.selectedCharacter;
    }

    useSkill(skill: string) {
        if (skill == "heal") {
            GetFromNode.playerController(this.selectedCharacter).heal();

            if (this.gameMode === GameMode.ONLINE) {
                NetworkManager.getInstance().action("heal", { QR: this.get_QR_selectedCharacter() });
            }

            this.changeTurn();
            this.setToNoneMode();
        }
        else if (skill == "attack") {
            this.mode = Mode.attacking;
            this.hitMask = ~GetFromNode.playerController(this.selectedCharacter).getMask();
            this.mouseRaycaster.changeMode(2, GetFromNode.playerController(this.selectedCharacter));
        }
        director.emit('UI_update');
    }

    onKeyDown(event: any) {
        // Check if the pressed key is ESC (Escape)
        if (event.keyCode === KeyCode.ESCAPE) {
            // Load the main menu scene
            director.loadScene(this.mainMenuScene);
        }
        // Toggle game mode for testing (O key)
        else if (event.keyCode === KeyCode.KEY_O) {
            this.isOfflineMode = !this.isOfflineMode;
            console.log(`Game mode switched to ${this.isOfflineMode ? 'OFFLINE' : 'ONLINE'}`);
            // Restart with new mode
            if (this.isOfflineMode) {
                this.gameMode = GameMode.OFFLINE_VS_AI;
                this.start_offline_game();
            } else {
                this.gameMode = GameMode.ONLINE;
                this.start_online_game();
            }
        }
    }

    onMouseDown(event: any) {
        // Only process clicks if it's player's turn
        if (this.turn !== this.playerTeam && this.gameMode === GameMode.OFFLINE_VS_AI) {
            console.log("Not player's turn");
            return;
        }

        // Check if the left mouse button was clicked
        if (event.getButton() === 0) { // 0 is the left mouse button
            const hitNode = this.mouseRaycaster.getHitNode();
            if (hitNode) {
                if (this.isCharacter(hitNode.name)) {
                    this.selectedCharacterUI = hitNode;
                    //director.emit('UI_selected_character', this.selectedCharacterUI);
                }

                if (hitNode.name == "hex_grass" && this.selectedCharacter && this.mode == Mode.moving) {
                    const hexController = hitNode.getChildByName('HexController').getComponent(HexController);
                    const selectedPlayer = GetFromNode.playerController(this.selectedCharacter);
                    selectedPlayer.moveToHex(hexController._q, hexController._r);

                    if (this.gameMode === GameMode.ONLINE) {
                        NetworkManager.getInstance().action("move", {
                            QR: this.get_QR_selectedCharacter(),
                            QR_target: { q: hexController._q, r: hexController._r }
                        });
                    }

                    this.changeTurn();
                    this.setToNoneMode();
                }
                else if (this.isCharacter(hitNode.name)) {
                    //console.log("Hit node is a character: ", hitNode.name);
                    //console.log(hitNode.worldPosition);
                    //console.log(hitNode.getChildByName('head').worldPosition);
                    //console.log(this.turn);
                    //console.log(this.playerTeam);
                    //console.log(hitNode.getChildByName("PlayerController").getComponent(PlayerController).getMask());
                    const hitPlayerMask = GetFromNode.playerController(hitNode).getMask();
                    // Selection logic for player's own characters
                    if ((this.mode == Mode.none || this.mode == Mode.moving)
                        && (hitPlayerMask === this.playerTeam)) {
                        //Update the UI skill buttons
                        this.skillButtonsController.selectedCharacter(hitNode);
                        this.selectedCharacter = hitNode;
                        this.mouseRaycaster.changeMode(1, GetFromNode.playerController(this.selectedCharacter));
                        this.mode = Mode.moving;
                    }
                    else if (this.mode == Mode.attacking) {
                        this.mouseRaycaster.changeMode(2, GetFromNode.playerController(this.selectedCharacter));
                        const selectedPlayer = GetFromNode.playerController(this.selectedCharacter);
                        const hitPlayer = GetFromNode.playerController(hitNode);
                        if (this.hitMask & hitPlayer.getMask()) {
                            selectedPlayer.attackOther(GetFromNode.playerController(hitNode));

                            if (this.gameMode === GameMode.ONLINE) {
                                NetworkManager.getInstance().action("attack", {
                                    QR: this.get_QR_selectedCharacter(),
                                    QR_target: { q: hitPlayer.getQR().q, r: hitPlayer.getQR().r }
                                });
                            }

                            this.changeTurn();
                        }
                        this.setToNoneMode();
                    }
                }
                else {
                    this.setToNoneMode();
                }
            }
        }
    }

    get_QR_selectedCharacter() {
        return GetFromNode.playerController(this.selectedCharacter).getQR();
    }

    isCharacter(name: string) {
        return name == 'Barbarian' || name == 'Knight' || name == 'Mage' || name == 'Rogue';
    }

    setToNoneMode() {
        this.skillButtonsController.selectedCharacter(null);
        this.selectedCharacter = null;
        this.mouseRaycaster.changeMode(0);
        this.mode = Mode.none;
        director.emit('UI_update');
    }
}