import type { SupabaseClient } from "@supabase/supabase-js";
import type { UserProfile } from "@/types/profile";
import {
    type UpdateProfileDTO,
    mapRowToProfile,
    mapDTOToUpdateRow,
} from "@/app/api/profiles/models/profile.model";
import { ServiceError, mapDbError } from "@/lib/service-error";

export async function getProfile(
    supabase: SupabaseClient,
    userId: string,
): Promise<UserProfile> {
    const { data, error } = await supabase
        .from("profiles")
        .select("name, email, theme")
        .eq("id", userId)
        .single();

    if (error) {
        const notFound = error.code === "PGRST116";
        if (notFound) {
            throw new ServiceError("Profil tidak ditemukan.", 404);
        }
        throw mapDbError(error);
    }

    return mapRowToProfile(data);
}

export async function updateProfile(
    supabase: SupabaseClient,
    userId: string,
    dto: UpdateProfileDTO,
): Promise<UserProfile> {
    const updateRow = mapDTOToUpdateRow(dto);

    if (Object.keys(updateRow).length === 0) {
        return getProfile(supabase, userId);
    }

    const { data, error } = await supabase
        .from("profiles")
        .update(updateRow)
        .eq("id", userId)
        .select("name, email, theme")
        .single();

    if (error) {
        throw mapDbError(error);
    }

    return mapRowToProfile(data);
}
