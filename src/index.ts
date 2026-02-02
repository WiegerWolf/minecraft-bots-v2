import BotWithViewer from '@/role/viewer'
import PathfinderDebugBot from '@/role/pathfinderDebug'
import FollowBot from './role/follow'
import { Vec3 } from 'vec3'

BotWithViewer.create(new PathfinderDebugBot(
    new Vec3(22.5, 63, 2.5),
    new Vec3(25.5, 69, -4.5)
))
BotWithViewer.create(new PathfinderDebugBot(
    new Vec3(6.5, 69, 4.5),
    new Vec3(6.5, 70, -9.5)
))



BotWithViewer.create(new FollowBot(
    'nuxdie'
))
