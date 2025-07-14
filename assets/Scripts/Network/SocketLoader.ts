import { _decorator, Component, Node, Asset, assetManager, js } from 'cc';
const { ccclass, property, executionOrder } = _decorator;

// Set a very low execution order to ensure this runs before other scripts
@ccclass('SocketLoader')
@executionOrder(-10000)
export class SocketLoader extends Component {
    @property({ type: Asset })
    socketIOScript: Asset = null;

    start() {
        if (!this.socketIOScript) {
            console.error('Socket.IO script asset not assigned! Please assign it in the editor.');
            return;
        }

        // Load the Socket.IO script
        const scriptUrl = this.socketIOScript.nativeUrl;
        console.log('Loading Socket.IO from:', scriptUrl);

        // Create a script element and load the Socket.IO client
        const script = document.createElement('script');
        script.src = scriptUrl;
        script.async = true;
        script.onload = () => {
            console.log('Socket.IO client loaded successfully!');
        };
        script.onerror = (error) => {
            console.error('Failed to load Socket.IO client:', error);
        };

        document.head.appendChild(script);
    }
} 