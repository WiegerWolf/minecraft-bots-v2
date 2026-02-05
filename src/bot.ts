import { faker } from '@faker-js/faker'
import { createBot } from 'mineflayer'
import type { Bot } from 'mineflayer'
import { pathfinder, Movements } from 'mineflayer-pathfinder'
import logger from '@/logger'
import type { Logger } from 'pino'
import chalk from 'chalk'
import { Vec3 } from 'vec3'
import { once } from 'events'
import { rconCommand } from '@/rcon'

export class BotBase {
    public readonly bot: Bot
    public readonly username: string
    public movements!: Movements
    public logger: Logger
    public color: string
    
    private _opPromise: Promise<void> | null = null
    protected get opComplete(): Promise<void> {
        return this._opPromise ?? Promise.resolve()
    }

    constructor(
        private roleName?: string
    ) {
        this.username = this.generateUsername(roleName)
        this.color = faker.color.rgb({ format: 'hex' })
        this.logger = logger.child({ username: this.username }, {
            msgPrefix: chalk.hex(this.color).bold(`${this.username}: `),
        })
        this.logger.debug('Creating bot')
        this.bot = createBot({
            username: this.username,
            auth: 'offline'
        })
        this.bot.on('kicked', (reason, loggedIn) => {
            this.logger.warn({ loggedIn, reason }, 'Kicked from server')
        })
        this.bot.on('error', err => {
            this.logger.error(err)
        })
        this.bot.on('end', reason => {
            this.logger.warn({ reason }, 'Disconnected from server')
        })
        this.bot.on('spawn', this.onSpawn)

        // Noop stub for debug viewer in prod
        this.bot.viewer = {
            drawPoints: () => { },
            drawLine: () => { },
            drawBoxGrid: () => { },
            erase: () => { },
            close: () => { },
        } as any

    }

    private generateUsername = (roleName?: string) => {
        if (roleName) {
            const remainingLen = 16 - roleName.length - 1
            return `${roleName}_${faker.string.alphanumeric(remainingLen)}`
        }
        return faker.internet.username().substring(0, 15).replace(/[^a-zA-Z0-9]/g, '')
    }

    /**
     * Called when the bot spawns in the world,
     * including when it first connects and when 
     * it respawns after death.
     */
    private onSpawn = () => {
        this.logger.info('(re)spawned')
        this.bot.loadPlugin(pathfinder)
        this.movements = new Movements(this.bot)
        this.bot.pathfinder.setMovements(this.movements)

        if (!this._opPromise) {
            this._opPromise = rconCommand(`op ${this.username}`)
                .then(res => this.logger.debug('RCON op: %s', res))
                .catch(err => this.logger.warn(err, 'Failed to op via RCON'))
        }
    }

    public waitForChunksToLoadInRadius = async (radius: number, timeout = 20000): Promise<void> => {
        const dist = radius
        // This makes sure that the bot's real position has been already sent
        if (!this.bot.entity.height) await once(this.bot.world, 'chunkColumnLoad')
        const pos = this.bot.entity.position
        const center = new Vec3(pos.x >> 4 << 4, 0, pos.z >> 4 << 4)
        // get corner coords of chunks around us
        const chunkPosToCheck = new Set()
        for (let x = -dist; x <= dist; x++) {
            for (let y = -dist; y <= dist; y++) {
                // ignore any chunks which are already loaded
                const pos = center.plus(new Vec3(x, 0, y).scaled(16))
                if (!this.bot.world.getColumnAt(pos)) chunkPosToCheck.add(pos.toString())
            }
        }
        if (chunkPosToCheck.size) {
            const that = this
            return new Promise((resolve) => {
                function waitForLoadEvents(columnCorner: Vec3) {
                    chunkPosToCheck.delete(columnCorner.toString())
                    if (chunkPosToCheck.size === 0) { // no chunks left to find
                        that.bot.world.off('chunkColumnLoad', waitForLoadEvents) // remove this listener instance
                        resolve()
                    }
                }
                // begin listening for remaining chunks to load
                this.bot.world.on('chunkColumnLoad', waitForLoadEvents)
                setTimeout(() => { // give up in case server has low view-distance
                    this.bot.world.off('chunkColumnLoad', waitForLoadEvents)
                    resolve()
                }, timeout)
            })
        }
    }
}