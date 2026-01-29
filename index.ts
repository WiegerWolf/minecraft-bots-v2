import { createBot } from 'mineflayer'
import { faker } from '@faker-js/faker'

const username = faker.internet.username().substring(0, 15).replace(/[^a-zA-Z0-9]/g, '')

const bot = createBot({
    username
})

console.log(`Bot ${bot} created`)