import { v4 as uuidv4 } from "uuid";
export function newGuid() {
    return uuidv4();
}
export function isGuid(value) {
    // strict-ish UUID v4 check
    return /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}
