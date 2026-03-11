import type { SupabaseClient } from "@supabase/supabase-js";
import type { UserProfile } from "@/types/profile";
import {
    type UpdateProfileDTO,
    mapRowToProfile,
    mapDTOToUpdateRow,
} from "@/app/api/profiles/models/profile.model";
import { ServiceError } from "@/lib/service-error";

export async function getProfile(
    supabase: SupabaseClient,
    userId: string,
): Promise<UserProfile> {
    const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .single();

    if (error) {
        const notFound = error.code === "PGRST116";
        throw new ServiceError(
            notFound ? "Profil tidak ditemukan." : error.message,
            notFound ? 404 : 500,
        );
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
        .select()
        .single();

    if (error) {
        throw new ServiceError(error.message);
    }

    return mapRowToProfile(data);
}
