import { _decorator, Component, Node } from 'cc';
import { MainSceneController } from './MainSceneController';
const { ccclass, property } = _decorator;

@ccclass('SkillButtonController')
export class SkillButtonController extends Component {

    @property(Node)
    mainScene: Node = null!;

    private mainSceneController: MainSceneController = null!;

    protected onLoad(): void {
        this.node.on(Node.EventType.TOUCH_START, this.onPressed, this);
        if (this.node) {
            this.mainSceneController = this.mainScene.getComponent(MainSceneController);
        }
    }
    start() {
    }

    onPressed() {
        if (this.node.name == "HealButton") {
            this.mainSceneController.useSkill("heal");
        }
        else if (this.node.name == "KnightAttackButton" || this.node.name == "BarbarianAttackButton"
            || this.node.name == "MageAttackButton" || this.node.name == "RogueAttackButton") {
            this.mainSceneController.useSkill("attack");
        }
    }
    update(deltaTime: number) {
    }

    protected onDestroy(): void {
        this.node.off(Node.EventType.TOUCH_START, this.onPressed, this);
    }
}


