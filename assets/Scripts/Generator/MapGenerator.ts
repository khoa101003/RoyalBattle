import { _decorator, Component, Node, Prefab, instantiate } from 'cc';
import { HexController } from '../Controller/HexController';
import { MapController } from '../Controller/MapController';
import { PlayerController } from '../Controller/PlayerController';
import { GetFromNode } from '../General/GetFromNode';
const { ccclass, property } = _decorator;

// HexMapGenerator.ts

@ccclass
export class MapGenerator extends Component {
    @property(Prefab)
    hexTilePrefab: Prefab = null;

    @property
    mapRadius: number = 9;

    static hexSize: number = 2 / Math.sqrt(3); // Outer radius in pixels

    private hexMap: Map<string, Node> = new Map();

    onLoad() {
        this.generateHexMap();
    }

    generateHexMap() {
        // Clear existing map
        this.node.removeAllChildren();
        this.hexMap.clear();

        // Generate hexagonal spiral pattern
        for (let q = -this.mapRadius; q <= this.mapRadius; q++) {
            for (let r = -this.mapRadius; r <= this.mapRadius; r++) {
                const s = -q - r;
                if (Math.abs(q) + Math.abs(r) + Math.abs(s) > this.mapRadius * 2) continue;

                const hexNode = instantiate(this.hexTilePrefab);

                const hexController = hexNode.getChildByName(hexNode.name).getChildByName('HexController').getComponent(HexController); // Set unique name for each hex tile

                if (hexController) {
                    hexController._q = q;
                    hexController._r = r;
                }
                //const hexTile = hexNode.getComponent('HexTile');

                // Set coordinates
                //hexTile.setCoords(q, r);

                // Calculate position
                const x = MapGenerator.hexSize * (Math.sqrt(3) * q + Math.sqrt(3) / 2 * r);
                const z = MapGenerator.hexSize * (3 / 2 * r);
                hexNode.setPosition(x, 0, z); // Adjust Y position as needed

                // Add to map
                this.node.addChild(hexNode);
                this.hexMap.set(`${q},${r}`, hexNode);
            }
        }
    }
    static toXZ(q: number, r: number): { x: number, z: number } {
        const x = this.hexSize * (Math.sqrt(3) * q + Math.sqrt(3) / 2 * r);
        const z = this.hexSize * (3 / 2 * r);
        return { x, z };
    }
    getTileAt(q: number, r: number): Node {
        return this.hexMap.get(`${q},${r}`);
    }
    highlightTile(character: PlayerController, map: MapController, AI: boolean = false, mask: number = 2) {
        const _q = character._q;
        const _r = character._r;
        for (let q = -this.mapRadius; q <= this.mapRadius; q++) {
            for (let r = -this.mapRadius; r <= this.mapRadius; r++) {
                const s = -q - r;
                if (Math.abs(q) + Math.abs(r) + Math.abs(s) > this.mapRadius * 2) continue;

                const tileNode = this.getTileAt(q, r);
                if (tileNode) {
                    const hexController = GetFromNode.hexController(tileNode);
                    if (hexController) {
                        const distance = Math.abs(_q - q) + Math.abs(_r - r);
                        hexController.setHighlighted(map.lengthPathToQR(_q, _r, q, r, AI, mask ) <= character.range_move);
                    }
                }
            }
        }
    }
}