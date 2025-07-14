import { _decorator, Component, Node, Camera, systemEvent, SystemEvent, find, Event, director, PhysicsSystem } from 'cc';
import { PlayerController } from '../Controller/PlayerController';
import { HexController } from '../Controller/HexController';
import { MapController } from '../Controller/MapController';
import { MainSceneController } from '../Controller/MainSceneController';
import { GetFromNode } from '../General/GetFromNode';
const { ccclass, property } = _decorator;
// MouseRaycaster.ts
enum mode {
    NONE = 0,//choosing character
    MOVE = 1,//choosing hex
    ATTACK = 2,
}
@ccclass
export class MouseRaycaster extends Component {
    private camera: Camera = null;
    private mainSceneController: MainSceneController = null;
    private previousHitNode: Node | null = null;
    private previousHitNodeController: Node | null = null;
    private mode: mode = mode.NONE;
    private range: number = 0;
    private center_q: number = 0;
    private center_r: number = 0;
    onLoad() {
        this.camera = find('Main Camera').getComponent(Camera);
        this.mainSceneController = MainSceneController.getInstance();
        systemEvent.on(SystemEvent.EventType.MOUSE_MOVE, this.onMouseMove, this);
    }

    onMouseMove(event: any) {
        //console.log("Mouse moved: ", event.getLocationX(), event.getLocationY());
        const ray = this.camera.screenPointToRay(event.getLocationX(), event.getLocationY());
        //console.log("Ray: ", ray);
        const hit = PhysicsSystem.instance.raycast(ray);
        if (hit) {
            const hits = PhysicsSystem.instance.raycastResults;
            if (!hits) return;
            if (hits.length === 0) return;
            //console.log("Raycast hits: ", hits.length);
            let hitNode = hits[0].collider.node;
            let hitDistance = hits[0].distance;
            for (let i = 0; i < hits.length; i++) {
                const hit = hits[i];
                if (hit.distance < hitDistance) {
                    hitDistance = hit.distance;
                    hitNode = hit.collider.node;
                }
                //console.log("Hit: ", hit.distance);
            }
            //console.log("Raycast hit: ", hit, "Node: ", hitNode.name);
            //console.log(hitNode.getChildByName("HexController").name);
            if (hitNode.name == "hex_grass")
                if (hitNode.getChildByName('HexController')) {
                    if (this.previousHitNode != hitNode) {
                        if (this.previousHitNodeController) {
                            this.previousHitNodeController.emit('onMouseExit');
                        }
                        this.previousHitNode = null;
                        this.previousHitNodeController = null;
                        if ((this.mode == mode.MOVE && this.check_hex_inside_move_range(hitNode.getChildByName('HexController').getComponent(HexController))) ||
                            (this.mode == mode.ATTACK && this.check_hex_inside_range(hitNode.getChildByName('HexController').getComponent(HexController)))) {
                            if (hitNode)
                                hitNode.getChildByName('HexController').emit('onMouseEnter');
                            this.previousHitNode = hitNode;
                            this.previousHitNodeController = hitNode.getChildByName('HexController');
                        }
                    }
                }
            if (this.isCharacter(hitNode.name))
                if (GetFromNode.playerController(hitNode)) {
                    if (this.previousHitNode != hitNode) {
                        this.mainSceneController.node.emit('new_character_selected', GetFromNode.playerController(hitNode));
                        if (this.previousHitNodeController) {
                            this.previousHitNodeController.emit('onMouseExit');
                        }
                        this.previousHitNode = null;
                        this.previousHitNodeController = null;
                        if (this.mode == mode.NONE || this.mode == mode.MOVE ||
                            (this.mode == mode.ATTACK
                                && this.check_hex_inside_range(GetFromNode.playerController(hitNode)))) {
                            if (hitNode)
                                hitNode.emit('onMouseEnter');
                            this.previousHitNode = hitNode;
                            this.previousHitNodeController = hitNode;
                        }
                    }
                }
        }
    }
    isCharacter(name: string) {
        return name == 'Barbarian' || name == 'Knight' || name == 'Mage' || name == 'Rogue';
    }
    changeMode(newMode: number, character?: PlayerController) {
        this.mode = newMode;
        if (this.mode == mode.MOVE && character) {
            this.range = character.range_move;
            this.center_q = character._q;
            this.center_r = character._r;
        }
        else if (this.mode == mode.ATTACK && character) {
            this.range = character.range_attack;
            this.center_q = character._q;
            this.center_r = character._r;
        }
        else if (this.mode == mode.NONE) {
            this.range = 0;
        }
        console.log("End of MouseRayCaster.changMode");
    }
    check_hex_inside_range(hex: HexController | PlayerController) {
        const tmp_q = Math.abs(this.center_q - hex._q);
        const tmp_r = Math.abs(this.center_r - hex._r);
        const tmp_s = Math.abs(- this.center_q - this.center_r + hex._q + hex._r);

        return this.range >= Math.max(tmp_q, tmp_r, tmp_s);
    }

    check_hex_inside_move_range(hex: HexController | PlayerController) {
        const path = MainSceneController.getInstance().getMapController().pathToQR(this.center_q, this.center_r, hex._q, hex._r);
        if (path.length > 0 && path.length <= this.range) {
            return true;
        }
        return false;
    }
    getHitNode() {
        return this.previousHitNode;
    }
    onDestroy() {
        systemEvent.off(SystemEvent.EventType.MOUSE_MOVE, this.onMouseMove, this);
    }
}
