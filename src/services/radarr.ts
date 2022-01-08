import fetch from "node-fetch";
import { config } from "../config";

class Radarr {

    async lookupMovies(name: string) {
        const url = `${config.radarr.url}/api/v3/movie/lookup?term=${encodeURIComponent(name)}`;
        const response = await fetch(url, {
            headers: {
                "X-Api-Key": config.radarr.apiKey
            }
        });

        if (response.status === 200) {
            return response.json();
        }

        const result = await response.json();

        throw new Error(`Failed to search for movie: Response: ${JSON.stringify(result)}`);
    }

    async searchMovie(movie: { id: any; }) {
        let request = {
            name: "moviesSearch",
            movieIds: [movie.id]
        };

        const url = `${config.radarr.url}/api/v3/command`;
        const response = await fetch(url, {
            method: "POST",
            headers: {
                "X-Api-Key": config.radarr.apiKey
            },
            body: JSON.stringify(request)
        });

        if (response.status === 201) {
            return true;
        }

        const result = await response.json();

        throw new Error(`Failed to search for movie: request: ${JSON.stringify(request)}. Response: ${JSON.stringify(result)}`);
    }

    async addMovie(movie: { title: any; year: any; }) {
        const request: Record<string, any> = {
            ...movie
        };
        request.qualityProfileId = config.radarr.defaultQualityProfileId;
        request.profileId = config.radarr.defaultQualityProfileId;
        request.path = `${config.radarr.defaultMediaPath}/${movie.title} (${movie.year})`;
        request.monitored = true;
        request.minimumAvailability = "released";
        request.addOptions = {
            ignoreEpisodesWithFiles: false,
            ignoreEpisodesWithoutFiles: false,
            searchForMovie: true
        };

        const url = `${config.radarr.url}/api/v3/movie`;
        const response = await fetch(url, {
            method: "POST",
            headers: {
                "X-Api-Key": config.radarr.apiKey
            },
            body: JSON.stringify(request),
        });

        if (response.status === 201) {
            return true;
        }

        const result = await response.json();

        throw new Error(`Failed to add movie: ${JSON.stringify(result)}`);
    }

    async findDownloads(movieId: any) {
        const url = `${config.radarr.url}/api/v3/release?movieId=${movieId}&sort_by=releaseWeight&order=asc`;
        const response = await fetch(url, {
            headers: {
                "X-Api-Key": config.radarr.apiKey
            }
        });

        return response.json();
    }

    async downloadMovie(searchResult: any) {
        const request = searchResult;

        const url = `${config.radarr.url}/api/v3/release`;
        const response = await fetch(url, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "X-Api-Key": config.radarr.apiKey
            },
            body: JSON.stringify(request)
        });

        if (response.status === 200) {
            return true;
        }

        const result = await response.json();

        throw new Error(`Failed to download movie: request: ${JSON.stringify(request)}. Response: ${JSON.stringify(result)}`);
    }

    async getMovieQueue() {
        const url = `${config.radarr.url}/api/v3/queue?page=1&pageSize=20&sortDirection=descending&sortKey=progress&includeUnknownMovieItems=false`;
        const response = await fetch(url, {
            headers: {
                "X-Api-Key": config.radarr.apiKey
            }
        });

        const json = await response.json();

        return {
            records: json.records,
            total: json.totalRecords,
        };
    }

    async deleteQueuedMovie(id: any) {
        const url = `${config.radarr.url}/api/v3/queue/${id}`;
        const response = await fetch(url, {
            method: "DELETE",
            headers: {
                "X-Api-Key": config.radarr.apiKey
            }
        });

        return response.json();
    }

}

export const radarr = new Radarr();
