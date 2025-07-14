import { _decorator, Component, Node, director } from 'cc';
import { ResourceManager } from '../Managers/ResourceManager';
const { ccclass, property } = _decorator;

@ccclass('ButtonRoute')
export class ButtonRoute extends Component {



    loadMainMenu() {
        // Load the specified scene
        director.loadScene("mainMenu");
    }
}