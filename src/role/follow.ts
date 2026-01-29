import type { Entity } from 'prismarine-entity'
import { BotBase } from '@/bot'
import logger from '@/logger'
import { goals } from 'mineflayer-pathfinder'

const { GoalFollow } = goals

export default class FollowBot extends BotBase {
    constructor() {
        super()
        logger.info(`FollowBot logged in as ${this.username}`)
        this.bot.on('entitySpawn', this.onEntitySpawn)
    }

    private onEntitySpawn = (entity: Entity) => {
        switch (entity.type) {
            case 'player':
                if (entity.uuid) { // real players have UUIDs
                    this.bot.pathfinder.setGoal(new GoalFollow(entity, 1), true)
                    logger.info(`Following ${entity.username}`)
                }
        }
    }

}