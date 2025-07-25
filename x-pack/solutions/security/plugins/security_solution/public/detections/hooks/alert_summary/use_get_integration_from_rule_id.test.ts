/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import { renderHook } from '@testing-library/react';
import { useGetIntegrationFromRuleId } from './use_get_integration_from_rule_id';
import type { PackageListItem } from '@kbn/fleet-plugin/common';
import type { RuleResponse } from '../../../../common/api/detection_engine';
import { installationStatuses } from '@kbn/fleet-plugin/common/constants';

describe('useGetIntegrationFromRuleId', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return undefined integration when no matching rule is found', () => {
    const packages: PackageListItem[] = [
      {
        id: 'splunk',
        icons: [{ src: 'icon.svg', path: 'mypath/icon.svg', type: 'image/svg+xml' }],
        name: 'splunk',
        status: installationStatuses.NotInstalled,
        title: 'Splunk',
        version: '0.1.0',
      },
    ];
    const ruleId = 'wrong_rule_id';
    const rules: RuleResponse[] = [
      {
        name: 'Rule name',
        rule_id: 'rule_id',
      } as RuleResponse,
    ];

    const { result } = renderHook(() => useGetIntegrationFromRuleId({ packages, ruleId, rules }));

    expect(result.current.integration).toBe(undefined);
  });

  it('should return undefined integration when no package name match the rule name', () => {
    const packages: PackageListItem[] = [
      {
        id: 'splunk',
        icons: [{ src: 'icon.svg', path: 'mypath/icon.svg', type: 'image/svg+xml' }],
        name: 'splunk',
        status: installationStatuses.NotInstalled,
        title: 'Splunk',
        version: '0.1.0',
      },
    ];
    const ruleId = 'rule_id';
    const rules: RuleResponse[] = [
      {
        related_integrations: [{ package: 'wrong_integrations' }],
        rule_id: 'rule_id',
      } as RuleResponse,
    ];

    const { result } = renderHook(() => useGetIntegrationFromRuleId({ packages, ruleId, rules }));

    expect(result.current.integration).toBe(undefined);
  });

  it('should return a matching integration', () => {
    const packages: PackageListItem[] = [
      {
        id: 'splunk',
        icons: [{ src: 'icon.svg', path: 'mypath/icon.svg', type: 'image/svg+xml' }],
        name: 'splunk',
        status: installationStatuses.NotInstalled,
        title: 'Splunk',
        version: '0.1.0',
      },
    ];
    const ruleId = 'splunk_rule_id';
    const rules: RuleResponse[] = [
      {
        related_integrations: [{ package: 'splunk' }],
        rule_id: 'splunk_rule_id',
      } as RuleResponse,
    ];

    const { result } = renderHook(() => useGetIntegrationFromRuleId({ packages, ruleId, rules }));

    expect(result.current.integration).toEqual({
      id: 'splunk',
      icons: [{ src: 'icon.svg', path: 'mypath/icon.svg', type: 'image/svg+xml' }],
      name: 'splunk',
      status: installationStatuses.NotInstalled,
      title: 'Splunk',
      version: '0.1.0',
    });
  });
});
