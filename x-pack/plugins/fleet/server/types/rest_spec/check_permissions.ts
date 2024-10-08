/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import { schema } from '@kbn/config-schema';

export const CheckPermissionsRequestSchema = {
  query: schema.object({
    fleetServerSetup: schema.maybe(schema.boolean()),
  }),
};

export const CheckPermissionsResponseSchema = schema.object({
  success: schema.boolean(),
  error: schema.maybe(
    schema.oneOf([
      schema.literal('MISSING_SECURITY'),
      schema.literal('MISSING_PRIVILEGES'),
      schema.literal('MISSING_FLEET_SERVER_SETUP_PRIVILEGES'),
    ])
  ),
});
