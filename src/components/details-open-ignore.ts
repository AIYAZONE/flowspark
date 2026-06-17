export type DetailsOpenIgnoreContext = {
	isNativeInteractive: boolean
	isRadixSelectOverlay: boolean
	isDialogLayer?: boolean
	isNestedButton: boolean
}

export function shouldIgnoreDetailsOpenInteraction(context: DetailsOpenIgnoreContext) {
	return Boolean(context.isNativeInteractive || context.isRadixSelectOverlay || context.isDialogLayer || context.isNestedButton)
}
