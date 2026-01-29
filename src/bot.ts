import { faker } from '@faker-js/faker'
import { createBot } from 'mineflayer'
import type { Bot } from 'mineflayer'
import { pathfinder, Movements, goals } from 'mineflayer-pathfinder'
import logger from '@/logger'

export class BotBase {
    public readonly bot: Bot
    public readonly username: string
    public movements!: Movements

    constructor() {
        this.username = faker.internet.username().substring(0, 15).replace(/[^a-zA-Z0-9]/g, '')
        logger.debug(`Creating bot with username ${this.username}`)
        this.bot = createBot({
            username: this.username,
            auth: 'offline'
        })
        this.bot.on('kicked', (reason, loggedIn) => {
            logger.warn({ loggedIn, reason }, 'Kicked from server')
        })
        this.bot.on('error', err => {
            logger.error(err)
        })
        this.bot.on('end', reason => {
            logger.warn({ reason }, 'Disconnected from server')
        })
        this.bot.on('spawn', this.onSpawn)
    }

    /**
     * Called when the bot spawns in the world,
     * including when it first connects and when 
     * it respawns after death.
     */
    private onSpawn = () => {
        logger.info(`${this.username} (re)spawned`)
        this.bot.loadPlugin(pathfinder)
        this.movements = new Movements(this.bot)
        this.bot.pathfinder.setMovements(this.movements)
    }
}