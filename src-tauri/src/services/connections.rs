use std::collections::HashSet;

use crate::{
    error::{AppError, AppResult},
    models::{ConnectionProfile, ConnectionTestResult, ConnectionValidationResult},
};

/// Validates and normalizes a connection profile against the current saved profiles.
pub fn validate_profile(
    profile: ConnectionProfile,
    existing_profiles: &[ConnectionProfile],
) -> AppResult<ConnectionValidationResult> {
    let normalized_profile = normalize_profile(profile)?;
    let duplicate_connection_id = find_duplicate_profile_id(&normalized_profile, existing_profiles);
    let warnings = duplicate_connection_id
        .as_ref()
        .map(|duplicate_id| vec![format!("检测到重复连接配置，可复用现有配置：{}。", duplicate_id)])
        .unwrap_or_default();

    Ok(ConnectionValidationResult {
        ok: true,
        normalized_profile,
        warnings,
        duplicate_connection_id,
    })
}

/// Performs a simulated connection test for P0 and returns validation-centric feedback.
pub fn simulate_connection_test(
    profile: ConnectionProfile,
    existing_profiles: &[ConnectionProfile],
) -> AppResult<ConnectionTestResult> {
    let validation = validate_profile(profile, existing_profiles)?;

    Ok(ConnectionTestResult {
        ok: true,
        message: "连接配置校验通过，当前为模拟测试模式。".into(),
        warnings: validation.warnings,
        duplicate_connection_id: validation.duplicate_connection_id,
        normalized_profile: validation.normalized_profile,
    })
}

/// Exports the given connection profiles as a pretty JSON array.
pub fn export_profiles_json(profiles: &[ConnectionProfile]) -> AppResult<String> {
    serde_json::to_string_pretty(profiles)
        .map_err(|error| AppError::new("serialize_connections", error.to_string()))
}

/// Imports connection profiles from JSON and returns normalized profiles with counters.
///
/// The importer accepts either a raw array of profiles or an object shaped as
/// `{ "connections": [...] }`.
pub fn import_profiles_json(
    payload: &str,
    existing_profiles: &[ConnectionProfile],
) -> AppResult<(Vec<ConnectionProfile>, usize, usize)> {
    let parsed_profiles = parse_import_payload(payload)?;
    let mut imported_profiles = Vec::with_capacity(parsed_profiles.len());
    let mut duplicate_count = 0;
    let mut skipped = 0;
    let mut seen_signatures = HashSet::new();

    for profile in parsed_profiles {
        let validation = validate_profile(profile, existing_profiles)?;
        let signature = profile_signature(&validation.normalized_profile);

        if !seen_signatures.insert(signature) {
            skipped += 1;
            continue;
        }

        if validation.duplicate_connection_id.is_some() {
            duplicate_count += 1;
        }

        imported_profiles.push(validation.normalized_profile);
    }

    Ok((imported_profiles, skipped, duplicate_count))
}

fn normalize_profile(mut profile: ConnectionProfile) -> AppResult<ConnectionProfile> {
    profile.id = profile.id.trim().to_string();
    profile.name = profile.name.trim().to_string();
    profile.host = profile.host.trim().to_string();
    profile.username = profile.username.trim().to_string();
    profile.auth_type = normalize_auth_type(&profile.auth_type);
    profile.group = normalize_fallback_field(profile.group, "默认分组");
    profile.note = profile.note.trim().to_string();
    profile.tags = normalize_tags(profile.tags);

    if profile.name.is_empty() {
        return Err(AppError::new("invalid_connection_name", "连接名称不能为空"));
    }

    if profile.host.is_empty() {
        return Err(AppError::new("invalid_connection_host", "主机地址不能为空"));
    }

    if profile.username.is_empty() {
        return Err(AppError::new("invalid_connection_username", "用户名不能为空"));
    }

    if profile.port == 0 {
        return Err(AppError::new("invalid_connection_port", "端口必须在 1 到 65535 之间"));
    }

    Ok(profile)
}

fn normalize_auth_type(value: &str) -> String {
    let normalized = value.trim();

    if normalized.eq_ignore_ascii_case("privatekey") || normalized.eq_ignore_ascii_case("private_key") {
        "privateKey".into()
    } else if normalized.eq_ignore_ascii_case("password") {
        "password".into()
    } else if normalized.is_empty() {
        "password".into()
    } else {
        normalized.to_string()
    }
}

fn normalize_fallback_field(value: String, fallback: &str) -> String {
    let trimmed = value.trim();

    if trimmed.is_empty() {
        fallback.into()
    } else {
        trimmed.to_string()
    }
}

fn normalize_tags(tags: Vec<String>) -> Vec<String> {
    let mut seen = HashSet::new();
    let mut normalized = Vec::new();

    for tag in tags {
        let trimmed = tag.trim();

        if trimmed.is_empty() {
            continue;
        }

        let lowered = trimmed.to_lowercase();
        if seen.insert(lowered) {
            normalized.push(trimmed.to_string());
        }
    }

    normalized
}

fn find_duplicate_profile_id(
    profile: &ConnectionProfile,
    existing_profiles: &[ConnectionProfile],
) -> Option<String> {
    existing_profiles
        .iter()
        .find(|existing| existing.id != profile.id && profile_signature(existing) == profile_signature(profile))
        .map(|existing| existing.id.clone())
}

fn profile_signature(profile: &ConnectionProfile) -> String {
    format!(
        "{}:{}:{}",
        profile.host.trim().to_lowercase(),
        profile.port,
        profile.username.trim().to_lowercase()
    )
}

fn parse_import_payload(payload: &str) -> AppResult<Vec<ConnectionProfile>> {
    #[derive(serde::Deserialize)]
    #[serde(rename_all = "camelCase")]
    struct ConnectionImportEnvelope {
        connections: Vec<ConnectionProfile>,
    }

    serde_json::from_str::<Vec<ConnectionProfile>>(payload)
        .or_else(|_| serde_json::from_str::<ConnectionImportEnvelope>(payload).map(|envelope| envelope.connections))
        .map_err(|error| AppError::new("invalid_connection_import", error.to_string()))
}

#[cfg(test)]
mod tests {
    use super::{
        export_profiles_json, import_profiles_json, normalize_profile, simulate_connection_test, validate_profile,
    };
    use crate::models::ConnectionProfile;

    fn sample_profile() -> ConnectionProfile {
        ConnectionProfile {
            id: "conn-1".into(),
            name: "  应用主机  ".into(),
            host: " Example.COM ".into(),
            port: 22,
            username: " Deploy ".into(),
            auth_type: " private_key ".into(),
            group: "  ".into(),
            tags: vec![" api ".into(), "API".into(), "".into()],
            note: "  note  ".into(),
            last_connected_at: None,
        }
    }

    #[test]
    fn normalize_profile_trims_and_defaults_fields() {
        let normalized = normalize_profile(sample_profile()).expect("profile should normalize");

        assert_eq!(normalized.name, "应用主机");
        assert_eq!(normalized.host, "Example.COM");
        assert_eq!(normalized.username, "Deploy");
        assert_eq!(normalized.auth_type, "privateKey");
        assert_eq!(normalized.group, "默认分组");
        assert_eq!(normalized.note, "note");
        assert_eq!(normalized.tags, vec!["api"]);
    }

    #[test]
    fn normalize_profile_rejects_invalid_fields() {
        let mut invalid = sample_profile();
        invalid.name = " ".into();
        assert_eq!(
            normalize_profile(invalid).expect_err("name should fail").code,
            "invalid_connection_name"
        );

        let mut invalid = sample_profile();
        invalid.host = "".into();
        assert_eq!(
            normalize_profile(invalid).expect_err("host should fail").code,
            "invalid_connection_host"
        );

        let mut invalid = sample_profile();
        invalid.username = "".into();
        assert_eq!(
            normalize_profile(invalid)
                .expect_err("username should fail")
                .code,
            "invalid_connection_username"
        );

        let mut invalid = sample_profile();
        invalid.port = 0;
        assert_eq!(
            normalize_profile(invalid).expect_err("port should fail").code,
            "invalid_connection_port"
        );
    }

    #[test]
    fn validate_profile_reports_duplicates_without_failing() {
        let existing = vec![ConnectionProfile {
            id: "conn-existing".into(),
            name: "旧主机".into(),
            host: "example.com".into(),
            port: 22,
            username: "deploy".into(),
            auth_type: "password".into(),
            group: "默认分组".into(),
            tags: vec![],
            note: "".into(),
            last_connected_at: None,
        }];

        let validation = validate_profile(sample_profile(), &existing).expect("validation should pass");

        assert_eq!(validation.duplicate_connection_id.as_deref(), Some("conn-existing"));
        assert_eq!(validation.warnings.len(), 1);
        assert!(validation.warnings[0].contains("重复连接配置"));
    }

    #[test]
    fn simulate_connection_test_returns_successful_structured_result() {
        let result = simulate_connection_test(sample_profile(), &[]).expect("test should pass");

        assert!(result.ok);
        assert!(result.message.contains("模拟测试"));
    }

    #[test]
    fn import_profiles_accepts_array_payload_and_tracks_replacements() {
        let payload = serde_json::to_string(&vec![sample_profile()]).expect("payload should serialize");
        let existing = vec![ConnectionProfile {
            id: "conn-existing".into(),
            name: "旧主机".into(),
            host: "example.com".into(),
            port: 22,
            username: "deploy".into(),
            auth_type: "password".into(),
            group: "默认分组".into(),
            tags: vec![],
            note: "".into(),
            last_connected_at: None,
        }];

        let (profiles, skipped, duplicate_count) =
            import_profiles_json(&payload, &existing).expect("import should succeed");

        assert_eq!(profiles.len(), 1);
        assert_eq!(skipped, 0);
        assert_eq!(duplicate_count, 1);
    }

    #[test]
    fn import_profiles_accepts_envelope_payload() {
        let payload = serde_json::json!({
            "connections": [sample_profile()]
        })
        .to_string();

        let (profiles, skipped, duplicate_count) =
            import_profiles_json(&payload, &[]).expect("envelope import should succeed");

        assert_eq!(profiles.len(), 1);
        assert_eq!(skipped, 0);
        assert_eq!(duplicate_count, 0);
        assert_eq!(profiles[0].name, "应用主机");
    }

    #[test]
    fn export_profiles_json_round_trips_profiles() {
        let profile = normalize_profile(sample_profile()).expect("normalize");
        let exported = export_profiles_json(&[profile]).expect("export should succeed");

        assert!(exported.contains("应用主机"));
        assert!(exported.contains("\"host\": \"Example.COM\""));
    }
}
