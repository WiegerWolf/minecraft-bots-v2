import { BotBase } from "@/bot";
import Tree from "@/world/tree";
import { faker } from '@faker-js/faker'

export default class LumberjackBot extends BotBase {
    constructor() {
        super('Lumberjack')
        this.bot.on('spawn', this.findForest)
    }

    private findForest = async (searchRadiusChunks = 4) => {
        this.logger.debug('Finding forest')
        await this.waitForChunksToLoadInRadius(searchRadiusChunks)
        const trees = this.findTrees(16 * searchRadiusChunks)
        this.logger.debug('Found %d trees', trees.length)
        trees.forEach((tree, i) => {
            this.bot.viewer.drawPoints(`tree-${i}-center`, [tree.centroid], faker.color.rgb({ format: 'hex' }), 150)
        })
    }

    private findTrees = (maxDistance: number, maxTreesToFind = 100) : Tree[] => {
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