import { BotBase } from '@/bot'
import { goals } from 'mineflayer-pathfinder'
import type { Entity } from 'prismarine-entity'

const { GoalFollow } = goals

const LOOK_AT_UPDATE_INTERVAL_MS = 250

export default class FollowBot extends BotBase {
    private targetEntity: Entity | null = null
    private lookAtUpdateIterval?: NodeJS.Timeout
    private lookAtDistance: number

    constructor(
        private usernameToFollow: string,
        private followDistance: number = 3
    ) {
        super()
        this.lookAtDistance = followDistance + 3
        this.logger.info(`creating FollowBot for ${usernameToFollow}`)
        this.bot.on('entitySpawn', this.followAssignedPlayer)
        this.bot.on('entityHurt', this.onEntityHurt)
        this.bot.once('spawn', this.registerChatEvents)
    }

    private registerChatEvents = () => {
        this.bot.on('whisper', (username, message) => {
            if (username !== this.usernameToFollow) return;
            if (message === 'come' && this.bot.players[username]) {
                this.startFollowing(this.bot.players[username].entity)
            }
        })
    }

    private followAssignedPlayer = (entity: Entity) => {
        if (!this.targetEntity && entity.type === 'player' && entity.username === this.usernameToFollow) {
            this.startFollowing(entity)
        }
    }

    private onEntityHurt = (entity: Entity) => {
        if (this.bot.entity.position.distanceTo(entity.position) > this.lookAtDistance) return;
        this.startFollowing(entity)
    }

    private startFollowing = (entity: Entity) => {
        this.stopLookAt()
        this.targetEntity = entity
        this.bot.pathfinder.setGoal(new GoalFollow(entity, this.followDistance), true)
        this.lookAtUpdateIterval = setInterval(this.updateLookAt, LOOK_AT_UPDATE_INTERVAL_MS)
        this.logger.info(`Following ${entity.username || entity.displayName || entity.name || entity.uuid || entity.id}`)
    }

    private updateLookAt = () => {
        if (!this.targetEntity) return;
        if (!this.bot.entities[this.targetEntity.id]) { // entity is not loaded so invisible to us
            this.stopLookAt()
            return
        }
        if (this.bot.entity.position.distanceTo(this.targetEntity.position) > this.lookAtDistance) return; // if we are too far away don't waste looking at them

        const targetEntityEyeLevel = this.targetEntity.position.offset(0, this.targetEntity.height * 0.9, 0)
        this.bot.lookAt(targetEntityEyeLevel)
    }

    private stopLookAt() {
        this.targetEntity = null
        this.lookAtUpdateIterval && clearInterval(this.lookAtUpdateIterval)
    }

}