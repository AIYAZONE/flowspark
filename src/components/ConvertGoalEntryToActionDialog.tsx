'use client'

import { useRef, useState, useTransition } from 'react'
import { Maximize2, Minimize2, X } from 'lucide-react'
import type en from '@/i18n/en.json'
import { Dialog, DialogClose, DialogFormContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { DateRangeFields } from '@/components/DateRangeFields'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { convertGoalEntryToAction } from '@/app/(authenticated)/goals/entries/actions'
import { useMobileInputVisible, useMobileKeyboardInset } from '@/components/ui/use-mobile-input-visible'
import { cn, stripHtmlToPlainText } from '@/lib/utils'

type Dict = typeof en

export function ConvertGoalEntryToActionDialog({
	entry,
	goalId,
	dict,
	startDefault,
	endDefault,
	trigger,
	onSuccess
}: {
	entry: { id: string; content: string; note: string }
	goalId: string
	dict: Dict
	startDefault: string
	endDefault: string
	trigger: React.ReactNode
	onSuccess?: () => void
}) {
	const [open, setOpen] = useState(false)
	const [isDesktopFullscreen, setIsDesktopFullscreen] = useState(false)
	const [isPending, startTransition] = useTransition()
	const [error, setError] = useState<string | null>(null)
	const titleRef = useRef<HTMLInputElement | null>(null)

	const plainEntryTitle = stripHtmlToPlainText(entry.content)
	const [title, setTitle] = useState(plainEntryTitle)
	const [description, setDescription] = useState(entry.note || '')
	const [type, setType] = useState('core')
	const [priority, setPriority] = useState('medium')

	function handleOpenChange(next: boolean) {
		setOpen(next)
		if (!next) {
			setIsDesktopFullscreen(false)
			return
		}
		setError(null)
		setTitle(plainEntryTitle)
		setDescription(entry.note || '')
		setType('core')
		setPriority('medium')
	}

	useMobileInputVisible(open, titleRef)
	const keyboardInset = useMobileKeyboardInset(open)

	async function handleSubmit(formData: FormData) {
		setError(null)
		startTransition(async () => {
			try {
				await convertGoalEntryToAction(formData)
				setOpen(false)
				onSuccess?.()
			} catch (err) {
				const key = err instanceof Error ? err.message : 'operation_failed'
				const errors = dict.common.errors as unknown as Record<string, string>
				setError(errors[key] || dict.common.errors.operation_failed)
			}
		})
	}

	return (
		<Dialog open={open} onOpenChange={handleOpenChange}>
			<DialogTrigger asChild>{trigger}</DialogTrigger>
			<DialogFormContent
				mobileMode="fullscreen"
				hideCloseButton
				className={cn(
					'p-0',
					isDesktopFullscreen
						? 'md:inset-0! md:h-dvh! md:w-screen! md:max-w-none! md:translate-x-0! md:translate-y-0! md:rounded-none! md:border-0!'
						: 'md:left-[50%]! md:right-auto! md:top-[50%]! md:bottom-auto! md:h-auto! md:w-full! md:max-w-3xl! md:translate-x-[-50%]! md:translate-y-[-50%]! md:rounded-lg! md:border! md:pb-6!'
				)}
			>
				<div className={cn('flex flex-col', isDesktopFullscreen ? 'h-full' : 'h-full md:max-h-[90dvh]')}>
					<DialogHeader className="border-b border-border/60 px-4 pb-3 pt-4 text-left md:px-6 md:pb-4 md:pt-6">
						<div className="flex items-start justify-between gap-3">
							<DialogTitle className="min-w-0 flex-1 text-left leading-snug">{dict.goals.detail.convertToAction}</DialogTitle>
							<div className="flex shrink-0 items-center gap-1">
								<Button
									type="button"
									variant="ghost"
									size="icon"
									className="h-8 w-8 rounded-full text-muted-foreground hover:bg-muted hover:text-foreground"
									onClick={() => setIsDesktopFullscreen((value) => !value)}
								>
									{isDesktopFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
									<span className="sr-only">{isDesktopFullscreen ? dict.common.exitFullscreen : dict.common.fullscreen}</span>
								</Button>
								<DialogClose asChild>
									<Button
										type="button"
										variant="ghost"
										size="icon"
										className="h-8 w-8 rounded-full text-muted-foreground hover:bg-muted hover:text-foreground"
									>
										<X className="h-4 w-4" />
										<span className="sr-only">Close</span>
									</Button>
								</DialogClose>
							</div>
						</div>
					</DialogHeader>

					<form action={handleSubmit} className="flex min-h-0 flex-1 flex-col">
						<input type="hidden" name="entry_id" value={entry.id} />
						<input type="hidden" name="goal_id" value={goalId} />

						<div
							className="min-h-0 flex-1 space-y-5 overflow-y-auto px-4 py-4 md:px-6"
							style={{ paddingBottom: keyboardInset > 0 ? Math.max(16, keyboardInset * 0.35) : undefined }}
						>
							<div className="space-y-2">
								<Label htmlFor={`title-${entry.id}`}>{dict.inbox.actionTitleLabel}</Label>
								<Input
									ref={titleRef}
									id={`title-${entry.id}`}
									name="title"
									value={title}
									onChange={(e) => setTitle(e.target.value)}
									required
								/>
							</div>

							<div className="space-y-2">
								<Label htmlFor={`desc-${entry.id}`}>{dict.inbox.actionDescLabel}</Label>
								<Textarea
									id={`desc-${entry.id}`}
									name="description"
									value={description}
									onChange={(e) => setDescription(e.target.value)}
									rows={8}
									className="min-h-[28dvh] md:min-h-[220px]"
								/>
							</div>

							<DateRangeFields
								defaultStart={startDefault}
								defaultEnd={endDefault}
								className="grid-cols-1 md:grid-cols-2"
								labels={{
									start: dict.today.startTime,
									end: dict.today.endTime,
									error: dict.common.dateRangeInvalid
								}}
							/>

							<div className="grid grid-cols-1 gap-4 md:grid-cols-2">
								<div className="space-y-2">
									<Label>{dict.today.typeLabel}</Label>
									<Select value={type} onValueChange={setType}>
										<SelectTrigger>
											<SelectValue />
										</SelectTrigger>
										<SelectContent>
											<SelectItem value="core">{dict.today.types.core}</SelectItem>
											<SelectItem value="maintenance">{dict.today.types.maintenance}</SelectItem>
											<SelectItem value="learning">{dict.today.types.learning}</SelectItem>
											<SelectItem value="review">{dict.today.types.review}</SelectItem>
											<SelectItem value="rest">{dict.today.types.rest}</SelectItem>
										</SelectContent>
									</Select>
									<input type="hidden" name="type" value={type} />
								</div>

								<div className="space-y-2">
									<Label>{dict.today.priorityLabel}</Label>
									<Select value={priority} onValueChange={setPriority}>
										<SelectTrigger>
											<SelectValue />
										</SelectTrigger>
										<SelectContent>
											<SelectItem value="high">{dict.goals.priority.high}</SelectItem>
											<SelectItem value="medium">{dict.goals.priority.medium}</SelectItem>
											<SelectItem value="low">{dict.goals.priority.low}</SelectItem>
										</SelectContent>
									</Select>
									<input type="hidden" name="priority" value={priority} />
								</div>
							</div>

							{error ? <div className="text-sm text-destructive">{error}</div> : null}
						</div>

						<div
							className="border-t border-border/60 bg-background/95 px-4 py-3 backdrop-blur md:bg-background/95 md:px-6 md:py-4"
							style={{ paddingBottom: open && keyboardInset > 0 ? `calc(env(safe-area-inset-bottom) + ${keyboardInset}px)` : undefined }}
						>
							<div className="flex items-center justify-end gap-2">
								<Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={isPending}>
									{dict.common.cancel}
								</Button>
								<Button type="submit" disabled={isPending || !title.trim()}>
									{isPending ? (
										<>
											<LoadingSpinner className="mr-2 h-4 w-4 text-current" />
											{dict.common.saving}
										</>
									) : (
										dict.goals.detail.convertToAction
									)}
								</Button>
							</div>
						</div>
					</form>
				</div>
			</DialogFormContent>
		</Dialog>
	)
}
