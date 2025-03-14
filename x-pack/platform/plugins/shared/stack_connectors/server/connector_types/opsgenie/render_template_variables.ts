/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import { renderMustacheObject } from '@kbn/actions-plugin/server/lib/mustache_renderer';
import type { ExecutorParams } from '@kbn/actions-plugin/server/sub_action_framework/types';
import type { RenderParameterTemplates } from '@kbn/actions-plugin/server/types';
import { set } from '@kbn/safer-lodash-set';
import { cloneDeep, get, isString } from 'lodash';
import { RULE_TAGS_TEMPLATE } from '../../../common/opsgenie';
import { OpsgenieSubActions } from '../../../common';
import type { CreateAlertSubActionParams } from './types';

export const renderParameterTemplates: RenderParameterTemplates<ExecutorParams> = (
  logger,
  params,
  variables
) => {
  if (!isCreateAlertSubAction(params) || !params.subActionParams.tags) {
    return renderMustacheObject(logger, params, variables);
  }

  const foundRuleTagsTemplate = params.subActionParams.tags.includes(RULE_TAGS_TEMPLATE);

  if (!foundRuleTagsTemplate) {
    return renderMustacheObject(logger, params, variables);
  }

  const paramsCopy = cloneDeep(params);

  const tagsWithoutRuleTagsTemplate = paramsCopy.subActionParams.tags?.filter(
    (tag) => tag !== RULE_TAGS_TEMPLATE
  );

  set(paramsCopy, 'subActionParams.tags', [
    ...(tagsWithoutRuleTagsTemplate ?? []),
    ...getRuleTags(variables),
  ]);

  return renderMustacheObject(logger, paramsCopy, variables);
};

type CreateAlertParams = CreateAlertSubActionParams & Record<string, unknown>;

const isCreateAlertSubAction = (params: ExecutorParams): params is CreateAlertParams =>
  params.subAction === OpsgenieSubActions.CreateAlert;

const getRuleTags = (variables: Record<string, unknown>): string[] => {
  const ruleTagsAsUnknown = get(variables, 'rule.tags', []);

  if (!Array.isArray(ruleTagsAsUnknown)) {
    return [];
  }

  return ruleTagsAsUnknown.filter((tag) => isString(tag));
};
