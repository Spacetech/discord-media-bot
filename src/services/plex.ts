import { config } from "../config";

class Plex {

    public async getLibraries() {
        const url = `${config.plex.url}/library/sections?X-Plex-Token=${config.plex.token}`;
        const response = await fetch(url, {
            headers: {
                "Accept": "application/json"
            }
        });

        const result = await response.json();

        return result.MediaContainer.Directory.sort((a: { key: string; }, b: { key: string; }) => parseInt(a.key, 10) - parseInt(b.key, 10));
    }

    public async refreshLibrary(libraryId: string): Promise<boolean> {
        const url = `${config.plex.url}/library/sections/${libraryId}/refresh?X-Plex-Token=${config.plex.token}`;
        const response = await fetch(url, {
            headers: {
                "Accept": "application/json"
            }
        });

        return response.status === 200;
    }

}

export const plex = new Plex();
