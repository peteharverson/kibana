/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the "Elastic License
 * 2.0", the "GNU Affero General Public License v3.0 only", and the "Server Side
 * Public License v 1"; you may not use this file except in compliance with, at
 * your election, the "Elastic License 2.0", the "GNU Affero General Public
 * License v3.0 only", or the "Server Side Public License, v 1".
 */

import { FilterStateStore, buildFilter, FILTERS } from '@kbn/es-query';
import type { DeeplyMockedKeys } from '@kbn/utility-types-jest';
import type { ExecutionContext } from '@kbn/expressions-plugin/common';
import type { KibanaContext, ExpressionFunctionKibanaContext } from '@kbn/data-plugin/common';
import { fromSavedSearchAttributes } from '../service/saved_searches_utils';
import type { SavedSearchAttributes, SavedSearch } from '../types';

import type { KibanaContextStartDependencies } from './kibana_context';
import { getKibanaContextFn } from './kibana_context';

type StartServicesMock = DeeplyMockedKeys<KibanaContextStartDependencies>;

const createExecutionContextMock = (): DeeplyMockedKeys<ExecutionContext> => ({
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  abortSignal: {} as any,
  getExecutionContext: jest.fn(),
  getSearchContext: jest.fn(),
  getSearchSessionId: jest.fn(),
  inspectorAdapters: jest.fn(),
  types: {},
  variables: {},
  getKibanaRequest: jest.fn(),
});

const emptyArgs = { q: null, timeRange: null, savedSearchId: null };

describe('kibanaContextFn', () => {
  let kibanaContextFn: ExpressionFunctionKibanaContext;
  let startServicesMock: StartServicesMock;

  const getStartServicesMock = (): Promise<StartServicesMock> => Promise.resolve(startServicesMock);

  beforeEach(async () => {
    kibanaContextFn = getKibanaContextFn(getStartServicesMock);
    startServicesMock = {
      getSavedSearch: jest.fn(),
    };
  });

  it('merges and deduplicates queries from different sources', async () => {
    const { fn } = kibanaContextFn;
    startServicesMock.getSavedSearch.mockResolvedValue(
      fromSavedSearchAttributes(
        'abc',
        {
          kibanaSavedObjectMeta: {
            searchSourceJSON: JSON.stringify({
              query: [],
            }),
          },
        } as SavedSearchAttributes,
        [],
        undefined,
        {
          getFields: () => ({
            query: [
              {
                language: 'kuery',
                query: {
                  match_phrase: {
                    DUPLICATE: 'DUPLICATE',
                  },
                },
              },
              {
                language: 'kuery',
                query: {
                  match_phrase: {
                    DUPLICATE: 'DUPLICATE',
                  },
                },
              },
              {
                language: 'kuery',
                query: {
                  match_phrase: {
                    test: 'something1',
                  },
                },
              },
            ],
            filter: [],
          }),
        } as unknown as SavedSearch['searchSource'],
        {} as SavedSearch['sharingSavedObjectProps'],
        false
      ) as SavedSearch
    );
    const args = {
      ...emptyArgs,
      q: [
        {
          type: 'kibana_query' as 'kibana_query',
          language: 'test',
          query: {
            type: 'test',
            match_phrase: {
              test: 'something2',
            },
          },
        },
        {
          type: 'kibana_query' as 'kibana_query',
          language: 'test',
          query: {
            type: 'test',
            match_phrase: {
              test: 'something3',
            },
          },
        },
      ],
      savedSearchId: 'test',
    };
    const input: KibanaContext = {
      type: 'kibana_context',
      query: [
        {
          language: 'kuery',
          query: [
            // TODO: Is it expected that if we pass in an array that the values in the array are not deduplicated?
            {
              language: 'kuery',
              query: {
                match_phrase: {
                  DUPLICATE: 'DUPLICATE',
                },
              },
            },
            {
              language: 'kuery',
              query: {
                match_phrase: {
                  DUPLICATE: 'DUPLICATE',
                },
              },
            },
            {
              language: 'kuery',
              query: {
                match_phrase: {
                  test: 'something3',
                },
              },
            },
          ],
        },
      ],
      timeRange: {
        from: 'now-24h',
        to: 'now',
      },
    };

    const { query } = await fn(input, args, createExecutionContextMock());

    expect(query).toEqual([
      {
        language: 'kuery',
        query: [
          {
            language: 'kuery',
            query: {
              match_phrase: {
                DUPLICATE: 'DUPLICATE',
              },
            },
          },
          {
            language: 'kuery',
            query: {
              match_phrase: {
                DUPLICATE: 'DUPLICATE',
              },
            },
          },
          {
            language: 'kuery',
            query: {
              match_phrase: {
                test: 'something3',
              },
            },
          },
        ],
      },
      {
        type: 'kibana_query',
        language: 'test',
        query: {
          type: 'test',
          match_phrase: {
            test: 'something2',
          },
        },
      },
      {
        type: 'kibana_query',
        language: 'test',
        query: {
          type: 'test',
          match_phrase: {
            test: 'something3',
          },
        },
      },
      {
        language: 'kuery',
        query: {
          match_phrase: {
            DUPLICATE: 'DUPLICATE',
          },
        },
      },
      {
        language: 'kuery',
        query: {
          match_phrase: {
            test: 'something1',
          },
        },
      },
    ]);
  });

  it('deduplicates duplicated filters and keeps the first enabled filter', async () => {
    const { fn } = kibanaContextFn;
    const filter1 = buildFilter(
      { fields: [], title: 'dataView' },
      { name: 'test', type: 'test' },
      FILTERS.PHRASE,
      false,
      true,
      {
        query: 'JetBeats',
      },
      null,
      FilterStateStore.APP_STATE
    );
    const filter2 = buildFilter(
      { fields: [], title: 'dataView' },
      { name: 'test', type: 'test' },
      FILTERS.PHRASE,
      false,
      false,
      {
        query: 'JetBeats',
      },
      null,
      FilterStateStore.APP_STATE
    );

    const filter3 = buildFilter(
      { fields: [], title: 'dataView' },
      { name: 'test', type: 'test' },
      FILTERS.PHRASE,
      false,
      false,
      {
        query: 'JetBeats',
      },
      null,
      FilterStateStore.APP_STATE
    );

    const input: KibanaContext = {
      type: 'kibana_context',
      query: [
        {
          language: 'kuery',
          query: '',
        },
      ],
      filters: [filter1, filter2, filter3],
      timeRange: {
        from: 'now-24h',
        to: 'now',
      },
    };

    const { filters } = await fn(input, emptyArgs, createExecutionContextMock());
    expect(filters!.length).toBe(1);
    expect(filters![0]).toBe(filter2);
  });
});
