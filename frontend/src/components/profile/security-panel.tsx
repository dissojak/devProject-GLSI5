"use client";

import Link from "next/link";
import { useState, type ChangeEvent } from "react";
import {
  PASSWORD_FORM_ROWS,
  PASSWORD_SESSION_POLICY_ROW,
  PASSWORD_STRENGTH_ROWS,
  PASSWORD_UPDATED_TOAST_ROW,
  PROFILE_SAVE_ACTIONS_ROW,
  SECURITY_PANEL_ROW,
} from "@/data/profile";
import {
  passwordCriterionRows,
  passwordStrengthLabel,
  validateNewPassword,
  validatePasswordMatch,
} from "@/utils/profile-validation";
import { mutationErrorMessage } from "@/utils/auth-responses";
import { useChangePasswordMutation } from "@/store/profile-api";
import { usePasswordVisibility } from "@/hooks/use-password-visibility";
import { PasswordStrengthMeter } from "@/shared/password-strength-meter";
import { AlertBanner } from "@/shared/alert-banner";
import { Button } from "@/shared/button";
import { MaterialIcon } from "@/shared/material-icon";
import { Pill } from "@/shared/pill";
import { TextField } from "@/shared/text-field";
import { cn } from "@/utils/class-names";
import { useToast } from "@/components/toast/toast-provider";

export interface SecurityPanelProps {
  expanded: boolean;
  onOpen: () => void;
  onClose: () => void;
}

const CARD = "rounded-2xl border border-ice/20 bg-surface-mid p-6 shadow-lg shadow-abyss/30";

function criterionIcon(met: boolean) {
  if (met) {
    return <MaterialIcon name="check" className="shrink-0 text-[14px] text-mint" />;
  }
  return <MaterialIcon name="close" className="shrink-0 text-[14px] text-mist/60" />;
}

function visibilityTail(visibility: { visible: boolean; toggle: () => void }) {
  return (
    <button
      type="button"
      onClick={visibility.toggle}
      aria-label={visibility.visible ? "Hide password" : "Show password"}
      className="shrink-0 text-mist transition-colors hover:text-ice"
    >
      <MaterialIcon
        name={visibility.visible ? "visibility" : "visibility_off"}
        className="text-[18px]"
      />
    </button>
  );
}

/** Backend-provided human copy only — never surface internal error codes. */
function backendMessage(error: unknown): string {
  return mutationErrorMessage(error, PASSWORD_FORM_ROWS.updateError);
}

/**
 * Screens 1 / 3 / 4 — collapsed "Password" row by default, the change-password
 * form when opened, and the backend-failure banner for wrong-current-password
 * and no-local-password responses.
 */
export function SecurityPanel({ expanded, onOpen, onClose }: SecurityPanelProps) {
  if (!expanded) {
    return (
      <section aria-label={SECURITY_PANEL_ROW.label} className={CARD}>
        <div className="mb-5 flex items-center justify-between">
          <Pill tone="quiet" icon={<MaterialIcon name="shield" className="text-[14px] text-teal" />}>
            {SECURITY_PANEL_ROW.label}
          </Pill>
          <span className="font-mono text-[10px] tracking-wider text-mist/80">
            {SECURITY_PANEL_ROW.metaLabel}
          </span>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex min-w-0 items-center gap-4">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-ice/20 bg-basin/70">
              <MaterialIcon
                name={SECURITY_PANEL_ROW.rowIcon}
                className="text-[22px] text-ice"
              />
            </span>
            <div className="min-w-0">
              <h3 className="font-display text-headline-sm font-semibold text-foam">
                {SECURITY_PANEL_ROW.passwordTitle}
              </h3>
              <p className="mt-0.5 text-body-sm text-mist">
                {SECURITY_PANEL_ROW.passwordSubtitle}
              </p>
            </div>
          </div>
          <Button variant="teal" onClick={onOpen}>
            <MaterialIcon name={SECURITY_PANEL_ROW.changeIcon} className="text-[16px]" />
            {SECURITY_PANEL_ROW.changeAction}
          </Button>
        </div>
      </section>
    );
  }
  return <PasswordForm onClose={onClose} />;
}

function PasswordForm({ onClose }: { onClose: () => void }) {
  const { push } = useToast();
  const [changePassword, { isLoading: pending }] = useChangePasswordMutation();
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [banner, setBanner] = useState<string | null>(null);
  const currentVisibility = usePasswordVisibility();
  const nextVisibility = usePasswordVisibility();
  const confirmVisibility = usePasswordVisibility();

  const criteria = passwordCriterionRows(next);
  const metCount = criteria.filter((row) => row.met).length;
  const strengthLabel = passwordStrengthLabel(metCount);
  const nextError = validateNewPassword(next, current);
  const confirmError = validatePasswordMatch(next, confirm);
  const confirmed = confirm.length > 0 && confirmError === null;
  const submittable =
    !pending &&
    current.length > 0 &&
    metCount === criteria.length &&
    nextError === null &&
    confirmError === null;

  function reset() {
    setCurrent("");
    setNext("");
    setConfirm("");
    setBanner(null);
  }

  async function submitPassword() {
    if (!submittable) return;
    setBanner(null);
    try {
      await changePassword({ currentPassword: current, newPassword: next }).unwrap();
    } catch (error) {
      setBanner(backendMessage(error));
      return;
    }
    reset();
    push({
      tone: "mint",
      title: PASSWORD_UPDATED_TOAST_ROW.title,
      message: PASSWORD_UPDATED_TOAST_ROW.message,
    });
    onClose();
  }

  return (
    <section aria-label={PASSWORD_FORM_ROWS.title} className={CARD}>
      {banner ? (
        <div className="mb-5">
          <AlertBanner
            tone="crimson"
            icon={<MaterialIcon name="error" className="shrink-0 text-[18px]" />}
          >
            <span>
              <span className="block font-semibold">{PASSWORD_FORM_ROWS.errorTitle}</span>
              <span className="block">{banner}</span>
            </span>
          </AlertBanner>
        </div>
      ) : null}

      <div className="flex items-center justify-between">
        <h3 className="font-display text-headline-sm font-semibold text-foam">
          {PASSWORD_FORM_ROWS.title}
        </h3>
        <span className="font-mono text-[10px] tracking-wider text-mist/80">
          {SECURITY_PANEL_ROW.metaLabel}
        </span>
      </div>
      <p className="mt-0.5 mb-5 text-body-sm text-mist">{PASSWORD_FORM_ROWS.subtitle}</p>

      <div className="space-y-4">
        <TextField
          id="profile-current-password"
          label={PASSWORD_FORM_ROWS.currentLabel}
          labelClass="mb-1.5"
          type={currentVisibility.visible ? "text" : "password"}
          autoComplete="current-password"
          required
          value={current}
          onChange={(event: ChangeEvent<HTMLInputElement>) => setCurrent(event.target.value)}
          disabled={pending}
          icon={<MaterialIcon name="lock" className="shrink-0 text-[20px] text-teal" />}
          trailing={visibilityTail(currentVisibility)}
          labelAction={
            <Link
              href={PASSWORD_FORM_ROWS.forgotHref}
              className="text-xs font-medium text-ice transition-colors hover:text-ice-bright"
            >
              {PASSWORD_FORM_ROWS.forgotHint}
            </Link>
          }
        />
        <div>
          <TextField
            id="profile-next-password"
            label={PASSWORD_FORM_ROWS.newLabel}
            labelClass="mb-1.5"
            type={nextVisibility.visible ? "text" : "password"}
            autoComplete="new-password"
            required
            value={next}
            onChange={(event: ChangeEvent<HTMLInputElement>) => setNext(event.target.value)}
            disabled={pending}
            error={nextError}
            icon={<MaterialIcon name="lock_open" className="shrink-0 text-[20px] text-teal" />}
            trailing={visibilityTail(nextVisibility)}
          />
          <p className="mt-2 flex items-center justify-between text-[10px] font-semibold uppercase tracking-wider text-mist/70">
            <span>{PASSWORD_FORM_ROWS.meterLabel}</span>
            {next.length > 0 ? (
              <span>
                {strengthLabel} · {metCount} {PASSWORD_STRENGTH_ROWS.metSuffix}
              </span>
            ) : null}
          </p>
          <PasswordStrengthMeter score={metCount} />
          <ul className="mt-2 grid grid-cols-1 gap-1 sm:grid-cols-2">
            {criteria.map((row) => (
              <li key={row.id} className="flex items-center gap-2 text-xs font-medium text-mist">
                {criterionIcon(row.met)}
                {row.label}
              </li>
            ))}
          </ul>
          <p className="mt-2 text-xs text-mist/70">{PASSWORD_FORM_ROWS.newHint}</p>
        </div>
        <div>
          <TextField
            id="profile-confirm-password"
            label={PASSWORD_FORM_ROWS.confirmLabel}
            labelClass="mb-1.5"
            type={confirmVisibility.visible ? "text" : "password"}
            autoComplete="new-password"
            required
            value={confirm}
            onChange={(event: ChangeEvent<HTMLInputElement>) => setConfirm(event.target.value)}
            disabled={pending}
            error={confirmError}
            icon={
              <MaterialIcon
                name={confirmed ? "verified" : "verified_user"}
                className={cn("shrink-0 text-[20px]", confirmed ? "text-mint" : "text-teal")}
              />
            }
            trailing={visibilityTail(confirmVisibility)}
          />
          {confirmed ? (
            <p className="mt-2 flex items-center gap-1.5 text-xs font-medium text-mint">
              <MaterialIcon name="check" className="text-[14px]" />
              {PASSWORD_FORM_ROWS.matchedLabel}
            </p>
          ) : (
            <p className="mt-2 text-xs text-mist/70">{PASSWORD_FORM_ROWS.confirmHint}</p>
          )}
        </div>
      </div>

      <div className="mt-6 flex items-start gap-3 rounded-xl border border-ice/25 bg-ice/[0.05] p-4">
        <MaterialIcon name="info" className="shrink-0 text-[18px] text-ice" />
        <div className="min-w-0">
          <p className="font-display text-sm font-semibold text-foam">
            {PASSWORD_SESSION_POLICY_ROW.title}
          </p>
          <p className="mt-0.5 text-xs text-mist">{PASSWORD_SESSION_POLICY_ROW.copy}</p>
        </div>
      </div>

      <div className="mt-5 flex items-center justify-end gap-2">
        <Button
          variant="teal"
          onClick={() => {
            reset();
            onClose();
          }}
          disabled={pending}
        >
          {PROFILE_SAVE_ACTIONS_ROW.cancel}
        </Button>
        <Button
          variant="primary"
          onClick={() => {
            void submitPassword();
          }}
          disabled={!submittable}
        >
          <MaterialIcon name="arrow_forward" className="text-[16px]" />
          {pending ? PASSWORD_FORM_ROWS.updating : PASSWORD_FORM_ROWS.update}
        </Button>
      </div>
    </section>
  );
}
