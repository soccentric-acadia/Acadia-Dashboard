// Thin GraphQL client wrapping graphql-request.
// All queries go through this module; no fetch() calls outside this file.

import { GraphQLClient, gql } from "graphql-request";
import type {
    Client,
    Run,
    RunState,
    ConfigureRunInput,
    ConfigureRunResult,
    ModuleSetting,
} from "./types";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://127.0.0.1:8080";

export const gqlClient = new GraphQLClient(`${API_BASE}/graphql`, {
    headers: () => {
        const key = typeof window !== "undefined" ? localStorage.getItem("acadia_api_key") : null;
        return key ? ({ "X-API-Key": key } as Record<string, string>) : ({} as Record<string, string>);
    },
});

// ── Queries ──────────────────────────────────────────────────────────────────

export const CLIENTS_QUERY = gql`
  query GetClients {
    clients {
      clientId hostname halVersion clientVersion firstSeen lastSeen isConnected
    }
  }
`;

export const CLIENT_QUERY = gql`
  query GetClient($clientId: ID!) {
    client(clientId: $clientId) {
      clientId hostname halVersion clientVersion firstSeen lastSeen isConnected
      runs(limit: 10) {
        edges { node { runId moduleId mode state createdAt endedAt batchCount sampleCount } cursor }
        pageInfo { hasNextPage endCursor }
      }
    }
  }
`;

export const RUNS_QUERY = gql`
  query GetRuns($clientId: ID, $moduleId: String, $state: RunState, $limit: Int, $after: String) {
    runs(clientId: $clientId, moduleId: $moduleId, state: $state, limit: $limit, after: $after) {
      edges {
        node {
          runId moduleId mode state createdAt startedAt endedAt batchCount sampleCount passFail
          client { clientId hostname }
        }
        cursor
      }
      pageInfo { hasNextPage endCursor }
    }
  }
`;

export const RUN_QUERY = gql`
  query GetRun($runId: ID!) {
    run(runId: $runId) {
      runId moduleId mode state config createdAt startedAt endedAt lastBatchAt
      passFail errorMessage batchCount sampleCount
      client { clientId hostname }
      resultBatches(limit: 100) {
        edges {
          node { runId batchSeq receivedAt tsFirst tsLast sampleCount primaryValue passFail tags payload }
          cursor
        }
        pageInfo { hasNextPage endCursor }
      }
    }
  }
`;

export const RUN_BATCHES_QUERY = gql`
  query GetRunBatches($runId: ID!, $limit: Int, $after: String) {
    run(runId: $runId) {
      resultBatches(limit: $limit, after: $after) {
        edges {
          node { runId batchSeq receivedAt tsFirst tsLast sampleCount primaryValue passFail tags payload }
          cursor
        }
        pageInfo { hasNextPage endCursor }
      }
    }
  }
`;

export const LOGS_QUERY = gql`
  query GetLogs($runId: ID, $source: String, $limit: Int, $after: String) {
    run(runId: $runId) {
      logs(source: $source, limit: $limit, after: $after) {
        edges {
          node { runId source seq timestamp level text }
          cursor
        }
        pageInfo { hasNextPage endCursor }
      }
    }
  }
`;

export const SEARCH_LOGS_QUERY = gql`
  query SearchLogs($query: String!, $runId: ID, $limit: Int) {
    search(query: $query, runId: $runId, limit: $limit) {
      runId source seq timestamp level text
    }
  }
`;

// ── Mutations ─────────────────────────────────────────────────────────────────

export const CONFIGURE_RUN_MUTATION = gql`
  mutation ConfigureRun($input: ConfigureRunInput!) {
    configureRun(input: $input) { runId state }
  }
`;

export const START_RUN_MUTATION = gql`
  mutation StartRun($runId: ID!) {
    startRun(runId: $runId) { runId state }
  }
`;

export const STOP_RUN_MUTATION = gql`
  mutation StopRun($runId: ID!) {
    stopRun(runId: $runId) { runId state }
  }
`;

export const PAUSE_RUN_MUTATION = gql`
  mutation PauseRun($runId: ID!) {
    pauseRun(runId: $runId) { runId state }
  }
`;

export const RESUME_RUN_MUTATION = gql`
  mutation ResumeRun($runId: ID!) {
    resumeRun(runId: $runId) { runId state }
  }
`;

export const RESTART_RUN_MUTATION = gql`
  mutation RestartRun($runId: ID!) {
    restartRun(runId: $runId) { runId state }
  }
`;

export const ENABLE_MODULE_MUTATION = gql`
  mutation EnableModule($clientId: ID!, $moduleId: String!, $enabled: Boolean!) {
    enableModule(clientId: $clientId, moduleId: $moduleId, enabled: $enabled) {
      clientId moduleId enabled
    }
  }
`;

// ── Typed fetch helpers ────────────────────────────────────────────────────────

export async function fetchClients(): Promise<Client[]> {
    const data = await gqlClient.request<{ clients: Client[] }>(CLIENTS_QUERY);
    return data.clients;
}

export async function fetchClient(clientId: string): Promise<Client> {
    const data = await gqlClient.request<{ client: Client }>(CLIENT_QUERY, { clientId });
    return data.client;
}

export async function fetchRuns(vars: {
    clientId?: string;
    moduleId?: string;
    state?: RunState;
    limit?: number;
    after?: string;
}): Promise<{ edges: Array<{ node: Run; cursor: string }>; pageInfo: { hasNextPage: boolean; endCursor: string | null } }> {
    const data = await gqlClient.request<{ runs: { edges: Array<{ node: Run; cursor: string }>; pageInfo: { hasNextPage: boolean; endCursor: string | null } } }>(
        RUNS_QUERY,
        vars
    );
    return data.runs;
}

export async function fetchRun(runId: string): Promise<Run> {
    const data = await gqlClient.request<{ run: Run }>(RUN_QUERY, { runId });
    return data.run;
}

export async function configureRun(input: ConfigureRunInput): Promise<ConfigureRunResult> {
    const data = await gqlClient.request<{ configureRun: ConfigureRunResult }>(
        CONFIGURE_RUN_MUTATION,
        { input }
    );
    return data.configureRun;
}

export async function startRun(runId: string): Promise<{ runId: string; state: RunState }> {
    const data = await gqlClient.request<{ startRun: { runId: string; state: RunState } }>(
        START_RUN_MUTATION,
        { runId }
    );
    return data.startRun;
}

export async function stopRun(runId: string): Promise<{ runId: string; state: RunState }> {
    const data = await gqlClient.request<{ stopRun: { runId: string; state: RunState } }>(
        STOP_RUN_MUTATION,
        { runId }
    );
    return data.stopRun;
}

export async function enableModule(
    clientId: string,
    moduleId: string,
    enabled: boolean
): Promise<ModuleSetting> {
    const data = await gqlClient.request<{ enableModule: ModuleSetting }>(
        ENABLE_MODULE_MUTATION,
        { clientId, moduleId, enabled }
    );
    return data.enableModule;
}
