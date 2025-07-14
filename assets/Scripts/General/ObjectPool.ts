import { _decorator, Component, Node, Prefab, instantiate, Vec3, Vec2 } from 'cc';
const { ccclass, property } = _decorator;

// Base interface for poolable objects
export interface IPoolable {
    node: Node;
    reset(): void;
    init(...args: any[]): void;
}

// Pool statistics interface
interface PoolStats {
    poolSize: number;
    activeCount: number;
    totalObjects: number;
}

// Generic prefab-based object pool
export class PrefabPool<T extends IPoolable & Component> {
    private pool: T[] = [];
    private activeObjects = new Set<T>();
    private prefab: Prefab;
    private parent: Node;
    private componentType: new () => T;

    constructor(prefab: Prefab, parent: Node, componentType: new () => T, initialSize: number = 10) {
        this.prefab = prefab;
        this.parent = parent;
        this.componentType = componentType;
        
        // Pre-populate the pool
        for (let i = 0; i < initialSize; i++) {
            const obj = this.createObject();
            obj.node.active = false;
            this.pool.push(obj);
        }
    }

    private createObject(): T {
        const node = instantiate(this.prefab);
        this.parent.addChild(node);
        const component = node.getComponent(this.componentType);
        if (!component) {
            throw new Error(`Component ${this.componentType} not found on prefab`);
        }
        return component as T;
    }

    acquire(): T {
        let obj: T;
        
        if (this.pool.length > 0) {
            obj = this.pool.pop()!;
        } else {
            obj = this.createObject();
        }
        
        obj.node.active = true;
        this.activeObjects.add(obj);
        return obj;
    }

    release(obj: T): void {
        if (this.activeObjects.has(obj)) {
            this.activeObjects.delete(obj);
            console.log(`Releasing object: ${obj.node.name}`);
            obj.node.setPosition(-1000, -1000, -1000); // Disable the node to prevent further interaction
            obj.node.active = false;
            this.pool.push(obj);
        }
    }

    releaseAll(): void {
        for (const obj of this.activeObjects) {
            obj.node.active = false;
            obj.reset();
            this.pool.push(obj);
        }
        this.activeObjects.clear();
    }

    getStats(): PoolStats {
        return {
            poolSize: this.pool.length,
            activeCount: this.activeObjects.size,
            totalObjects: this.pool.length + this.activeObjects.size
        };
    }

    destroy(): void {
        this.releaseAll();
        for (const obj of this.pool) {
            obj.node.destroy();
        }
        this.pool.length = 0;
    }
}