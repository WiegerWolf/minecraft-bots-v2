import { createBot } from 'mineflayer'
import { faker } from '@faker-js/faker'
import logger from '@/logger'
import FollowBot from '@/role/follow'

const username = faker.internet.username()
    .substring(0, 15).replace(/[^a-zA-Z0-9]/g, '')

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
bot.on('login', () => {
    new FollowBot(bot, logger, username)
})