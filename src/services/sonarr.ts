import { config } from "../config";

class Sonarr {

    async getSeries() {
        const url = `${config.sonarr.url}/api/v3/series`;
        const response = await fetch(url, {
            headers: {
                "X-Api-Key": config.sonarr.apiKey
            }
        });

        return response.json();
    }

    async getQualityProfiles() {
        const url = `${config.sonarr.url}/api/v3/qualityprofile`;
        const response = await fetch(url, {
            headers: {
                "X-Api-Key": config.sonarr.apiKey
            }
        });

        const profiles = await response.json();

        const profileMap = new Map();

        for (const profile of profiles) {
            profileMap.set(profile.id, profile.name);
        }

        return profileMap;
    }

    async lookupShows(name: string) {
        const url = `${config.sonarr.url}/api/v3/series/lookup?term=${encodeURIComponent(name)}`;
        const response = await fetch(url, {
            headers: {
                "X-Api-Key": config.sonarr.apiKey
            }
        });

        if (response.status === 200) {
            return response.json();
        }

        const result = await response.json();

        throw new Error(`Failed to search for show: Response: ${JSON.stringify(result)}`);
    }

    async getEpisode(id: string) {
        const url = `${config.sonarr.url}/api/v3/episode?episodeIds=${id}`;
        const response = await fetch(url, {
            headers: {
                "X-Api-Key": config.sonarr.apiKey
            }
        });

        return response.json();
    }

    async getSeriesEpisodes(id: string) {
        const url = `${config.sonarr.url}/api/v3/episode?seriesId=${id}`;
        const response = await fetch(url, {
            headers: {
                "X-Api-Key": config.sonarr.apiKey
            }
        });

        return response.json();
    }

    async addShow(show: any) {
        let request = {
            ...show
        };
        request.qualityProfileId = config.sonarr.defaultQualityProfileId;
        request.languageProfileId = 1;
        request.rootFolderPath = config.sonarr.defaultMediaPath;
        request.monitored = true;
        request.seasonFolder = true;
        request.addOptions = {
            monitor: "all",
            searchForMissingEpisodes: true,
        };
        request.seriesType = "standard";

        const url = `${config.sonarr.url}/api/v3/series`;
        const response = await fetch(url, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "X-Api-Key": config.sonarr.apiKey
            },
            body: JSON.stringify(request)
        });

        if (response.status === 201) {
            return true;
        }

        const result = await response.json();

        throw new Error(`Failed to add show: ${JSON.stringify(result)}`);
    }

    async updateShow(show: { id: any; }) {
        let request = {
            ...show
        };

        const url = `${config.sonarr.url}/api/v3/series/${show.id}`;
        const response = await fetch(url, {
            method: "PUT",
            headers: {
                "X-Api-Key": config.sonarr.apiKey
            },
            body: JSON.stringify(request)
        });

        if (response.status === 202) {
            return true;
        }

        const result = await response.json();

        throw new Error(`Failed to update show: ${JSON.stringify(result)}`);
    }

    async getShowQueue() {
        const url = `${config.sonarr.url}/api/v3/queue?page=1&pageSize=20&sortDirection=descending&sortKey=progress&includeUnknownSeriesItems=false`;
        const response = await fetch(url, {
            headers: {
                "X-Api-Key": config.sonarr.apiKey
            }
        });

        const json = await response.json();

        return {
            records: json.records,
            total: json.totalRecords,
        };
    }

    async getMissingEpisodes() {
        const url = `${config.sonarr.url}/api/v3/wanted/missing?page=1&pageSize=20&sortDirection=descending&sortKey=airDateUtc&monitored=true`;
        const response = await fetch(url, {
            headers: {
                "X-Api-Key": config.sonarr.apiKey
            }
        });

        const json = await response.json();

        return json.records;
    }

    async deleteQueuedShow(id: string) {
        const url = `${config.radarr.url}/api/v3/queue/${id}?removeFromClient=true&blacklist=false`;
        const response = await fetch(url, {
            method: "DELETE",
            headers: {
                "X-Api-Key": config.radarr.apiKey
            }
        });

        return response.json();
    }

    async searchShow(id: string) {
        let request = {
            name: "SeriesSearch",
            seriesId: id
        }

        const url = `${config.sonarr.url}/api/v3/command`;
        const response = await fetch(url, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "X-Api-Key": config.sonarr.apiKey
            },
            body: JSON.stringify(request)
        });

        if (response.status === 201) {
            return true;
        }

        const result = await response.json();

        throw new Error(`Failed to search show: ${JSON.stringify(result)}`);
    }

    async searchMissing() {
        let request = {
            name: "MissingEpisodeSearch",
            monitored: true
        }

        const url = `${config.sonarr.url}/api/v3/command`;
        const response = await fetch(url, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "X-Api-Key": config.sonarr.apiKey
            },
            body: JSON.stringify(request)
        });

        if (response.status === 201) {
            return true;
        }

        const result = await response.json();

        throw new Error(`Failed to search for missing shows: ${JSON.stringify(result)}`);
    }
}

export const sonarr = new Sonarr();
