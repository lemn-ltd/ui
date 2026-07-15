import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

export const transformId = 'tremor-tracker';
export const transformVersion = '1.0.0';
export const outputPath = 'packages/ui/src/visualizations/tracker/tremor-tracker.internal.tsx';

const upstreamPath = 'src/components/Tracker/Tracker.tsx';
const patchPath = 'packages/provider-registry/third-party/patches/tremor-tracker-lemn.patch.json';

export async function transformSnapshot({ repositoryRoot, source }) {
  const tracker = source.closure.find((entry) => entry.upstreamPath === upstreamPath);
  if (!tracker) throw new Error(`Tremor Tracker closure is missing ${upstreamPath}.`);
  const raw = await readFile(resolve(repositoryRoot, 'packages/provider-registry', tracker.localPath), 'utf8');
  const patch = JSON.parse(await readFile(resolve(repositoryRoot, patchPath), 'utf8'));
  if (patch.upstreamCommit !== source.commitSha) {
    throw new Error('Tremor Tracker patch and source commit differ.');
  }

  let generated = mechanicalTransform(raw);
  for (const operation of patch.operations) {
    generated = replaceOnce(generated, operation.match, operation.replacement, operation.id);
  }
  return [{ path: outputPath, content: generated }];
}

function mechanicalTransform(raw) {
  let source = raw;
  source = replaceOnce(
    source,
    '// Tremor Tracker [v1.0.0]\n',
    '// Generated from Tremor Tracker [v1.0.0]. Do not edit; run provider snapshot sync.\n',
    'generated-header',
  );
  source = replaceOnce(
    source,
    'import * as HoverCardPrimitives from "@radix-ui/react-hover-card"',
    'import { HoverCard as HoverCardPrimitives } from "radix-ui"',
    'radix-umbrella-import',
  );
  source = replaceOnce(
    source,
    'import { cx } from "../../utils/cx"',
    'const cx = (...values: Array<string | undefined | false>) => values.filter(Boolean).join(" ")',
    'tailwind-class-join',
  );
  source = replaceOnce(source, 'interface TrackerBlockProps {', 'export interface TremorTrackerBlockProps {', 'block-type');
  source = source.replaceAll(': TrackerBlockProps', ': TremorTrackerBlockProps');
  source = replaceOnce(source, 'interface TrackerProps extends React.HTMLAttributes<HTMLDivElement> {', 'export interface TremorTrackerProps extends React.HTMLAttributes<HTMLDivElement> {', 'tracker-type');
  source = replaceOnce(source, 'const Tracker = React.forwardRef<HTMLDivElement, TrackerProps>(', 'const TremorTracker = React.forwardRef<HTMLDivElement, TremorTrackerProps>(', 'tracker-name');
  source = replaceOnce(source, 'Tracker.displayName = "Tracker"', 'TremorTracker.displayName = "TremorTracker"', 'display-name');
  source = replaceOnce(source, 'export { Tracker, type TrackerBlockProps }', 'export { TremorTracker }', 'exports');
  source = replaceOnce(
    source,
    'className="size-full overflow-hidden px-[0.5px] transition first:rounded-l-[4px] first:pl-0 last:rounded-r-[4px] last:pr-0 sm:px-px"',
    'className="ui-tracker-provider__item"',
    'item-class',
  );
  source = replaceOnce(
    source,
    '"size-full rounded-[1px]",',
    '"ui-tracker-provider__block",',
    'block-class',
  );
  source = replaceOnce(
    source,
    'hoverEffect ? "hover:opacity-50" : "",',
    'hoverEffect ? "ui-tracker-provider__block--hover" : "",',
    'hover-class',
  );
  source = replaceOnce(
    source,
    'className={cx(\n            // base\n            "w-auto rounded-md px-2 py-1 text-sm shadow-md",\n            // text color\n            "text-white dark:text-gray-900",\n            // background color\n            "bg-gray-900 dark:bg-gray-50",\n          )}',
    'className="ui-tracker-provider__tooltip"',
    'tooltip-class',
  );
  source = replaceOnce(
    source,
    'defaultBackgroundColor = "bg-gray-400 dark:bg-gray-400",',
    'defaultBackgroundColor = "ui-tracker-provider__block--pending",',
    'default-class',
  );
  source = replaceOnce(
    source,
    'className={cx("group flex h-8 w-full items-center", className)}',
    'className={cx("ui-tracker-provider", className)}',
    'root-class',
  );
  return source;
}

function replaceOnce(source, match, replacement, id) {
  const first = source.indexOf(match);
  if (first < 0) throw new Error(`Tremor Tracker transform ${id} did not match the pinned source.`);
  if (source.indexOf(match, first + match.length) >= 0) {
    throw new Error(`Tremor Tracker transform ${id} matched more than once.`);
  }
  return `${source.slice(0, first)}${replacement}${source.slice(first + match.length)}`;
}
