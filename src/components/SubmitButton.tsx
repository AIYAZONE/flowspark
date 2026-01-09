'use client'

import { useFormStatus } from 'react-dom'
import { Button, ButtonProps } from '@/components/ui/button'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import React from 'react'

export function SubmitButton(props: ButtonProps) {
  const { pending } = useFormStatus()
  const { children, disabled, ...rest } = props
  const childArray = React.Children.toArray(children)
  const textChildren = childArray.filter((c) => typeof c === 'string')
  return (
    <Button type="submit" disabled={pending || disabled} {...rest}>
      {pending ? (
        <>
          <LoadingSpinner size={16} className="text-current mr-2" />
          <span>{textChildren.length ? textChildren : children}</span>
        </>
      ) : (
        children
      )}
    </Button>
  )
}
