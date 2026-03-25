use std::{
    path::{Path, PathBuf},
    sync::Arc,
    time::Duration,
};

use russh::{client, keys::PrivateKey};

use crate::{
    error::{AppError, AppResult},
    models::ConnectionProfile,
};

const DEFAULT_CONNECT_TIMEOUT_SECS: u64 = 10;
const DEFAULT_KEEPALIVE_INTERVAL_SECS: u64 = 15;
const DEFAULT_KEEPALIVE_MAX: usize = 3;

/// Supported SSH authentication methods at the service boundary.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum SshAuthMethod {
    Password,
    PrivateKey,
}

/// Credentials collected by the host before opening a real SSH connection.
#[derive(Debug, Clone, PartialEq, Eq)]
#[allow(dead_code)]
pub enum SshCredentials {
    Password {
        password: String,
    },
    PrivateKey {
        private_key_path: PathBuf,
        passphrase: Option<String>,
    },
}

/// A normalized connection plan that the real SSH transport can consume.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct SshConnectPlan {
    pub library: &'static str,
    pub host: String,
    pub port: u16,
    pub username: String,
    pub auth_method: SshAuthMethod,
    pub connect_timeout_secs: u64,
    pub keepalive_interval_secs: u64,
    pub keepalive_max: usize,
}

/// A backend-owned connection configuration assembled for the chosen SSH adapter.
#[derive(Debug)]
#[allow(dead_code)]
pub struct PreparedSshConnection {
    pub plan: SshConnectPlan,
    pub client_config: Arc<client::Config>,
    pub auth: PreparedSshAuth,
}

/// The credential payload resolved into the form expected by the SSH adapter.
#[derive(Debug)]
#[allow(dead_code)]
pub enum PreparedSshAuth {
    Password {
        password: String,
    },
    PrivateKey {
        private_key: Arc<PrivateKey>,
    },
}

/// Builds normalized SSH connection plans and adapter-specific runtime config.
pub struct RusshSshService;

impl RusshSshService {
    /// Creates the default russh-backed SSH service.
    pub fn new() -> Self {
        Self
    }

    /// Returns the adapter label surfaced in diagnostics and tests.
    pub fn library_name(&self) -> &'static str {
        "russh"
    }

    /// Normalizes a connection profile into a real SSH transport plan.
    pub fn build_connect_plan(&self, profile: &ConnectionProfile) -> AppResult<SshConnectPlan> {
        Ok(SshConnectPlan {
            library: self.library_name(),
            host: profile.host.trim().to_string(),
            port: profile.port,
            username: profile.username.trim().to_string(),
            auth_method: parse_auth_method(&profile.auth_type)?,
            connect_timeout_secs: DEFAULT_CONNECT_TIMEOUT_SECS,
            keepalive_interval_secs: DEFAULT_KEEPALIVE_INTERVAL_SECS,
            keepalive_max: DEFAULT_KEEPALIVE_MAX,
        })
    }

    /// Builds the russh client configuration shared by upcoming real SSH sessions.
    #[allow(dead_code)]
    pub fn build_client_config(&self, plan: &SshConnectPlan) -> Arc<client::Config> {
        let mut config = client::Config::default();
        config.inactivity_timeout = Some(Duration::from_secs(plan.connect_timeout_secs));
        config.keepalive_interval = Some(Duration::from_secs(plan.keepalive_interval_secs));
        config.keepalive_max = plan.keepalive_max;
        Arc::new(config)
    }

    /// Resolves host-provided credentials into the auth form required by russh.
    #[allow(dead_code)]
    pub fn prepare_connection(
        &self,
        profile: &ConnectionProfile,
        credentials: SshCredentials,
    ) -> AppResult<PreparedSshConnection> {
        let plan = self.build_connect_plan(profile)?;
        let auth = match (plan.auth_method, credentials) {
            (SshAuthMethod::Password, SshCredentials::Password { password }) => PreparedSshAuth::Password {
                password: normalize_password(password)?,
            },
            (SshAuthMethod::PrivateKey, SshCredentials::PrivateKey {
                private_key_path,
                passphrase,
            }) => PreparedSshAuth::PrivateKey {
                private_key: Arc::new(load_private_key(&private_key_path, passphrase.as_deref())?),
            },
            (SshAuthMethod::Password, SshCredentials::PrivateKey { .. }) => {
                return Err(AppError::new(
                    "ssh_credentials_mismatch",
                    "当前连接配置需要密码认证",
                ))
            }
            (SshAuthMethod::PrivateKey, SshCredentials::Password { .. }) => {
                return Err(AppError::new(
                    "ssh_credentials_mismatch",
                    "当前连接配置需要私钥认证",
                ))
            }
        };

        Ok(PreparedSshConnection {
            client_config: self.build_client_config(&plan),
            plan,
            auth,
        })
    }
}

/// Returns the default SSH service used by the current backend runtime.
pub fn default_ssh_service() -> RusshSshService {
    RusshSshService::new()
}

fn parse_auth_method(value: &str) -> AppResult<SshAuthMethod> {
    let normalized = value.trim();

    if normalized.eq_ignore_ascii_case("password") {
        return Ok(SshAuthMethod::Password);
    }

    if normalized.eq_ignore_ascii_case("privatekey") || normalized.eq_ignore_ascii_case("private_key") {
        return Ok(SshAuthMethod::PrivateKey);
    }

    Err(AppError::new(
        "unsupported_auth_type",
        format!("暂不支持的认证方式：{}", value),
    ))
}

#[allow(dead_code)]
fn normalize_password(password: String) -> AppResult<String> {
    if password.trim().is_empty() {
        return Err(AppError::new("ssh_password_required", "密码不能为空"));
    }

    Ok(password)
}

#[allow(dead_code)]
fn load_private_key(path: &Path, passphrase: Option<&str>) -> AppResult<PrivateKey> {
    russh::keys::load_secret_key(path, passphrase)
        .map_err(|error| AppError::new("ssh_private_key_load_failed", error.to_string()))
}

#[cfg(test)]
mod tests {
    use std::{env, fs, time::Duration};

    use super::{default_ssh_service, PreparedSshAuth, SshCredentials};
    use crate::models::ConnectionProfile;

    fn profile(auth_type: &str) -> ConnectionProfile {
        ConnectionProfile {
            id: "conn-ssh".into(),
            name: "测试 SSH".into(),
            host: "ssh.example.internal".into(),
            port: 22,
            username: "deploy".into(),
            auth_type: auth_type.into(),
            group: "默认分组".into(),
            tags: vec![],
            note: String::new(),
            last_connected_at: None,
        }
    }

    #[test]
    fn build_connect_plan_supports_password_and_private_key() {
        let service = default_ssh_service();
        let password_plan = service
            .build_connect_plan(&profile("password"))
            .expect("password auth should be supported");
        let private_key_plan = service
            .build_connect_plan(&profile("private_key"))
            .expect("private key auth should be supported");

        assert_eq!(password_plan.library, "russh");
        assert_eq!(password_plan.username, "deploy");
        assert_eq!(private_key_plan.library, "russh");
        assert_eq!(private_key_plan.keepalive_interval_secs, 15);
    }

    #[test]
    fn build_connect_plan_rejects_unknown_auth_type() {
        let error = default_ssh_service()
            .build_connect_plan(&profile("keyboard-interactive"))
            .expect_err("unknown auth type should fail");

        assert_eq!(error.code, "unsupported_auth_type");
    }

    #[test]
    fn prepare_connection_builds_russh_config_for_password_auth() {
        let prepared = default_ssh_service()
            .prepare_connection(
                &profile("password"),
                SshCredentials::Password {
                    password: "secret".into(),
                },
            )
            .expect("password auth should prepare");

        assert_eq!(prepared.plan.library, "russh");
        assert_eq!(prepared.client_config.keepalive_max, 3);
        assert_eq!(
            prepared.client_config.inactivity_timeout,
            Some(Duration::from_secs(10))
        );

        match prepared.auth {
            PreparedSshAuth::Password { password } => assert_eq!(password, "secret"),
            PreparedSshAuth::PrivateKey { .. } => panic!("expected password auth"),
        }
    }

    #[test]
    fn prepare_connection_rejects_mismatched_credentials() {
        let error = default_ssh_service()
            .prepare_connection(
                &profile("privateKey"),
                SshCredentials::Password {
                    password: "secret".into(),
                },
            )
            .expect_err("mismatched credentials should fail");

        assert_eq!(error.code, "ssh_credentials_mismatch");
    }

    #[test]
    fn prepare_connection_reports_private_key_load_errors() {
        let temp_path = env::temp_dir().join(format!("termorax-missing-key-{}", std::process::id()));
        let _ = fs::remove_file(&temp_path);

        let error = default_ssh_service()
            .prepare_connection(
                &profile("privateKey"),
                SshCredentials::PrivateKey {
                    private_key_path: temp_path,
                    passphrase: None,
                },
            )
            .expect_err("missing key should fail");

        assert_eq!(error.code, "ssh_private_key_load_failed");
    }
}
