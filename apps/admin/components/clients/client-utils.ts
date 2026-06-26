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
  baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL?.trim() || 'http://localhost:3000'
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
      code: `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Lead Form</title>
    <!-- Client ID: ${clientId} -->
  </head>
  <body>
    <form action="${endpoint}" method="post">
      <input type="hidden" name="apiKey" value="${apiKeyPlaceholder}" />
      <label>
        Name
        <input name="name" type="text" placeholder="Jane Doe" />
      </label>
      <label>
        Email
        <input name="email" type="email" placeholder="jane@example.com" />
      </label>
      <label>
        Phone
        <input name="phone" type="tel" placeholder="+91 98765 43210" />
      </label>
      <button type="submit">Submit</button>
    </form>
  </body>
</html>`
    },
    {
      title: 'JavaScript Fetch',
      language: 'javascript',
      code: `// Client ID: ${clientId}
const endpoint = '${endpoint}';

await fetch(endpoint, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-Api-Key': '${apiKeyPlaceholder}'
  },
  body: JSON.stringify({
    name: 'Jane Doe',
    email: 'lead@example.com',
    phone: '+91 98765 43210'
  })
});`
    },
    {
      title: 'Axios Example',
      language: 'javascript',
      code: `import axios from 'axios';

// Client ID: ${clientId}
await axios.post('${endpoint}', {
  name: 'Jane Doe',
  email: 'lead@example.com',
  phone: '+91 98765 43210'
}, {
  headers: {
    'X-Api-Key': '${apiKeyPlaceholder}'
  }
});`
    },
    {
      title: 'React Example',
      language: 'tsx',
      code: `"use client";

import { useState, type FormEvent } from 'react';

const endpoint = '${endpoint}';

export default function LeadForm() {
  const [status, setStatus] = useState('');
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: ''
  });

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setStatus('Submitting...');

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Api-Key': '${apiKeyPlaceholder}'
        },
        body: JSON.stringify(form)
      });

      if (!response.ok) {
        const message = await response.text();
        throw new Error(message || 'Failed to submit lead');
      }

      setForm({ name: '', email: '', phone: '' });
      setStatus('Lead submitted successfully.');
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Failed to submit lead');
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <label>
        Name
        <input value={form.name} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} />
      </label>
      <label>
        Email
        <input type="email" value={form.email} onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))} />
      </label>
      <label>
        Phone
        <input value={form.phone} onChange={(event) => setForm((current) => ({ ...current, phone: event.target.value }))} />
      </label>
      <button type="submit">Send</button>
      <p aria-live="polite">{status}</p>
    </form>
  );
}`
    },
    {
      title: 'cURL Example',
      language: 'bash',
      code: `# Client ID: ${clientId}
curl -X POST '${endpoint}' \\
  -H 'Content-Type: application/json' \\
  -H 'X-Api-Key: ${apiKeyPlaceholder}' \\
  -d '{"name":"Jane Doe","email":"lead@example.com","phone":"+91 98765 43210"}'`
    },
    {
      title: 'Postman Example',
      language: 'text',
      code: `POST ${endpoint}
Headers:
  Content-Type: application/json
  X-Api-Key: ${apiKeyPlaceholder}
Body:
  { "name": "Jane Doe", "email": "lead@example.com", "phone": "+91 98765 43210" }`
    }
  ];
}
