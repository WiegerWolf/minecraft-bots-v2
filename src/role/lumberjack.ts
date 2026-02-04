import { BotBase } from "@/bot";


export default class LumberjackBot extends BotBase {
    constructor() {
        super('Lumberjack')
        this.bot.on('spawn', this.findForest)
    }

    private findForest = async () => {
        await this.bot.waitForChunksToLoad()
        const treeLogIds = this.bot.registry.blocksArray
            .filter(({name}) => name.endsWith('_log') && !name.startsWith('stripped_'))
            .map(({id}) => id)
        const blockCandidates = this.bot.findBlocks({
            maxDistance: 192,
            count: 100,
            matching: treeLogIds,
        })
        this.bot.viewer.drawPoints('logCandidates', )
    }
}