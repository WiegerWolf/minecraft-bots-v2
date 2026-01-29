import type { Bot } from 'mineflayer'
import type { Logger } from 'pino'
import type { Entity } from 'prismarine-entity'
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
        this.bot.on('entitySpawn', this.onEntitySpawn)
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

    private onEntitySpawn = (entity: Entity) => {
        switch (entity.type) {
            case 'player':
                if (entity.username === 'nuxdie') {
                    this.bot.pathfinder.setGoal(new GoalFollow(entity, 1), true)
                }
        }
    }

}