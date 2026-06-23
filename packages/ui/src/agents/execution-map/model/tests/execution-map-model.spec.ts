import { describe, expect, it } from 'vitest';

import type { ExecutionMapEvent } from '../../types.js';
import { executionMapEventDisplay, executionMapEventVocabulary } from '../execution-map-model.js';

function eventWithType(eventType: string): ExecutionMapEvent {
  return {
    eventId: `event-${eventType}`,
    eventFamily: 'runtime',
    eventType,
    schemaVersion: 1,
    occurredAt: '2026-06-13T09:10:00.000Z',

    scope: {},

    persistence: {
      eventSeq: 1,
    },

    payload: {},
  };
}

describe('execution map event display', () => {
  it('keeps one unique vocabulary entry per display kind and code', () => {
    const kinds = new Set(executionMapEventVocabulary.map((entry) => entry.kind));
    const codes = new Set(executionMapEventVocabulary.map((entry) => entry.code));

    expect(kinds.size).toBe(executionMapEventVocabulary.length);
    expect(codes.size).toBe(executionMapEventVocabulary.length);
  });

  it('classifies timeline events through the canonical vocabulary', () => {
    expect(executionMapEventDisplay(eventWithType('runtime.input.received'))).toMatchObject({
      kind: 'input',
      code: 'IN',
      iconName: 'corner-down-left',
    });
    expect(executionMapEventDisplay(eventWithType('agent.attempt.started'))).toMatchObject({
      kind: 'attempt',
      code: 'AT',
      iconName: 'play',
    });
    expect(executionMapEventDisplay(eventWithType('agent.tool.completed'))).toMatchObject({
      kind: 'tool',
      code: 'TOOL',
      iconName: 'wrench',
    });
    expect(executionMapEventDisplay(eventWithType('inference_run.completed'))).toMatchObject({
      kind: 'inference',
      code: 'LLM',
      iconName: 'code',
    });
    expect(executionMapEventDisplay(eventWithType('agent.tool.failed'))).toMatchObject({
      kind: 'error',
      code: 'ERR',
      iconName: 'triangle-alert',
    });
  });
});
