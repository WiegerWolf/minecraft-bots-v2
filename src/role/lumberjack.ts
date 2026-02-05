import { BotBase } from "@/bot"
import Tree from "@/world/tree"
import { faker } from '@faker-js/faker'
import dbscan from "@/algo/dbscan"
import { Vec3 } from "vec3"
import { goals } from "mineflayer-pathfinder"

const { GoalNear } = goals

export default class LumberjackBot extends BotBase {
    private forestCenter?: Vec3

    constructor() {
        super('Lumberjack')
        this.bot.on('spawn', this.findForestAndGoToIt)
    }

    private findForestAndGoToIt = async () => {
        this.logger.info('Finding forest')
        const forestCenter = await this.locateForestCenter()
        this.bot.viewer.drawPoints('forest-center', [forestCenter], faker.color.rgb({ format: 'hex' }), 150)
        this.logger.debug('Forest center: %s', forestCenter)
        this.forestCenter = forestCenter
        const groundBlock = this.bot.findBlock({
            point: forestCenter,
            matching: (block) => block.name === 'grass_block' || block.name === 'dirt',
            maxDistance: 10,
        })
        const target = groundBlock?.position ?? forestCenter
        this.bot.pathfinder.goto(new GoalNear(target.x, target.y, target.z, 3))
    }

    private locateForestCenter = async (searchRadiusChunks = 4) : Promise<Vec3> => {
        this.logger.debug('Finding forest in radius %d chunks', searchRadiusChunks)
        this.logger.debug('Waiting for chunks to load')
        await this.waitForChunksToLoadInRadius(searchRadiusChunks)
        const trees = this.findTrees(16 * searchRadiusChunks)
        this.logger.debug('Found %d trees', trees.length)
        trees.forEach((tree, i) => {
            this.bot.viewer.drawPoints(`tree-${i}-center`, [tree.centroid], faker.color.rgb({ format: 'hex' }), 50)
        })
        const clusters = dbscan(trees.map(({ centroid }) => centroid), 10, 3)
        this.logger.debug('Found %d clusters', clusters.length)
        if (clusters.length === 0) {
            this.logger.warn('No clusters found, retrying')
            return this.locateForestCenter(searchRadiusChunks + 3)
        }
        const bestCluster = clusters.reduce((best, cluster) => cluster.length > best.length ? cluster : best, clusters[0]!)
        this.logger.debug('Best cluster has %d trees', bestCluster.length)
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