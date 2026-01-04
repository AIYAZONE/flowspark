'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { Trash2, AlertTriangle } from 'lucide-react'
import { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { deleteAccount } from '@/app/(authenticated)/profile/actions'

interface Dict {
  profile: {
    dangerZone: string
    deleteAccount: string
    deleteAccountDesc: string
    confirmDeleteTitle: string
    confirmDeleteDesc: string
    deleteConfirmLabelPrefix: string
    deleteConfirmLabelSuffix: string
    deletePlaceholder: string
    deleting: string
  }
  common: {
    cancel: string
    error: string
  }
}

export function DangerZoneCard({ dict, userEmail }: { dict: Dict; userEmail: string }) {
  const [isDeleting, setIsDeleting] = useState(false)
  const [deleteConfirmation, setDeleteConfirmation] = useState('')

  async function handleDeleteAccount() {
    setIsDeleting(true)
    try {
      await deleteAccount()
    } catch (err) {
      setIsDeleting(false)
    }
  }

  return (
    <Card className="border-destructive/20 bg-destructive/5 shadow-none">
      <CardHeader>
        <CardTitle className="text-destructive/80 flex items-center gap-2 text-lg">
          <AlertTriangle className="h-5 w-5" />
          {dict.profile.dangerZone}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">{dict.profile.deleteAccountDesc}</p>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="outline" className="w-full sm:w-auto text-destructive hover:text-destructive hover:bg-destructive/10 border-destructive/20">
              <Trash2 className="h-4 w-4 mr-2" />
              {isDeleting ? dict.profile.deleting : dict.profile.deleteAccount}
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>{dict.profile.confirmDeleteTitle}</AlertDialogTitle>
              <AlertDialogDescription>{dict.profile.confirmDeleteDesc}</AlertDialogDescription>
            </AlertDialogHeader>
            <div className="grid gap-2 py-2">
              <Label htmlFor="delete-confirm">
                {dict.profile.deleteConfirmLabelPrefix}
                <span className="font-bold text-base select-all bg-muted px-1 py-0.5 rounded border border-border/50">{userEmail}</span>
                {dict.profile.deleteConfirmLabelSuffix}
              </Label>
              <Input
                id="delete-confirm"
                value={deleteConfirmation}
                onChange={(e) => setDeleteConfirmation(e.target.value)}
                placeholder={dict.profile.deletePlaceholder}
                autoComplete="off"
              />
            </div>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setDeleteConfirmation('')}>{dict.common.cancel}</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDeleteAccount}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                disabled={isDeleting || deleteConfirmation !== userEmail}
              >
                {isDeleting && <LoadingSpinner size={16} className="mr-2" />}
                {dict.profile.deleteAccount}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </CardContent>
    </Card>
  )
}
