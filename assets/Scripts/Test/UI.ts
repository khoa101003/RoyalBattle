import { _decorator, Component, Node, sys, director, Camera, Vec3, View, view } from 'cc';
import { Player, Room, RoomStatus } from '../Interfaces/Room';
import { dir } from 'console';
const { ccclass, property } = _decorator;

@ccclass('UI')
export class UI extends Component {
    @property(Node)
    object: Node = null;
    @property(Camera)
    camera_3d: Camera = null;
    @property(Camera)
    camera_2d: Camera = null;
    @property(Node)
    canvansNode: Node = null;

    private _last_pos: Vec3 = new Vec3();
    private _pos: Vec3 = new Vec3();
    protected onLoad(): void {
        let scaleX = view.getScaleX();
        let scaleY = view.getScaleY();
        const screenPos = new Vec3();
        this.camera_3d.worldToScreen(this.object.getPosition(), screenPos);
        screenPos.x /= scaleX;
        screenPos.y /= scaleY;
        console.log(scaleX);
        console.log(scaleY);
        console.log("3D camera pos: ", this.camera_3d.node.position);
        console.log("Object screen pos: ", screenPos);
    }
    protected start(): void {
        const wpos = this.object.worldPosition;
        if (!this.camera_3d) {
            return;
        }

        const camera = this.camera_3d!;

        camera.convertToUINode(wpos, this.canvansNode!, this._pos)
        this.node.setPosition(this._pos);
    }
    protected update(dt: number): void {
        const wpos = this.object.worldPosition;
        //@ts-ignore
        if (!this.camera_3d!._camera || this._last_pos.equals(wpos)) {
            return;
        }

        const camera = this.camera_3d!;
        //[HACK]
        //@ts-ignore
        camera._camera.update();
        camera.convertToUINode(wpos, this.canvansNode!, this._pos)
        this.node.setPosition(this._pos);

        //@ts-ignore
        Vec3.transformMat4(this._pos, this.object.worldPosition, camera._camera!.matView)
    }
}