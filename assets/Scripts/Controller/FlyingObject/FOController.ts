import { _decorator, Component, Node, Prefab, SkeletalAnimation } from 'cc';
import { PrefabPool } from '../../General/ObjectPool';
import ArrowController from './ArrowController';
const { ccclass, property } = _decorator;

@ccclass('FOController')
export default class FOController extends Component {
    public static instance: FOController = null;
    @property(Prefab)
    private arrowPrefab: Prefab = null;

    @property(Prefab)
    private fireballPrefab: Prefab = null;

    private arrowPool: PrefabPool<ArrowController>;
    private fireballPool: PrefabPool<ArrowController>; // Assuming you will create a FireballController similar to ArrowController

    static getInstance(): FOController {
        if (!FOController.instance) {
            console.log("FOController instance is null");
            return null;
        }
        return FOController.instance;
    }
    onLoad() {
        if (!FOController.instance) FOController.instance = this;
        if (!this.arrowPrefab) {
            console.error("Arrow prefab is not assigned! Please assign it in the editor.");
            return;
        }else {
            this.arrowPool = new PrefabPool<ArrowController>(this.arrowPrefab, this.node, ArrowController, 10);
        }
        if (!this.fireballPrefab) {
            console.error("Fireball prefab is not assigned! Please assign it in the editor.");
            return;
        } else {
            this.fireballPool = new PrefabPool<ArrowController>(this.fireballPrefab, this.node, ArrowController, 10);
        }
    }
    addArrow(origin_pos: Node, target_pos: Node) {
        if (!this.arrowPool) {
            console.error("Arrow pool is not initialized!");
            return;
        }
        
        const arrow = this.arrowPool.acquire();
        if (arrow) {
            arrow.init(origin_pos.getPosition(), target_pos.getPosition());
            this.node.addChild(arrow.node);
        } else {
            console.warn("No available arrows in the pool.");
        }
    }
    addFireball(origin_pos: Node, target_pos: Node) {
        if (!this.fireballPool) {
            console.error("Fireball pool is not initialized!");
            return;
        }
        
        const fireball = this.fireballPool.acquire();
        if (fireball) {
            fireball.init(origin_pos.getPosition(), target_pos.getPosition());
            this.node.addChild(fireball.node);
        } else {
            console.warn("No available fireballs in the pool.");
        }
    }
}