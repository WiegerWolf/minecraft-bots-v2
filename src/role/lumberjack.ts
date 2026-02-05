import { BotBase } from "@/bot"
import Tree from "@/world/tree"
import { faker } from '@faker-js/faker'
import dbscan from "@/algo/dbscan"
import { Vec3 } from "vec3"
import { goals } from "mineflayer-pathfinder"

const { GoalNear, GoalNearXZ, GoalLookAtBlock } = goals

type LumberjackState = 'idle' | 'finding_forest' | 'exploring' | 'travelling' | 'chopping'

const EXPLORED_AREA_NEARNESS_THRESHOLD = 80

export default class LumberjackBot extends BotBase {
    private state: LumberjackState = 'idle'
    private forestCenter?: Vec3
    private trees: Tree[] = []
    private exploredAreas: Vec3[] = []

    constructor() {
        super('Lumberjack')
        this.bot.on('spawn', this.start)
    }

    private start = async () => {
        this.logger.info('Starting lumberjack role')
        this.setState('finding_forest')
    }

    private setState = (newState: LumberjackState) => {
        this.logger.debug('State change: %s -> %s', this.state, newState)
        this.state = newState
        this.tick()
    }

    private tick = async () => {
        switch (this.state) {
            case 'finding_forest':
                await this.onFindingForest()
                break
            case 'exploring':
                await this.onExploring()
                break
            case 'travelling':
                await this.onTravelling()
                break
            case 'chopping':
                await this.onChopping()
                break
        }
    }

    private onChopping = async () => {
        // Find trees near forest center (rescan since we may have moved)
        const trees = this.findTrees(16, 5)
        if (trees.length === 0) {
            this.logger.debug('No trees left, finding new forest')
            this.setState('finding_forest')
            return
        }
        // Find nearest tree
        const nearest = trees.reduce((a, b) =>
            a.base.distanceTo(this.bot.entity.position) < b.base.distanceTo(this.bot.entity.position) ? a : b
        )
        this.logger.trace('Walking to tree at %s', nearest.base)
        await this.bot.pathfinder.goto(new GoalNear(nearest.base.x, nearest.base.y, nearest.base.z, 2))

        // Dig each log from bottom to top
        for (const log of nearest.logs.sort((a, b) => a.y - b.y)) {
            const block = this.bot.blockAt(log)
            if (block && block.name.endsWith('_log')) {
                if (block.position.distanceTo(this.bot.entity.position) > 4)
                    await this.bot.pathfinder.goto(new GoalLookAtBlock(block.position, this.bot.world))
                this.logger.trace('Digging log at %s', log)
                try {
                    await this.bot.dig(block, true, 'raycast')
                } catch (e: any) {
                    if (e.message.includes('Block not in view')) {
                        await this.bot.pathfinder.goto(new GoalLookAtBlock(block.position, this.bot.world))
                        continue
                    }
                    this.logger.warn(e, 'Failed to dig log at %s', log)
                }
            }
        }

        // Loop back to chop next tree
        this.tick()
    }

    private onTravelling = async () => {
        if (!this.forestCenter) { // normally we shouldn't get here
            this.logger.error('No forest center found, cannot travel to it')
            this.setState('finding_forest')
            return
        }
        this.bot.viewer.drawPoints('forest-center', [this.forestCenter], faker.color.rgb({ format: 'hex' }), 150)
        this.logger.debug('Travelling to forest center near %s', this.forestCenter)
        await this.bot.pathfinder.goto(new GoalNear(this.forestCenter.x, this.forestCenter.y, this.forestCenter.z, 7))
        this.setState('chopping')
    }

    private onExploring = async () => {
        this.logger.info('Exploring to find trees')
        let angle: number
        if (this.trees.length === 0) {
            // No trees at all - random direction
            angle = this.pickUnexploredAngle()
            this.logger.debug('No trees found, picking random direction')
        } else if (this.trees.length === 1) {
            const tree = this.trees[0]!
            // Check if this tree is in an explored area
            if (this.exploredAreas.some(explored => explored.distanceTo(tree.centroid) < EXPLORED_AREA_NEARNESS_THRESHOLD)) {
                angle = this.pickUnexploredAngle()
                this.logger.debug('Only tree is in explored area, picking random direction')
            } else {
                const dir = tree.centroid.minus(this.bot.entity.position)
                angle = Math.atan2(dir.z, dir.x)
                this.logger.debug('One tree found, heading towards it')
            }
        } else {
            // Multiple trees - relaxed clustering, pick direction of best cluster
            const centroids = this.trees.map(t => t.centroid)
            const clusters = dbscan(centroids, 100, 2) // very relaxed: 100 blocks epsilon, min 2 trees
            const validClusters = clusters.filter(cluster => { // filter out clusters near explored areas
                const center = cluster.reduce((a, b) => a.plus(b), new Vec3(0, 0, 0)).scaled(1 / cluster.length)
                return !this.exploredAreas.some(explored => explored.distanceTo(center) < EXPLORED_AREA_NEARNESS_THRESHOLD)
            })
            if (validClusters.length > 0) {
                const bestCluster = validClusters.reduce((a, b) => a.length > b.length ? a : b)
                const clusterCenter = bestCluster
                    .reduce((acc, pos) => acc.plus(pos), new Vec3(0, 0, 0))
                    .scaled(1 / bestCluster.length)
                const dir = clusterCenter.minus(this.bot.entity.position)
                angle = Math.atan2(dir.z, dir.x)
                this.logger.debug('Found cluster of %d trees, heading towards it', bestCluster.length)
            } else { // Clustering failed even with relaxed params - use nearest tree
                const unexploredTrees = this.trees.filter(t => // Filter trees not in explored areas
                    !this.exploredAreas.some(explored => explored.distanceTo(t.centroid) < EXPLORED_AREA_NEARNESS_THRESHOLD))
                if (unexploredTrees.length > 0) {
                    const nearest = unexploredTrees.reduce((a, b) =>
                        a.centroid.distanceTo(this.bot.entity.position) < b.centroid.distanceTo(this.bot.entity.position) ? a : b)
                    const dir = nearest.centroid.minus(this.bot.entity.position)
                    angle = Math.atan2(dir.z, dir.x)
                    this.logger.debug('Heading towards nearest unexplored tree')
                } else {
                    angle = this.pickUnexploredAngle()
                    this.logger.debug('All trees explored, picking random direction')
                }
            }
        }
        const distance = 100
        const offset = new Vec3(Math.cos(angle) * distance, 0, Math.sin(angle) * distance)
        const target = this.bot.entity.position.plus(offset)
        this.exploredAreas.push(target)
        try {
            this.logger.debug('Pathfinding exploration to %s', target)
            await this.bot.pathfinder.goto(new GoalNearXZ(target.x, target.z, 10))
        } catch (e) {
            this.logger.debug('Exploration pathfinding failed')
        }
        this.setState('finding_forest')
    }

    private pickUnexploredAngle = (): number => {
        // Try random angles, pick one that's far from explored areas
        const pos = this.bot.entity.position
        // TODO: Make this more sophisticated, avoiding water, lava, etc.
        for (let attempt = 0; attempt < 8; attempt++) {
            const angle = Math.random() * Math.PI * 2
            const testPoint = pos.plus(new Vec3(Math.cos(angle) * 50, 0, Math.sin(angle) * 50))
            const tooClose = this.exploredAreas.some(explored =>
                explored.distanceTo(testPoint) < EXPLORED_AREA_NEARNESS_THRESHOLD
            )
            if (!tooClose) return angle
        }
        // All directions explored? Pick random anyway
        return Math.random() * Math.PI * 2
    }

    private onFindingForest = async () => {
        const forestCenter = await this.locateForestCenter()
        if (forestCenter) {
            this.forestCenter = forestCenter
            this.setState('travelling')
        } else {
            this.setState('exploring')
        }
    }

    private locateForestCenter = async (searchRadiusChunks = 4): Promise<Vec3 | null> => {
        if (searchRadiusChunks > 10) return null // we're not finding anything, move on
        this.logger.debug('Finding forest in radius %d chunks', searchRadiusChunks)
        this.logger.debug('Waiting for chunks to load')
        await this.waitForChunksToLoadInRadius(searchRadiusChunks)
        const trees = this.findTrees(16 * searchRadiusChunks)
        this.logger.trace('Found %d trees', trees.length)
        if (!trees.length) {
            this.logger.warn('No trees found, retrying')
            return this.locateForestCenter(searchRadiusChunks + 3)
        }
        this.trees = trees // save for later
        this.logger.trace('Found %d trees', trees.length)
        const clusters = dbscan(trees.map(({ centroid }) => centroid), 10, 3)
        this.logger.trace('Found %d clusters', clusters.length)
        if (clusters.length === 0) {
            this.logger.warn('No tree clusters found, retrying')
            return this.locateForestCenter(searchRadiusChunks + 3)
        }
        const bestCluster = clusters.reduce((best, cluster) => cluster.length > best.length ? cluster : best, clusters[0]!)
        this.logger.trace('Best cluster has %d trees', bestCluster.length)
        const forestCenter = bestCluster.reduce((acc, pos) => acc.plus(pos), new Vec3(0, 0, 0)).scaled(1 / bestCluster.length)
        return forestCenter
    }

    private findTrees = (maxDistance: number, maxTreesToFind = 100): Tree[] => {
        const logIds = this.bot.registry.blocksArray
            .filter(({ name }) => name.endsWith('_log') && !name.startsWith('stripped_'))
            .map(({ id }) => id)
        const logCandidates = this.bot.findBlocks({
            maxDistance,
            count: 5 * maxTreesToFind,
            matching: logIds,
        })
        const leafIds = this.bot.registry.blocksArray
            .filter(({ name }) => name.endsWith('_leaves'))
            .map(({ id }) => id)
        const leafPositions = this.bot.findBlocks({
            maxDistance,
            count: 60 * maxTreesToFind,
            matching: leafIds,
        })
        return Tree.fromLogsAndLeaves(logCandidates, leafPositions)
    }
}