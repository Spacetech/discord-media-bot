// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Math/random
export function getRandomInt(min: number, max: number) {
    return Math.floor(Math.random() * (max - min) + min);
}

export function sleep(milliseconds: number) {
    return new Promise<void>(resolve => setTimeout(resolve, milliseconds));
}