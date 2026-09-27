import type { SupabaseClient } from "@supabase/supabase-js";
import type { MemberUpdateInput } from "../../domain/types.ts";
import type { Database } from "../../supabase/database.types.ts";
import type { MemberWriteRepository } from "../contracts.ts";
import { RepositoryError } from "../errors.ts";
import { mapMemberRow } from "./mappers.ts";

const toRow = (input: MemberUpdateInput) => ({
  company: input.company,
  date_joined: input.dateJoined,
  date_of_birth: input.dateOfBirth,
  department_id: input.departmentId,
  email: input.email,
  facebook_handle: input.facebookHandle,
  favorite_verse: input.favoriteVerse,
  first_name: input.firstName,
  full_name: [input.firstName, input.middleName, input.lastName].filter(Boolean).join(" "),
  hobbies: input.hobbies,
  home_address: input.homeAddress,
  instagram_handle: input.instagramHandle,
  is_new_comer: input.isNewComer,
  last_name: input.lastName,
  marital_status: input.maritalStatus,
  middle_name: input.middleName,
  nationality: input.nationality,
  nickname: input.nickname,
  occupation: input.occupation,
  phone_number: input.phoneNumber,
  preferred_department_id: input.preferredDepartmentId,
  ...(input.profilePictureId === undefined ? {} : { profile_picture_id: input.profilePictureId }),
  role: input.role,
  skills: input.skills,
  tribe: input.tribe,
  whatsapp_number: input.whatsappNumber,
  x_handle: input.xHandle,
});

export const createSupabaseMemberWriteRepository = (
  client: SupabaseClient<Database>,
): MemberWriteRepository => ({
  async create(input) {
    const { data, error } = await client
      .from("members")
      .insert({
        available_days: [],
        born_again: false,
        church_interests: null,
        company: null,
        course: null,
        date_joined: input.dateJoined,
        date_of_birth: input.dateOfBirth,
        department_id: input.departmentId,
        email: input.email,
        facebook_handle: null,
        favorite_verse: null,
        first_name: input.firstName,
        full_name: [input.firstName, input.middleName, input.lastName].filter(Boolean).join(" "),
        hobbies: null,
        home_address: null,
        instagram_handle: null,
        institution: null,
        is_new_comer: input.isNewComer,
        last_name: input.lastName,
        legacy_profile_picture_url: null,
        marital_status: null,
        middle_name: input.middleName,
        nationality: null,
        nickname: null,
        occupation: null,
        phone_number: input.phoneNumber,
        preferred_department_id: input.preferredDepartmentId,
        previous_church: null,
        profile_picture_id: input.profilePictureId,
        role: null,
        skills: null,
        tribe: null,
        wants_department: false,
        whatsapp_number: input.whatsappNumber,
        x_handle: null,
        years_a_christian: null,
      })
      .select("*")
      .single();
    if (error) throw new RepositoryError("The member could not be registered.", error.code);
    return mapMemberRow(data);
  },
  async markAsRegular(id) {
    const { data, error } = await client
      .from("members")
      .update({ is_new_comer: false })
      .eq("id", id)
      .select("*")
      .single();
    if (error) throw new RepositoryError("The member could not be updated.", error.code);
    return mapMemberRow(data);
  },
  async update(id, input) {
    const { data, error } = await client
      .from("members")
      .update(toRow(input))
      .eq("id", id)
      .select("*")
      .single();
    if (error) throw new RepositoryError("The member could not be updated.", error.code);
    return mapMemberRow(data);
  },
});
