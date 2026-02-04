import { BotBase } from "@/bot";


export default class LumberjackBot extends BotBase {
    constructor() {
        super('Lumberjack')
        this.bot.on('spawn', this.findForest)
    }

    private findForest = async () => {
        await this.waitForChunksToLoadInRadius(8)
        const treeLogIds = this.bot.registry.blocksArray
            .filter(({name}) => name.endsWith('_log') && !name.startsWith('stripped_'))
            .map(({id}) => id)
        const blockCandidates = this.bot.findBlocks({
            maxDistance: 192,
            count: 1000,
            matching: treeLogIds,
        })
        this.bot.viewer.drawPoints('logCandidates', blockCandidates, 0x00ff00, 10)
    }
}