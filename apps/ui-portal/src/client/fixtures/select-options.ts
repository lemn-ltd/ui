export interface SelectOption {
  readonly value: string;
  readonly label: string;
}

/** Native `<select>` options for the input-select demo. */
export const selectOptions: readonly SelectOption[] = [
  { value: 'option-01', label: 'Newest first' },
  { value: 'option-02', label: 'Oldest first' },
  { value: 'option-03', label: 'Name ascending' },
  { value: 'option-04', label: 'Name descending' },
  { value: 'option-05', label: 'Most recent' },
  { value: 'option-06', label: 'Least recent' },
  { value: 'option-07', label: 'Highest value' },
  { value: 'option-08', label: 'Lowest value' },
  { value: 'option-09', label: 'Owner ascending' },
  { value: 'option-10', label: 'Owner descending' },
  { value: 'option-11', label: 'Status ascending' },
  { value: 'option-12', label: 'Status descending' },
];
