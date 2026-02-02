import BotWithViewer from '@/role/viewer'
import PathfinderDebugBot from '@/role/pathfinderDebug'
import { Vec3 } from 'vec3'

BotWithViewer.create(new PathfinderDebugBot(
    new Vec3(22.5, 63, 2.5),
    new Vec3(25.5, 69, -4.5)
))
