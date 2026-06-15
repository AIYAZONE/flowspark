'use client'

import { useEffect, useState, useTransition } from 'react'
import { Archive, CalendarDays, Lightbulb, ListChecks, Pencil, Sparkles, Trash2, Undo2 } from 'lucide-react'
import type en from '@/i18n/en.json'
import { archiveGoalEntry, unarchiveGoalEntry } from '@/app/(authenticated)/goals/entries/actions'
import { Button } from '@/components/ui/button'
import { Dialog, DialogClose, DialogFormContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Sheet, SheetClose, SheetFormContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { EditGoalEntryDialog } from '@/components/EditGoalEntryDialog'
import { ConvertGoalEntryToActionDialog } from '@/components/ConvertGoalEntryToActionDialog'
import { ConfirmDeleteGoalEntryDialog } from '@/components/ConfirmDeleteGoalEntryDialog'
import { RichTextContentView } from '@/components/RichTextContentView'
import { RichTextImagePreviewDialog } from '@/components/RichTextImagePreviewDialog'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { useMediaQuery } from '@/components/ui/use-media-query'
import { cn } from '@/lib/utils'
import type { GoalEntry } from '@/components/goal-entry.types'
import { ModalActionFooter } from '@/components/ModalActionFooter'
import { ModalHeaderActions } from '@/components/ModalHeaderActions'
import { DESKTOP_MODAL_SHELL_CLASS, TABLET_AND_UP_MEDIA_QUERY } from '@/components/responsive-classes'
import { getGoalEntryFooterLayout } from '@/components/goal-entry-footer-layout'

type Dict = typeof en

type GoalEntryDetailsSheetProps = {
	open: boolean
	onOpenChange: (next: boolean) => void
	entry: GoalEntry
	goalId: string
	dict: Dict
	startDefault: string
	endDefault: string
	enabled?: boolean
}

export function GoalEntryDetailsSheet({
	open,
	onOpenChange,
	entry,
	goalId,
	dict,
	startDefault,
	endDefault,
	enabled = true
}: GoalEntryDetailsSheetProps) {
	useEffect(() => {
		if (enabled) return
		if (open) onOpenChange(false)
	}, [enabled, onOpenChange, open])

	if (!enabled) return null

	return (
		<GoalEntryDetailsSheetInner
			open={open}
			onOpenChange={onOpenChange}
			entry={entry}
			goalId={goalId}
			dict={dict}
			startDefault={startDefault}
			endDefault={endDefault}
		/>
	)
}

function GoalEntryDetailsSheetInner({
	open,
	onOpenChange,
	entry,
	goalId,
	dict,
	startDefault,
	endDefault
}: Omit<GoalEntryDetailsSheetProps, 'enabled'>) {
	const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null)
	const [actionError, setActionError] = useState<string | null>(null)
	const [isArchivePending, startArchiveTransition] = useTransition()
	const isTabletAndUp = useMediaQuery(TABLET_AND_UP_MEDIA_QUERY)
	const footerLayout = getGoalEntryFooterLayout(isTabletAndUp)

	const isJourney = entry.kind === 'journey'
	const isArchived = entry.status === 'archived'
	const kindLabel = isJourney ? dict.goals.detail.tabJourney : dict.goals.detail.tabInspiration
	const dateText = new Intl.DateTimeFormat(dict.common.locale, { year: 'numeric', month: '2-digit', day: '2-digit' }).format(
		new Date(entry.created_at)
	)
	const timeText = new Intl.DateTimeFormat(dict.common.locale, { hour: '2-digit', minute: '2-digit' }).format(new Date(entry.created_at))
	const locale = String(dict.common.locale || '').toLowerCase()
	const noteLabel = dict.quickCapture.noteLabel || (locale.startsWith('zh') ? '补充说明' : 'Notes')

	function handleOpenChange(next: boolean) {
		onOpenChange(next)
		if (!next) {
			setActionError(null)
			setPreviewImageUrl(null)
		}
	}

	function handleArchiveOrRestore() {
		setActionError(null)
		startArchiveTransition(async () => {
			try {
				const formData = new FormData()
				formData.set('id', entry.id)
				formData.set('goal_id', goalId)
				if (isArchived) {
					await unarchiveGoalEntry(formData)
				} else {
					await archiveGoalEntry(formData)
				}
				onOpenChange(false)
			} catch (err) {
				const key = err instanceof Error ? err.message : 'operation_failed'
				const errors = dict.common.errors as unknown as Record<string, string>
				setActionError(errors[key] || dict.common.errors.operation_failed)
			}
		})
	}

	const headerBadges = (
		<div className="mt-3 flex flex-wrap items-center gap-2">
			<div
				className={cn(
					'inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-medium',
					isJourney ? 'border-primary/20 bg-primary/10 text-primary' : 'border-amber-500/20 bg-amber-500/10 text-amber-700 dark:text-amber-300'
				)}
			>
				{isJourney ? <Sparkles className="h-3.5 w-3.5" /> : <Lightbulb className="h-3.5 w-3.5" />}
				{kindLabel}
			</div>
			<div className="inline-flex items-center gap-1 rounded-full border border-border/60 bg-background/80 px-2.5 py-1 text-[11px] text-muted-foreground">
				<CalendarDays className="h-3.5 w-3.5" />
				{dateText} {timeText}
			</div>
			{isArchived ? (
				<div className="rounded-full border border-border/60 bg-muted px-2.5 py-1 text-[11px] text-muted-foreground">
					{dict.goals.status.archived}
				</div>
			) : null}
		</div>
	)

	const content = (
		<div
			className={cn(
				'min-h-0 flex-1 overflow-y-auto px-4 pt-4',
				isTabletAndUp ? 'pb-4 sm:px-6 sm:pb-6' : 'pb-[calc(env(safe-area-inset-bottom)+1rem)]'
			)}
		>
			<div className="space-y-4">
				<div className="rounded-2xl border border-border/60 bg-background/85 px-4 py-3">
					<RichTextContentView html={entry.content} onImageClick={setPreviewImageUrl} />
				</div>

				{entry.note ? (
					<div
						className={cn(
							'rounded-2xl border px-4 py-3',
							isJourney ? 'border-primary/12 bg-primary/4' : 'border-amber-500/12 bg-amber-500/4'
						)}
					>
						<div className="mb-2 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">{noteLabel}</div>
						<div className="whitespace-pre-wrap wrap-break-word text-sm leading-7 text-muted-foreground">{entry.note}</div>
					</div>
				) : null}

				{actionError ? <div className="text-sm text-destructive">{actionError}</div> : null}
			</div>
		</div>
	)

	const footer = (
		<ModalActionFooter className={cn('px-4', isTabletAndUp && 'md:px-6 md:pt-4 md:pb-6')}>
			<div
				className={cn(
					footerLayout === 'row' ? 'flex flex-wrap justify-end gap-2' : 'grid grid-cols-2 gap-2'
				)}
			>
				{isArchived ? (
					<>
						<Button
							type="button"
							size="sm"
							onClick={handleArchiveOrRestore}
							disabled={isArchivePending}
							className={cn(footerLayout === 'grid' && 'w-full', 'gap-2')}
						>
							{isArchivePending ? <LoadingSpinner className="h-4 w-4 text-current" /> : <Undo2 className="h-4 w-4" />}
							{dict.goals.detail.unarchive}
						</Button>
						<ConfirmDeleteGoalEntryDialog
							id={entry.id}
							goalId={goalId}
							dict={dict}
							onSuccess={() => onOpenChange(false)}
							trigger={
								<Button
									type="button"
									size="sm"
									variant={footerLayout === 'row' ? 'outline' : 'ghost'}
									className={cn(
										footerLayout === 'grid' && 'w-full',
										'gap-1',
										footerLayout === 'row'
											? 'border-destructive/30 text-destructive hover:border-destructive/40 hover:bg-destructive/10 hover:text-destructive focus-visible:ring-destructive/30'
											: 'text-muted-foreground hover:text-destructive'
									)}
								>
									<Trash2 className="h-4 w-4" />
									{dict.common.delete}
								</Button>
							}
						/>
					</>
				) : footerLayout === 'row' ? (
					<>
						<ConfirmDeleteGoalEntryDialog
							id={entry.id}
							goalId={goalId}
							dict={dict}
							onSuccess={() => onOpenChange(false)}
							trigger={
								<Button
									type="button"
									size="sm"
									variant="outline"
									className={cn(
										'gap-1',
										'border-destructive/30 text-destructive hover:border-destructive/40 hover:bg-destructive/10 hover:text-destructive focus-visible:ring-destructive/30'
									)}
								>
									<Trash2 className="h-4 w-4" />
									{dict.common.delete}
								</Button>
							}
						/>
						<Button
							type="button"
							size="sm"
							variant="outline"
							onClick={handleArchiveOrRestore}
							disabled={isArchivePending}
							className="gap-1"
						>
							{isArchivePending ? <LoadingSpinner className="h-4 w-4 text-current" /> : <Archive className="h-4 w-4" />}
							{dict.goals.detail.archiveEntry}
						</Button>
						<ConvertGoalEntryToActionDialog
							entry={{ id: entry.id, content: entry.content, note: entry.note }}
							goalId={goalId}
							dict={dict}
							startDefault={startDefault}
							endDefault={endDefault}
							onSuccess={() => onOpenChange(false)}
							trigger={
								<Button size="sm" variant="outline" className="gap-1">
									<ListChecks className="h-4 w-4" />
									{dict.goals.detail.convertToAction}
								</Button>
							}
						/>
						<EditGoalEntryDialog
							entry={{ id: entry.id, kind: entry.kind, content: entry.content, note: entry.note }}
							goalId={goalId}
							dict={dict}
							onSuccess={() => onOpenChange(false)}
							trigger={
								<Button size="sm" variant="outline" className="gap-1">
									<Pencil className="h-4 w-4" />
									{dict.common.edit}
								</Button>
							}
						/>
					</>
				) : (
					<>
						<EditGoalEntryDialog
							entry={{ id: entry.id, kind: entry.kind, content: entry.content, note: entry.note }}
							goalId={goalId}
							dict={dict}
							onSuccess={() => onOpenChange(false)}
							trigger={
								<Button size="sm" variant="outline" className="w-full gap-1">
									<Pencil className="h-4 w-4" />
									{dict.common.edit}
								</Button>
							}
						/>
						<ConvertGoalEntryToActionDialog
							entry={{ id: entry.id, content: entry.content, note: entry.note }}
							goalId={goalId}
							dict={dict}
							startDefault={startDefault}
							endDefault={endDefault}
							onSuccess={() => onOpenChange(false)}
							trigger={
								<Button size="sm" variant="outline" className="w-full gap-1">
									<ListChecks className="h-4 w-4" />
									{dict.goals.detail.convertToAction}
								</Button>
							}
						/>
						<Button type="button" size="sm" variant="outline" onClick={handleArchiveOrRestore} disabled={isArchivePending} className="w-full gap-1">
							{isArchivePending ? <LoadingSpinner className="h-4 w-4 text-current" /> : <Archive className="h-4 w-4" />}
							{dict.goals.detail.archiveEntry}
						</Button>
						<ConfirmDeleteGoalEntryDialog
							id={entry.id}
							goalId={goalId}
							dict={dict}
							onSuccess={() => onOpenChange(false)}
							trigger={
								<Button type="button" size="sm" variant="ghost" className="w-full gap-1 text-muted-foreground hover:text-destructive">
									<Trash2 className="h-4 w-4" />
									{dict.common.delete}
								</Button>
							}
						/>
					</>
				)}
			</div>
		</ModalActionFooter>
	)

	return (
		<>
			{isTabletAndUp ? (
				<Dialog open={open} onOpenChange={handleOpenChange}>
					<DialogFormContent hideCloseButton className={cn('max-w-2xl overflow-hidden p-0 sm:p-0', DESKTOP_MODAL_SHELL_CLASS)}>
						<div className="flex min-h-0 flex-col max-h-[85vh]">
							<DialogHeader className="border-b border-border/60 px-4 pb-3 pt-4 text-left sm:px-6 sm:pt-6">
								<div className="flex items-start justify-between gap-3">
									<div className="min-w-0 flex-1">
										<DialogTitle className="text-left leading-snug">{kindLabel}</DialogTitle>
										{headerBadges}
									</div>
									<ModalHeaderActions renderCloseButton={(button) => <DialogClose asChild>{button}</DialogClose>} />
								</div>
							</DialogHeader>
							{content}
							{footer}
						</div>
					</DialogFormContent>
				</Dialog>
			) : (
				<Sheet open={open} onOpenChange={handleOpenChange}>
					<SheetFormContent side="bottom" mobileMode="sheet" className="max-h-[85vh] overflow-hidden rounded-t-2xl p-0">
						<div className="flex min-h-0 max-h-[85vh] flex-col">
							<SheetHeader className="border-b border-border/60 px-4 pb-3 pt-4 text-left">
								<div className="flex items-start justify-between gap-3">
									<div className="min-w-0 flex-1">
										<SheetTitle className="text-left leading-snug">{kindLabel}</SheetTitle>
										{headerBadges}
									</div>
									<ModalHeaderActions renderCloseButton={(button) => <SheetClose asChild>{button}</SheetClose>} />
								</div>
							</SheetHeader>
							{content}
							{footer}
						</div>
					</SheetFormContent>
				</Sheet>
			)}

			<RichTextImagePreviewDialog
				open={Boolean(previewImageUrl)}
				imageUrl={previewImageUrl}
				title={dict.common.imagePreviewTitle}
				openOriginalLabel={dict.common.openOriginal}
				onOpenChange={(nextOpen) => {
					if (!nextOpen) setPreviewImageUrl(null)
				}}
			/>
		</>
	)
}
