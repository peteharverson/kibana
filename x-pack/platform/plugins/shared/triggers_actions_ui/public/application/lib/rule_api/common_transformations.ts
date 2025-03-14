/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */
import type { RuleExecutionStatus } from '@kbn/alerting-plugin/common';
import type { AsApiContract, RewriteRequestCase } from '@kbn/actions-plugin/common';
import type { Rule, RuleUiAction, ResolvedRule, RuleLastRun } from '../../../types';

const transformAction: RewriteRequestCase<RuleUiAction> = (action) => {
  const { uuid, id, connector_type_id: actionTypeId, params } = action;
  return {
    ...('group' in action && action.group ? { group: action.group } : {}),
    id,
    params,
    actionTypeId,
    ...('use_alert_data_for_template' in action &&
    typeof action.use_alert_data_for_template !== 'undefined'
      ? { useAlertDataForTemplate: action.use_alert_data_for_template }
      : {}),
    ...('frequency' in action && action.frequency
      ? {
          frequency: {
            summary: action.frequency.summary,
            notifyWhen: action.frequency.notify_when,
            throttle: action.frequency.throttle,
          },
        }
      : {}),
    ...('alerts_filter' in action && action.alerts_filter
      ? { alertsFilter: action.alerts_filter }
      : {}),
    ...(uuid && { uuid }),
  };
};

const transformExecutionStatus: RewriteRequestCase<RuleExecutionStatus> = ({
  last_execution_date: lastExecutionDate,
  last_duration: lastDuration,
  ...rest
}) => ({
  lastExecutionDate,
  lastDuration,
  ...rest,
});

const transformLastRun: RewriteRequestCase<RuleLastRun> = ({
  outcome_msg: outcomeMsg,
  outcome_order: outcomeOrder,
  alerts_count: alertsCount,
  ...rest
}) => ({
  outcomeMsg,
  outcomeOrder,
  alertsCount,
  ...rest,
});

const transformFlapping = (flapping: AsApiContract<Rule['flapping']>) => {
  if (!flapping) {
    return flapping;
  }
  return {
    lookBackWindow: flapping.look_back_window,
    statusChangeThreshold: flapping.status_change_threshold,
  };
};

export const transformRule: RewriteRequestCase<Rule> = ({
  rule_type_id: ruleTypeId,
  created_by: createdBy,
  updated_by: updatedBy,
  created_at: createdAt,
  updated_at: updatedAt,
  api_key_owner: apiKeyOwner,
  api_key_created_by_user: apiKeyCreatedByUser,
  notify_when: notifyWhen,
  mute_all: muteAll,
  muted_alert_ids: mutedInstanceIds,
  scheduled_task_id: scheduledTaskId,
  execution_status: executionStatus,
  actions: actions,
  snooze_schedule: snoozeSchedule,
  is_snoozed_until: isSnoozedUntil,
  active_snoozes: activeSnoozes,
  last_run: lastRun,
  next_run: nextRun,
  alert_delay: alertDelay,
  flapping,
  ...rest
}: any) => ({
  ruleTypeId,
  createdBy,
  updatedBy,
  createdAt,
  updatedAt,
  apiKeyOwner,
  notifyWhen,
  muteAll,
  mutedInstanceIds,
  snoozeSchedule,
  executionStatus: executionStatus ? transformExecutionStatus(executionStatus) : undefined,
  actions: actions
    ? actions.map((action: AsApiContract<RuleUiAction>) => transformAction(action))
    : [],
  scheduledTaskId,
  isSnoozedUntil,
  activeSnoozes,
  ...(lastRun ? { lastRun: transformLastRun(lastRun) } : {}),
  ...(nextRun ? { nextRun } : {}),
  ...(apiKeyCreatedByUser !== undefined ? { apiKeyCreatedByUser } : {}),
  ...(alertDelay ? { alertDelay } : {}),
  ...(flapping !== undefined ? { flapping: transformFlapping(flapping) } : {}),
  ...rest,
});

export const transformResolvedRule: RewriteRequestCase<ResolvedRule> = ({
  // eslint-disable-next-line @typescript-eslint/naming-convention
  alias_target_id,
  // eslint-disable-next-line @typescript-eslint/naming-convention
  alias_purpose,
  outcome,
  ...rest
}: any) => {
  return {
    ...transformRule(rest),
    alias_target_id,
    alias_purpose,
    outcome,
  };
};
