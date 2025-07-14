import { _decorator, Component, Node, AudioSource, AudioClip, resources, sys, game, Sprite, input, Input, Vec3, Camera, director } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('BackGroundController')
export class BackGroundController extends Component {
    @property(Sprite)
    bgSprites: Sprite[] = []; 
    
    @property(Camera)
    camera: Camera = null;

    private origin_pos: Vec3[] = [];
    private alpha: number[] = [0, 0.1, 0.15, 0.2];
    protected onLoad(): void {
        input.on(Input.EventType.MOUSE_MOVE, this.onMouseMove, this);
        this.bgSprites.forEach(sprite => {
            this.origin_pos.push(sprite.node.position.clone());
        });
        if (!this.camera){
            this.camera = this.node.getParent().getChildByName('Camera').getComponent(Camera);
        }
    }

    onMouseMove(event: any): void {
        const mousePos = event.getLocation();
        console.log(mousePos);
        //director.
        const delta = new Vec3(mousePos.x - 1280 / 2, mousePos.y - 720 / 2, 0);
        for (let i = 0; i < this.bgSprites.length; i++) {
            const sprite = this.bgSprites[i];
            const originPos = this.origin_pos[i];
            console.log(i, " -> ", originPos);
            const offset = new Vec3(delta.x * this.alpha[i] + originPos.x, delta.y * this.alpha[i] + originPos.y, 0);
            sprite.node.setPosition(offset);
        }
    }
}
