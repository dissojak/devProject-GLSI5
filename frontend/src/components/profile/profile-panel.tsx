"use client";

import { useState, type ChangeEvent } from "react";
import {
  PROFILE_FIELD_ROWS,
  PROFILE_PANEL_ROW,
  PROFILE_ROLE_ROW,
  PROFILE_SAVE_ACTIONS_ROW,
  PROFILE_SAVE_ERROR_ROW,
  PROFILE_SAVE_HINT_ROW,
  PROFILE_UPDATED_TOAST_ROW,
  type ProfileSaveHintId,
} from "@/data/profile";
import { relativeTime } from "@/utils/relative-time";
import { initials, titleCase } from "@/utils/identity";
import {
  validateAvatarUrl,
  validateProfileName,
  profileEditIsDirty,
} from "@/utils/profile-validation";
import { mutationErrorMessage } from "@/utils/auth-responses";
import { useUpdateProfileMutation } from "@/store/profile-api";
import type { ProfileAccount, ProfileUpdateBody } from "@/types/profile";
import { AlertBanner } from "@/shared/alert-banner";
import { Button } from "@/shared/button";
import { MaterialIcon } from "@/shared/material-icon";
import { Pill } from "@/shared/pill";
import { StatusDot } from "@/shared/status-dot";
import { TextField } from "@/shared/text-field";
import { cn } from "@/utils/class-names";
import { useToast } from "@/components/toast/toast-provider";

interface ProfilePanelProps {
  profile: ProfileAccount;
}

const CARD =
  "rounded-2xl border border-ice/20 bg-surface-mid p-6 shadow-lg shadow-abyss/30";

const CHIP_TONES = {
  champagne: "border-champagne/50 bg-champagne/10 text-champagne",
  crimson: "border-crimson/50 bg-crimson/10 text-crimson",
  mint: "border-mint/50 bg-mint/10 text-mint",
} as const;

const HINT_TONES = {
  champagne: "text-champagne",
  crimson: "text-crimson",
  mint: "text-mint",
} as const;

function backendMessage(error: unknown): string {
  return mutationErrorMessage(error, PROFILE_SAVE_ERROR_ROW.title);
}
/** Screens 1 & 2 — the identity form with its full save-state machine. */
export function ProfilePanel({ profile }: ProfilePanelProps) {
  const push = useToast().push;
  const [updateProfile, { isLoading: saving }] = useUpdateProfileMutation();
  const [name, setName] = useState(profile.name);
  const [avatarUrl, setAvatarUrl] = useState(profile.avatarUrl ?? "");
  const [justSaved, setJustSaved] = useState(false);
  const [loadedAvatar, setLoadedAvatar] = useState<string | null>(null);
  const [avatarFailed, setAvatarFailed] = useState(false);
  const [patchError, setPatchError] = useState<string | null>(null);
  const [syncedProfile, setSyncedProfile] = useState(profile);

  // Refetched profile (server ledger) resets the buffer. `justSaved` stays:
  // this domain is single-writer (the panel itself), so a fresh profile rows
  // back only after this panel's PATCH — the "All changes saved" readout
  // therefore persists until the next edit clears it.
  if (syncedProfile !== profile) {
    setSyncedProfile(profile);
    setName(profile.name);
    setAvatarUrl(profile.avatarUrl ?? "");
    setLoadedAvatar(null);
    setAvatarFailed(false);
  }

  const trimmedAvatar = avatarUrl.trim();
  const nameError = validateProfileName(name);
  const avatarError = validateAvatarUrl(trimmedAvatar);
  const invalid = Boolean(nameError || avatarError);
  const dirty = profileEditIsDirty(
    { name: profile.name, avatarUrl: profile.avatarUrl ?? "" },
    { name, avatarUrl },
  );
  const previewable = validateAvatarUrl(trimmedAvatar) === null ? trimmedAvatar : "";

  let hint: ProfileSaveHintId | null = null;
  if (saving) {
    hint = "saving";
  } else if (dirty && invalid) {
    hint = "invalid";
  } else if (dirty && previewable && !avatarFailed && loadedAvatar === previewable) {
    hint = "ready";
  } else if (dirty) {
    hint = "dirty";
  } else if (justSaved) {
    hint = "saved";
  }
  const hintRow = hint ? PROFILE_SAVE_HINT_ROW[hint] : null;

  function commitField(commit: () => void) {
    commit();
    setJustSaved(false);
    setPatchError(null);
  }

  function handleAvatarChange(value: string) {
    commitField(() => setAvatarUrl(value));
    setAvatarFailed(false);
    setLoadedAvatar(null);
  }

  async function handleSave() {
    if (saving || !dirty || invalid) return;
    setPatchError(null);
    const body: ProfileUpdateBody = {
      name: name.trim(),
      avatarUrl: previewable ? previewable : null,
    };
    try {
      await updateProfile(body).unwrap();
    } catch (error) {
      setPatchError(backendMessage(error));
      return;
    }
    setJustSaved(true);
    push({
      tone: "mint",
      title: PROFILE_UPDATED_TOAST_ROW.title,
      message: PROFILE_UPDATED_TOAST_ROW.message,
    });
  }

  function handleCancel() {
    setJustSaved(false);
    setPatchError(null);
    setAvatarFailed(false);
    setLoadedAvatar(null);
    setName(profile.name);
    setAvatarUrl(profile.avatarUrl ?? "");
  }

  const loginCopy = profile.lastLoginAt ? `Last login ${relativeTime(profile.lastLoginAt)}` : null;

  return (
    <section aria-label={PROFILE_PANEL_ROW.label} className={CARD}>
      <div className="mb-5 flex items-center justify-between">
        <Pill tone="quiet" icon={<MaterialIcon name="badge" className="text-[14px] text-teal" />}>
          {PROFILE_PANEL_ROW.label}
        </Pill>
        {hintRow ? (
          <span
            className={cn(
              "inline-flex items-center rounded-full border px-3 py-1 text-[10px] font-semibold tracking-wider uppercase",
              CHIP_TONES[hintRow.tone],
            )}
          >
            {hintRow.chip}
          </span>
        ) : (
          <span className="font-mono text-[10px] tracking-wider text-mist/60">
            {PROFILE_PANEL_ROW.metaLabel}
          </span>
        )}
      </div>

      <div className="mb-6 flex items-center gap-4">
        <div className="relative h-16 w-16 shrink-0">
          {previewable && !avatarFailed ? (
            // Arbitrary per-user hosts: plain <img> is the only safe remote source here.
            <img
              src={previewable}
              alt={profile.name}
              className="h-16 w-16 rounded-xl border border-ice/25 object-cover"
              onLoad={() => setLoadedAvatar(previewable)}
              onError={() => setAvatarFailed(true)}
            />
          ) : (
            <span className="flex h-16 w-16 items-center justify-center rounded-xl border border-ice/25 bg-panel font-display text-xl font-bold text-ice">
              {initials(profile.name)}
            </span>
          )}
          <span className="absolute inset-x-0 -bottom-2 flex justify-center">
            <span className="rounded-full border border-ice/25 bg-basin px-1.5">
              <StatusDot />
            </span>
          </span>
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h2 className="truncate font-display text-headline-sm font-semibold text-foam">
              {name.trim() || profile.name}
            </h2>
            <Pill
              tone="champagne"
              icon={<MaterialIcon name="shield_person" className="text-[14px]" />}
            >
              {titleCase(profile.role)}
            </Pill>
          </div>
          <p className="mt-0.5 truncate text-body-sm text-mist">{profile.email}</p>
          {loginCopy ? (
            <p className="mt-1 flex items-center gap-1.5 text-xs text-mist/80">
              <MaterialIcon name="schedule" className="text-[14px] text-teal" />
              {loginCopy}
            </p>
          ) : null}
        </div>
      </div>

      <div className="space-y-4">
        <TextField
          id="profile-name"
          label={PROFILE_FIELD_ROWS.nameLabel}
          labelAside={PROFILE_FIELD_ROWS.nameHint}
          type="text"
          autoComplete="name"
          value={name}
          onChange={(event: ChangeEvent<HTMLInputElement>) =>
            commitField(() => setName(event.target.value))
          }
          disabled={saving}
          error={nameError}
          icon={<MaterialIcon name="person" className="shrink-0 text-[20px] text-teal" />}
        />
        <TextField
          id="profile-email"
          label={PROFILE_FIELD_ROWS.emailLabel}
          labelAside={PROFILE_FIELD_ROWS.emailHint}
          type="email"
          autoComplete="email"
          value={profile.email}
          readOnly
          disabled
          icon={<MaterialIcon name="mail" className="shrink-0 text-[20px] text-teal" />}
          trailing={<MaterialIcon name="lock" className="shrink-0 text-[16px] text-mist/70" />}
        />
        <div>
          <TextField
            id="profile-avatar"
            label={PROFILE_FIELD_ROWS.avatarLabel}
            labelAside={PROFILE_FIELD_ROWS.avatarHint}
            type="url"
            placeholder={PROFILE_FIELD_ROWS.avatarPlaceholder}
            value={avatarUrl}
            onChange={(event: ChangeEvent<HTMLInputElement>) =>
              handleAvatarChange(event.target.value)
            }
            disabled={saving}
            error={avatarError}
            icon={<MaterialIcon name="image" className="shrink-0 text-[20px] text-teal" />}
            trailing={
              trimmedAvatar ? (
                <button
                  type="button"
                  disabled={saving}
                  onClick={() => handleAvatarChange("")}
                  className="shrink-0 text-[11px] font-semibold tracking-wide text-mist transition-colors hover:text-crimson disabled:opacity-50"
                >
                  {PROFILE_FIELD_ROWS.removeAvatar}
                </button>
              ) : null
            }
          />
        </div>
      </div>

      <div className="mt-6">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold tracking-wider text-mist uppercase">
            {PROFILE_ROLE_ROW.label}
          </span>
        </div>
        <div className="mt-2 flex items-center justify-between rounded-xl border border-steel/60 bg-basin/60 px-4 py-2.5">
          <span className="flex items-center gap-2 text-sm font-medium text-foam">
            <MaterialIcon name="how_to_reg" className="text-[16px] text-teal" />
            {titleCase(profile.role)}
          </span>
          <span className="text-xs text-mist/70">{PROFILE_ROLE_ROW.note}</span>
        </div>
      </div>

      <div className="mt-6 space-y-3">
        {patchError ? (
          <AlertBanner
            tone="crimson"
            icon={<MaterialIcon name="error" className="shrink-0 text-[18px]" />}
          >
            {patchError}
          </AlertBanner>
        ) : null}
        <div className="flex items-center justify-between gap-3">
          {hintRow ? (
            <p
              className={cn(
                "flex min-w-0 items-center gap-1.5 text-xs font-medium",
                HINT_TONES[hintRow.tone],
              )}
            >
              <MaterialIcon
                name={hintRow.icon}
                className={cn("shrink-0 text-[14px]", hint === "saving" && "animate-spin")}
              />
              <span className="truncate">{hintRow.copy}</span>
            </p>
          ) : null}
          <div className="flex items-center gap-2">
            <Button variant="teal" onClick={handleCancel} disabled={saving}>
              {PROFILE_SAVE_ACTIONS_ROW.cancel}
            </Button>
            <Button
              variant="primary"
              onClick={() => {
                void handleSave();
              }}
              disabled={saving || !dirty || invalid}
            >
              {saving ? PROFILE_SAVE_ACTIONS_ROW.saving : PROFILE_SAVE_ACTIONS_ROW.save}
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
