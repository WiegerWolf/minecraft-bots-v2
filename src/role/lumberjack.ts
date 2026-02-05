import { BotBase } from "@/bot"
import Tree from "@/world/tree"
import { faker } from '@faker-js/faker'
import dbscan from "@/algo/dbscan"
import { Vec3 } from "vec3"
import { goals } from "mineflayer-pathfinder"

const { GoalNear } = goals

type LumberjackState = 'idle' | 'finding_forest' | 'exploring' | 'travelling' | 'chopping'

export default class LumberjackBot extends BotBase {
    private state: LumberjackState = 'idle'
    private forestCenter?: Vec3
    private trees: Tree[] = []

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
        // TODO: Implement chopping logic
    }

    private onTravelling = async () => {
        if (!this.forestCenter) { // normally we shouldn't get here
            this.logger.error('No forest center found, cannot travel to it')
            this.setState('finding_forest')
            return
        }
        this.bot.viewer.drawPoints('forest-center', [this.forestCenter], faker.color.rgb({ format: 'hex' }), 150)
        const groundBlock = this.bot.findBlock({
            point: this.forestCenter,
            matching: (block) => block.name === 'grass_block' || block.name === 'dirt',
            maxDistance: 10,
        })
        const target = groundBlock?.position ?? this.forestCenter
        this.logger.debug('Travelling to forest center at %s', target)
        await this.bot.pathfinder.goto(new GoalNear(target.x, target.y, target.z, 3))
        this.setState('chopping')
    }

    private onExploring = async () => {
        // TODO: Implement exploring logic
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
        trees.forEach((tree, i) => {
            this.bot.viewer.drawPoints(`tree-${i}-center`, [tree.centroid], faker.color.rgb({ format: 'hex' }), 50)
        })
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