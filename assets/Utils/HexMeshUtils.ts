import { _decorator, Component, Node, Mesh, primitives } from 'cc';
const { ccclass, property } = _decorator;

// HexMeshUtils.ts

export class HexMeshUtils {
    /**
     * Creates a hexagonal mesh
     * @param size Outer radius of the hexagon
     * @returns Configured cc.Mesh object
     */
    public static createHexMesh(size: number): Mesh {
        const segments = 6;
        const positions: number[] = [];
        const uvs: number[] = [];
        const indices: number[] = [];
        
        // Center point
        positions.push(0, 0, 0);
        uvs.push(0.5, 0.5);
        
        // Outer points
        for (let i = 0; i <= segments; i++) {
            const angle = (i / segments) * Math.PI * 2;
            const x = size * Math.cos(angle);
            const y = size * Math.sin(angle);
            
            positions.push(x, y, 0);
            uvs.push(0.5 + Math.cos(angle) * 0.5, 0.5 + Math.sin(angle) * 0.5);
            
            if (i > 0) {
                indices.push(0, i, i + 1);
            }
        }
    
        const mesh = new Mesh();
        mesh.reset({
            // Use the correct property names
            data: new Uint8Array(positions.length * 4 + uvs.length * 4 + indices.length * 2),
            struct: {
                primitives: [],
                vertexBundles: []
            }
        });
    
        return mesh;
    }

    // Add other mesh creation utilities here
    public static createHexPrism(size: number, height: number) {
        // Implementation for 3D hex prism
    }
}


