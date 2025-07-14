
export class KiwiVMApi {
  private readonly baseUrl = "https://api.64clouds.com/v1";

  constructor(
    private readonly veid: string,
    private readonly apiKey: string,
  ) {}

  private async request<T>(
    endpoint: string,
    params: Record<string, string> = {},
  ): Promise<T> {
    const url = new URL(`${this.baseUrl}/${endpoint}`);
    url.searchParams.set("veid", this.veid);
    url.searchParams.set("api_key", this.apiKey);

    for (const key in params) {
      url.searchParams.set(key, params[key]);
    }

    const response = await fetch(url.toString());

    if (!response.ok) {
      throw new Error(`KiwiVM API request failed: ${response.statusText}`);
    }

    return response.json();
  }

  start() {
    return this.request("start");
  }

  stop() {
    return this.request("stop");
  }

  restart() {
    return this.request("restart");
  }

  kill() {
    return this.request("kill");
  }

  getServiceInfo() {
    return this.request("getServiceInfo");
  }

  getLiveServiceInfo() {
    return this.request("getLiveServiceInfo");
  }

  getAvailableOS() {
    return this.request("getAvailableOS");
  }

  reinstallOS(os: string) {
    return this.request("reinstallOS", { os });
  }

  updateSshKeys(ssh_keys: string) {
    return this.request("updateSshKeys", { ssh_keys });
  }

  getSshKeys() {
    return this.request("getSshKeys");
  }

  resetRootPassword() {
    return this.request("resetRootPassword");
  }

  getRawUsageStats() {
    return this.request("getRawUsageStats");
  }

  getAuditLog() {
    return this.request("getAuditLog");
  }

  setHostname(newHostname: string) {
    return this.request("setHostname", { newHostname });
  }

  setPTR(ip: string, ptr: string) {
    return this.request("setPTR", { ip, ptr });
  }

  mountISO(iso: string) {
    return this.request("iso/mount", { iso });
  }

  unmountISO() {
    return this.request("iso/unmount");
  }

  basicShellCd(currentDir: string, newDir: string) {
    return this.request("basicShell/cd", { currentDir, newDir });
  }

  basicShellExec(command: string) {
    return this.request("basicShell/exec", { command });
  }

  shellScriptExec(script: string) {
    return this.request("shellScript/exec", { script });
  }

  createSnapshot(description?: string) {
    const params: Record<string, string> = {};
    if (description) {
      params.description = description;
    }
    return this.request("snapshot/create", params);
  }

  listSnapshots() {
    return this.request("snapshot/list");
  }

  deleteSnapshot(snapshot: string) {
    return this.request("snapshot/delete", { snapshot });
  }

  restoreSnapshot(snapshot: string) {
    return this.request("snapshot/restore", { snapshot });
  }

  toggleSnapshotSticky(snapshot: string, sticky: "0" | "1") {
    return this.request("snapshot/toggleSticky", { snapshot, sticky });
  }

  exportSnapshot(snapshot: string) {
    return this.request("snapshot/export", { snapshot });
  }

  importSnapshot(sourceVeid: string, sourceToken: string) {
    return this.request("snapshot/import", { sourceVeid, sourceToken });
  }

  listBackups() {
    return this.request("backup/list");
  }

  copyBackupToSnapshot(backupToken: string) {
    return this.request("backup/copyToSnapshot", { backupToken });
  }

  addIPv6() {
    return this.request("ipv6/add");
  }

  deleteIPv6(ip: string) {
    return this.request("ipv6/delete", { ip });
  }

  getMigrationLocations() {
    return this.request("migrate/getLocations");
  }

  startMigration(location: string) {
    return this.request("migrate/start", { location });
  }

  cloneFromExternalServer(
    externalServerIP: string,
    externalServerSSHport: string,
    externalServerRootPassword?: string,
  ) {
    const params: Record<string, string> = {
      externalServerIP,
      externalServerSSHport,
    };
    if (externalServerRootPassword) {
      params.externalServerRootPassword = externalServerRootPassword;
    }
    return this.request("cloneFromExternalServer", params);
  }

  getSuspensionDetails() {
    return this.request("getSuspensionDetails");
  }

  getPolicyViolations() {
    return this.request("getPolicyViolations");
  }

  unsuspend(record_id: string) {
    return this.request("unsuspend", { record_id });
  }

  resolvePolicyViolation(record_id: string) {
    return this.request("resolvePolicyViolation", { record_id });
  }

  getRateLimitStatus() {
    return this.request("getRateLimitStatus");
  }

  getAvailablePrivateIps() {
    return this.request("privateIp/getAvailableIps");
  }

  assignPrivateIp(ip?: string) {
    const params: Record<string, string> = {};
    if (ip) {
      params.ip = ip;
    }
    return this.request("privateIp/assign", params);
  }

  deletePrivateIp(ip: string) {
    return this.request("privateIp/delete", { ip });
  }

  getNotificationPreferences() {
    return this.request("kiwivm/getNotificationPreferences");
  }

  setNotificationPreferences(json_notification_preferences: string) {
    return this.request("kiwivm/setNotificationPreferences", {
      json_notification_preferences,
    });
  }
}
