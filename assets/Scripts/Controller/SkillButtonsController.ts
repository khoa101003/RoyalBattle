import { _decorator, Component, Node } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('SkillButtonsController')
export class SkillButtonsController extends Component {
    @property(Node)
    skillButtons: Node[] = []

    private startSkillId: number = 0;
    onLoad() {
        if (!this.skillButtons) return;
        for (let i = 0; i < this.skillButtons.length; ++i)
            this.skillButtons[i].active = false;
    }
    selectedCharacter(character: Node) {
        if (!character) {
            for (let i = 0; i < 3; ++i) {
                this.skillButtons[this.startSkillId + i].active = false;
            }
        } else {
            for (let i = 0; i < 3; ++i) {
                this.skillButtons[this.startSkillId + i].active = false;
            }
            if (character.name == "Barbarian") {
                this.startSkillId = 0;
            }
            else if (character.name == "Knight") {
                this.startSkillId = 3;
            }
            else if (character.name == "Mage") {
                this.startSkillId = 6;
            }
            else if (character.name == "Rogue") {
                this.startSkillId = 9;
            }
            for (let i = 0; i < 3; ++i) {
                this.skillButtons[this.startSkillId + i].active = true;
            }
        }

    }
    update(deltaTime: number) {
        if (!this.skillButtons) return;
        if (this.skillButtons.length == 0) return;
        /*if (Math.random() < 0.02) {
            const randomIndex = Math.floor(Math.random() * this.skillButtons.length);
            this.skillButtons[randomIndex].active = !this.skillButtons[randomIndex].active;
            //console.log("Randomly activating skill button.");
        }*/
    }
}


