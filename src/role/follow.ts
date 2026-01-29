import type { Bot } from 'mineflayer'
import type { Logger } from 'pino'

export default class FollowBot {
    constructor(
        private readonly bot: Bot,
        private readonly logger: Logger,
        private readonly username: string,
    ) {
        this.bot.addListener('spawn', this.onSpawn)
    }

    private onSpawn = () => {
        this.logger.info(`FollowBot spawned as ${this.username}`)
    }

}