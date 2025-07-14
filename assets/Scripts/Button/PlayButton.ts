import { _decorator, Component, Node, director } from 'cc';
import { ResourceManager } from '../Managers/ResourceManager';
const { ccclass, property } = _decorator;

@ccclass('PlayButton')
export class PlayButton extends Component {

    @property(Node)
    playButton: Node = null!;

    // Add a property for the scene name
    @property({ type: String })
    sceneName: string = "mainScene";

    @property({ type: Boolean })
    isOnline: boolean = false;

    onLoad() {
        // Add click event listener to the button
        if (this.node.getParent().name == "PlayButton") this.isOnline = true;
        this.playButton.on(Node.EventType.TOUCH_END, this.onPlayButtonClick, this);
    }

    onPlayButtonClick() {
        // Load the specified scene
        ResourceManager.getInstance().setOnline(this.isOnline);
        director.loadScene(this.sceneName);
    }

    onDestroy() {
        // Remember to remove the event listener when the component is destroyed
        this.playButton.off(Node.EventType.TOUCH_END, this.onPlayButtonClick, this);
    }
}