"use client";

import { ServerCard } from "./server-card";
import type { Credential, ServerData, FetchState, ActionState } from "@/app/page";

interface ServerListProps {
  credentials: Credential[];
  serverData: Record<string, ServerData>;
  fetchStates: Record<string, FetchState>;
  actionStates: Record<string, ActionState>;
  selectedCredentialId: string | null;
  onSelectCredential: (id: string) => void;
  onAction: (id: string, action: "start" | "stop" | "restart") => void;
  onRemove: (id: string) => void;
}

export function ServerList({
  credentials,
  serverData,
  fetchStates,
  actionStates,
  selectedCredentialId,
  onSelectCredential,
  onAction,
  onRemove,
}: ServerListProps) {
  return (
    <div className="w-1/3 space-y-4">
      {credentials.map((cred) => (
        <ServerCard
          key={cred.id}
          credId={cred.id}
          veid={cred.veid}
          data={serverData[cred.id]}
          state={fetchStates[cred.id] || { loading: true, refreshing: false, error: null }}
          actionState={actionStates[cred.id] || { loading: false, error: null }}
          isSelected={selectedCredentialId === cred.id}
          onSelect={() => onSelectCredential(cred.id)}
          onAction={(action) => onAction(cred.id, action)}
          onRemove={() => onRemove(cred.id)}
        />
      ))}
    </div>
  );
}
