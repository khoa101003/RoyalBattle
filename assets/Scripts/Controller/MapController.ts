import { _decorator, Component, Node, Prefab, instantiate, director } from 'cc';
import { HexDirection } from './HexDirection';
import { PriorityQueue } from '../DataStructure/PriorityQueue';
import { ObjectType } from './ObjectType';
import { MapGenerator } from '../Generator/MapGenerator';
import { PlayerController } from './PlayerController';
const { ccclass, property } = _decorator;

interface Tile {
    q: number;
    r: number;
}
export class MapController{
    //private static instance: MapController;
    walls: Prefab[] = [];
    private map: ObjectType[][];
    private map_object: Node[][];
    private previousMove: Tile[][]
    private d: number[][];
    private visited: boolean[][];
    public mapRadius: number = 9;

    private move: Tile[] = [{ q: 1, r: 0 }, { q: -1, r: 0 }, { q: 1, r: -1 }, { q: 0, r: 1 }, { q: 0, r: -1 }, { q: -1, r: 1 }]

    private queue: PriorityQueue<Tile> = new PriorityQueue<Tile>;
    private old_q: number = 0;
    private old_r: number = 0;
    private inf: number = this.mapRadius * this.mapRadius + 10;
    constructor (walls: Prefab[]){
        this.walls = walls;
        this.map = new Array(this.mapRadius * 2 + 1).fill(ObjectType.NONE).map(() => new Array(this.mapRadius * 2 + 1).fill(ObjectType.NONE));
        this.map_object = new Array(this.mapRadius * 2 + 1).fill(null).map(() => new Array(this.mapRadius * 2 + 1).fill(null));
        this.previousMove = new Array(this.mapRadius * 2 + 1).fill(null).map(() => new Array(this.mapRadius * 2 + 1).fill(null).map(() => ({q:-1, r:-1})));
        const tmp = this.mapRadius * 2 + 1
        this.d = new Array(tmp).fill(this.inf).map(() => new Array(tmp).fill(this.inf));
        this.visited = new Array(tmp).fill(false).map(() => new Array(tmp).fill(false));
        /*for (let i = 0; i < this.mapRadius * 2 + 1; ++i) {
            console.log("Map object at ", i - this.mapRadius, " ", i - this.mapRadius, ": ", this.map[i][i]);
        }*/
    }
    /*onLoad() {
        if (MapController.instance) {
            this.node.destroy();
            return;
        }
        MapController.instance = this;

        this.map = new Array(this.mapRadius * 2 + 1).fill(ObjectType.NONE).map(() => new Array(this.mapRadius * 2 + 1).fill(ObjectType.NONE));
        this.map_object = new Array(this.mapRadius * 2 + 1).fill(null).map(() => new Array(this.mapRadius * 2 + 1).fill(null));
        this.previousMove = new Array(this.mapRadius * 2 + 1).fill({ q: 0, r: 0 }).map(() => new Array(this.mapRadius * 2 + 1).fill({ q: 0, r: 0 }));
        for (let i = 0; i < this.mapRadius * 2 + 1; ++i) {
            console.log("Map object at ", i - this.mapRadius, " ", i - this.mapRadius, ": ", this.map[i][i]);
        }

        director.on('character_removed', this.removeCharacter, this);
    }
    onDestroy() {
        director.off('character_removed', this.removeCharacter, this);
    }*/
    removeCharacter(character : PlayerController) {
        if (character) {
            const q = character.getQR().q;
            const r = character.getQR().r;
            this.map[q + this.mapRadius][r + this.mapRadius] = ObjectType.NONE;
            this.map_object[q + this.mapRadius][r + this.mapRadius] = null;
            //director.emit('destroy_character', node);
        }

    }
    addObject(object: ObjectType, q: number, r: number, tmp: Node = null) {
        if (this.map[q + this.mapRadius][r + this.mapRadius] != ObjectType.NONE) return;
        this.map[q + this.mapRadius][r + this.mapRadius] = object;
        /*if (tmp){

            if (object == ObjectType.WALL) {
                //const node = instantiate(this.walls[Math.floor(Math.random() * this.walls.length)]);
                //const hexPos = MapGenerator.toXZ(q, r); // Adjust Y position as needed
                //node.setPosition(hexPos.x, node.getPosition().y, hexPos.z)
                //this.node.addChild(node);
                this.map_object[q + this.mapRadius][r + this.mapRadius] = tmp;
            } else if (object == ObjectType.CHARACTER) {
                this.map_object[q + this.mapRadius][r + this.mapRadius] = tmp;
            }
            else{
                console.log("MapController.addObject ObjectType not valid!");
            }
        }
        else{
            this.map_object[q+this.mapRadius][r+this.mapRadius] = null;
            this.map[q + this.mapRadius][r + this.mapRadius] = ObjectType.NONE;
        }*/
        //console.log("Map object at ", q, " ", r, ": ", this.map[q + this.mapRadius][r + this.mapRadius]);
    }
    checkQR(q: number, r: number) {
        q += this.mapRadius;
        r += this.mapRadius;
        return (q >= 0 && q < this.mapRadius * 2 + 1 && r >= 0 && r < this.mapRadius * 2 + 1 && this.map[q][r] == ObjectType.NONE)
    }
    moveObject(q: number, r: number, target_q: number, target_r: number) {
        console.log("Moving object ", this.map[q + this.mapRadius][r + this.mapRadius], " from ", q, " ", r, " to ", target_q, " ", target_r);
        q += this.mapRadius;
        r += this.mapRadius;
        target_q += this.mapRadius;
        target_r += this.mapRadius;

        this.map[target_q][target_r] = this.map[q][r];
        this.map[q][r] = ObjectType.NONE;

        this.map_object[target_q][target_r] = this.map_object[q][r];
        this.map_object[q][r] = null;

        this.old_q = -1;
    }
    getObject(q: number, r: number) {
        return this.map[q + this.mapRadius][r + this.mapRadius];
    }
    getObjectNode(q: number, r: number) {
        console.log("Getting object node at ", q, " ", r, " ", this.map_object[q + this.mapRadius][r + this.mapRadius]);
        return this.map_object[q + this.mapRadius][r + this.mapRadius];
    }
    lengthPathToQR(q: number, r: number, target_q: number, target_r: number, AI: boolean = false, mask: number = 2) {
        q += this.mapRadius;
        r += this.mapRadius;
        target_q += this.mapRadius;
        target_r += this.mapRadius;
        if (q != this.old_q || r != this.old_r) {
            this.pathToQR(q - this.mapRadius, r - this.mapRadius, target_q - this.mapRadius, target_r - this.mapRadius, AI, mask);
        }
        return this.d[target_q][target_r];
    }
        
    pathToQR(q: number, r: number, target_q: number, target_r: number, AI: boolean = false, mask: number = 2) {
        //need to check this function again!!!!!
        q += this.mapRadius;
        r += this.mapRadius;
        target_q += this.mapRadius;
        target_r += this.mapRadius;
        if (AI) console.log("q: ", q, " r: ", r, " target_q: ", target_q, " target_r: ", target_r);
        if (q != this.old_q || r != this.old_r) {
            this.old_q=q;
            this.old_r=r;
            console.log("Start dijkstra from ", q, ",", r ," to ", target_q, ",", target_r );
            this.queue.clear();
            this.queue.push({ q: q, r: r }, 0);
            console.log("d: ", this.d);
            this.reset_D();
            this.previousMove[q][r] = {q, r};
            this.d[q][r] = 0;
            while (this.queue.length() > 0) {
                const u = this.queue.pop();
        
                if (this.visited[u.value.q][u.value.r]) continue;
                this.visited[u.value.q][u.value.r] = true;
                if (AI && u.value.q == target_q && u.value.r == target_r) console.log("visit u: ", u.value.q, " ", u.value.r)
                for (let i = 0; i <= 5; ++i) {
                    const new_q = u.value.q + this.move[i].q;
                    const new_r = u.value.r + this.move[i].r;
    
                    if (AI && this.inside(new_q, new_r) && new_q == target_q && new_r == target_r) {
                        this.d[new_q][new_r] = this.d[u.value.q][u.value.r] + 1;
                        this.previousMove[new_q][new_r] = u.value;
                    }
                    if (!this.check_qr(new_q, new_r)) {
                        continue;
                    }
                    //console.log("check: ", new_q, " ", new_r, " ", this.d[new_q][new_r], " ",  this.d[u.value.q][u.value.r] + 1)
                    if (this.d[new_q][new_r] > this.d[u.value.q][u.value.r] + 1) {
                        this.d[new_q][new_r] = this.d[u.value.q][u.value.r] + 1;
                        this.previousMove[new_q][new_r] = u.value;
                        //console.log("update: ", new_q, " ", new_r, " ", this.previousMove[new_q][new_r]);
                        this.queue.push({ q: new_q, r: new_r }, this.d[new_q][new_r]);
                    }
                }
            }
            /*const tmp = this.mapRadius*2+1;
            for (let i=0; i<tmp; ++i){
                for (let j=0; j<tmp; ++j){
                    console.log("previous[", i,"][",j,'] = ', this.previousMove[i][j].q, ",", this.previousMove[i][j].r);
                }
            }
            for (let i=0; i<tmp; ++i){
                for (let j=0; j<tmp; ++j){
                    console.log("d[", i,"][",j,'] = ', this.d[i][j]);
                }
            }*/
        }
        console.log("Completed dijkstra");
        const result = [];
        if (this.d[target_q][target_r] == this.inf || (target_q == q && target_r == r)) return [];
        while (true) {
            //console.log("previous: " , target_q, " ", target_r, " ", this.previousMove[target_q][target_r].q, " ", this.previousMove[target_q][target_r].r);
            const tmp = this.previousMove[target_q][target_r];
            const tmp_q = target_q - tmp.q;
            const tmp_r = target_r - tmp.r;
            if (tmp_q == 1 && tmp_r == 0)
                result.push(HexDirection.RIGHT);
            else if (tmp_q == -1 && tmp_r == 0)
                result.push(HexDirection.LEFT);
            else if (tmp_q == 1 && tmp_r == -1)
                result.push(HexDirection.UPRIGHT);
            else if (tmp_q == -1 && tmp_r == 1)
                result.push(HexDirection.BOTTOMLEFT);
            else if (tmp_q == 0 && tmp_r == 1)
                result.push(HexDirection.BOTTOMRIGHT);
            else if (tmp_q == 0 && tmp_r == -1)
                result.push(HexDirection.UPLEFT);

            target_q = tmp.q;
            target_r = tmp.r;
            if (target_q == q && target_r == r) break;
        }
        //console.log("Completed tracking with path: ", result.length)
        return result;
    }
    check_qr(q: number, r: number) {
        return (q >= 0 && q < this.mapRadius * 2 + 1 && r >= 0 && r < this.mapRadius * 2 + 1 && this.map[q][r] == ObjectType.NONE)
    }
    inside(q: number, r: number) {
        return (q >= 0 && q < this.mapRadius * 2 + 1 && r >= 0 && r < this.mapRadius * 2 + 1);
    }
    reset_D() {
        const tmp = this.mapRadius * 2 + 1
        for (let i = 0; i < tmp; ++i) {
            for (let j = 0; j < tmp; ++j) {
                this.d[i][j] = this.inf; // Set to a large value
                this.visited[i][j] = false;
                this.previousMove[i][j] = { q: -1, r: -1 };
            }
        }
        //this.d = new Array(tmp).fill(tmp * tmp + 10).map(() => new Array(tmp).fill(tmp * tmp + 10));
        console.log("Reset d completed!!!")
    }

    clearMap() {
        // Remove all objects from the map
        for (let q = 0; q < this.mapRadius * 2 + 1; q++) {
            for (let r = 0; r < this.mapRadius * 2 + 1; r++) {
                if (this.map[q][r] !== ObjectType.NONE) {
                    // If there's an object at this position, destroy it
                    if (this.map_object[q][r]) {
                        this.map_object[q][r].destroy();
                        this.map_object[q][r] = null;
                    }
                    this.map[q][r] = ObjectType.NONE;
                }
            }
        }
        console.log("Map cleared");
    }

    // Print a text representation of the hex map
    printHexMap() {
        console.log(`=== HEX MAP (Radius: ${this.mapRadius}) ===`);

        // Create a 2D representation for easier visualization
        const grid: string[][] = [];
        const size = this.mapRadius * 2 + 1;

        // Initialize the grid with spaces
        for (let i = 0; i < size; i++) {
            grid[i] = [];
            for (let j = 0; j < size; j++) {
                grid[i][j] = ' . '; // Empty hex
            }
        }

        // Fill in the grid with hex information
        for (let q = -this.mapRadius; q <= this.mapRadius; q++) {
            for (let r = -this.mapRadius; r <= this.mapRadius; r++) {
                const s = -q - r;
                if (Math.abs(q) + Math.abs(r) + Math.abs(s) > this.mapRadius * 2) continue;

                // Convert to array indices
                const row = r + this.mapRadius;
                const col = q + this.mapRadius;

                // Get hex data from MapController if available
                if (typeof MapController !== 'undefined') {
                    const objType = this.getObject(q, r);

                    if (objType === 1) { // Wall
                        grid[row][col] = ' W ';
                    } else if (objType === 2) { // Character
                        const node = this.getObjectNode(q, r);
                        if (node) {
                            const playerController = node.getChildByName("PlayerController")?.getComponent(PlayerController);
                            if (playerController) {
                                const mask = playerController.getMask();
                                grid[row][col] = `C${mask}`;
                            } else {
                                grid[row][col] = ' C ';
                            }
                        }
                    }
                } else {
                    // Just mark that a hex exists here
                    grid[row][col] = ' o ';
                }
            }
        }

        // Print the grid with proper hex alignment
        for (let r = 0; r < size; r++) {
            let line = '';
            // Add indentation for hex grid appearance
            line += ' '.repeat(r);

            for (let q = 0; q < size; q++) {
                line += grid[r][q];
            }
            console.log(line);
        }

        console.log("=== LEGEND ===");
        console.log(" . : Empty or outside map");
        console.log(" W : Wall");
        console.log("C1 : Team 1 Character");
        console.log("C2 : Team 2 Character");
        console.log("==============");
    }

    // Print just the object types in the map
    printObjectMap() {
        if (typeof MapController === 'undefined') {
            console.error("MapController not available");
            return;
        }

        console.log("=== OBJECT MAP ===");
        const mapController = this;

        for (let q = -this.mapRadius; q <= this.mapRadius; q++) {
            let line = '';
            // Add indentation for hex grid appearance
            const indent = this.mapRadius + q;
            line += ' '.repeat(indent);

            for (let r = -this.mapRadius; r <= this.mapRadius; r++) {
                const s = -q - r;
                if (Math.abs(q) + Math.abs(r) + Math.abs(s) > this.mapRadius * 2) {
                    line += '   ';
                    continue;
                }

                if (mapController.inside(q + this.mapRadius, r + this.mapRadius)) {
                    const objType = mapController.getObject(q, r);

                    if (objType === 0) {
                        line += ' . '; // Empty
                    } else if (objType === 1) {
                        line += ' W '; // Wall
                    } else if (objType === 2) {
                        // Check for team
                        const node = mapController.getObjectNode(q, r);
                        if (node) {
                            const playerController = node.getChildByName("PlayerController")?.getComponent(PlayerController);
                            if (playerController) {
                                const mask = playerController.getMask();
                                line += `C${mask}`;
                            } else {
                                line += ' C ';
                            }
                        } else {
                            line += ' ? '; // Unknown character
                        }
                    } else {
                        line += ' ? '; // Unknown object
                    }
                } else {
                    line += '   '; // Outside map
                }
            }
            console.log(line);
        }

        console.log("=== LEGEND ===");
        console.log(" . : Empty");
        console.log(" W : Wall");
        console.log("C1 : Team 1 Character");
        console.log("C2 : Team 2 Character");
        console.log(" ? : Unknown object");
        console.log("==============");
    }


    // Method to remove a wall at specified coordinates
    /*removeWall(q: number, r: number) {
        const adjustedQ = q + this.mapRadius;
        const adjustedR = r + this.mapRadius;

        if (this.inside(adjustedQ, adjustedR) && this.map[adjustedQ][adjustedR] === ObjectType.WALL) {
            // Find child wall node at this position
            const children = this.node.children;
            for (let i = 0; i < children.length; i++) {
                const child = children[i];
                const childPos = child.getPosition();
                const hexPos = MapGenerator.toXZ(q, r);

                // Check if positions match (with some tolerance for floating point errors)
                if (Math.abs(childPos.x - hexPos.x) < 0.1 && Math.abs(childPos.z - hexPos.z) < 0.1) {
                    child.destroy();
                    break;
                }
            }

            // Clear map data
            this.map[adjustedQ][adjustedR] = ObjectType.NONE;
            this.map_object[adjustedQ][adjustedR] = null;
        }
    }*/
}


