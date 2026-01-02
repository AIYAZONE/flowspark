'use client'

import { useFormStatus } from 'react-dom'
import { Button, ButtonProps } from '@/components/ui/button'
import { LoadingSpinner } from '@/components/ui/loading-spinner'

export function SubmitButton({ children, ...props }: ButtonProps) {
  const { pending } = useFormStatus()
  return (
    <Button type="submit" disabled={pending || props.disabled} {...props}>
      {pending && <LoadingSpinner size={16} className="mr-2 text-current" />}
      {children}
    </Button>
  )
}
