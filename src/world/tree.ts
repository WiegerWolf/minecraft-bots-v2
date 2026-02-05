import { Vec3 } from "vec3"

const offsets: [number, number, number][] = []
for (let dx = -1; dx <= 1; dx++)
    for (let dy = -1; dy <= 1; dy++)
        for (let dz = -1; dz <= 1; dz++)
            if (dx !== 0 || dy !== 0 || dz !== 0)
                offsets.push([dx, dy, dz])

export default class Tree {
    public readonly centroid: Vec3
    public readonly base: Vec3

    constructor(
        public readonly logs: Vec3[]
    ) {
        this.centroid = this.centroidCalc()
        this.base = this.baseCalc()
    }

    private baseCalc(): Vec3 {
        // Find the lowest log block, aka the base of the tree trunk
        return this.logs.reduce((lowest, log) =>
            log.y < lowest.y ? log : lowest
        )
    }

    private centroidCalc(): Vec3 {
        const sum = this.logs.reduce((acc, v) => acc.plus(v), new Vec3(0, 0, 0))
        return sum.scaled(1 / this.logs.length)
    }

    public static fromLogsAndLeaves(logs: Vec3[], leaves: Vec3[]): Tree[] {
        const leafSet = new Set(leaves.map(v => `${v.x},${v.y},${v.z}`))
        const remaining = new Set(logs.map(v => `${v.x},${v.y},${v.z}`))
        const trees: Tree[] = []

        for (const key of remaining) {
            if (!remaining.has(key)) continue
            const trunk: Vec3[] = []
            const queue = [key]
            remaining.delete(key)

            while (queue.length > 0) {
                const current = queue.pop()!
                const [x, y, z] = current.split(',').map(Number)
                trunk.push(new Vec3(x!, y!, z!))

                for (const [dx, dy, dz] of offsets) {
                    const neighborKey = `${x! + dx},${y! + dy},${z! + dz}`
                    if (remaining.has(neighborKey)) {
                        remaining.delete(neighborKey)
                        queue.push(neighborKey)
                    }
                }
            }
            const highestLog = trunk.reduce((a, b) => a.y > b.y ? a : b)
            const hasLeaves = offsets.some(([dx, dy, dz]) =>
                leafSet.has(`${highestLog.x + dx},${highestLog.y + dy},${highestLog.z + dz}`)
            )
            if (hasLeaves) trees.push(new Tree(trunk))
        }

        return trees
    }
}