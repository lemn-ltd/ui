import { describe, expect, it } from 'vitest';
import { uiShowcaseAppDescriptor } from '../../app-descriptor';
import { uiShowcaseServiceDescriptor } from '../service-descriptor';

describe('ui showcase service descriptor', () => {
  it('derives app descriptor fields without changing the worker identity value', () => {
    expect(uiShowcaseServiceDescriptor).toMatchObject({
      name: uiShowcaseAppDescriptor.name,
      displayName: uiShowcaseAppDescriptor.displayName,
      accent: uiShowcaseAppDescriptor.accent,
      workerName: uiShowcaseAppDescriptor.name,
    });
  });
});
