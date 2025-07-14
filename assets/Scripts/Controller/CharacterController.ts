import { _decorator, Component, Node, Prefab, instantiate, director, Camera } from 'cc';
import { MapGenerator } from '../Generator/MapGenerator';
import { PlayerController } from '../Controller/PlayerController';
import { HexController } from '../Controller/HexController';
import {PrefabPool} from '../General/ObjectPool';
const { ccclass, property } = _decorator;

export class CharacterController {
    
    private prefabs: Prefab[];
    private objectPool: PrefabPool<PlayerController>[];
    private parent: Node = null;
    constructor(prefabs: Prefab[], parent: Node){
        this.prefabs = prefabs;
        this.parent = parent;
        this.objectPool = prefabs.map((prefab) => {
            const pool = new PrefabPool<PlayerController>(prefab, parent, PlayerController, 10);
            return pool;
        });
        this.setupEventListener();
    }
    private setupEventListener(){
        this.parent.on('character_died', this.onCharacterDie, this);
    }
    private timer = null;
    destroy() {
        //director.off('character_died', this.removeCharacter, this);
        //director.off('destroy_character', this.destroyCharacter, this);
        clearTimeout(this.timer);
    }
    addCharacter(id: number, q: number, r: number, mask: number) {
        //const playerNode = instantiate(this.prefabs[id]);
        const hexPos = MapGenerator.toXZ(q, r);
        const player = this.objectPool[id].acquire();
        //playerNode.getChildByName("PlayerController").getComponent(PlayerController);
        player.init(q, r, mask);
        /*player.camera = this.camera;
        player.canvansNode = this.canvansNode;*/
        //this.node.addChild(playerNode);
        //console.log("Character added at: ", q, " ", r);
        //return playerNode;
        return player;
    }
    onCharacterDie(player : PlayerController, id?: number){
        console.log("CharacterControler.onCharacterDie Character died: ", player.node.name);
        if (id)
            this.objectPool[id].release(player);
        else{
            // If no id is provided, release from all pools
            for (const pool of this.objectPool) {
                pool.release(player);
            }
        }

        director.emit('character_removed', player);

    }
    /*removeCharacter(node: Node) {
        if (node) {
            //director.emit('character_removed', node);
            // Add visual death effects here if needed // Allow time for death animation to complete
        }
    }*/
    /*destroyCharacter(node: Node) {
        if (node) {
            this.timer = setTimeout(() => {
                node.destroy();
            }, 10000);
        }
    }*/
}


