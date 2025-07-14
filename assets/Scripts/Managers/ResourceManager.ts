// ResourceManager.ts
import { _decorator, Component, director } from 'cc';
import { ResourceType } from './ResourceType';
const { ccclass } = _decorator;


export class ResourceManager{
    private static instance: ResourceManager;
    private resources: Map<ResourceType, number> = new Map();
    public isOnline: boolean = false;

    public static getInstance(){
        if (!ResourceManager.instance){
            ResourceManager.instance = new ResourceManager;
        }
        return ResourceManager.instance;
    }
    setOnline(isOnline: boolean) {
        this.isOnline = isOnline;
    }
    setOffline(isOffline: boolean) {
        this.isOnline = isOffline;
    }
    private initializeResources(): void {
        // Set default values for all resources
        this.resources.set(ResourceType.GOLD, 100);
        this.resources.set(ResourceType.GEM, 10);
        this.resources.set(ResourceType.ENERGY, 50);
        this.resources.set(ResourceType.WOOD, 0);
        this.resources.set(ResourceType.STONE, 0);
    }

    public getResource(type: ResourceType): number {
        if (type == null) return 0;
        return this.resources.get(type);
    }

    public addResource(type: ResourceType, amount: number): void {
        const current = this.getResource(type);
        this.resources.set(type, current + amount);
        this.emitResourceChanged(type);
    }

    public spendResource(type: ResourceType, amount: number): boolean {
        const current = this.getResource(type);
        if (current >= amount) {
            this.resources.set(type, current - amount);
            this.emitResourceChanged(type);
            return true;
        }
        return false;
    }

    public hasEnough(type: ResourceType, amount: number): boolean {
        return this.getResource(type) >= amount;
    }

    private emitResourceChanged(type: ResourceType): void {
        director.emit('resource_changed', type, this.getResource(type));
    }

    // Save/Load methods

    private saveResources() {
        const saveData = Object.fromEntries(this.resources);
        localStorage.setItem('resource_data', JSON.stringify(saveData));
    }

    private loadResources() {
        const saved = localStorage.getItem('resource_data');
        if (saved) {
            const data = JSON.parse(saved);
            for (const [key, value] of Object.entries(data)) {
                this.resources.set(key as ResourceType, Number(value));
            }
        } else {
            // Initialize with defaults if no save exists
            this.initializeResources();
        }
    }

    // Public method to force save (call after important changes)
    public saveNow() {
        this.saveResources();
    }
}