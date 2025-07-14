// ResourceUI.ts
import { _decorator, Component, Label, Sprite, director, Node, Enum, ProgressBar } from 'cc';
import { ResourceType } from './ResourceType';
import { ResourceManager } from './ResourceManager';
import { MainSceneController } from '../Controller/MainSceneController';
import { PlayerController } from '../Controller/PlayerController';
const { ccclass, property } = _decorator;

@ccclass('StatsUI')
export class StatsUI extends Component {

    @property(ProgressBar)
    healthBar: ProgressBar = null!;
    @property(Label)
    amountLabel: Label = null!;
    @property(Label)
    ATKLabel: Label = null!;
    @property(Label)
    RANGE_ATTACKLabel: Label = null!;
    @property(Label)
    RANGE_MOVELabel: Label = null!;

    @property(Sprite)
    iconSprite: Sprite = null!;

    @property(Node)
    mainScene: Node = null!;

    private character: PlayerController | null = null;
    start() {
        //this.mainScene.on('new_character_selected', this.onUISelectedCharacter, this);
        this.node.active = false; // Hide the UI initially
    }

    onDestroy() {
    }

    onUISelectedCharacter(character: PlayerController) {
        this.character = character;
        this.updateUI();
    }

    private updateUI() {
        if (this.character != null) {
            const amount = this.character.health;
            this.node.active = true; // Show the UI if a character is selected
            //this.healthBar.totalLength = this.character.max_health;
            //console.log('totalLength: ', this.healthBar.totalLength);
            this.healthBar.progress = amount / this.character.max_health;
            console.log('progress: ', this.healthBar.progress);
            this.amountLabel.string = 'HP: ' + this.character.health.toString() + '/' + this.character.max_health.toString();
            this.ATKLabel.string = 'ATK: ' + this.character.attack.toString();
            this.RANGE_ATTACKLabel.string = 'RAN: ' + this.character.range_attack.toString();
            this.RANGE_MOVELabel.string = 'SPD: ' + this.character.range_move.toString();
            //console.log(`Updated UI for ${this.resourceType}: ${amount}`);
        }
        else {
            this.node.active = false; // Hide the UI if no character is selected
            /*this.amountLabel.string = "";
            this.ATKLabel.string = "";
            this.RANGE_ATTACKLabel.string = "";
            this.RANGE_MOVELabel.string = "";*/
        }
        // You can also update icon based on resource type
    }
}