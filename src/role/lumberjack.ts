import { BotBase } from "@/bot";
import Tree from "@/world/tree";

export default class LumberjackBot extends BotBase {
    constructor() {
        super('Lumberjack')
        this.bot.on('spawn', this.findForest)
    }

    private findForest = async () => {
        this.logger.debug('Finding forest')
        await this.waitForChunksToLoadInRadius(4)

        const leafIds = this.bot.registry.blocksArray
            .filter(({ name }) => name.endsWith('_leaves'))
            .map(({ id }) => id)
        const leafCandidates = this.bot.findBlocks({
            maxDistance: 192,
            count: 1000,
            matching: leafIds,
        })
        const trees = Tree.fromLeafBlocks(leafCandidates)
        this.logger.debug('Found %d trees', trees.length)

    }
}