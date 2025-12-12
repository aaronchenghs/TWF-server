export function makeCode(len = 4) {
    const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    let out = "";
    for (let i = 0; i < len; i++)
        out += alphabet[Math.floor(Math.random() * alphabet.length)];
    return out;
}
export function emptyTiers() {
    return { S: [], A: [], B: [], C: [], D: [] };
}
