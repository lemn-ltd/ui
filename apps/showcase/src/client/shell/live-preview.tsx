import {
	ShowcaseEntryProvider,
	ShowcaseRenderModeProvider,
} from "@appranks/showcase-kit";
import {
	Component,
	type ErrorInfo,
	type ReactElement,
	type ReactNode,
	Suspense,
	useEffect,
	useRef,
	useState,
} from "react";
import type { UiShowcaseEntry } from "../registry/showcase-types";

const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 450;
const FRAME_ASPECT_RATIO = CANVAS_WIDTH / CANVAS_HEIGHT;
const FRAME_PADDING = 32;
const MIN_FRAME_WIDTH = 208;

interface PreviewTransform {
	readonly x: number;
	readonly y: number;
	readonly scale: number;
}

interface PreviewErrorBoundaryProps {
	readonly children: ReactNode;
}

interface PreviewErrorBoundaryState {
	readonly failed: boolean;
}

class PreviewErrorBoundary extends Component<
	PreviewErrorBoundaryProps,
	PreviewErrorBoundaryState
> {
	public override state: PreviewErrorBoundaryState = { failed: false };

	public static getDerivedStateFromError(): PreviewErrorBoundaryState {
		return { failed: true };
	}

	public override componentDidCatch(error: Error, info: ErrorInfo): void {
		console.error("showcase.live-preview.failed", error, info.componentStack);
	}

	public override render(): ReactNode {
		if (this.state.failed) {
			return (
				<span className="showcase-live-preview__status">
					Preview unavailable
				</span>
			);
		}
		return this.props.children;
	}
}

function isVisible(element: HTMLElement): boolean {
	const style = window.getComputedStyle(element);
	return (
		style.display !== "none" &&
		style.visibility !== "hidden" &&
		style.opacity !== "0"
	);
}

function calculateFrame(
	boundary: HTMLElement,
	scale: number,
): {
	readonly x: number;
	readonly y: number;
	readonly width: number;
} {
	const boundaryRect = boundary.getBoundingClientRect();
	const candidates = Array.from(boundary.children)
		.filter(
			(child): child is HTMLElement =>
				child instanceof HTMLElement && isVisible(child),
		)
		.map((child) => {
			const rect = child.getBoundingClientRect();
			return {
				left: (rect.left - boundaryRect.left) / scale,
				top: (rect.top - boundaryRect.top) / scale,
				right: (rect.right - boundaryRect.left) / scale,
				bottom: (rect.bottom - boundaryRect.top) / scale,
			};
		})
		.filter((rect) => rect.right > rect.left && rect.bottom > rect.top);

	if (candidates.length === 0) {
		return { x: 0, y: 0, width: CANVAS_WIDTH };
	}

	const left = Math.min(...candidates.map((rect) => rect.left));
	const top = Math.min(...candidates.map((rect) => rect.top));
	const right = Math.max(...candidates.map((rect) => rect.right));
	const bottom = Math.max(...candidates.map((rect) => rect.bottom));
	const contentWidth = right - left;
	const contentHeight = bottom - top;
	const requestedWidth = Math.max(
		MIN_FRAME_WIDTH,
		contentWidth + FRAME_PADDING * 2,
		(contentHeight + FRAME_PADDING * 2) * FRAME_ASPECT_RATIO,
	);
	const width = Math.ceil(requestedWidth / 16) * 16;
	const height = width / FRAME_ASPECT_RATIO;

	return {
		x: left + contentWidth / 2 - width / 2,
		y: top + contentHeight / 2 - height / 2,
		width,
	};
}

export function LivePreview({
	entry,
}: {
	readonly entry: UiShowcaseEntry;
}): ReactElement {
	const viewportRef = useRef<HTMLDivElement>(null);
	const canvasRef = useRef<HTMLDivElement>(null);
	const scaleRef = useRef(1);
	const [active, setActive] = useState(false);
	const [ready, setReady] = useState(false);
	const [transform, setTransform] = useState<PreviewTransform>({
		x: 0,
		y: 0,
		scale: 1,
	});

	useEffect(() => {
		const viewport = viewportRef.current;
		if (!viewport) return;

		viewport.setAttribute("inert", "");
		const observer = new IntersectionObserver(
			([intersection]) => {
				const nextActive = Boolean(intersection?.isIntersecting);
				setActive(nextActive);
				if (!nextActive) setReady(false);
			},
			{ rootMargin: "480px 0px" },
		);
		observer.observe(viewport);
		return () => observer.disconnect();
	}, []);

	useEffect(() => {
		if (!active) return;
		const viewport = viewportRef.current;
		const canvas = canvasRef.current;
		if (!viewport || !canvas) return;

		const observedElements = new WeakSet<Element>();
		let frame = 0;

		const resizeObserver = new ResizeObserver(() => measure());

		const observeSize = (element: Element): void => {
			if (observedElements.has(element)) return;
			observedElements.add(element);
			resizeObserver.observe(element);
		};

		const measure = (): void => {
			cancelAnimationFrame(frame);
			frame = requestAnimationFrame(() => {
				const boundary = canvas.querySelector<HTMLElement>(
					"[data-showcase-preview-content]",
				);
				if (!boundary || viewport.clientWidth === 0) return;

				observeSize(boundary);
				for (const child of boundary.children) observeSize(child);

				const crop = calculateFrame(boundary, scaleRef.current);
				const nextScale = viewport.clientWidth / crop.width;
				const nextTransform = {
					x: -crop.x * nextScale,
					y: -crop.y * nextScale,
					scale: nextScale,
				};
				scaleRef.current = nextScale;
				setTransform(nextTransform);
				setReady(true);
			});
		};

		const mutationObserver = new MutationObserver(measure);
		mutationObserver.observe(canvas, { childList: true, subtree: true });
		const viewportObserver = new ResizeObserver(measure);
		viewportObserver.observe(viewport);
		measure();

		return () => {
			cancelAnimationFrame(frame);
			mutationObserver.disconnect();
			resizeObserver.disconnect();
			viewportObserver.disconnect();
		};
	}, [active]);

	return (
		<div
			aria-hidden="true"
			className="showcase-live-preview"
			data-preview-active={active ? "true" : "false"}
			data-preview-ready={ready ? "true" : "false"}
			ref={viewportRef}
		>
			{active ? (
				<div
					className="showcase-live-preview__canvas"
					ref={canvasRef}
					style={{
						transform: `translate(${transform.x}px, ${transform.y}px) scale(${transform.scale})`,
					}}
				>
					<PreviewErrorBoundary>
						<Suspense
							fallback={
								<span className="showcase-live-preview__status">
									Loading live preview…
								</span>
							}
						>
							<ShowcaseEntryProvider entry={entry}>
								<ShowcaseRenderModeProvider mode="card">
									{entry.page()}
								</ShowcaseRenderModeProvider>
							</ShowcaseEntryProvider>
						</Suspense>
					</PreviewErrorBoundary>
				</div>
			) : (
				<span className="showcase-live-preview__status">Live preview</span>
			)}
		</div>
	);
}
