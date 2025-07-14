import { _decorator, Component, Node, Color, MeshRenderer, Camera, find } from 'cc';
const { ccclass, property } = _decorator;

@ccclass
export class HexController extends Component {
    @property(Color)
    hoverColor: Color = new Color(255, 0, 0, 255); // Red color for hover effect
    
    @property
    colorChangeDuration: number = 0.2; // seconds

    public _q: number = 0;
    public _r: number = 0;
    private grassColor: Color = new Color(162,184,43,255); // Default grass color
    private isHighlighted: boolean = false;
    onLoad() {
        //console.log("HexController loaded for: ", this.node.name);
        this.node.on('onMouseEnter', this.onHoverStart, this);
        this.node.on('onMouseExit', this.onHoverEnd, this);
        const renderer = this.node.getParent().getComponent(MeshRenderer);
        if (renderer && renderer.materials.length > 0) {
            const material = renderer.materials[0];
            material.setProperty('mainColor', this.grassColor);
        }
        // Set up mouse events
        //this.node.getParent().on(Node.EventType.MOUSE_ENTER, this.onHoverStart, this);
        //this.node.on(Node.EventType.MOUSE_LEAVE, this.onHoverEnd, this);
    }

    setHighlighted(highlighted: boolean) {
        this.isHighlighted = highlighted;
        if (this.isHighlighted) this.highlight();
        else this.unhighlight();
    }
    highlight() {
        const renderer = this.node.getParent().getComponent(MeshRenderer);
            if (renderer && renderer.materials.length > 0) {
                const material = renderer.materials[0];
                material.setProperty('mainColor', this.grassColor);
                if (this.isHighlighted) {
                // If the hex was highlighted, revert to the original color
                    material.setProperty('albedo', new Color(255 * 0.2, 255 * 0.2, 255 * 0.2, 255));
                }
            }
    }
    unhighlight() {
        const renderer = this.node.getParent().getComponent(MeshRenderer);
        if (renderer && renderer.materials.length > 0) {
            const material = renderer.materials[0];
            material.setProperty('mainColor', this.grassColor);
            // Reset albedo color to default grass color
            //material.setProperty('albedo', this.grassColor);
        }
    }
    onHoverStart() {
        //console.log("Hover started on hex tile: ", this._q, " ", this._r);
        const renderer = this.node.getParent().getComponent(MeshRenderer);
        if (renderer && renderer.materials.length > 0) {
            const material = renderer.materials[0];
            material.setProperty('mainColor', this.hoverColor);
            //const darkenAmount = 0.2; // Adjust this value to control the darkness level
            //material.setProperty('albedo', new Color(255 * darkenAmount, 255 * darkenAmount, 255 * darkenAmount, 255));
            //renderer.setMaterialInstance(0, material);  
            //material.setProperty('albedo', new Color(0, 0, 0, 255)); // Change albedo color to black
        }
    }

    onHoverEnd() {
        //console.log("Hover ended on hex tile: ", this.node.name);
        const renderer = this.node.getParent().getComponent(MeshRenderer);
        if (renderer && renderer.materials.length > 0) {
            const material = renderer.materials[0];
            material.setProperty('mainColor', this.grassColor);
            if (this.isHighlighted) {
                // If the hex was highlighted, revert to the original color
                material.setProperty('albedo', new Color(255 * 0.2, 255 * 0.2, 255 * 0.2, 255));
            }
        }
    }

    protected onDestroy(): void {
        // Clean up event listeners
        this.node.off('onMouseEnter', this.onHoverStart, this);
        this.node.off('onMouseExit', this.onHoverEnd, this);
        //this.node.off(Node.EventType.MOUSE_ENTER, this.onHoverStart, this);
        //this.node.off(Node.EventType.MOUSE_LEAVE, this.onHoverEnd, this);
    }
}

