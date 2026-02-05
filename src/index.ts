import BotWithViewer from '@/role/viewer'
import LumberjackBot from './role/lumberjack'
import PathfinderDebugBot from './role/pathfinderDebug'
import { Vec3 } from 'vec3'

BotWithViewer.create(new LumberjackBot())
// BotWithViewer.create(new PathfinderDebugBot(new Vec3(-20.5, 76, -32.5), new Vec3(-20.5, 72, -32.5)))
