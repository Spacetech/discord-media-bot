# Discord Media Bot
Sonarr &amp; Radarr integration with Discord

## Screenshots

### Commands list
![image](https://user-images.githubusercontent.com/824323/135698061-18977c55-5a12-4036-ae1f-3f5903e156c1.png)

### Show command
![image](https://user-images.githubusercontent.com/824323/135698098-34a987fd-0155-468e-9b4f-1739f5b46b2e.png)

### Movie command
![image](https://user-images.githubusercontent.com/824323/135698126-151d0000-d7dd-4cab-b8f7-39ce149f3e3a.png)

## Example docker-compose

```
  mediabot:
    image: mediabot
    restart: unless-stopped
    container_name: mediabot
    volumes:
      - /etc/localtime:/etc/localtime:ro
    environment:
      - TZ=${DEFAULT_TIMEZONE}

      - BOT_USER_ID=discord_bot_user_id
      - BOT_TOKEN=discord_bot_token_secret
      - BOT_GUILDS=guild_id_1,guild_id_2

      - COMMANDS_EPHEMERAL=0
      - COMMANDS_ENABLE_PLEX=1
      - COMMANDS_ENABLE_SONARR=1
      - COMMANDS_ENABLE_RADARR=1

      - PLEX_URL=http://192.168.20.1:32400
      - PLEX_TOKEN=secret

      - SONARR_URL=http://192.168.20.2:8989
      - SONARR_API_KEY=secret
      - SONARR_DEFAULT_MEDIA_PATH=/media/TV Shows
      - SONARR_DEFAULT_QUALITY_PROFILE_ID=6

      - RADARR_URL=http://192.168.20.3:7878
      - RADARR_API_KEY=secret
      - RADARR_DEFAULT_MEDIA_PATH=/media/Movies
      - RADARR_DEFAULT_QUALITY_PROFILE_ID=4

      - NODE_ENV=production
```
