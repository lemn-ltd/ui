import { ComponentPage, ExampleBlock, PropsTable, VariantsGallery } from '@portal/catalog-kit';
import { Avatar, type AvatarColor, AvatarGroup, type AvatarSize } from '@lemn-ltd/ui';
import type { ReactElement } from 'react';
import { people } from '../../../fixtures';

const COLORS: readonly AvatarColor[] = ['teal', 'purple', 'amber', 'blue', 'pink', 'red'];

const SIZES: readonly AvatarSize[] = [24, 32];

const GROUP_PEOPLE = people.slice(0, 9);

function AvatarPage(): ReactElement {
  const first = people[0];

  return (
    <ComponentPage
      status="stable"
      summary="A circular identity badge showing initials. AvatarGroup overlaps avatars and collapses the overflow into a +N count."
      title="Avatar"
    >
      <ExampleBlock
        code={`<Avatar color="teal">${first?.initials ?? 'AB'}</Avatar>

<AvatarGroup>
  {people.slice(0, 9).map((person) => (
    <Avatar color={person.avatarColor} key={person.id}>
      {person.initials}
    </Avatar>
  ))}
</AvatarGroup>`}
        render={() => (
          <>
            <Avatar color={first?.avatarColor ?? 'teal'}>{first?.initials ?? 'AB'}</Avatar>
            <AvatarGroup>
              {GROUP_PEOPLE.map((person) => (
                <Avatar color={person.avatarColor} key={person.id}>
                  {person.initials}
                </Avatar>
              ))}
            </AvatarGroup>
          </>
        )}
      />

      <VariantsGallery
        items={COLORS.map((color, index) => ({
          label: color,
          render: () => <Avatar color={color}>{people[index]?.initials ?? 'AB'}</Avatar>,
        }))}
      />

      <VariantsGallery
        items={SIZES.map((size) => ({
          label: `size ${size}`,
          render: () => (
            <Avatar color="blue" size={size}>
              {first?.initials ?? 'AB'}
            </Avatar>
          ),
        }))}
      />

      <PropsTable
        rows={[
          {
            name: 'Avatar color',
            type: "'teal' | 'purple' | 'amber' | 'blue' | 'pink' | 'red'",
            defaultValue: "'teal'",
            description: 'Background hue, written to data-color.',
          },
          {
            name: 'Avatar size',
            type: '24 | 32',
            defaultValue: '32',
            description: 'Diameter in pixels, written to data-size.',
          },
          {
            name: 'Avatar children',
            type: 'ReactNode',
            description: 'Content of the avatar, normally two-letter initials.',
          },
          {
            name: 'AvatarGroup max',
            type: 'number',
            defaultValue: '5',
            description: 'How many avatars to render before collapsing the rest into +N.',
          },
          {
            name: 'AvatarGroup children',
            type: 'ReactNode',
            description: 'The Avatar elements to overlap.',
          },
        ]}
      />
    </ComponentPage>
  );
}

export default AvatarPage;
