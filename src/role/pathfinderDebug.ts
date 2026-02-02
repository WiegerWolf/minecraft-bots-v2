import { BotBase } from "@/bot";
import { Vec3 } from "vec3";
import { goals } from 'mineflayer-pathfinder'

const { GoalBlock } = goals

export default class PathfinderDebugBot extends BotBase {
    private lastControlString = ''

    constructor(
        private startingPoint: Vec3,
        private targetPoint: Vec3
    ) {
        super()
        this.logger.info(`creating PathfinderDebugBot from ${startingPoint} to ${targetPoint}`)
        this.bot.on('spawn', this.setPositionAndGoal)
        this.bot.on('physicsTick', this.logControlState)
    }

    private setPositionAndGoal = () => {
        this.bot.chat(`/tp ${this.startingPoint.x} ${this.startingPoint.y} ${this.startingPoint.z}`)
        this.bot.pathfinder.setGoal(new GoalBlock(this.targetPoint.x, this.targetPoint.y, this.targetPoint.z))
    }

    private logControlState = () => {
        const cs = {
            forward: this.bot.controlState.forward,
            back: this.bot.controlState.back,
            left: this.bot.controlState.left,
            right: this.bot.controlState.right,
            jump: this.bot.controlState.jump,
            sprint: this.bot.controlState.sprint,
            sneak: this.bot.controlState.sneak
        }
        const active = Object.entries(cs)
            .filter(([, v]) => v)
            .map(([k]) => k)
        const str = active.length > 0 ? active.join('+') : 'idle'
        if (str !== this.lastControlString) {
            const pos = this.bot.entity.position
            this.logger.debug(`[controls] ${str}  pos=(${pos.x.toFixed(2)}, ${pos.y.toFixed(2)}, ${pos.z.toFixed(2)})`)
            this.lastControlString = str
        }
    }
}