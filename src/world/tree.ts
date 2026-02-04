import { Vec3 } from "vec3"

const offsets: [number, number, number][] = []
for (let dx = -1; dx <= 1; dx++)
    for (let dy = -1; dy <= 1; dy++)
        for (let dz = -1; dz <= 1; dz++)
            if (dx !== 0 || dy !== 0 || dz !== 0)
                offsets.push([dx, dy, dz])

export default class Tree {
    public readonly centroid: Vec3
    
    constructor(
        public readonly leaves: Vec3[]
    ) {
        this.centroid = this.centroidCalc()
    }

    private centroidCalc(): Vec3 {
        const sum = this.leaves.reduce((acc, v) => acc.plus(v), new Vec3(0, 0, 0))
        return sum.scaled(1 / this.leaves.length)
    }

    public static fromLeafBlocks(leaves: Vec3[]): Tree[] {
        const remaining = new Set(leaves.map(v => `${v.x},${v.y},${v.z}`))
        const trees: Tree[] = []

        for (const key of remaining) {
            if (!remaining.has(key)) continue
            const tree: Vec3[] = []
            const queue = [key]
            remaining.delete(key)

            while (queue.length > 0) {
                const current = queue.pop()!
                const [x, y, z] = current.split(',').map(Number)
                tree.push(new Vec3(x!, y!, z!))

                for (const [dx, dy, dz] of offsets) {
                    const neighborKey = `${x! + dx},${y! + dy},${z! + dz}`
                    if (remaining.has(neighborKey)) {
                        remaining.delete(neighborKey)
                        queue.push(neighborKey)
                    }
                }
            }

            trees.push(new Tree(tree))
        }

        return trees
    }
}