import { Timestamp } from "firebase/firestore";

/**
 * Serializes any Firestore document data to be JSON-friendly.
 * Recursively converts Timestamp and Date objects to plain numbers (ms).
 */
export function serializeData(data: any): any {
    if (!data) return data;

    // Handle array
    if (Array.isArray(data)) {
        return data.map(item => serializeData(item));
    }

    // Handle object
    if (typeof data === 'object') {
        // Handle Timestamp (Firestore class)
        if (typeof data.toDate === 'function') {
            return data.toDate().getTime();
        }

        // Handle Date object
        if (data instanceof Date) {
            return data.getTime();
        }

        // Handle raw Firestore-like {seconds, nanoseconds}
        if (data.seconds !== undefined && data.nanoseconds !== undefined) {
            return new Date(data.seconds * 1000).getTime();
        }

        // Clone and recurse
        const result: any = {};
        for (const key in data) {
            if (Object.prototype.hasOwnProperty.call(data, key)) {
                result[key] = serializeData(data[key]);
            }
        }
        return result;
    }

    return data;
}
