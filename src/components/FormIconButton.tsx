'use client'

import type { ComponentProps, ReactNode } from 'react'
import { Button, type ButtonProps } from '@/components/ui/button'
import { HoverLabel } from '@/components/HoverLabel'

type HiddenField = { name: string; value: string }

export function FormIconButton({
	action,
	fields,
	label,
	title,
	ariaLabel,
	buttonProps,
	formProps,
	children
}: {
	action: NonNullable<ComponentProps<'form'>['action']>
	fields: HiddenField[]
	label: string
	title: string
	ariaLabel: string
	buttonProps?: Omit<ButtonProps, 'type' | 'title' | 'aria-label' | 'children'>
	formProps?: Omit<ComponentProps<'form'>, 'action' | 'children'>
	children: ReactNode
}) {
	return (
		<form action={action} {...formProps}>
			{fields.map((f, index) => (
				<input key={`${f.name}:${index}`} type="hidden" name={f.name} value={f.value} />
			))}
			<HoverLabel label={label}>
				<Button type="submit" variant="ghost" size="icon" title={title} aria-label={ariaLabel} {...buttonProps}>
					{children}
				</Button>
			</HoverLabel>
		</form>
	)
}
