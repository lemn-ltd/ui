import { ComponentPage, ExampleBlock, PropsTable } from '@portal/catalog-kit';
import { ClassificationMatrix, type DataPolicyDraft } from '@lemn-ltd/ui';
import { type ReactElement, useState } from 'react';

const FIELDS: readonly string[] = ['email', 'full_name', 'account_balance', 'support_notes'];

const AVAILABLE_SINKS: readonly string[] = ['queue.outbound', 'webhook.crm', 'warehouse.analytics'];

const INITIAL_DRAFT: DataPolicyDraft = {
  outputClassification: 'internal',
  fieldClassifications: {
    email: 'confidential',
    full_name: 'confidential',
    account_balance: 'restricted',
    support_notes: 'internal',
  },
  modelContextPolicy: 'hash_only',
  allowedSinkRefs: ['queue.outbound', 'webhook.crm'],
};

function ClassificationMatrixPage(): ReactElement {
  const [draft, setDraft] = useState<DataPolicyDraft>(INITIAL_DRAFT);

  return (
    <ComponentPage
      status="beta"
      summary="A controlled editor for a capability's data policy: output classification, model-context policy, a per-field classification matrix, and the allowed sink refs. Each field's sensitivity is toned through the shared Badge palette."
      title="Classification matrix"
    >
      <ExampleBlock
        code={`const [draft, setDraft] = useState<DataPolicyDraft>(initial);

<ClassificationMatrix
  value={draft}
  fields={['email', 'full_name', 'account_balance', 'support_notes']}
  availableSinks={['queue.outbound', 'webhook.crm', 'warehouse.analytics']}
  onChange={setDraft}
/>`}
        render={() => (
          <ClassificationMatrix
            availableSinks={AVAILABLE_SINKS}
            fields={FIELDS}
            onChange={setDraft}
            value={draft}
          />
        )}
      />

      <PropsTable
        rows={[
          {
            name: 'value',
            type: 'DataPolicyDraft',
            description:
              'The current data policy draft: output classification, per-field classifications, model-context policy, and allowed sink refs.',
          },
          {
            name: 'fields',
            type: 'readonly string[]',
            description:
              'The output fields the matrix lets an operator classify; each renders one row reading and writing value.fieldClassifications[field].',
          },
          {
            name: 'onChange',
            type: '(next: DataPolicyDraft) => void',
            description:
              'Called with an immutable next draft on every edit. The component never mutates value.',
          },
          {
            name: 'availableSinks',
            type: 'readonly string[]',
            defaultValue: 'undefined',
            description:
              'Optional catalog of known sink refs, surfaced as context when no sinks are allowed yet.',
          },
        ]}
      />
    </ComponentPage>
  );
}

export default ClassificationMatrixPage;
