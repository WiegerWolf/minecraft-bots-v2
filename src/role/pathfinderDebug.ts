import { BotBase } from "@/bot";
import { Vec3 } from "vec3";
import { goals } from 'mineflayer-pathfinder'

const { GoalBlock } = goals

export default class PathfinderDebugBot extends BotBase {
    constructor(
        private startingPoint: Vec3,
        private targetPoint: Vec3
    ) {
        super()
        this.logger.info(`creating PathfinderDebugBot from ${startingPoint} to ${targetPoint}`)
        this.bot.on('spawn', this.setPositionAndGoal)
    }

    private setPositionAndGoal = () => {
        this.bot.chat(`/tp ${this.startingPoint.x} ${this.startingPoint.y} ${this.startingPoint.z}`)
        this.bot.pathfinder.setGoal(new GoalBlock(this.targetPoint.x, this.targetPoint.y, this.targetPoint.z))
    }
}