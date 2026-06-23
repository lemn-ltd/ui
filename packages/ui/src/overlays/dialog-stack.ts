const MODAL_STACK_LAYER_ATTRIBUTE = 'data-ui-modal-stack-layer';

export function modalStackLayerProps(layerId: string): Record<string, string> {
  return { [MODAL_STACK_LAYER_ATTRIBUTE]: layerId };
}

export function preventDismissFromStackedModal(
  event: Pick<Event, 'preventDefault' | 'target'>,
  currentLayerId: string,
): void {
  if (!(event.target instanceof Element)) return;

  const targetLayer = event.target.closest(`[${MODAL_STACK_LAYER_ATTRIBUTE}]`);
  if (targetLayer?.getAttribute(MODAL_STACK_LAYER_ATTRIBUTE) === currentLayerId) return;
  if (targetLayer) event.preventDefault();
}
