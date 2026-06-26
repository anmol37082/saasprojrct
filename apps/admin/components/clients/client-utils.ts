import type { Client, ClientApiKey, ClientStatistics, ClientSnippet } from '@/types/client';

export function getClientKey(client: Client) {
  return client._id ?? client.id ?? client.clientId ?? '';
}

export function formatDate(value?: string | null) {
  if (!value) return 'N/A';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'N/A';
  return date.toLocaleString();
}

export function formatShortDate(value?: string | null) {
  if (!value) return 'N/A';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'N/A';
  return date.toLocaleDateString();
}

export function getLatestApiKey(client: Client): ClientApiKey | null {
  const keys = client.apiKeys ?? [];
  if (!keys.length) return null;
  return [...keys].sort((a, b) => {
    const left = a.createdAt ? new Date(a.createdAt).getTime() : 0;
    const right = b.createdAt ? new Date(b.createdAt).getTime() : 0;
    return right - left;
  })[0] ?? null;
}

export function getLatestApiUsage(client: Client) {
  const keys = client.apiKeys ?? [];
  const entries = keys.filter((key) => key.lastUsedAt);
  if (!entries.length) return null;
  return [...entries].sort((a, b) => {
    const left = a.lastUsedAt ? new Date(a.lastUsedAt).getTime() : 0;
    const right = b.lastUsedAt ? new Date(b.lastUsedAt).getTime() : 0;
    return right - left;
  })[0]?.lastUsedAt ?? null;
}

export function getClientStatistics(client: Client): ClientStatistics {
  return client.statistics ?? {
    apiKeyCount: client.apiKeys?.length ?? 0,
    activeApiKeyCount: (client.apiKeys ?? []).filter((key) => key.status === 'active').length,
    allowedDomainCount: client.allowedDomains?.length ?? 0,
    lastApiUsage: getLatestApiUsage(client),
    latestApiKeyEnvironment: getLatestApiKey(client)?.environment ?? null,
    latestApiKeyStatus: getLatestApiKey(client)?.status ?? null
  };
}

export function buildIntegrationSnippets({
  clientId,
  apiKeyPlaceholder = '{{API_KEY}}',
  baseUrl = 'https://api.example.com'
}: {
  clientId: string;
  apiKeyPlaceholder?: string;
  baseUrl?: string;
}): ClientSnippet[] {
  const endpoint = `${baseUrl.replace(/\/$/, '')}/api/leads`;

  return [
    {
      title: 'HTML Form',
      language: 'html',
      code: `<form action="${endpoint}" method="post">\n  <input type="hidden" name="clientId" value="${clientId}" />\n  <input type="hidden" name="apiKey" value="${apiKeyPlaceholder}" />\n  <input name="email" type="email" placeholder="name@example.com" />\n  <button type="submit">Submit</button>\n</form>`
    },
    {
      title: 'JavaScript Fetch',
      language: 'javascript',
      code: `await fetch('${endpoint}', {\n  method: 'POST',\n  headers: {\n    'Content-Type': 'application/json',\n    'X-Api-Key': '${apiKeyPlaceholder}'\n  },\n  body: JSON.stringify({\n    clientId: '${clientId}',\n    email: 'lead@example.com'\n  })\n});`
    },
    {
      title: 'Axios Example',
      language: 'javascript',
      code: `import axios from 'axios';\n\nawait axios.post('${endpoint}', {\n  clientId: '${clientId}',\n  email: 'lead@example.com'\n}, {\n  headers: {\n    'X-Api-Key': '${apiKeyPlaceholder}'\n  }\n});`
    },
    {
      title: 'React Example',
      language: 'tsx',
      code: `function LeadForm() {\n  return (\n    <form onSubmit={async (event) => {\n      event.preventDefault();\n      await fetch('${endpoint}', {\n        method: 'POST',\n        headers: {\n          'Content-Type': 'application/json',\n          'X-Api-Key': '${apiKeyPlaceholder}'\n        },\n        body: JSON.stringify({ clientId: '${clientId}' })\n      });\n    }}>\n      <button type="submit">Send</button>\n    </form>\n  );\n}`
    },
    {
      title: 'cURL Example',
      language: 'bash',
      code: `curl -X POST '${endpoint}' \\\n  -H 'Content-Type: application/json' \\\n  -H 'X-Api-Key: ${apiKeyPlaceholder}' \\\n  -d '{"clientId":"${clientId}","email":"lead@example.com"}'`
    },
    {
      title: 'Postman Example',
      language: 'text',
      code: `POST ${endpoint}\nHeaders:\n  Content-Type: application/json\n  X-Api-Key: ${apiKeyPlaceholder}\nBody:\n  { "clientId": "${clientId}", "email": "lead@example.com" }`
    }
  ];
}
