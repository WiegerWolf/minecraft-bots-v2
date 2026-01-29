import type { Entity } from 'prismarine-entity'
import { BotBase } from '@/bot'
import { goals } from 'mineflayer-pathfinder'

const { GoalFollow } = goals

export default class FollowBot extends BotBase {
    constructor(
        private usernameToFollow: string,
        private followDistance: number = 3
    ) {
        super()
        this.logger.info(`FollowBot logged in as ${this.username}`)
        this.bot.on('entitySpawn', this.onEntitySpawn)
    }

    private onEntitySpawn = (entity: Entity) => {
        switch (entity.type) {
            case 'player':
                if (entity.username === this.usernameToFollow) {
                    this.bot.pathfinder.setGoal(new GoalFollow(entity, this.followDistance), true)
                    this.logger.info(`Following ${entity.username}`)
                }
        }
    }

}