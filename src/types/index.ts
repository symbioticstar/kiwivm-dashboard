// 用于 KiwiVM Dashboard 的类型定义

export interface Credential {
  id: string;
  veid: string;
  api_key: string;
}

export interface ServerData {
  ve_status: string;
  node_location: string;
  plan_ram: number;
  mem_available_kb: number;
  plan_disk: number;
  ve_used_disk_space_b: number;
  data_counter: number;
  plan_monthly_data: number;
  monthly_data_multiplier: number;
  data_next_reset: number;
  hostname: string;
  node_alias: string;
  node_ip: string;
  node_ip_try: string;
  rdns: string;
  plan_os: string;
  email: string;
  data_next_reset_unix: number;
  suspended: boolean;
  ip_addresses: string[];
  os: string;
}

export interface FetchState {
  loading: boolean;
  refreshing: boolean;
  error: string | null;
}

export interface ActionState {
  loading: boolean;
  error: string | null;
}
