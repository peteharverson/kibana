/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import type { Dispatch, Store } from 'redux';
import { createStore } from 'redux';
import type { EndpointState } from '../types';
import { listData } from './selectors';
import { mockEndpointResultList } from './mock_endpoint_result_list';
import type { EndpointAction } from './action';
import { endpointListReducer } from './reducer';
import { DEFAULT_POLL_INTERVAL } from '../../../common/constants';
import { createUninitialisedResourceState } from '../../../state';
import {
  ENDPOINT_DEFAULT_SORT_DIRECTION,
  ENDPOINT_DEFAULT_SORT_FIELD,
} from '../../../../../common/endpoint/constants';

describe('EndpointList store concerns', () => {
  let store: Store<EndpointState>;
  let dispatch: Dispatch<EndpointAction>;
  const createTestStore = () => {
    store = createStore(endpointListReducer);
    dispatch = store.dispatch;
  };

  const loadDataToStore = () => {
    dispatch({
      type: 'serverReturnedEndpointList',
      payload: mockEndpointResultList({ pageSize: 1, page: 0, total: 10 }),
    });
  };

  describe('# Reducers', () => {
    beforeEach(() => {
      createTestStore();
    });

    test('it creates default state', () => {
      const expectedDefaultState: EndpointState = {
        hosts: [],
        isInitialized: false,
        pageSize: 10,
        pageIndex: 0,
        sortField: ENDPOINT_DEFAULT_SORT_FIELD,
        sortDirection: ENDPOINT_DEFAULT_SORT_DIRECTION,
        total: 0,
        loading: false,
        error: undefined,
        location: undefined,
        policyItems: [],
        selectedPolicyId: undefined,
        policyItemsLoading: false,
        endpointPackageInfo: {
          type: 'UninitialisedResourceState',
        },
        nonExistingPolicies: new Set(),
        endpointsExist: true,
        patterns: [],
        patternsError: undefined,
        isAutoRefreshEnabled: true,
        autoRefreshInterval: DEFAULT_POLL_INTERVAL,
        agentsWithEndpointsTotal: 0,
        endpointsTotal: 0,
        agentsWithEndpointsTotalError: undefined,
        endpointsTotalError: undefined,
        isolationRequestState: {
          type: 'UninitialisedResourceState',
        },
        metadataTransformStats: createUninitialisedResourceState(),
      };

      expect(store.getState()).toEqual(expectedDefaultState);
    });

    test('it handles `serverReturnedEndpointList', () => {
      const payload = mockEndpointResultList({
        page: 0,
        pageSize: 1,
        total: 10,
      });
      dispatch({
        type: 'serverReturnedEndpointList',
        payload,
      });

      const currentState = store.getState();
      expect(currentState.hosts).toEqual(payload.data);
      expect(currentState.pageSize).toEqual(payload.pageSize);
      expect(currentState.pageIndex).toEqual(payload.page);
      expect(currentState.total).toEqual(payload.total);
    });
  });

  describe('# Selectors', () => {
    beforeEach(() => {
      createTestStore();
      loadDataToStore();
    });

    test('it selects `endpointListData`', () => {
      const currentState = store.getState();
      expect(listData(currentState)).toEqual(currentState.hosts);
    });
  });
});
