/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import type { RequestHandler } from '@kbn/core/server';
import type {
  UpdateWorkflowInsightsRequestBody,
  UpdateWorkflowInsightsRequestParams,
} from '../../../../common/api/endpoint/workflow_insights/workflow_insights';
import { UpdateWorkflowInsightRequestSchema } from '../../../../common/api/endpoint/workflow_insights/workflow_insights';
import { securityWorkflowInsightsService } from '../../services';

import { errorHandler } from '../error_handler';
import { WORKFLOW_INSIGHTS_UPDATE_ROUTE } from '../../../../common/endpoint/constants';
import { withEndpointAuthz } from '../with_endpoint_authz';
import type {
  SecuritySolutionPluginRouter,
  SecuritySolutionRequestHandlerContext,
} from '../../../types';
import type { EndpointAppContext } from '../../types';
import type { SecurityWorkflowInsight } from '../../../../common/endpoint/types/workflow_insights';

export const registerUpdateInsightsRoute = (
  router: SecuritySolutionPluginRouter,
  endpointContext: EndpointAppContext
) => {
  router.versioned
    .put({
      access: 'internal',
      path: WORKFLOW_INSIGHTS_UPDATE_ROUTE,
      security: {
        authz: {
          requiredPrivileges: ['securitySolution'],
        },
      },
      options: { authRequired: true },
    })
    .addVersion(
      {
        version: '1',
        validate: {
          request: UpdateWorkflowInsightRequestSchema,
        },
      },
      withEndpointAuthz(
        { all: ['canReadWorkflowInsights'] },
        endpointContext.logFactory.get('workflowInsights'),
        updateInsightsRouteHandler(endpointContext)
      )
    );
};

const updateInsightsRouteHandler = (
  endpointContext: EndpointAppContext
): RequestHandler<
  UpdateWorkflowInsightsRequestParams,
  unknown,
  UpdateWorkflowInsightsRequestBody,
  SecuritySolutionRequestHandlerContext
> => {
  const logger = endpointContext.logFactory.get('workflowInsights');

  const isOnlyActionTypeUpdate = (body: Partial<UpdateWorkflowInsightsRequestBody>): boolean => {
    // Type guard is done by schema validation
    if (!body?.action?.type) return false;
    // Make sure the body only contains the action.type field
    return Object.keys(body).length === 1 && Object.keys(body.action).length === 1;
  };

  return async (_, request, response) => {
    const { insightId } = request.params;
    const { canWriteWorkflowInsights } = await endpointContext.service.getEndpointAuthz(request);
    if (!canWriteWorkflowInsights && !isOnlyActionTypeUpdate(request.body)) {
      return response.forbidden({ body: 'Unauthorized to update workflow insights' });
    }
    logger.debug(`Updating insight ${insightId}`);
    try {
      const body = await securityWorkflowInsightsService.update(
        insightId,
        request.body as Partial<SecurityWorkflowInsight>
      );
      return response.ok({ body });
    } catch (e) {
      return errorHandler(logger, response, e);
    }
  };
};
