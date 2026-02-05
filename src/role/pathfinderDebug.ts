import { BotBase } from "@/bot";
import { Vec3 } from "vec3";
import { goals } from 'mineflayer-pathfinder'
import type { PartiallyComputedPath } from "mineflayer-pathfinder";

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
        this.bot.on('path_update', this.logPathUpdate)
        this.bot.on('goal_reached', this.logGoalReached)
    }

    private logGoalReached = () => {
        const pos = this.bot.entity.position
        this.logger.debug(`GOAL REACHED at (${pos.x.toFixed(2)}, ${pos.y.toFixed(2)}, ${pos.z.toFixed(2)})`)
    }

    private logPathUpdate = (result: PartiallyComputedPath) => {
        this.logger.debug(`Path update: ${result.status}`)
        if (result.path) {
            const pos = this.bot.entity.position
            if (result.path.length === 0) {
                this.logger.trace(`Path found with 0 nodes (bot at ${pos.x.toFixed(2)}, ${pos.y.toFixed(2)}, ${pos.z.toFixed(2)})`)
            } else {
                this.logger.trace(`Path found with ${result.path.length} nodes:`)
                result.path.forEach((node: any, i: number) => {
                    const block = this.bot.blockAt(new Vec3(node.x, node.y, node.z))
                    this.logger.trace(`  [${i}] (${node.x}, ${node.y}, ${node.z}) - ${block?.name || 'unknown'}`)
                })
            }
        }
    }

    private setPositionAndGoal = async () => {
        await this.opComplete
        this.bot.chat(`/tp ${this.startingPoint.x} ${this.startingPoint.y} ${this.startingPoint.z}`)
        this.bot.on('message', ({ json }, position) => {
            if (position === 'system' && json.with[0].text === this.username && json.translate === 'commands.teleport.success.location.single') { // once we've teleported
                this.logger.info(`teleported to ${json.with.slice(1).map((o: any) => Object.values(o)[0])}`)
                this.bot.pathfinder.setGoal(new GoalBlock(this.targetPoint.x, this.targetPoint.y, this.targetPoint.z))
            }
        })
        this.bot.on('whisper', (username, message) => {
            if (message === 'pos') {
                const pos = this.bot.entity.position
                this.logger.info(`pos: (${pos.x.toFixed(2)}, ${pos.y.toFixed(2)}, ${pos.z.toFixed(2)})`)
            }
        })
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