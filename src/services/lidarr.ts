import { config } from "../config";

class Lidarr {

    async lookup(name: string | number | boolean) {
        const url = `${config.lidarr.url}/api/v1/search?term=${encodeURIComponent(name)}`;
        const response = await fetch(url, {
            headers: {
                "X-Api-Key": config.lidarr.apiKey
            }
        });

        if (response.status === 200) {
            return response.json();
        }

        const result = await response.json();

        throw new Error(`Failed to search for music: Response: ${JSON.stringify(result)}`);
    }

    async add(artistOrAlbum: { artist: any; album: any; }) {
        const artist = artistOrAlbum.artist ? artistOrAlbum.artist : artistOrAlbum;
        artist.albumFolder = true;
        artist.addOptions = {
            monitor: "all",
            searchForMissingAlbums: true
        };
        artist.rootFolderPath = config.lidarr.defaultMediaPath;

        let request = {
            ...(artistOrAlbum.artist ? artistOrAlbum.artist : artistOrAlbum.album)
        };
        request.qualityProfileId = config.lidarr.defaultQualityProfileId;
        request.metadataProfileId = config.lidarr.defaultMetadataProfileId;
        request.monitored = true;

        if (!artistOrAlbum.artist) {
            request.addOptions = {
                searchForNewAlbum: true
            };
        }

        const url = `${config.lidarr.url}/api/v1/${artistOrAlbum.artist ? "artist" : "album"}`;
        const response = await fetch(url, {
            method: "POST",
            headers: {
                "X-Api-Key": config.lidarr.apiKey
            },
            body: JSON.stringify(request),
        });

        if (response.status === 201) {
            return true;
        }

        const result = await response.json();

        throw new Error(`Failed to add artist/album: ${JSON.stringify(result)}`);
    }

    async getQueue() {
        const url = `${config.lidarr.url}/api/v1/queue?page=1&pageSize=20&sortDirection=descending&sortKey=progress&includeUnknownArtistItems=false`;
        const response = await fetch(url, {
            headers: {
                "X-Api-Key": config.lidarr.apiKey
            }
        });

        const json = await response.json();

        return {
            records: json.records,
            total: json.totalRecords,
        };
    }

    async deleteQueuedMovie(id: any) {
        const url = `${config.radarr.url}/api/queue/${id}`;
        const response = await fetch(url, {
            method: "DELETE",
            headers: {
                "X-Api-Key": config.radarr.apiKey
            }
        });

        return response.json();
    }

}

export const lidarr = new Lidarr();
