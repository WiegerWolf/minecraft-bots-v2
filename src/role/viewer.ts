import type { BotBase } from "@/bot";
import type { PartiallyComputedPath } from "mineflayer-pathfinder";
import type { Logger } from "pino";
import type { EventEmitter } from "events";
import { Vec3 } from "vec3";
import { mineflayer as mineflayerViewer } from 'prismarine-viewer'

interface Viewer extends EventEmitter {
    drawLine(id: string, points: Vec3[], color?: number | string): void
    drawBoxGrid(id: string, start: Vec3, end: Vec3, color?: number | string): void
    drawPoints(id: string, points: Vec3[], color?: number | string, size?: number): void
    erase(id: string): void
    close(): void
}
declare module 'mineflayer' {
    interface Bot {
        viewer: Viewer
    }
}

export default class BotWithViewer {
    private logger: Logger

    constructor(
        private inner: BotBase,
    ) {
        this.logger = inner.logger.child({ module: 'viewer' })
        this.inner.bot.once('spawn', this.setupViewer)
        this.inner.bot.on('path_update', this.onPathUpdate)
    }

    private setupViewer = () => {
        mineflayerViewer(this.inner.bot, {
            firstPerson: true
        })
    }

    private onPathUpdate = (r: PartiallyComputedPath) => {
        this.inner.bot.viewer.drawLine('path', r.path.map(({ x, y, z }) => new Vec3(x, y + 0.5, z)), 0x00FF00)
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