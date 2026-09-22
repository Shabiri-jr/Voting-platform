"use server";

import { revalidatePath } from "next/cache";
import { randomUUID } from "node:crypto";
import sharp from "sharp";
import { parseStudentCsv, normalizeMatricNumber } from "@/lib/csv";
import { requireAdmin, requireRecentAdmin } from "@/lib/auth";
import { writeAuditLog } from "@/lib/audit";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import {
  candidateSchema,
  electionSchema,
  electionStatusSchema,
  positionOrderSchema,
  positionSchema,
  studentSchema,
} from "@/lib/validation";
import type { ActionResult } from "@/types";

function formValue(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value : undefined;
}

function lagosLocalToUtc(value: string) {
  const normalized = value.length === 16 ? `${value}:00` : value;
  const date = new Date(`${normalized}+01:00`);
  if (Number.isNaN(date.getTime())) throw new Error("Election date is invalid.");
  return date.toISOString();
}

function candidatePhotoPath(photoUrl: string | null) {
  if (!photoUrl) return null;
  try {
    const marker = "/storage/v1/object/public/candidate-photos/";
    const pathname = new URL(photoUrl).pathname;
    const markerIndex = pathname.indexOf(marker);
    return markerIndex >= 0
      ? decodeURIComponent(pathname.slice(markerIndex + marker.length))
      : null;
  } catch {
    return null;
  }
}

function errorResult<T = undefined>(error: unknown): ActionResult<T> {
  return {
    success: false,
    message:
      error instanceof Error
        ? error.message
        : "The requested change could not be completed.",
  };
}

export async function saveStudentAction(
  formData: FormData,
): Promise<ActionResult> {
  try {
    const actor = await requireAdmin("election_officer");
    const parsed = studentSchema.parse({
      id: formValue(formData, "id"),
      matricNumber: formValue(formData, "matricNumber"),
      firstName: formValue(formData, "firstName"),
      surname: formValue(formData, "surname"),
      department: formValue(formData, "department"),
      level: formValue(formData, "level"),
      isEligible: formValue(formData, "isEligible") ?? "false",
    });
    const supabase = getSupabaseAdminClient();
    const payload = {
      matric_number: normalizeMatricNumber(parsed.matricNumber),
      first_name: parsed.firstName,
      surname: parsed.surname,
      department: parsed.department,
      level: parsed.level,
      is_eligible: parsed.isEligible,
    };
    const result = parsed.id
      ? await supabase.from("students").update(payload).eq("id", parsed.id)
      : await supabase.from("students").insert(payload);
    if (result.error) throw new Error("Student could not be saved.");

    await writeAuditLog(supabase, actor, {
      action: parsed.id ? "student_edited" : "student_added",
      details: `${parsed.id ? "Updated" : "Added"} a student record.`,
    });
    revalidatePath("/admin/students");
    return { success: true, message: "Student saved successfully." };
  } catch (error) {
    return errorResult(error);
  }
}

export async function deleteStudentAction(
  formData: FormData,
): Promise<ActionResult> {
  try {
    const actor = await requireRecentAdmin("super_admin");
    const id = String(formData.get("id") ?? "");
    const supabase = getSupabaseAdminClient();
    const { error } = await supabase.from("students").delete().eq("id", id);
    if (error) throw new Error("Student could not be deleted.");
    await writeAuditLog(supabase, actor, {
      action: "student_deleted",
      details: "Deleted a student record.",
    });
    revalidatePath("/admin/students");
    return { success: true };
  } catch (error) {
    return errorResult(error);
  }
}

export async function importStudentsCsvAction(
  formData: FormData,
): Promise<ActionResult<{ inserted: number; skipped: number }>> {
  try {
    const actor = await requireAdmin("election_officer");
    const file = formData.get("file");
    if (!(file instanceof File) || file.size === 0) {
      throw new Error("Choose a CSV file.");
    }
    const students = parseStudentCsv(await file.text());
    const supabase = getSupabaseAdminClient();
    const { data, error } = await supabase
      .from("students")
      .upsert(
        students.map((student) => ({
          matric_number: student.matricNumber,
          first_name: student.firstName,
          surname: student.surname,
          department: student.department,
          level: student.level,
          is_eligible: true,
        })),
        { onConflict: "matric_number", ignoreDuplicates: true },
      )
      .select("id");
    if (error) throw new Error("The CSV could not be imported.");
    const inserted = data?.length ?? 0;
    await writeAuditLog(supabase, actor, {
      action: "students_imported",
      details: `Imported ${inserted} students; ${students.length - inserted} duplicates skipped.`,
    });
    revalidatePath("/admin/students");
    return {
      success: true,
      data: { inserted, skipped: students.length - inserted },
      message: `${inserted} students imported successfully.`,
    };
  } catch (error) {
    return errorResult<{ inserted: number; skipped: number }>(error);
  }
}

export async function savePositionAction(
  formData: FormData,
): Promise<ActionResult> {
  try {
    const actor = await requireAdmin("election_officer");
    const parsed = positionSchema.parse({
      id: formValue(formData, "id"),
      electionId: formValue(formData, "electionId"),
      title: formValue(formData, "title"),
      description: formValue(formData, "description") ?? "",
      displayOrder: formValue(formData, "displayOrder"),
    });
    const supabase = getSupabaseAdminClient();
    const payload = {
      election_id: parsed.electionId,
      title: parsed.title,
      description: parsed.description,
      display_order: parsed.displayOrder,
    };
    const result = parsed.id
      ? await supabase.from("positions").update(payload).eq("id", parsed.id)
      : await supabase.from("positions").insert(payload);
    if (result.error) throw new Error("Position could not be saved.");
    await writeAuditLog(supabase, actor, {
      action: parsed.id ? "position_edited" : "position_added",
      details: `${parsed.id ? "Updated" : "Added"} position ${parsed.title}.`,
    });
    revalidatePath("/admin/positions");
    return { success: true };
  } catch (error) {
    return errorResult(error);
  }
}

export async function reorderPositionsAction(
  formData: FormData,
): Promise<ActionResult> {
  try {
    const actor = await requireAdmin("election_officer");
    const parsed = positionOrderSchema.parse({
      electionId: formValue(formData, "electionId"),
      orderedIds: JSON.parse(String(formData.get("orderedIds") ?? "[]")) as unknown,
    });
    const supabase = getSupabaseAdminClient();
    const { error } = await supabase.rpc("reorder_positions", {
      target_election_id: parsed.electionId,
      ordered_position_ids: parsed.orderedIds,
      acting_admin_id: actor.adminId,
    });
    if (error) throw new Error("Positions could not be reordered.");
    revalidatePath("/admin/positions");
    return { success: true };
  } catch (error) {
    return errorResult(error);
  }
}

export async function deletePositionAction(
  formData: FormData,
): Promise<ActionResult> {
  try {
    const actor = await requireAdmin("election_officer");
    const id = String(formData.get("id") ?? "");
    const supabase = getSupabaseAdminClient();
    const { error } = await supabase.from("positions").delete().eq("id", id);
    if (error) throw new Error("Position could not be deleted.");
    await writeAuditLog(supabase, actor, {
      action: "position_deleted",
      details: "Deleted an election position.",
    });
    revalidatePath("/admin/positions");
    return { success: true };
  } catch (error) {
    return errorResult(error);
  }
}

export async function saveCandidateAction(
  formData: FormData,
): Promise<ActionResult> {
  try {
    const actor = await requireAdmin("election_officer");
    const parsed = candidateSchema.parse({
      id: formValue(formData, "id"),
      positionId: formValue(formData, "positionId"),
      fullName: formValue(formData, "fullName"),
      department: formValue(formData, "department"),
      level: formValue(formData, "level"),
      manifesto: formValue(formData, "manifesto") ?? "",
    });
    const supabase = getSupabaseAdminClient();
    const photo = formData.get("photo");
    let photoUrl: string | null = null;
    let previousPhotoPath: string | null = null;
    if (parsed.id) {
      const { data: existingCandidate } = await supabase
        .from("candidates")
        .select("photo_url")
        .eq("id", parsed.id)
        .maybeSingle();
      photoUrl = existingCandidate?.photo_url ? String(existingCandidate.photo_url) : null;
      previousPhotoPath = candidatePhotoPath(photoUrl);
    }
    let uploadedPath: string | null = null;
    if (photo instanceof File && photo.size > 0) {
      const allowedTypes = new Set(["image/jpeg", "image/png", "image/webp"]);
      if (!allowedTypes.has(photo.type) || photo.size > 2_000_000) {
        throw new Error("Candidate photo must be a JPEG, PNG, or WebP under 2 MB.");
      }
      let sanitizedImage: Buffer;
      try {
        sanitizedImage = await sharp(Buffer.from(await photo.arrayBuffer()), {
          failOn: "warning",
          limitInputPixels: 20_000_000,
        })
          .rotate()
          .resize(800, 800, {
            fit: "cover",
            position: "attention",
            withoutEnlargement: true,
          })
          .webp({ quality: 82 })
          .toBuffer();
      } catch {
        throw new Error("Candidate photo is corrupt or uses an unsupported format.");
      }
      const path = `${parsed.positionId}/${randomUUID()}.webp`;
      const { error: uploadError } = await supabase.storage
        .from("candidate-photos")
        .upload(path, sanitizedImage, {
          contentType: "image/webp",
          upsert: false,
        });
      if (uploadError) throw new Error("Candidate photo could not be uploaded.");
      uploadedPath = path;
      photoUrl = supabase.storage.from("candidate-photos").getPublicUrl(path).data.publicUrl;
    }
    const payload = {
      position_id: parsed.positionId,
      full_name: parsed.fullName,
      department: parsed.department,
      level: parsed.level,
      photo_url: photoUrl,
      manifesto: parsed.manifesto,
    };
    const result = parsed.id
      ? await supabase.from("candidates").update(payload).eq("id", parsed.id)
      : await supabase.from("candidates").insert(payload);
    if (result.error) {
      if (uploadedPath) {
        await supabase.storage.from("candidate-photos").remove([uploadedPath]);
      }
      throw new Error("Candidate could not be saved.");
    }
    if (uploadedPath && previousPhotoPath) {
      await supabase.storage.from("candidate-photos").remove([previousPhotoPath]);
    }
    await writeAuditLog(supabase, actor, {
      action: parsed.id ? "candidate_edited" : "candidate_added",
      details: `${parsed.id ? "Updated" : "Added"} candidate ${parsed.fullName}.`,
    });
    revalidatePath("/admin/candidates");
    return { success: true };
  } catch (error) {
    return errorResult(error);
  }
}

export async function deleteCandidateAction(
  formData: FormData,
): Promise<ActionResult> {
  try {
    const actor = await requireAdmin("election_officer");
    const id = String(formData.get("id") ?? "");
    const supabase = getSupabaseAdminClient();
    const { data: candidate } = await supabase
      .from("candidates")
      .select("photo_url")
      .eq("id", id)
      .maybeSingle();
    const { error } = await supabase.from("candidates").delete().eq("id", id);
    if (error) throw new Error("Candidate could not be deleted.");
    const photoPath = candidatePhotoPath(
      candidate?.photo_url ? String(candidate.photo_url) : null,
    );
    if (photoPath) {
      await supabase.storage.from("candidate-photos").remove([photoPath]);
    }
    await writeAuditLog(supabase, actor, {
      action: "candidate_deleted",
      details: "Deleted a candidate.",
    });
    revalidatePath("/admin/candidates");
    return { success: true };
  } catch (error) {
    return errorResult(error);
  }
}

export async function saveElectionAction(
  formData: FormData,
): Promise<ActionResult<{ electionId: string }>> {
  try {
    const actor = await requireAdmin("election_officer");
    const parsed = electionSchema.parse({
      id: formValue(formData, "id"),
      title: formValue(formData, "title"),
      description: formValue(formData, "description") ?? "",
      startTime: formValue(formData, "startTime"),
      endTime: formValue(formData, "endTime"),
    });
    const supabase = getSupabaseAdminClient();
    const payload = {
      title: parsed.title,
      description: parsed.description,
      start_time: lagosLocalToUtc(parsed.startTime),
      end_time: lagosLocalToUtc(parsed.endTime),
    };
    let electionId = parsed.id;
    if (parsed.id) {
      const { error } = await supabase
        .from("elections")
        .update(payload)
        .eq("id", parsed.id);
      if (error) throw new Error("Election could not be saved.");
    } else {
      const { data, error } = await supabase
        .from("elections")
        .insert({ ...payload, created_by: actor.adminId })
        .select("id")
        .single();
      if (error || !data) throw new Error("Election could not be saved.");
      electionId = String(data.id);
    }
    await writeAuditLog(supabase, actor, {
      action: parsed.id ? "election_edited" : "election_created",
      details: `${parsed.id ? "Updated" : "Created"} election ${parsed.title}.`,
    });
    revalidatePath("/admin/elections");
    return {
      success: true,
      data: { electionId: electionId! },
      message: parsed.id
        ? "Election details updated."
        : "Election created. Add its positions and candidates next.",
    };
  } catch (error) {
    return errorResult<{ electionId: string }>(error);
  }
}

export async function changeElectionStatusAction(
  formData: FormData,
): Promise<ActionResult> {
  try {
    const actor = await requireRecentAdmin("election_officer");
    const parsed = electionStatusSchema.parse({
      electionId: formValue(formData, "electionId"),
      status: formValue(formData, "status"),
    });
    const supabase = getSupabaseAdminClient();
    const { data: election, error: electionError } = await supabase
      .from("elections")
      .select("status")
      .eq("id", parsed.electionId)
      .maybeSingle();
    if (electionError || !election) {
      throw new Error("Election could not be found.");
    }

    if (parsed.status === "open") {
      const [{ count: positions }, { count: candidates }] = await Promise.all([
        supabase
          .from("positions")
          .select("*", { count: "exact", head: true })
          .eq("election_id", parsed.electionId),
        supabase
          .from("candidates")
          .select("*, positions!inner(election_id)", { count: "exact", head: true })
          .eq("positions.election_id", parsed.electionId),
      ]);
      if (!positions || !candidates) {
        throw new Error("Add positions and candidates before opening the election.");
      }
    }

    const reopened = election.status === "closed" && parsed.status === "open";
    const statusUpdate: {
      status: typeof parsed.status;
      end_time?: string;
    } = { status: parsed.status };
    if (reopened) {
      const reopenEndTime = formValue(formData, "reopenEndTime");
      if (!reopenEndTime) {
        throw new Error("Choose a new closing time before reopening the election.");
      }
      const endTime = lagosLocalToUtc(reopenEndTime);
      if (new Date(endTime).getTime() <= Date.now()) {
        throw new Error("The new closing time must be in the future.");
      }
      statusUpdate.end_time = endTime;
    }

    const { data: updatedElection, error } = await supabase
      .from("elections")
      .update(statusUpdate)
      .eq("id", parsed.electionId)
      .eq("status", election.status)
      .select("status")
      .maybeSingle();
    if (error) {
      if (error.message.includes("Invalid election status transition")) {
        throw new Error(
          "The production database has not been updated to allow reopening. Apply migration 202606080003_allow_election_reopen.sql.",
        );
      }
      if (
        error.message.includes("elections_one_open") ||
        error.message.includes("duplicate key")
      ) {
        throw new Error("Close the currently open election before reopening this one.");
      }
      throw new Error(`Election status could not be changed: ${error.message}`);
    }
    if (!updatedElection) {
      throw new Error("Election status changed while this request was being processed.");
    }

    await writeAuditLog(supabase, actor, {
      action: reopened ? "election_reopened" : `election_${parsed.status}`,
      details: reopened
        ? "Reopened the election. Existing ballots and participation records were retained."
        : `Changed election status to ${parsed.status}.`,
    });
    revalidatePath("/admin");
    return {
      success: true,
      message: reopened
        ? "Election reopened. Existing votes remain counted."
        : `Election status changed to ${parsed.status}.`,
    };
  } catch (error) {
    return errorResult(error);
  }
}
