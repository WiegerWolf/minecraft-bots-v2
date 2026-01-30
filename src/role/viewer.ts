import type { BotBase } from "@/bot";
import { mineflayer as mineflayerViewer } from 'prismarine-viewer'

export default class BotWithViewer {
    constructor(
        private inner: BotBase,
    ) {
        if (this.inner.bot.entity)
            this.onSpawn()
        else
            this.inner.bot.on('spawn', this.onSpawn)
    }

    private onSpawn = () => {
        mineflayerViewer(this.inner.bot, {})
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