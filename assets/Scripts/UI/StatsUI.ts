import { _decorator, Camera, Component, Vec3, Node, view } from "cc";
const { ccclass, property } = _decorator;

@ccclass
export class StatsUI extends Component {
    @property(Node)
    character: Node = null;
    @property(Camera)
    camera: Camera = null;
    @property(Node)
    canvansNode: Node = null;

    private _pos: Vec3 = new Vec3();
    private _last_pos: Vec3 = new Vec3();
    protected update(dt: number): void {
        const wpos = this.character.worldPosition;
        //@ts-ignore
        if (!this.camera!._camera || this._last_pos.equals(wpos)) {
            return;
        }

        const camera = this.camera!;
        //[HACK]
        //@ts-ignore
        camera._camera.update();
        camera.convertToUINode(wpos, this.canvansNode!, this._pos);
        const scaleX = view.getScaleX;
        const scaleY = view.getScaleY;
        this.node.setPosition(this._pos);

        //@ts-ignore
        Vec3.transformMat4(this._pos, this.character.worldPosition, camera._camera!.matView);
    }
    init(character: Node, camera: Camera, canvans: Node) {
        this.character = character;
        this.camera = camera;
        this.canvansNode = canvans;
    }
}