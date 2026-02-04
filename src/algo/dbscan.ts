import { Vec3 } from "vec3"

export default function dbscan(points: Vec3[], epsilon: number, minPoints: number): Vec3[][] {
    const visited = new Set<number>()
    const clusters: Vec3[][] = []

    function regionQuery(idx: number): number[] {
        const neighbors: number[] = []
        for (let i = 0; i < points.length; i++) {
            if (points[idx]!.distanceTo(points[i]!) <= epsilon) {
                neighbors.push(i)
            }
        }
        return neighbors
    }

    for (let i = 0; i < points.length; i++) {
        if (visited.has(i)) continue
        const neighbors = regionQuery(i)
        if (neighbors.length < minPoints) continue

        const cluster: Vec3[] = []
        const queue = [...neighbors]
        visited.add(i)

        while (queue.length > 0) {
            const j = queue.pop()!
            if (visited.has(j)) continue
            visited.add(j)
            cluster.push(points[j]!)

            const jNeighbors = regionQuery(j)
            if (jNeighbors.length >= minPoints) {
                queue.push(...jNeighbors)
            }
        }

        clusters.push(cluster)
    }

    return clusters
}
