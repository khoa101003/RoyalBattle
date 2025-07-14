import { _decorator, Component, Node, SkeletalAnimation, Vec3 } from 'cc';
import { IPoolable } from '../../General/ObjectPool';
import { AudioManager } from '../AudioController';
const { ccclass, property } = _decorator;

@ccclass('ArrowController')
export default class ArrowController extends Component implements IPoolable{    


    private speed: number = 12;
    private lifeTime: number = 0; // seconds
    private currentLife: number = 0; // seconds
    private origin_pos: Vec3 = null;
    private target_pos: Vec3 = null;
    private velocity: Vec3 = null;
    reset(){
        this.node.active = false;
    }
    init(origin_pos: Vec3, target_pos: Vec3) {
        this.node.active = true;
        this.origin_pos = origin_pos;
        this.target_pos = target_pos;
        this.node.setPosition(this.origin_pos);
        let direction = Vec3.subtract(new Vec3(), this.target_pos, this.origin_pos);
        Vec3.normalize(direction, direction);
        console.log("ArrowController.init origin_pos: ", this.origin_pos, " target_pos: ", this.target_pos, " direction: ", direction);
        this.velocity = Vec3.multiplyScalar(new Vec3(), direction, this.speed);
        this.lifeTime = Vec3.distance(this.origin_pos, this.target_pos) / this.speed;
        console.log("ArrowController.init velocity: ", this.velocity, " lifeTime: ", this.lifeTime);
        this.currentLife = 0;
        this.faceTarget();
    }

    protected update(dt: number): void {
        const pos = this.node.getPosition();
        console.log("ArrowController.update pos: ", pos);
        pos.add(this.velocity.clone().multiplyScalar(dt));
        console.log("ArrowController.update : ", this.velocity.clone().multiplyScalar(dt), " dt: ", dt);
        this.node.setPosition(pos);
        // Update lifetime
        this.currentLife += dt;
        
        // Check if bullet should be destroyed
        if (this.currentLife >= this.lifeTime) {
            if (this.node.name == "fireball"){
                AudioManager.getInstance().playSound('FireExplosion', 0.8);
            }
            else if (this.node.name == "arrow") {
                AudioManager.getInstance().playSound('ArrowBodyImpact', 0.8);
            }
            this.release();
        }
    }
    release() {
        this.reset();
        this.node.getParent().emit('arrow_released', this);
    }
    faceTarget() {
            const charPos = {x : this.origin_pos.x, z : this.origin_pos.z};
            const targetPos = {x : this.target_pos.x, z : this.target_pos.z};
            
            // Calculate direction vector using X and Z (not Y)
            const dx = targetPos.x - charPos.x;
            const dz = targetPos.z - charPos.z;
        
            //console.log("Attack: ", dx, " ", dz);
            // Convert to degrees and adjust for model orientation
            // Using -Math.atan2 to invert the angle calculation
            let angleInDegrees = 0;
            if (dx == 0) {
                if (dz > 0)
                    angleInDegrees = 0;
                else
                    angleInDegrees = 180;
            }
            else if (dz == 0) {
                if (dx > 0)
                    angleInDegrees = 90;
                else
                    angleInDegrees = -90;
            }
            else if (dx > 0 && dz > 0) {
                angleInDegrees = Math.atan(dx/dz) * 180 / Math.PI;
            }
            else if (dx < 0 && dz > 0) {
                angleInDegrees = 0;
                angleInDegrees = - Math.atan((-dx)/dz) * 180 / Math.PI;
            }
            else if (dx < 0 && dz < 0) {
                angleInDegrees = 0;
                angleInDegrees = Math.atan((-dx)/(-dz))*180/Math.PI - 180;
            }
            else if (dx > 0 && dz < 0) {
                angleInDegrees = 0;
                angleInDegrees = 180 - Math.atan(dx/(-dz)) * 180 / Math.PI;
            }
            //console.log("Attack angle: ", angleInDegrees);
            this.node.setRotationFromEuler(0, angleInDegrees, 0);
        }
}