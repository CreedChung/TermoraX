use std::{
    path::{Path, PathBuf},
    sync::Arc,
    time::Duration,
};

use russh::{
    ChannelReadHalf, ChannelWriteHalf,
    Disconnect,
    client,
    keys::{PrivateKey, PrivateKeyWithHashAlg},
};

use crate::{
    error::{AppError, AppResult},
    models::ConnectionProfile,
};

const DEFAULT_CONNECT_TIMEOUT_SECS: u64 = 10;
const DEFAULT_KEEPALIVE_INTERVAL_SECS: u64 = 15;
const DEFAULT_KEEPALIVE_MAX: usize = 3;
const DEFAULT_TERM_TYPE: &str = "xterm-256color";

/// Supported SSH authentication methods at the service boundary.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum SshAuthMethod {
    Password,
    PrivateKey,
}

/// Credentials collected by the host before opening a real SSH connection.
#[derive(Debug, Clone, PartialEq, Eq)]
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
pub struct PreparedSshConnection {
    pub plan: SshConnectPlan,
    pub client_config: Arc<client::Config>,
    pub auth: PreparedSshAuth,
}

/// The credential payload resolved into the form expected by the SSH adapter.
#[derive(Debug)]
pub enum PreparedSshAuth {
    Password {
        password: String,
    },
    PrivateKey {
        private_key: Arc<PrivateKey>,
    },
}

/// An opened interactive shell session ready for runtime IO bridging.
pub struct OpenedSshShell {
    pub connection: client::Handle<TermoraXClientHandler>,
    pub reader: ChannelReadHalf,
    pub writer: ChannelWriteHalf<client::Msg>,
}

/// Minimal russh client handler used by TermoraX.
#[derive(Debug, Default)]
pub struct TermoraXClientHandler;

impl client::Handler for TermoraXClientHandler {
    type Error = russh::Error;

    /// Accepts the host key for now. Trust management is planned separately.
    async fn check_server_key(
        &mut self,
        _server_public_key: &russh::keys::ssh_key::PublicKey,
    ) -> Result<bool, Self::Error> {
        Ok(true)
    }
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
    pub fn build_client_config(&self, plan: &SshConnectPlan) -> Arc<client::Config> {
        let mut config = client::Config::default();
        config.inactivity_timeout = Some(Duration::from_secs(plan.connect_timeout_secs));
        config.keepalive_interval = Some(Duration::from_secs(plan.keepalive_interval_secs));
        config.keepalive_max = plan.keepalive_max;
        Arc::new(config)
    }

    /// Resolves host-provided credentials into the auth form required by russh.
    pub fn prepare_connection(
        &self,
        profile: &ConnectionProfile,
        credentials: SshCredentials,
    ) -> AppResult<PreparedSshConnection> {
        let plan = self.build_connect_plan(profile)?;
        let auth = match (plan.auth_method, credentials) {
            (SshAuthMethod::Password, SshCredentials::Password { password }) => {
                PreparedSshAuth::Password {
                    password: normalize_password(password)?,
                }
            }
            (
                SshAuthMethod::PrivateKey,
                SshCredentials::PrivateKey {
                    private_key_path,
                    passphrase,
                },
            ) => PreparedSshAuth::PrivateKey {
                private_key: Arc::new(load_private_key(&private_key_path, passphrase.as_deref())?),
            },
            (SshAuthMethod::Password, SshCredentials::PrivateKey { .. }) => {
                return Err(AppError::new(
                    "ssh_credentials_mismatch",
                    "当前连接配置需要密码认证",
                ));
            }
            (SshAuthMethod::PrivateKey, SshCredentials::Password { .. }) => {
                return Err(AppError::new(
                    "ssh_credentials_mismatch",
                    "当前连接配置需要私钥认证",
                ));
            }
        };

        Ok(PreparedSshConnection {
            client_config: self.build_client_config(&plan),
            plan,
            auth,
        })
    }

    /// Resolves credentials directly from a persisted connection profile.
    pub fn prepare_connection_from_profile(
        &self,
        profile: &ConnectionProfile,
    ) -> AppResult<PreparedSshConnection> {
        let credentials = match parse_auth_method(&profile.auth_type)? {
            SshAuthMethod::Password => SshCredentials::Password {
                password: profile.password.clone(),
            },
            SshAuthMethod::PrivateKey => SshCredentials::PrivateKey {
                private_key_path: PathBuf::from(profile.private_key_path.clone()),
                passphrase: optional_secret(&profile.private_key_passphrase),
            },
        };

        self.prepare_connection(profile, credentials)
    }

    /// Opens a real PTY-backed interactive shell over SSH.
    pub async fn open_shell_session(
        &self,
        profile: &ConnectionProfile,
        cols: u16,
        rows: u16,
    ) -> AppResult<OpenedSshShell> {
        if cols == 0 || rows == 0 {
            return Err(AppError::new(
                "invalid_terminal_size",
                "终端尺寸必须大于 0",
            ));
        }

        let prepared = self.prepare_connection_from_profile(profile)?;
        let timeout = Duration::from_secs(prepared.plan.connect_timeout_secs);
        let address = format!("{}:{}", prepared.plan.host, prepared.plan.port);

        let mut connection = tokio::time::timeout(
            timeout,
            client::connect(
                prepared.client_config.clone(),
                address.as_str(),
                TermoraXClientHandler,
            ),
        )
        .await
        .map_err(|_| AppError::new("ssh_connect_timeout", "SSH 连接超时"))?
        .map_err(|error| classify_ssh_error("ssh_connect_failed", "SSH 连接失败", error))?;

        self.authenticate(&mut connection, &prepared).await?;

        let channel = tokio::time::timeout(timeout, async {
            let channel = connection.channel_open_session().await?;
            channel
                .request_pty(true, DEFAULT_TERM_TYPE, cols as u32, rows as u32, 0, 0, &[])
                .await?;
            channel.request_shell(true).await?;
            Ok::<_, russh::Error>(channel)
        })
        .await
        .map_err(|_| AppError::new("ssh_open_timeout", "SSH 会话打开超时"))?
        .map_err(|error| classify_ssh_error("ssh_open_failed", "SSH 会话打开失败", error))?;

        let (reader, writer) = channel.split();

        Ok(OpenedSshShell {
            connection,
            reader,
            writer,
        })
    }

    /// Sends raw terminal input bytes to the remote PTY.
    pub async fn send_input(
        &self,
        writer: &ChannelWriteHalf<client::Msg>,
        input: &str,
    ) -> AppResult<()> {
        if input.is_empty() {
            return Ok(());
        }

        writer
            .data(input.as_bytes())
            .await
            .map_err(|error| classify_ssh_error("ssh_write_failed", "发送终端输入失败", error))?;
        Ok(())
    }

    /// Forwards terminal size changes to the remote PTY.
    pub async fn resize_shell(
        &self,
        writer: &ChannelWriteHalf<client::Msg>,
        cols: u16,
        rows: u16,
    ) -> AppResult<()> {
        if cols == 0 || rows == 0 {
            return Err(AppError::new(
                "invalid_terminal_size",
                "终端尺寸必须大于 0",
            ));
        }

        writer
            .window_change(cols as u32, rows as u32, 0, 0)
            .await
            .map_err(|error| classify_ssh_error("ssh_resize_failed", "终端尺寸同步失败", error))?;
        Ok(())
    }

    /// Closes the shell channel and disconnects the SSH transport.
    pub async fn close_shell(
        &self,
        connection: &mut client::Handle<TermoraXClientHandler>,
        writer: &ChannelWriteHalf<client::Msg>,
    ) -> AppResult<()> {
        writer
            .close()
            .await
            .map_err(|error| classify_ssh_error("ssh_close_failed", "关闭 SSH 会话失败", error))?;
        connection
            .disconnect(Disconnect::ByApplication, "Closing TermoraX session", "en-US")
            .await
            .map_err(|error| classify_ssh_error("ssh_disconnect_failed", "断开 SSH 连接失败", error))?;
        Ok(())
    }

    async fn authenticate(
        &self,
        connection: &mut client::Handle<TermoraXClientHandler>,
        prepared: &PreparedSshConnection,
    ) -> AppResult<()> {
        let timeout = Duration::from_secs(prepared.plan.connect_timeout_secs);
        let username = prepared.plan.username.clone();

        let auth_result = match &prepared.auth {
            PreparedSshAuth::Password { password } => tokio::time::timeout(
                timeout,
                connection.authenticate_password(username, password.clone()),
            )
            .await
            .map_err(|_| AppError::new("ssh_auth_timeout", "SSH 认证超时"))?
            .map_err(|error| classify_ssh_error("ssh_auth_failed", "SSH 密码认证失败", error))?,
            PreparedSshAuth::PrivateKey { private_key } => {
                let hash = connection
                    .best_supported_rsa_hash()
                    .await
                    .map_err(|error| classify_ssh_error("ssh_auth_failed", "读取服务器密钥算法失败", error))?
                    .flatten();

                tokio::time::timeout(
                    timeout,
                    connection.authenticate_publickey(
                        username,
                        PrivateKeyWithHashAlg::new(private_key.clone(), hash),
                    ),
                )
                .await
                .map_err(|_| AppError::new("ssh_auth_timeout", "SSH 认证超时"))?
                .map_err(|error| classify_ssh_error("ssh_auth_failed", "SSH 私钥认证失败", error))?
            }
        };

        if auth_result.success() {
            return Ok(());
        }

        Err(AppError::new(
            "ssh_auth_failed",
            "SSH 认证失败，请检查用户名与凭证",
        ))
    }
}

/// Returns the default SSH service used by the current backend runtime.
pub fn default_ssh_service() -> RusshSshService {
    RusshSshService::new()
}

fn optional_secret(value: &str) -> Option<String> {
    let trimmed = value.trim();
    if trimmed.is_empty() {
        None
    } else {
        Some(value.to_string())
    }
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

fn normalize_password(password: String) -> AppResult<String> {
    if password.trim().is_empty() {
        return Err(AppError::new("ssh_password_required", "密码不能为空"));
    }

    Ok(password)
}

fn load_private_key(path: &Path, passphrase: Option<&str>) -> AppResult<PrivateKey> {
    russh::keys::load_secret_key(path, passphrase)
        .map_err(|error| AppError::new("ssh_private_key_load_failed", error.to_string()))
}

fn classify_transport_error_code(message: &str) -> &'static str {
    let lower = message.to_ascii_lowercase();

    if lower.contains("timed out") || lower.contains("timeout") {
        return "ssh_connect_timeout";
    }

    if lower.contains("refused") {
        return "ssh_connection_refused";
    }

    if lower.contains("permission denied")
        || lower.contains("auth")
        || lower.contains("authentication")
    {
        return "ssh_auth_failed";
    }

    if lower.contains("disconnect") || lower.contains("closed") || lower.contains("broken pipe") {
        return "ssh_disconnected";
    }

    "ssh_transport_error"
}

fn classify_ssh_error(default_code: &'static str, fallback_message: &'static str, error: russh::Error) -> AppError {
    let message = error.to_string();
    let code = match classify_transport_error_code(&message) {
        "ssh_transport_error" => default_code,
        classified => classified,
    };

    AppError::new(code, format!("{fallback_message}: {message}"))
}

#[cfg(test)]
mod tests {
    use super::{
        PreparedSshAuth, SshCredentials, classify_transport_error_code, default_ssh_service,
    };
    use crate::models::ConnectionProfile;

    fn profile(auth_type: &str) -> ConnectionProfile {
        ConnectionProfile {
            id: "conn-ssh".into(),
            name: "测试 SSH".into(),
            host: "ssh.example.internal".into(),
            port: 22,
            username: "deploy".into(),
            auth_type: auth_type.into(),
            password: String::new(),
            private_key_path: String::new(),
            private_key_passphrase: String::new(),
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
    fn prepare_connection_requires_matching_password_credentials() {
        let service = default_ssh_service();
        let error = service
            .prepare_connection(
                &profile("password"),
                SshCredentials::PrivateKey {
                    private_key_path: std::path::PathBuf::from("id_ed25519"),
                    passphrase: None,
                },
            )
            .expect_err("mismatched auth should fail");

        assert_eq!(error.code, "ssh_credentials_mismatch");
    }

    #[test]
    fn prepare_connection_normalizes_password_auth() {
        let service = default_ssh_service();
        let prepared = service
            .prepare_connection(
                &profile("password"),
                SshCredentials::Password {
                    password: "secret".into(),
                },
            )
            .expect("password auth should prepare");

        match prepared.auth {
            PreparedSshAuth::Password { password } => assert_eq!(password, "secret"),
            PreparedSshAuth::PrivateKey { .. } => panic!("expected password auth"),
        }
    }

    #[test]
    fn prepare_connection_rejects_missing_private_key() {
        let service = default_ssh_service();
        let error = service
            .prepare_connection(
                &profile("privateKey"),
                SshCredentials::PrivateKey {
                    private_key_path: std::path::PathBuf::from("/tmp/termorax-missing-key"),
                    passphrase: None,
                },
            )
            .expect_err("missing key should fail");

        assert_eq!(error.code, "ssh_private_key_load_failed");
    }

    #[test]
    fn classify_transport_error_maps_common_cases() {
        assert_eq!(classify_transport_error_code("connection timed out"), "ssh_connect_timeout");
        assert_eq!(classify_transport_error_code("connection refused"), "ssh_connection_refused");
        assert_eq!(classify_transport_error_code("permission denied"), "ssh_auth_failed");
        assert_eq!(classify_transport_error_code("broken pipe"), "ssh_disconnected");
        assert_eq!(classify_transport_error_code("unexpected packet"), "ssh_transport_error");
    }
}
