import { _decorator, Component, Node, tween } from 'cc';
const { ccclass, property } = _decorator;
// RangeIndicator.ts
@ccclass
export class RangeIndicator extends Component {
    onLoad() {
        this.fadeIn();
    }
    
    fadeIn() {
        tween(this.node)
            .to(0.3, this)
            .delay(0.5) // Wait for 0.5 seconds before fading out
            .start();
    }
    
    fadeOut() {
        tween(this.node)
            .to(0.2, this)
            .call(() => this.node.destroy())
            .start();
    }
}
