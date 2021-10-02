
export interface IUserState {
    userId: string;
    queue?: any[];
    sonarrMissing?: any[];
    radarrMovies?: any[];
    radarrMovie?: any;
    sonarrShows?: any[];
    lidarrMusic?: any[];
    radarrSearchResults?: any[];
    sonarrShow?: any;
    sonarrQualityProfiles?: any;
}

export const userStates: Record<string, IUserState> = {};

export function getState(userId: string): IUserState {
    let state = userStates[userId];

    if (!state) {
        state = { userId };
        userStates[userId] = state;
    }

    return state;
}

export function clearState(state: IUserState) {
    for (const key of Object.keys(state)) {
        (state as any)[key] = undefined;
    }
}

