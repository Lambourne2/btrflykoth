# BTRFLY KotH - Setup Guide

This document provides detailed instructions for setting up and running the BTRFLY KotH bot.

## Prerequisites

- Node.js 12.0.0 or higher
- npm or yarn
- A Discord bot token (see [Discord Developer Portal](https://discord.com/developers/applications))
- Appropriate permissions for your Discord bot

## Installation

1. Extract the BTRFLY-KotH.zip file to your desired location
2. Navigate to the extracted directory
3. Install dependencies:

```bash
npm install
# or
yarn install
```

## Configuration

1. Create a `.env` file in the root directory with the following variables:

```
token=YOUR_DISCORD_BOT_TOKEN
channelName=koth-queue
categoryName=BTRFLY KotH
lobbyName=BTRFLY
lobbyRegion=USE
lobbySeries=5
```

Replace `YOUR_DISCORD_BOT_TOKEN` with your actual Discord bot token.

### Environment Variables Explained

- `token`: Your Discord bot token
- `channelName`: The name of the Discord channel where the bot will listen for commands
- `categoryName`: The name of the Discord category where voice channels will be created (if needed)
- `lobbyName`: The prefix for Rocket League lobby names
- `lobbyRegion`: The default region for Rocket League lobbies (e.g., USE, USW, EU)
- `lobbySeries`: The number of games in a series (Rocket League mutator setting)

## Discord Server Setup

1. Create a text channel named `koth-queue` (or whatever you specified in the `.env` file)
2. Create a text channel named `alerts` for error notifications
3. Create a role named `BTRFLY Admin` and assign it to users who should have admin privileges
4. Invite your bot to your Discord server with appropriate permissions:
   - Read Messages
   - Send Messages
   - Manage Messages
   - Embed Links
   - Attach Files
   - Read Message History
   - Mention Everyone
   - Add Reactions

## Running the Bot

Start the bot with:

```bash
npm start
# or
yarn start
```

For development/debugging:

```bash
npm run dev
# or
yarn dev
```

## Troubleshooting

### Bot doesn't respond to commands
- Ensure the bot is online and has the correct permissions
- Verify you're using commands in the correct channel (as specified in `.env`)
- Check console logs for any errors

### DM failures
- The bot will attempt to notify users via DM for lobby details
- If DMs fail, notifications will be sent to the `alerts` channel
- Ensure users have DMs enabled for the server

### Match result issues
- If match result processing fails, the bot will retry up to 3 times
- Check the console logs for detailed error information

## Support

For additional support or to report issues, please contact BTRFLY Tournaments administrators.
