import { Entity } from 'prismarine-entity'
import { BotBase } from '@/bot'
import { goals } from 'mineflayer-pathfinder'

const { GoalFollow } = goals

const LOOK_AT_UPDATE_INTERVAL_MS = 500

export default class FollowBot extends BotBase {
    private targetEntity: Entity | null = null
    private lookAtUpdateIterval?: NodeJS.Timeout

    constructor(
        private usernameToFollow: string,
        private followDistance: number = 3
    ) {
        super()
        this.logger.info(`creating FollowBot for ${usernameToFollow}`)
        this.bot.on('entitySpawn', this.onEntitySpawn)
    }

    private onEntitySpawn = (entity: Entity) => {
        if (entity.type === 'player' && entity.username === this.usernameToFollow) {
            this.startFollowing(entity)
        }
    }

    private startFollowing = (entity: Entity) => {
        this.targetEntity = entity
        this.bot.pathfinder.setGoal(new GoalFollow(entity, this.followDistance), true)
        this.lookAtUpdateIterval = setInterval(this.updateLookAt, LOOK_AT_UPDATE_INTERVAL_MS)
        this.logger.info(`Following ${entity.username}`)
    }

    private updateLookAt = () => {
        if (!this.targetEntity) return;
        if (!this.bot.entities[this.targetEntity.id]) { // entity is not loaded so invisible to us
            this.stopLookAt()
            return
        }
        if (this.bot.entity.position.distanceTo(this.targetEntity.position) > this.followDistance + 3) return; // if we are too far away don't waste looking at them

        const targetEntityEyeLevel = this.targetEntity.position.offset(0, this.targetEntity.height, 0)
        this.bot.lookAt(targetEntityEyeLevel)
    }

    private stopLookAt() {
        this.targetEntity = null
        this.lookAtUpdateIterval && clearInterval(this.lookAtUpdateIterval)
    }

}