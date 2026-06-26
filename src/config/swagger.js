export function buildSwaggerSpec({ basePath = '/api' } = {}) {
  const definition = {
    openapi: '3.1.0',
    info: {
      title: 'Multi-tenant Lead SaaS API',
      version: '1.0.0',
      description: 'API documentation for Auth, Clients, Lead Ingestion, Lead Management, and Exports.'
    },
    servers: [{ url: basePath }],
    tags: [
      { name: 'Auth', description: 'Authentication and session management' },
      { name: 'Clients', description: 'Client admin operations and domain management' },
      { name: 'Leads', description: 'Lead ingestion (public/API-key) and tenant context' },
      { name: 'Lead Management', description: 'Tenant-scoped lead management' },
      { name: 'Exports', description: 'Export lead data' },
      { name: 'Audit Logs', description: 'Admin activity logs' },
      { name: 'Dashboard', description: 'Summary metrics for the admin console' }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT'
        },
        apiKeyAuth: {
          type: 'apiKey',
          in: 'header',
          name: 'X-Api-Key',
          description: 'API Key authentication. Send your API key in the X-Api-Key header.'
        }
      },
      schemas: {
        ErrorResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            message: { type: 'string' },
            code: { type: 'string' },
            requestId: { type: 'string' }
          },
          required: ['success', 'message', 'code']
        },
        SuccessResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            message: { type: 'string' },
            data: { type: 'object' },
            requestId: { type: 'string' }
          }
        },
        LoginRequest: {
          type: 'object',
          required: ['email', 'password'],
          properties: {
            email: { type: 'string' },
            password: { type: 'string' }
          }
        },
        LoginResponseData: {
          type: 'object',
          description: 'Implementation-defined authService response (tokens/admin info)',
          additionalProperties: true
        },
        LeadIngestionRequest: {
          type: 'object',
          description: 'Payload validated by leadValidator. Fields depend on leadValidator schema.',
          additionalProperties: true
        },
        LeadIngestionResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            leadId: { type: ['string', 'null'] },
            requestId: { type: 'string' }
          },
          required: ['success', 'leadId', 'requestId']
        }
      }
    },
    paths: {}
  };

  // Hand-write paths as JSDoc-free spec to avoid dependency on file scanning.
  // We keep them aligned with current routes.

  definition.paths = {
    '/auth/login': {
      post: {
        tags: ['Auth'],
        operationId: 'login',
        summary: 'Login (admin)',
        security: [],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/LoginRequest' },
              example: { email: 'admin@example.com', password: 'P@ssw0rd' }
            }
          }
        },
        responses: {
          '200': {
            description: 'Logged in',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/SuccessResponse' },
                examples: {
                  ok: {
                    value: {
                      success: true,
                      message: 'Logged in',
                      data: { accessToken: '...', refreshToken: '...', adminId: '...' },
                      requestId: 'req_123'
                    }
                  }
                }
              }
            }
          },
          '400': { description: 'Bad Request', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
          '401': { description: 'Unauthorized', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } }
        }
      }
    },

    '/auth/refresh': {
      post: {
        tags: ['Auth'],
        operationId: 'refreshToken',
        summary: 'Refresh token',
        security: [],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['refreshToken'],
                properties: { refreshToken: { type: 'string' } }
              },
              example: { refreshToken: '...' }
            }
          }
        },
        responses: {
          '200': { description: 'Token refreshed' },
          '400': { description: 'Bad Request' },
          '401': { description: 'Unauthorized' }
        }
      }
    },

    '/auth/logout': {
      post: {
        tags: ['Auth'],
        operationId: 'logout',
        summary: 'Logout',
        security: [],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['refreshToken'],
                properties: { refreshToken: { type: 'string' } }
              },
              example: { refreshToken: '...' }
            }
          }
        },
        responses: {
          '200': { description: 'Logged out' },
          '400': { description: 'Bad Request' }
        }
      }
    },

    '/auth/me': {
      get: {
        tags: ['Auth'],
        operationId: 'me',
        summary: 'Get current admin profile',
        security: [{ bearerAuth: [] }],
        responses: {
          '200': { description: 'Current user' },
          '401': { description: 'Unauthorized' }
        }
      }
    },

    '/dashboard/summary': {
      get: {
        tags: ['Dashboard'],
        operationId: 'getDashboardSummary',
        summary: 'Get dashboard summary metrics',
        security: [{ bearerAuth: [] }],
        responses: {
          '200': { description: 'Dashboard summary retrieved' },
          '401': { description: 'Unauthorized' }
        }
      }
    },

    '/audit-logs': {
      get: {
        tags: ['Audit Logs'],
        operationId: 'listAuditLogs',
        summary: 'List audit logs',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'page', in: 'query', required: false, schema: { type: 'string' } },
          { name: 'limit', in: 'query', required: false, schema: { type: 'string' } },
          { name: 'search', in: 'query', required: false, schema: { type: 'string' } },
          { name: 'action', in: 'query', required: false, schema: { type: 'string' } },
          { name: 'resource', in: 'query', required: false, schema: { type: 'string' } },
          { name: 'severity', in: 'query', required: false, schema: { type: 'string', enum: ['info', 'warning', 'critical'] } }
        ],
        responses: { '200': { description: 'Audit logs retrieved' }, '401': { description: 'Unauthorized' } }
      }
    },

    '/clients/': {
      post: {
        tags: ['Clients'],
        operationId: 'createClient',
        summary: 'Create a client (admin)',
        security: [{ bearerAuth: [] }],
        responses: { '201': { description: 'Client created' }, '401': { description: 'Unauthorized' }, '403': { description: 'Forbidden' } }
      },
      get: {
        tags: ['Clients'],
        operationId: 'listClients',
        summary: 'List clients (admin)',
        security: [{ bearerAuth: [] }],
        responses: { '200': { description: 'Clients list retrieved' } }
      }
    },

    '/clients/{clientId}': {
      patch: {
        tags: ['Clients'],
        operationId: 'updateClient',
        summary: 'Update a client (admin)',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'clientId', in: 'path', required: true, schema: { type: 'string' } }
        ],
        responses: { '200': { description: 'Client updated' }, '401': { description: 'Unauthorized' }, '403': { description: 'Forbidden' } }
      },
      delete: {
        tags: ['Clients'],
        operationId: 'deleteClient',
        summary: 'Delete a client (admin)',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'clientId', in: 'path', required: true, schema: { type: 'string' } }
        ],
        responses: { '200': { description: 'Client deleted' } }
      },
      get: {
        tags: ['Clients'],
        operationId: 'getClientById',
        summary: 'Get client by id (admin)',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'clientId', in: 'path', required: true, schema: { type: 'string' } }
        ],
        responses: { '200': { description: 'Client retrieved' } }
      }
    },

    '/clients/{clientId}/activate': {
      post: {
        tags: ['Clients'],
        operationId: 'activateClient',
        summary: 'Activate a client (admin)',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'clientId', in: 'path', required: true, schema: { type: 'string' } }
        ],
        responses: { '200': { description: 'Client activated' } }
      }
    },

    '/clients/{clientId}/deactivate': {
      post: {
        tags: ['Clients'],
        operationId: 'deactivateClient',
        summary: 'Deactivate a client (admin)',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'clientId', in: 'path', required: true, schema: { type: 'string' } }
        ],
        responses: { '200': { description: 'Client deactivated' } }
      }
    },

    '/clients/{clientId}/rotate-api-key': {
      post: {
        tags: ['Clients'],
        operationId: 'rotateApiKey',
        summary: 'Rotate API key (admin)',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'clientId', in: 'path', required: true, schema: { type: 'string' } }
        ],
        responses: { '200': { description: 'API key rotated' } }
      }
    },

    '/clients/{clientId}/domains': {
      post: {
        tags: ['Clients'],
        operationId: 'addDomain',
        summary: 'Add allowed domain to client (admin)',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'clientId', in: 'path', required: true, schema: { type: 'string' } }
        ],
        responses: { '200': { description: 'Domain added' } }
      },
      delete: {
        tags: ['Clients'],
        operationId: 'removeDomain',
        summary: 'Remove allowed domain from client (admin)',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'clientId', in: 'path', required: true, schema: { type: 'string' } }
        ],
        responses: { '200': { description: 'Domain removed' } }
      }
    },

    '/leads/': {
      post: {
        tags: ['Leads'],
        operationId: 'ingestLead',
        summary: 'Ingest lead (API-key + domain validation)',
        security: [{ apiKeyAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/LeadIngestionRequest' },
              example: { firstName: 'Jane', lastName: 'Doe', email: 'jane@example.com' }
            }
          }
        },
        responses: {
          '201': { description: 'Lead created' },
          '401': { description: 'Unauthorized' },
          '403': { description: 'Domain not allowed' },
          '400': { description: 'Validation error' }
        }
      }
    },

    '/leads-management/': {
      get: {
        tags: ['Lead Management'],
        operationId: 'listLeads',
        summary: 'List leads (tenant-scoped)',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'page', in: 'query', required: false, schema: { type: 'string' } },
          { name: 'limit', in: 'query', required: false, schema: { type: 'string' } },
          { name: 'sortField', in: 'query', required: false, schema: { type: 'string' } },
          { name: 'sortOrder', in: 'query', required: false, schema: { type: 'string', enum: ['asc', 'desc'] } }
        ],
        responses: { '200': { description: 'Leads list' }, '401': { description: 'Unauthorized' } }
      }
    },

    '/leads-management/{id}': {
      get: {
        tags: ['Lead Management'],
        operationId: 'getLead',
        summary: 'Get a lead (tenant-scoped)',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { '200': { description: 'Lead retrieved' }, '401': { description: 'Unauthorized' } }
      },
      delete: {
        tags: ['Lead Management'],
        operationId: 'deleteLead',
        summary: 'Delete a lead (tenant-scoped)',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { '200': { description: 'Lead deleted' }, '401': { description: 'Unauthorized' } }
      }
    },

    '/leads-management/export/csv': {
      get: {
        tags: ['Exports'],
        operationId: 'exportCsv',
        summary: 'Export leads to CSV',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'status', in: 'query', required: false, schema: { type: 'string' } },
          { name: 'sourceDomain', in: 'query', required: false, schema: { type: 'string' } },
          { name: 'startDate', in: 'query', required: false, schema: { type: 'string' } },
          { name: 'endDate', in: 'query', required: false, schema: { type: 'string' } },
          { name: 'search', in: 'query', required: false, schema: { type: 'string' } }
        ],
        responses: {
          '200': { description: 'CSV download' },
          '401': { description: 'Unauthorized' },
          '403': { description: 'Forbidden' }
        }
      }
    },

    '/leads-management/export/xlsx': {
      get: {
        tags: ['Exports'],
        operationId: 'exportXlsx',
        summary: 'Export leads to XLSX',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'status', in: 'query', required: false, schema: { type: 'string' } },
          { name: 'sourceDomain', in: 'query', required: false, schema: { type: 'string' } },
          { name: 'startDate', in: 'query', required: false, schema: { type: 'string' } },
          { name: 'endDate', in: 'query', required: false, schema: { type: 'string' } },
          { name: 'search', in: 'query', required: false, schema: { type: 'string' } }
        ],
        responses: {
          '200': { description: 'XLSX download' },
          '401': { description: 'Unauthorized' },
          '403': { description: 'Forbidden' }
        }
      }
    }
  };

  return definition;
}

