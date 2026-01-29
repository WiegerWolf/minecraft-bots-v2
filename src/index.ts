import { createBot } from 'mineflayer'
import { faker } from '@faker-js/faker'
import logger from './logger'

const username = faker.internet.username().substring(0, 15).replace(/[^a-zA-Z0-9]/g, '')

const bot = createBot({
    username
})

bot.on('kicked', (reason, loggedIn) => {
    logger.warn({ loggedIn, reason }, 'Kicked from server')
})
bot.on('error', err => {
    logger.error(err)
})
bot.on('end', reason => {
    logger.warn({ reason }, 'Disconnected from server')
})
