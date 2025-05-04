# BTRFLY KotH (King of the Hill)

A Discord bot for managing 1v1 King of the Hill tournaments for Rocket League.

*This project is based on [6mans-JS](https://github.com/devlemire/6mans-JS) by devlemire, modified to support 1v1 King of the Hill tournaments.*

![BTRFLY Logo](./screenshots/btrfly_logo.png)

## Features

- **King of the Hill Format**: Players compete in 1v1 matches where the winner becomes/remains the King and the loser goes to the back of the queue
- **Queue Management**: Automatically manages player queue, king status, and challenger rotation
- **Discord Integration**: Sends match notifications, lobby details, and results via Discord
- **Admin Controls**: Commands for tournament management (skip, clear, kick, add)
- **Error Handling**: Robust error handling for various edge cases

## Setup

1. Clone this repository
2. Install dependencies with `npm install`
3. Create a `.env` file in the root directory with the following variables:

```
token=YOUR_DISCORD_BOT_TOKEN
channelName=koth-queue
categoryName=BTRFLY KotH
lobbyName=BTRFLY
lobbyRegion=USE
lobbySeries=5
```

4. Start the bot with `npm start`

## Commands

### Player Commands

- `!queue` - Join the queue
- `!leave` - Leave the queue
- `!status` - Check the current queue status
- `!win @user` - Report that you won against the mentioned user

### Admin Commands

- `!queue add @user` - Add a user to the queue
- `!skip` - Skip the current challenger
- `!clear` - Clear the entire queue
- `!kick @user` - Kick a user from the queue

## How It Works

1. **Queue System**:
   - Players join the queue with `!queue`
   - First player becomes the King
   - Second player becomes the Challenger
   - Additional players join the waiting queue

2. **Match Flow**:
   - King and Challenger receive lobby details via DM
   - After the match, the winner reports with `!win @loser`
   - Winner becomes/remains King
   - Loser goes to the back of the waiting queue
   - Next player in waiting queue becomes the new Challenger

3. **Admin Controls**:
   - Admins can add players, skip challengers, clear the queue, or kick players
   - Admin commands require appropriate Discord permissions

## Screenshots

### Queue Status
![Queue Status](./screenshots/queue_status.png)

### Match Ready
![Match Ready](./screenshots/match_ready.png)

### Match Results
![Match Results](./screenshots/match_results.png)

## Error Handling

The bot includes robust error handling for:
- DM failures (with alerts to a designated channel)
- Match result processing failures (with retries)
- Empty queue scenarios
- Permission validation

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- Original [6mans-JS](https://github.com/devlemire/6mans-JS) by devlemire
- BTRFLY Tournaments for the concept and branding
