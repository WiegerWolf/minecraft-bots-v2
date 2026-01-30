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

export function spectatorViewer(bot: Bot, { viewDistance = 6, port = 3000, prefix = '' } = {}) {
  const app = express()
  const server = http.createServer(app)
  const io = new SocketIOServer(server, { path: prefix + '/socket.io' })

  // Serve our custom frontend first, then fall back to prismarine-viewer's public assets
  // (worker.js, textures/, blocksStates/)
  app.use(prefix + '/', express.static(customPublic))
  app.use(prefix + '/', express.static(prismarinePublic))

  const sockets: any[] = []
  const primitives: Record<string, any> = {}

  const viewer = new EventEmitter() as Viewer

  viewer.erase = (id: string) => {
    delete primitives[id]
    for (const socket of sockets) {
      socket.emit('primitive', { id })
    }
  }

  viewer.drawBoxGrid = (id: string, start: any, end: any, color: any = 'aqua') => {
    primitives[id] = { type: 'boxgrid', id, start, end, color }
    for (const socket of sockets) {
      socket.emit('primitive', primitives[id])
    }
  }

  viewer.drawLine = (id: string, points: any[], color: any = 0xff0000) => {
    primitives[id] = { type: 'line', id, points, color }
    for (const socket of sockets) {
      socket.emit('primitive', primitives[id])
    }
  }

  viewer.drawPoints = (id: string, points: any[], color: any = 0xff0000, size: number = 5) => {
    primitives[id] = { type: 'points', id, points, color, size }
    for (const socket of sockets) {
      socket.emit('primitive', primitives[id])
    }
  }

  viewer.close = () => {
    server.close()
    for (const socket of sockets) {
      socket.disconnect()
    }
  }

  bot.viewer = viewer

  io.on('connection', (socket) => {
    socket.emit('version', bot.version)
    sockets.push(socket)

    const worldView = new WorldView(bot.world, viewDistance, bot.entity.position, socket)
    worldView.init(bot.entity.position)

    worldView.on('blockClicked', (block: any, face: any, button: any) => {
      viewer.emit('blockClicked', block, face, button)
    })

    for (const id in primitives) {
      socket.emit('primitive', primitives[id])
    }

    function botPosition() {
      const packet: any = { pos: bot.entity.position, yaw: bot.entity.yaw, addMesh: true }
      socket.emit('position', packet)
      worldView.updatePosition(bot.entity.position)
    }

    bot.on('move', botPosition)
    worldView.listenToBot(bot)
    socket.on('disconnect', () => {
      bot.removeListener('move', botPosition)
      worldView.removeListenersFromBot(bot)
      sockets.splice(sockets.indexOf(socket), 1)
    })
  })

  server.listen(port, () => {
    console.log(`Spectator viewer running on *:${port}`)
  })
}
