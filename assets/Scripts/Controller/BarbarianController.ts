import { _decorator, Component, Node, SkeletalAnimation } from 'cc';
const { ccclass, property } = _decorator;

@ccclass
export default class BarbarianController extends Component {

    @property(SkeletalAnimation)
    anim: SkeletalAnimation = null;

    // Animation clip names (match these to your actual clips)
    @property
    idleAnim: string = "2H_Melee_Idle";
    @property
    runAnim: string = "Running_A";
    @property
    jumpAnim: string = "Jump_Full_Long_animation";
    @property
    attackAnim: string = "H_Melee_Attack_Chop_animation";

    onLoad() {
        if (!this.anim) {
            console.log("SkeletalAnimation component is not assigned! Attempting to find it on parent node.");
            this.anim = this.node.getParent().getComponent(SkeletalAnimation);
            if (!this.anim) {
                console.error("SkeletalAnimation component not found on parent node! Please assign it in the editor.");
                return;
            }
        }

        console.log("BarbarianController initialized with parent node: ", this.node.getParent().name);
        
        // Play idle by default
        this.playIdle();
    }

    playIdle() {
        console.log("Playing idle animation: " + this.idleAnim);
        this.anim.play(this.idleAnim);
    }

    playRun() {
        this.anim.play(this.runAnim);
    }

    playJump() {
        this.anim.play(this.jumpAnim);
    }

    playAttack() {
        this.anim.play(this.attackAnim);
    }

    update(dt: number) {
        // Add your movement logic here
        // Call appropriate animation methods based on player state
    }
}


