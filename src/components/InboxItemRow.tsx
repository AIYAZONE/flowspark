import { archiveInboxItem, convertInboxItemToAction, deleteInboxItem } from '@/app/(authenticated)/inbox/actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import type en from '@/i18n/en.json'

type Dict = typeof en

export function InboxItemRow({
	item,
	activeGoals,
	dict,
	tz,
	startDefault,
	endDefault
}: {
	item: { id: string; content: string; note: string; tags: string[]; created_at: string }
	activeGoals: { id: string; title: string }[]
	dict: Dict
	tz: string
	startDefault: string
	endDefault: string
}) {
	const created = new Intl.DateTimeFormat(dict?.common?.locale ?? 'en-CA', {
		timeZone: tz,
		year: 'numeric',
		month: '2-digit',
		day: '2-digit'
	}).format(new Date(item.created_at))

	const convertLabel = dict?.inbox?.convert ?? 'Convert to Action'
	const archiveLabel = dict?.inbox?.archive ?? 'Archive'
	const deleteLabel = dict?.common?.delete ?? 'Delete'
	const createdLabel = dict?.inbox?.createdAt ?? 'Created'

	return (
		<div className="rounded-2xl border border-border/40 bg-background/50 backdrop-blur-xl p-4 space-y-3">
			<div className="flex items-start justify-between gap-3">
				<div className="min-w-0">
					<div className="text-sm font-medium break-words">{item.content}</div>
					{item.note ? (
						<div className="mt-1 text-sm text-muted-foreground whitespace-pre-wrap">{item.note}</div>
					) : null}
					<div className="mt-2 flex flex-wrap gap-2 text-xs text-muted-foreground">
						<span>{createdLabel} {created}</span>
						{item.tags.map((t) => (
							<span
								key={t}
								className="px-2 py-0.5 rounded-full bg-secondary/50 text-secondary-foreground border border-border/50"
							>
								{t}
							</span>
						))}
					</div>
				</div>
				<div className="flex items-center gap-2 shrink-0">
					<form action={archiveInboxItem}>
						<input type="hidden" name="id" value={item.id} />
						<Button type="submit" size="sm" variant="outline">{archiveLabel}</Button>
					</form>
					<form action={deleteInboxItem}>
						<input type="hidden" name="id" value={item.id} />
						<Button type="submit" size="sm" variant="ghost">{deleteLabel}</Button>
					</form>
				</div>
			</div>

			<details className="rounded-lg border border-border/50 bg-muted/10 p-3">
				<summary className="cursor-pointer text-sm font-medium">{convertLabel}</summary>
				<div className="mt-3 space-y-3">
					<form action={convertInboxItemToAction} className="space-y-3">
						<input type="hidden" name="inbox_id" value={item.id} />
						<div className="grid gap-2">
							<Label htmlFor="goal_id">{dict?.today?.goalLabel ?? 'Goal'}</Label>
							<select
								name="goal_id"
								defaultValue={activeGoals[0]?.id ?? ''}
								className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background/50 px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
								required
							>
								{activeGoals.map((g) => (
									<option key={g.id} value={g.id}>{g.title}</option>
								))}
							</select>
						</div>

						<div className="grid gap-2">
							<Label htmlFor="title">{dict?.today?.actionTitleLabel ?? 'Title'}</Label>
							<Input name="title" defaultValue={item.content} required />
						</div>

						<div className="grid gap-2">
							<Label htmlFor="description">{dict?.today?.descriptionLabel ?? 'Description'}</Label>
							<Textarea name="description" defaultValue={item.note} className="min-h-[80px]" />
						</div>

						<div className="grid grid-cols-2 gap-3">
							<div className="grid gap-2">
								<Label htmlFor="type">{dict?.today?.typeLabel ?? 'Type'}</Label>
								<select
									name="type"
									defaultValue="core"
									className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background/50 px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
								>
									<option value="core">{dict?.today?.types?.core ?? 'Core'}</option>
									<option value="maintenance">{dict?.today?.types?.maintenance ?? 'Maintenance'}</option>
									<option value="learning">{dict?.today?.types?.learning ?? 'Learning'}</option>
									<option value="review">{dict?.today?.types?.review ?? 'Review'}</option>
									<option value="rest">{dict?.today?.types?.rest ?? 'Rest'}</option>
								</select>
							</div>
							<div className="grid gap-2">
								<Label htmlFor="priority">{dict?.today?.priorityLabel ?? 'Priority'}</Label>
								<select
									name="priority"
									defaultValue="medium"
									className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background/50 px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
								>
									<option value="high">{dict?.goals?.priority?.high ?? 'High'}</option>
									<option value="medium">{dict?.goals?.priority?.medium ?? 'Medium'}</option>
									<option value="low">{dict?.goals?.priority?.low ?? 'Low'}</option>
								</select>
							</div>
						</div>

						<div className="grid grid-cols-2 gap-3">
							<div className="grid gap-2">
								<Label htmlFor="start_date">{dict?.today?.startTime ?? 'Start'}</Label>
								<Input type="date" name="start_date" defaultValue={startDefault} required />
							</div>
							<div className="grid gap-2">
								<Label htmlFor="end_date">{dict?.today?.endTime ?? 'End'}</Label>
								<Input type="date" name="end_date" defaultValue={endDefault} required />
							</div>
						</div>

						<div className="flex justify-end">
							<Button type="submit" size="sm">{dict?.common?.save ?? 'Save'}</Button>
						</div>
					</form>
				</div>
			</details>
		</div>
	)
}
