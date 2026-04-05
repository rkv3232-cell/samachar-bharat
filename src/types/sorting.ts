import { ReactNode } from "react";

export type SortOption = "latest" | "oldest" | "most-viewed" | "most-liked" | "a-z" | "z-a";

export interface SortConfig {
    id: SortOption;
    field: string;
    direction: "asc" | "desc";
    label: string;
    icon?: ReactNode; // Kept optional to decouple types if needed
}
