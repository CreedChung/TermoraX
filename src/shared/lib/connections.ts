import type {
  ConnectionDuplicateWarning,
  ConnectionProfile,
  ConnectionValidationErrors,
} from "../../entities/domain";
import { t } from "../i18n";

export interface DraftConnectionInput {
  id?: string;
  name?: string;
  host?: string;
  port?: number;
  username?: string;
  authType?: ConnectionProfile["authType"];
  group?: string;
  tags?: string[];
  note?: string;
  lastConnectedAt?: string | null;
  password?: string;
  privateKeyPath?: string;
  privateKeyPassphrase?: string;
}

/**
 * Normalizes form input before it crosses the frontend/backend boundary so
 * validation and duplicate detection use stable values.
 */
export function normalizeConnectionInput(input: DraftConnectionInput): ConnectionProfile {
  return {
    id: input.id ?? "",
    name: input.name?.trim() ?? "",
    host: input.host?.trim() ?? "",
    port: input.port ?? 22,
    username: input.username?.trim() ?? "",
    authType: input.authType ?? "password",
    group: input.group?.trim() || "默认分组",
    tags: (input.tags ?? []).map((item) => item.trim()).filter(Boolean),
    note: input.note?.trim() ?? "",
    lastConnectedAt: input.lastConnectedAt ?? null,
    password: input.password?.trim() ?? "",
    privateKeyPath: input.privateKeyPath?.trim() ?? "",
    privateKeyPassphrase: input.privateKeyPassphrase?.trim() ?? "",
  };
}

export function validateConnectionProfile(profile: ConnectionProfile): ConnectionValidationErrors {
  const errors: ConnectionValidationErrors = {};

  if (!profile.name) {
    errors.name = t("connections.validation.nameRequired");
  }

  if (!profile.host) {
    errors.host = t("connections.validation.hostRequired");
  }

  if (!profile.username) {
    errors.username = t("connections.validation.usernameRequired");
  }

  if (!Number.isInteger(profile.port) || profile.port < 1 || profile.port > 65535) {
    errors.port = t("connections.validation.portInvalid");
  }

  if (profile.authType === "password" && !profile.password?.trim()) {
    errors.password = t("connections.validation.passwordRequired");
  }

  if (profile.authType === "privateKey" && !profile.privateKeyPath?.trim()) {
    errors.privateKeyPath = t("connections.validation.privateKeyRequired");
  }

  return errors;
}

export function findConnectionDuplicate(
  connections: ConnectionProfile[],
  profile: ConnectionProfile,
): ConnectionDuplicateWarning | null {
  const duplicate = connections.find(
    (item) =>
      item.id !== profile.id &&
      item.host.trim().toLowerCase() === profile.host.trim().toLowerCase() &&
      item.port === profile.port &&
      item.username.trim().toLowerCase() === profile.username.trim().toLowerCase(),
  );

  if (!duplicate) {
    return null;
  }

  return {
    duplicateConnectionId: duplicate.id,
    duplicateName: duplicate.name,
    message: t("connections.duplicateWarning", { name: duplicate.name }),
  };
}

export function hasValidationErrors(errors: ConnectionValidationErrors): boolean {
  return Object.values(errors).some(Boolean);
}
