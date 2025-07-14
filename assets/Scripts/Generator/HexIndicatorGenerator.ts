import { _decorator, Component, Node, MeshRenderer, Material, Color } from 'cc';
import { HexMeshUtils } from '../../Utils/HexMeshUtils';
const { ccclass, property } = _decorator;

@ccclass('HexIndicatorGenerator')
export class HexIndicatorGenerator extends Component {
    @property
    hexSize: number = 1.0;

    onLoad() {
        this.createHexagon();
    }

    createHexagon() {
        // Create node and components
        const node = new Node('Hexagon');
        node.setPosition(0, 5, 0); // Set position as needed
        const renderer = node.addComponent(MeshRenderer);

        // Create mesh
        const mesh = HexMeshUtils.createHexMesh(this.hexSize);
        renderer.mesh = mesh;

        // Add material
        const material = new Material();
        material.initialize({
            effectName: 'builtin-unlit',
            defines: { USE_COLOR: true }
        });
        material.setProperty('mainColor', Color.BLUE);
        renderer.setMaterial(material, 0);

        // Add to scene
        this.node.addChild(node);
    }

    update(deltaTime: number) {
        
    }
}


