import { PlayerController } from "../Controller/PlayerController";
import { HexController } from "../Controller/HexController";
import { Node } from "cc";
export class GetFromNode{
    static playerController(node: Node){
        return node.getComponent(PlayerController);
    }
    static hexController(node: Node){
        return node.getChildByName('hex_grass').getChildByName('HexController')?.getComponent(HexController);
    }
}