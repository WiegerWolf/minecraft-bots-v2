import FollowBot from '@/role/follow'

let prev_bot_name = ''
for (let i = 0; i < 7; i++) {
    const followBot = new FollowBot(prev_bot_name||'nuxdie')
    prev_bot_name = followBot.username
}
