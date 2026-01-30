import { EventEmitter } from 'events'
import * as path from 'path'
import * as http from 'http'
import express from 'express'
import { Server as SocketIOServer } from 'socket.io'
import type { Bot } from 'mineflayer'
import type { Vec3 } from 'vec3'

interface Viewer extends EventEmitter {
  drawLine(id: string, points: Vec3[], color?: number | string): void
  drawBoxGrid(id: string, start: Vec3, end: Vec3, color?: number | string): void
  drawPoints(id: string, points: Vec3[], color?: number | string, size?: number): void
  erase(id: string): void
  close(): void
}

declare module 'mineflayer' {
  interface Bot {
    viewer: Viewer
  }
}

// @ts-ignore — CommonJS module without types
const { WorldView } = require('prismarine-viewer/viewer')

const prismarinePublic = path.join(path.dirname(require.resolve('prismarine-viewer')), 'public')
const customPublic = path.join(__dirname, '..', '..', 'dist', 'viewer')

interface BotEntry {
  bot: Bot
  primitives: Record<string, any>
  moveListeners: Map<any, () => void> // socket -> listener
}

export class ViewerServer {
  private static _instance: ViewerServer | undefined

  private bots = new Map<string, BotEntry>()
  private sockets: any[] = []
  private server: http.Server | undefined
  private io: SocketIOServer | undefined
  private started = false
  private viewDistance = 6
  private port = 3000
  private prefix = ''

  private constructor() {}

  static instance(): ViewerServer {
    if (!ViewerServer._instance) {
      ViewerServer._instance = new ViewerServer()
    }
    return ViewerServer._instance
  }

  addBot(bot: Bot): void {
    const username = bot.username

    const entry: BotEntry = {
      bot,
      primitives: {},
      moveListeners: new Map(),
    }

    this.bots.set(username, entry)

    // Create a viewer EventEmitter for this bot with namespaced primitive IDs
    const viewer = new EventEmitter() as Viewer
    const ns = (id: string) => `${username}:${id}`

    viewer.erase = (id: string) => {
      const nsId = ns(id)
      delete entry.primitives[nsId]
      for (const socket of this.sockets) {
        socket.emit('primitive', { id: nsId })
      }
    }

    viewer.drawBoxGrid = (id: string, start: any, end: any, color: any = 'aqua') => {
      const nsId = ns(id)
      entry.primitives[nsId] = { type: 'boxgrid', id: nsId, start, end, color }
      for (const socket of this.sockets) {
        socket.emit('primitive', entry.primitives[nsId])
      }
    }

    viewer.drawLine = (id: string, points: any[], color: any = 0xff0000) => {
      const nsId = ns(id)
      entry.primitives[nsId] = { type: 'line', id: nsId, points, color }
      for (const socket of this.sockets) {
        socket.emit('primitive', entry.primitives[nsId])
      }
    }

    viewer.drawPoints = (id: string, points: any[], color: any = 0xff0000, size: number = 5) => {
      const nsId = ns(id)
      entry.primitives[nsId] = { type: 'points', id: nsId, points, color, size }
      for (const socket of this.sockets) {
        socket.emit('primitive', entry.primitives[nsId])
      }
    }

    viewer.close = () => {
      // Remove this bot from the server
      this.bots.delete(username)
    }

    bot.viewer = viewer

    // Emit position updates for this bot to all connected sockets
    const onMove = () => {
      const packet = { botId: username, pos: bot.entity.position, yaw: bot.entity.yaw, addMesh: true }
      for (const socket of this.sockets) {
        socket.emit('position', packet)
      }
    }
    bot.on('move', onMove)

    // Start the server lazily on first addBot
    if (!this.started) {
      this.startServer()
    }
  }

  private startServer() {
    this.started = true

    const app = express()
    const server = http.createServer(app)
    const io = new SocketIOServer(server, { path: this.prefix + '/socket.io' })

    app.use(this.prefix + '/', express.static(customPublic))
    app.use(this.prefix + '/', express.static(prismarinePublic))

    this.server = server
    this.io = io

    io.on('connection', (socket) => {
      // Use the first registered bot for version and WorldView
      const firstEntry = Array.from(this.bots.values())[0]
      if (!firstEntry) {
        socket.disconnect()
        return
      }

      socket.emit('version', firstEntry.bot.version)
      this.sockets.push(socket)

      const worldView = new WorldView(firstEntry.bot.world, this.viewDistance, firstEntry.bot.entity.position, socket)
      worldView.init(firstEntry.bot.entity.position)

      worldView.on('blockClicked', (block: any, face: any, button: any) => {
        firstEntry.bot.viewer.emit('blockClicked', block, face, button)
      })

      // Send all primitives from all bots
      this.bots.forEach((entry) => {
        for (const id in entry.primitives) {
          socket.emit('primitive', entry.primitives[id])
        }
      })

      // Emit current position for all bots
      this.bots.forEach((entry, username) => {
        const packet = { botId: username, pos: entry.bot.entity.position, yaw: entry.bot.entity.yaw, addMesh: true }
        socket.emit('position', packet)
      })

      // Per-socket move listeners for WorldView updates (use first bot for camera)
      function updateWorldView() {
        worldView.updatePosition(firstEntry.bot.entity.position)
      }
      firstEntry.bot.on('move', updateWorldView)
      worldView.listenToBot(firstEntry.bot)

      socket.on('disconnect', () => {
        firstEntry.bot.removeListener('move', updateWorldView)
        worldView.removeListenersFromBot(firstEntry.bot)
        this.sockets.splice(this.sockets.indexOf(socket), 1)
      })
    })

    server.listen(this.port, () => {
      console.log(`Spectator viewer running on *:${this.port}`)
    })
  }
}
