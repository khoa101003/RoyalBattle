import {
    _decorator, Component, Node, director, input, Input, KeyCode, RigidBody, error, Vec3,
    Collider, PhysicsGroup, PhysicsSystem, geometry, PhysicsRayResult, SkeletalAnimation, AnimationClip,
    EPhysicsDrawFlags, RigidBodyComponent, find, tween, Quat,
    Vec2,
    WorldNode3DToLocalNodeUI,
    WorldNode3DToWorldNodeUI,
    Camera,
    Prefab,
    instantiate,
} from 'cc';
const { ccclass, property } = _decorator;
import { HexDirection } from './HexDirection';
import { MapGenerator } from '../Generator/MapGenerator';
import { MapController } from './MapController';
import {IPoolable} from '../General/ObjectPool';
import { MainSceneController } from './MainSceneController';
import FOController from './FlyingObject/FOController';
import { AudioManager } from './AudioController';
enum AnimationState {
    IDLE,
    RUNNING,
    JUMPING,
    ATTACKING,
    HIT,
    USE_ITEM,
    DEATH,
}
@ccclass
export class PlayerController extends Component implements IPoolable{

    /*@property(Camera)
    camera: Camera = null;
    @property(Node)
    canvansNode: Node = null;*/
    

    @property(Node)
    player: Node = null!;

    @property
    jumpForce: number = 5.0;

    private moveSpeed: number = 10.0;

    @property(Node)
    animNode: Node = null!;

    private mapController: MapController = null!;

    private currentState: AnimationState = null;
    private animComponent: SkeletalAnimation = null!; // Replace with the actual type of your animation component
    private idleAnim: string = "2H_Melee_Idle";
    private runAnim: string = "Running_A";
    private jumpAnim: string = "Jump_Full_Short";
    private attackAnim: string = "1H_Melee_Attack_Chop";
    private hitAnim: string = "Hit_A";
    private useItemAnim: string = "Use_Item";
    private deathAnim: string = "Death_A";

    private _rigidBody: RigidBody;
    private ready: boolean = true; // Flag to check if the player is ready to move

    //private moveDirection: Vec3 = new Vec3(0, 0, 0);
    private targetPos: Vec3 = new Vec3(0, 0, 0);
    private pathToMove: HexDirection[] = [];
    private targetq: number = 0;
    private targetr: number = 0;
    public _q: number = 0;
    public _r: number = 0;
    public _s: number = 0;
    public pre_q: number = null;
    public pre_r: number = null;

    @property(Number)
    max_health: number = 100;
    @property(Number)
    attack: number = 10;
    @property(Number)
    range_move: number = 3;
    @property(Number)
    range_attack: number = 1;
    public health: number = this.max_health;
    private mask: number = 0;

    @property(Boolean)
    isDead: boolean = false;

    onLoad() {

        this.node.on('onMouseEnter', this.onHoverStart, this);
        this.node.on('onMouseExit', this.onHoverEnd, this);
        this._rigidBody = this.player.getComponent(RigidBody);
        if (!this.animNode) {
            this.animNode = this.node.getChildByName("Animation");
        }
        if (this.animNode) {
            this.animComponent = this.animNode.getComponent(SkeletalAnimation);
            if (this.animComponent) console.log("Player Controller: Animation component found.");
        }
        if (!this._rigidBody) {
            error('RigidBody3D component is required!');
        }

        if (!this.mapController) {

            this.mapController = MainSceneController.getInstance().getMapController();
            if (!this.mapController) {
                error("Map node not found! Please assign it in MainSceneController.");
            }
        }

        if (this.node.name == "Rogue"){
            this.attackAnim = "1H_Ranged_Shoot";
        }
        else if (this.node.name == "Mage") {
            this.attackAnim = "Spellcast_Shoot";
        }
        else if (this.node.name == "Knight") {
        }
        else if (this.node.name == "Barbarian") {
        }
        else{
            console.log("PlayerController.onLoad: Unknown player type: ", this.node.name);
        }
        /*if (this.map) {
            this.mapController = this.map.getComponent(MapController);
        }*/
        this._rigidBody.angularDamping = 1;
        this._rigidBody.angularFactor = new Vec3(0, 1, 0);



        // Input setup
        input.on(Input.EventType.KEY_DOWN, this.onKeyDown, this);

        input.on(Input.EventType.KEY_UP, this.onKeyUp, this);
    }

    init(q: number, r:number, mask: number): void {
        this.reset();
        this.setPosition(q, r, 5); // Adjust Y position as needed
        this.setMask(mask);
        

        console.log("Player initialized at: ", q, " ", r, " with mask: ", mask);
    }
    reset(): void {
        this._q = 0;
        this._r = 0;
        this.targetq = 0;
        this.targetr = 0;
        this.health = this.max_health;
        this.isDead = false;
        this.ready = true;
        this.pathToMove = [];
        this.pre_q = null;
        this.pre_r = null;

        // Reset animations
        if (this.animComponent) {
            this.playAnimation(AnimationState.IDLE);
        }
    }

    onStart() {
        this.playAnimation(AnimationState.IDLE)
    }

    getMask() {
        return this.mask;
    }
    setMask(mask: number) {
        this.mask = mask;
    }

    setPosition(q: number, r: number, h: number) {

        this._q = q;
        this._r = r;
        this.targetq = q;
        this.targetr = r;
        const tmp = MapGenerator.toXZ(q, r);
        this.node.setPosition(tmp.x, h, tmp.z);
        this.targetPos = new Vec3(tmp.x, this.targetPos.y, tmp.z);
    }

    getQR() {
        return { q: this._q, r: this._r };
    }

    heal() {
        this.health = Math.min(this.health+10, this.max_health);
        console.log(this.node.name, " health: ", this.health);
        this.playAnimation(AnimationState.USE_ITEM);
        AudioManager.getInstance().playSound('Heal', 0.7);
    }

    attackOther(enemy: PlayerController) {
        if (this.node.name == 'Rogue'){
            FOController.getInstance().addArrow(this.node, enemy.node);
            AudioManager.getInstance().playSound('ArrowSwish', 0.8);
        }
        else if (this.node.name == 'Mage') {
            FOController.getInstance().addFireball(this.node, enemy.node);                  
        }
        else if (this.node.name == 'Knight') {
            AudioManager.getInstance().playSound('Slash', 0.8);
        }
        else if (this.node.name == 'Barbarian') {
            AudioManager.getInstance().playSound('Slash', 0.8);
        }  
        else {
            console.warn("Unknown player type for attack: ", this.node.name);
            return;
        }
        this.faceTarget(this, enemy);

        this.playAnimation(AnimationState.ATTACKING);
        enemy.beDamaged(this.attack, this);
    }
    // Replace cc.misc.radiansToDegrees with manual conversion
    // Make character face another character in 3D
    
    faceTarget(character, target) {
        const charPos = MapGenerator.toXZ(character._q, character._r);
        const targetPos = MapGenerator.toXZ(target._q, target._r);
        
        // Calculate direction vector using X and Z (not Y)
        const dx = targetPos.x - charPos.x;
        const dz = targetPos.z - charPos.z;
    
        console.log("Attack: ", dx, " ", dz);
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
        console.log("Attack angle: ", angleInDegrees);
        this.node.setRotationFromEuler(0, angleInDegrees, 0);
    }
    beDamaged(damage: number, attacker: PlayerController) {
        // Get positions
        const myPos = this.node.getWorldPosition();

        // Look toward attacker - direct method

        /*console.log("Defend rotation angle:", angleInDegrees);
        this.node.setRotationFromEuler(0, angleInDegrees + 180, 0);*/

        this.faceTarget(this, attacker);

        this.health -= damage;
        console.log("Damage ", this.node.name, " health: ", this.health);

        setTimeout(() => {
            this.playAnimation(AnimationState.HIT);}
        , 500);
        // Check if character died from this damage
        if (this.health <= 0) {
            setTimeout(() => {
                this.die();
                
            }, 1000);
        }

    }

    die() {
        if (this.isDead) return;

        this.isDead = true;
        this.health = 0;
        console.log(this.node.name + " has died!");

        // Play death animation
        this.playAnimation(AnimationState.DEATH);

        // Disable character controls
        this.ready = false;

        // Notify game system about character death

        setTimeout(() => {  
            this.node.getParent().emit('character_died', this);}
        , 1500); // Wait for 1.5 second before resetting
    }

    update(dt: number) {
        //this.checkGrounded();
        //console.log("isDead: ", this.isDead);
        if (this.isDead) return;
        //console.log("ready: ", this.ready);
        /*if (this.camera) {
            WorldNode3DToWorldNodeUI(this.camera, this.node.getPosition());

        }*/
        if (this.ready) {
            if (this._q != this.targetq || this._r != this.targetr) {
                if (this.pathToMove.length > 0) {
                    const tmp = this.pathToMove.pop();
                    this.move(tmp);
                }
                else {
                    this.pathToMove = this.mapController.pathToQR(this._q, this._r, this.targetq, this.targetr);
                    if (this.pathToMove.length > 0) {
                        this.pre_q = this._q;
                        this.pre_r = this._r;
                        console.log("Pre: ", this.pre_q, " ", this.pre_r);
                    }
                    else {
                        this.targetq = this._q;
                        this.targetr = this._r;
                    }
                }
            } else if (this.pre_q != null && this.pre_r != null) {
                this.mapController.moveObject(this.pre_q, this.pre_r, this._q, this._r);
                this.pre_q = null;
                this.pre_r = null;
            }
        }
        if (this._q != this.targetq || this._r != this.targetr ||
            Math.abs(this.node.worldPosition.x - this.targetPos.x) > 0.1 ||
            Math.abs(this.node.worldPosition.z - this.targetPos.z) > 0.1)
            this.playAnimation(AnimationState.RUNNING);
        else if (this.currentState != AnimationState.ATTACKING
            && this.currentState != AnimationState.HIT
            && this.currentState != AnimationState.USE_ITEM)
            this.playAnimation(AnimationState.IDLE);


        // Normalize and apply speed
        const velocity = new Vec3();
        this._rigidBody.getLinearVelocity(velocity);
        /*if (Math.abs(this.moveDirection.x) + Math.abs(this.moveDirection.z) >= 1) {

        velocity.x = this.moveDirection.x * this.moveSpeed;
        velocity.z = this.moveDirection.z * this.moveSpeed;
        console.log("Moving: ", this.moveDirection);
        
        // Keep current vertical velocity
        this._rigidBody.setLinearVelocity(velocity);
    }
    else{
        this._rigidBody.setLinearVelocity(new Vec3(0, velocity.y, 0));
}*/

        //console.log("TargetPos1: ", this.targetPos)
        if (Math.abs(this.node.worldPosition.x - this.targetPos.x) > 0.1 || Math.abs(this.node.worldPosition.z - this.targetPos.z) > 0.1) {
            this.ready = false;
            const tmp = this.targetPos.clone();
            const direction = tmp.subtract(this.node.worldPosition).normalize();
            //console.log("Target position: ", this.targetPos, " Node position: ", this.node.worldPosition, " Direction: ", direction);
            velocity.x = direction.x * this.moveSpeed;
            velocity.z = direction.z * this.moveSpeed;
            this._rigidBody.setLinearVelocity(velocity);
        }
        else {
            this._rigidBody.setLinearVelocity(new Vec3(0, velocity.y, 0));
            this.ready = true;
        }

    }
    playAnimation(state: AnimationState) {
        // Don't change animations if already dead except for the DEATH animation itself
        if (this.isDead && state !== AnimationState.DEATH) return;

        if (this.currentState === state) return;

        //console.log("Playing animation: ", state);
        this.currentState = state;

        switch (state) {
            case AnimationState.IDLE:
                this.animComponent.crossFade(this.idleAnim, 0.3);
                break;
            case AnimationState.RUNNING:
                this.animComponent.play(this.runAnim);
                break;
            case AnimationState.JUMPING:
                this.animComponent.crossFade(this.jumpAnim, 0.1);
                break;
            case AnimationState.ATTACKING:
                const attackState = this.animComponent.getState(this.attackAnim);
                attackState.wrapMode = AnimationClip.WrapMode.Normal;

                attackState.once('finished', () => {
                    if (!this.isDead) this.playAnimation(AnimationState.IDLE);
                });
                this.animComponent.crossFade(this.attackAnim, 0.1);
                break;
            case AnimationState.HIT:
                console.log("Start hit animation");
                const hitState = this.animComponent.getState(this.hitAnim);
                hitState.wrapMode = AnimationClip.WrapMode.Normal;

                hitState.once('finished', () => {
                    if (!this.isDead) this.playAnimation(AnimationState.IDLE);
                });
                this.animComponent.crossFade(this.hitAnim, 0.3);
                break;
            case AnimationState.USE_ITEM:
                const useItemState = this.animComponent.getState(this.useItemAnim);
                useItemState.wrapMode = AnimationClip.WrapMode.Normal;

                useItemState.once('finished', () => {
                    if (!this.isDead) this.playAnimation(AnimationState.IDLE);
                });
                this.animComponent.crossFade(this.useItemAnim, 0.1);
                break;
            case AnimationState.DEATH:
                const deathState = this.animComponent.getState(this.deathAnim);
                deathState.wrapMode = AnimationClip.WrapMode.Normal;

                // No need to go back to idle after death
                this.animComponent.crossFade(this.deathAnim, 0.1);
                break;
        }
    }
    move(direction: HexDirection) {
        if (direction == HexDirection.RIGHT)
            this.moveRight();
        if (direction == HexDirection.LEFT)
            this.moveLeft();
        if (direction == HexDirection.UPRIGHT)
            this.moveUpRight();
        if (direction == HexDirection.BOTTOMRIGHT)
            this.moveBottomRight();
        if (direction == HexDirection.UPLEFT)
            this.moveUpLeft();
        if (direction == HexDirection.BOTTOMLEFT)
            this.moveBottomLeft();
        AudioManager.getInstance().playSound("FootStepGrass", 0.5);
    }
    moveToHex(q: number, r: number) {
        this.targetq = q;
        this.targetr = r;
    }
    moveRight() {
        if (!this.ready) return;
        this.ready = false;
        const tmp = MapGenerator.toXZ(this._q + 1, this._r);
        this.node.setRotationFromEuler(0, 90, 0);
        this.targetPos = new Vec3(tmp.x, this.targetPos.y, tmp.z);
        //console.log("Moving right: ", this._q, " ", this._r, " to ", tmp.x, " ", tmp.z, " ", this.targetPos);
        this._q += 1;
    }
    moveLeft() {
        if (!this.ready) return;
        this.ready = false;
        const tmp = MapGenerator.toXZ(this._q - 1, this._r);
        this.node.setRotationFromEuler(0, -90, 0);
        this.targetPos = new Vec3(tmp.x, this.targetPos.y, tmp.z);
        //console.log("Moving left: ", this._q, " ", this._r, " to ", tmp.x, " ", tmp.z, " ", this.targetPos);
        this._q -= 1;
    }
    moveUpRight() {
        if (!this.ready) return;
        this.ready = false;
        const tmp = MapGenerator.toXZ(this._q + 1, this._r - 1);
        this.node.setRotationFromEuler(0, 150, 0);
        this.targetPos = new Vec3(tmp.x, this.targetPos.y, tmp.z);
        //console.log("Moving up right: ", this._q, " ", this._r, " to ", tmp.x, " ", tmp.z, " ", this.targetPos);
        this._q += 1;
        this._r -= 1;
    }
    moveBottomRight() {
        if (!this.ready) return;
        this.ready = false;
        const tmp = MapGenerator.toXZ(this._q, this._r + 1);
        this.node.setRotationFromEuler(0, 30, 0);
        this.targetPos = new Vec3(tmp.x, this.targetPos.y, tmp.z);
        //console.log("Moving bottom right: ", this._q, " ", this._r, " to ", tmp.x, " ", tmp.z, " ", this.targetPos);
        this._r += 1;
    }
    moveUpLeft() {
        if (!this.ready) return;
        this.ready = false;
        const tmp = MapGenerator.toXZ(this._q, this._r - 1);
        this.node.setRotationFromEuler(0, -150, 0);
        this.targetPos = new Vec3(tmp.x, this.targetPos.y, tmp.z);
        //console.log("Moving up left: ", this._q, " ", this._r, " to ", tmp.x, " ", tmp.z, " ", this.targetPos);
        this._r -= 1;
    }
    moveBottomLeft() {
        if (!this.ready) return;
        this.ready = false;
        const tmp = MapGenerator.toXZ(this._q - 1, this._r + 1);
        this.node.setRotationFromEuler(0, -30, 0);
        this.targetPos = new Vec3(tmp.x, this.targetPos.y, tmp.z);
        //console.log("Moving bottom left: ", this._q, " ", this._r, " to ", tmp.x, " ", tmp.z, " ", this.targetPos);
        this._q -= 1;
        this._r += 1;
    }
    /*checkGrounded() {
        // Perform raycast downward to check for ground
        const ray = new geometry.Ray();
        const rayStart = this.node.worldPosition;
        //if (this.node.name == "Knight") 
        console.log("Knight: ", this.node.worldPosition);
        ray.o= rayStart;
        ray.d = new Vec3(0, -1, 0); // Direction downwards
        
        // Raycast options
        const raycastOptions = {
            mask: PhysicsGroup.DEFAULT,
            maxDistance: this.groundCheckDistance,
            queryTrigger: true
        };
        
        // Perform the raycast
        const hit = new PhysicsRayResult();
        if (PhysicsSystem.instance.raycast(ray, PhysicsGroup.DEFAULT, this.groundCheckDistance, false)) {
            if (!this._isGrounded) 
            this.playAnimation(AnimationState.IDLE);
            this._isGrounded = true;
        } else {
            this._isGrounded = false;
    }
        console.log("Grounded: ", this._isGrounded);
    }*/

    onHoverStart() {
        console.log("Hover start on player: ", this.node.name);
        tween(this.node).to(0.5, { scale: new Vec3(1.2, 1.2, 1.2) }).start();
    }
    onHoverEnd() {

        console.log("Hover end on player: ", this.node.name);
        tween(this.node).to(0.5, { scale: new Vec3(1, 1, 1) }).start();
    }
    onDestroy() {
        input.off(Input.EventType.KEY_DOWN, this.onKeyDown, this);
        input.off(Input.EventType.KEY_UP, this.onKeyUp, this);
        this.node.off('onMouseEnter', this.onHoverStart, this);
        this.node.off('onMouseExit', this.onHoverEnd, this);
    }
    onKeyUp(event: any) {
        /*if (event.keyCode === KeyCode.KEY_W && this.moveDirection.z < 0) {
            this.moveDirection.z = 0;
            if (this.moveDirection.x === 0 && this.moveDirection.z === 0 && this._isGrounded) {
                this.playAnimation(AnimationState.IDLE);
            }
        }
        if (event.keyCode === KeyCode.KEY_S && this.moveDirection.z > 0) {
            this.moveDirection.z = 0;
            if (this.moveDirection.x === 0 && this.moveDirection.z === 0 && this._isGrounded) {
                this.playAnimation(AnimationState.IDLE);
            }
        }
        if (event.keyCode === KeyCode.KEY_A && this.moveDirection.x < 0) {
            this.moveDirection.x = 0;
            if (this.moveDirection.x === 0 && this.moveDirection.z === 0 && this._isGrounded) {
                this.playAnimation(AnimationState.IDLE);
            }
        }
        if (event.keyCode === KeyCode.KEY_D && this.moveDirection.x > 0) {
            this.moveDirection.x = 0;
            if (this.moveDirection.x === 0 && this.moveDirection.z === 0 && this._isGrounded) {
                this.playAnimation(AnimationState.IDLE);
            }
        }*/
    }

    onKeyDown(event: any) {
        /*if (event.keyCode === KeyCode.SPACE && this._isGrounded) {
            this.jump();
        }
        if (event.keyCode === KeyCode.KEY_J) {
            this.playAnimation(AnimationState.ATTACKING);
        }
        if (event.keyCode === KeyCode.KEY_W) {
            this.moveDirection.z = -1;
            this.playAnimation(AnimationState.RUNNING);
        }
        if (event.keyCode === KeyCode.KEY_S) {
            this.moveDirection.z = 1;
            this.playAnimation(AnimationState.RUNNING);
        }
        if (event.keyCode === KeyCode.KEY_A) {  
            this.moveDirection.x = -1;
            this.playAnimation(AnimationState.RUNNING);
        }
        if (event.keyCode === KeyCode.KEY_D) {
            this.moveDirection.x = 1;
            this.playAnimation(AnimationState.RUNNING);
        }*/
    }
}