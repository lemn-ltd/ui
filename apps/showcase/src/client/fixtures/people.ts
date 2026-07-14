import type { AvatarColor } from '@lemn-ltd/ui';
import { faker, resetSeed } from './faker-seed.js';

resetSeed();

export interface Person {
  readonly id: string;
  readonly name: string;
  readonly email: string;
  readonly initials: string;
  readonly avatarColor: AvatarColor;
}

const AVATAR_COLORS: readonly AvatarColor[] = ['teal', 'purple', 'amber', 'blue', 'pink', 'red'];

const PERSON_COUNT = 40;

function initialsFor(name: string): string {
  return name
    .split(' ')
    .filter((part) => part.length > 0)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('');
}

export const people: readonly Person[] = Array.from({ length: PERSON_COUNT }, (_, index) => {
  const firstName = faker.person.firstName();
  const lastName = faker.person.lastName();
  const name = `${firstName} ${lastName}`;
  return {
    id: `person-${String(index + 1).padStart(2, '0')}`,
    name,
    email: faker.internet.email({ firstName, lastName, provider: 'example.com' }).toLowerCase(),
    initials: initialsFor(name),
    avatarColor: AVATAR_COLORS[index % AVATAR_COLORS.length] as AvatarColor,
  };
});
