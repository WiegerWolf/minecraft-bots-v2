import type { Bot } from 'mineflayer'
import type { Logger } from 'pino'

export default class FollowBot {
    constructor(
        private readonly bot: Bot,
        private readonly logger: Logger,
        private readonly username: string,
    ) {
        this.logger.info(`FollowBot logged in as ${this.username}`)
        this.logger.debug('Adding event listeners')
        this.bot.on('spawn', this.onSpawn)
        // this.bot.on('physicsTick', this.onPhysicsTick)
    }

    /**
     * Called when the bot spawns in the world,
     * including when it first connects and when 
     * it respawns after death.
     */
    private onSpawn = () => {
        this.logger.info(`${this.username} (re)spawned`)
    }

    /**
     * Called every physics tick, which is 20Hz!
     */
    private onPhysicsTick = () => {
        this.logger.debug('Physics tick')
    }
}