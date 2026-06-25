# TODO

- [x] Fix src/app.js to mount routers
- [x] Fix src/middleware/domainWhitelist.js to set req.sourceDomain (and compatibility copy to req.client.sourceDomain)
- [x] Phase 8: Swagger/OpenAPI implementation
  - [x] Create src/config/swagger.js (OpenAPI 3.1 spec builder)
  - [x] Install swagger-ui-express + swagger-jsdoc
  - [x] Mount Swagger UI at /api/docs in src/app.js
  - [x] Remove any accidental duplicate /health route introduced during integration
- [ ] Phase 9: Frontend Next.js admin panel (not started yet)

