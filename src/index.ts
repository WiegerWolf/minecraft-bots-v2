import BotWithViewer from '@/role/viewer'
import LumberjackBot from './role/lumberjack'
import PathfinderDebugBot from './role/pathfinderDebug'
import { Vec3 } from 'vec3'

// BotWithViewer.create(new LumberjackBot())
BotWithViewer.create(new PathfinderDebugBot(new Vec3(-2.5, 80, 35.5), new Vec3(-0.5, 83, 35.5)))
