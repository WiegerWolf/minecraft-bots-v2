import type { Bot, Player } from 'mineflayer'
import type { Logger } from 'pino'
import { pathfinder, Movements, goals } from 'mineflayer-pathfinder'

const { GoalFollow } = goals

export default class FollowBot {
    private readonly movements: Movements

    constructor(
        private readonly bot: Bot,
        private readonly logger: Logger,
        private readonly username: string,
    ) {
        this.logger.info(`FollowBot logged in as ${this.username}`)
        this.movements = new Movements(this.bot)
        this.logger.debug('Adding event listeners')
        this.bot.on('spawn', this.onSpawn)
    }

    /**
     * Called when the bot spawns in the world,
     * including when it first connects and when 
     * it respawns after death.
     */
    private onSpawn = () => {
        this.logger.info(`${this.username} (re)spawned`)
        this.bot.loadPlugin(pathfinder)
        this.bot.pathfinder.setMovements(this.movements)
    }

}