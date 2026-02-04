import { faker } from '@faker-js/faker'
import { createBot } from 'mineflayer'
import type { Bot } from 'mineflayer'
import { pathfinder, Movements } from 'mineflayer-pathfinder'
import logger from '@/logger'
import type { Logger } from 'pino'
import chalk from 'chalk'

export class BotBase {
    public readonly bot: Bot
    public readonly username: string
    public movements!: Movements
    public logger: Logger
    public color: string

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
    }
}