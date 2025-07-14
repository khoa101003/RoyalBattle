// ResourceUI.ts
import { _decorator, Component, Label, Sprite, director, Enum } from 'cc';
import { ResourceType } from './ResourceType';
import { ResourceManager } from './ResourceManager';
const { ccclass, property } = _decorator;

@ccclass('ResourceUI')
export class ResourceUI extends Component {
    @property({type: Enum(ResourceType)})
    resourceType: ResourceType = ResourceType.GOLD;

    @property(Label)
    amountLabel: Label = null!;

    @property(Sprite)
    iconSprite: Sprite = null!;

    start() {
        this.updateUI();
        director.on('resource_changed', this.onResourceChanged, this);
    }

    onDestroy() {
        director.off('resource_changed', this.onResourceChanged, this);
    }

    private onResourceChanged(type: ResourceType) {
        if (type === this.resourceType) {
            this.updateUI();
        }
    }

    private updateUI() {
        console.log(`Updating UI for ${this.resourceType}`);
        const amount = ResourceManager.getInstance().getResource(this.resourceType);
        this.amountLabel.string = amount.toString();
        console.log(`Updated UI for ${this.resourceType}: ${amount}`);
        // You can also update icon based on resource type
    }
}