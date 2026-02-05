import { Rcon } from 'rcon-client'

export async function rconCommand(command: string, port = 25575, password = 'botdev'): Promise<string> {
    const rcon = await Rcon.connect({ host: 'localhost', port, password })
    const response = await rcon.send(command)
    await rcon.end()
    return response
}
