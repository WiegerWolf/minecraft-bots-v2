import type { BotBase } from "@/bot";
import { mineflayer as mineflayerViewer } from 'prismarine-viewer'

export default class BotWithViewer {
    constructor(
        private inner: BotBase,
    ) {
        this.inner.bot.once('chunkColumnLoad', this.setupViewer)
    }

    private setupViewer = () => {
        mineflayerViewer(this.inner.bot, {
            firstPerson: true
        })
    }

    static create<T extends BotBase>(inner: T): BotWithViewer & T {
        const botWithViewer = new BotWithViewer(inner)
        const proxy = new Proxy(botWithViewer, {
            get(target, prop) {
                if (prop in target)
                    return (target as any)[prop]
                return (inner as any)[prop]
            }
        })
        return proxy as BotWithViewer & T
    }
}