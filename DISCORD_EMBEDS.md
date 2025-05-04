# BTRFLY KotH - Sample Discord Embeds

This document shows examples of the Discord embeds used in the BTRFLY KotH bot.

## Queue Status Embed

```
{
  "embed": {
    "color": 0x0075F2,
    "title": "BTRFLY KotH - Status",
    "description": "Current match: @KingPlayer (King) vs @ChallengerPlayer (Challenger)\nNext in line: @NextPlayer",
    "fields": [
      {
        "name": "Current King",
        "value": "@KingPlayer",
        "inline": true
      },
      {
        "name": "Current Challenger",
        "value": "@ChallengerPlayer",
        "inline": true
      },
      {
        "name": "Waiting Queue",
        "value": "@NextPlayer\n@Player3\n@Player4"
      },
      {
        "name": "Match in Progress",
        "value": "Yes",
        "inline": true
      },
      {
        "name": "Lobby Ready",
        "value": "Yes",
        "inline": true
      }
    ],
    "footer": {
      "text": "Lobby: BTRFLY1"
    }
  }
}
```

## Match Ready Embed

```
{
  "embed": {
    "color": 0x0075F2,
    "title": "BTRFLY KotH - Match Ready",
    "description": "A new 1v1 match is ready!",
    "fields": [
      {
        "name": "King",
        "value": "@KingPlayer",
        "inline": true
      },
      {
        "name": "Challenger",
        "value": "@ChallengerPlayer",
        "inline": true
      },
      {
        "name": "Lobby Creator",
        "value": "@KingPlayer"
      }
    ],
    "footer": {
      "text": "Check your DMs for lobby details"
    }
  }
}
```

## Match Result Embed

```
{
  "embed": {
    "color": 0x0075F2,
    "title": "BTRFLY KotH - Match Result",
    "description": "🏆 @WinnerPlayer defeated @LoserPlayer! Next up: @WinnerPlayer vs. @NextChallengerPlayer.",
    "fields": [
      {
        "name": "Current King",
        "value": "@WinnerPlayer",
        "inline": true
      },
      {
        "name": "Next Challenger",
        "value": "@NextChallengerPlayer",
        "inline": true
      },
      {
        "name": "Waiting Queue",
        "value": "@LoserPlayer\n@Player3\n@Player4"
      }
    ]
  }
}
```

## Lobby Details DM

```
{
  "embed": {
    "color": 0x0075F2,
    "title": "BTRFLY KotH - Lobby Details",
    "description": "You are the current King. Use this information to join the private match:",
    "fields": [
      {
        "name": "Lobby Name",
        "value": "BTRFLY1"
      },
      {
        "name": "Lobby Password",
        "value": "abc123"
      },
      {
        "name": "Series Length (mutator)",
        "value": "5"
      },
      {
        "name": "Region",
        "value": "USE"
      }
    ],
    "footer": {
      "text": "Report match results in the Discord channel when finished"
    }
  }
}
```

## Player Joined Embed

```
{
  "embed": {
    "color": 0x0075F2,
    "title": "BTRFLY KotH - Joined Waiting Queue",
    "description": "@NewPlayer has joined the waiting queue.",
    "fields": [
      {
        "name": "Current King",
        "value": "@KingPlayer",
        "inline": true
      },
      {
        "name": "Current Challenger",
        "value": "@ChallengerPlayer",
        "inline": true
      },
      {
        "name": "Queue Position",
        "value": "3",
        "inline": true
      },
      {
        "name": "Waiting Queue",
        "value": "@Player1\n@Player2\n@NewPlayer"
      }
    ]
  }
}
```
