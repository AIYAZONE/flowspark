'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { Trash2, ChevronDown, ChevronRight } from 'lucide-react'
import { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { deleteAccount } from '@/app/(authenticated)/profile/actions'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'

interface Dict {
  profile: {
    advancedActions: string
    dangerZone: string
    deleteAccount: string
    deleteAccountDesc: string
    confirmDeleteTitle: string
    confirmDeleteDesc: string
    deleteAcknowledge: string
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
  const [acknowledged, setAcknowledged] = useState(false)
  const [advancedOpen, setAdvancedOpen] = useState(false)

  async function handleDeleteAccount() {
    setIsDeleting(true)
    try {
      await deleteAccount()
    } catch (err) {
      setIsDeleting(false)
    }
  }

  return (
    <Card className="shadow-none">
      <CardHeader>
        <CardTitle className="text-base">{dict.profile.advancedActions}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Collapsible open={advancedOpen} onOpenChange={setAdvancedOpen}>
          <CollapsibleTrigger asChild>
            <button type="button" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
              {advancedOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
              {dict.profile.dangerZone}
            </button>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <div className="pt-3 space-y-3">
              <p className="text-sm text-muted-foreground">{dict.profile.deleteAccountDesc}</p>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    type="button"
                    variant="ghost"
                    className="px-0 text-destructive hover:text-destructive hover:bg-transparent"
                    onClick={() => {
                      setDeleteConfirmation('')
                      setAcknowledged(false)
                    }}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    {dict.profile.deleteAccount}
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>{dict.profile.confirmDeleteTitle}</AlertDialogTitle>
                    <AlertDialogDescription>{dict.profile.confirmDeleteDesc}</AlertDialogDescription>
                  </AlertDialogHeader>

                  <div className="grid gap-3 py-2">
                    <div className="flex items-center gap-2">
                      <input
                        id="delete-ack"
                        type="checkbox"
                        className="h-4 w-4 shrink-0 rounded border-border accent-destructive focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ring-offset-background cursor-pointer"
                        checked={acknowledged}
                        onChange={(e) => setAcknowledged(e.target.checked)}
                      />
                      <Label htmlFor="delete-ack" className="text-sm leading-snug">
                        {dict.profile.deleteAcknowledge}
                      </Label>
                    </div>

                    <div className="grid gap-2">
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
                  </div>

                  <AlertDialogFooter>
                    <AlertDialogCancel
                      onClick={() => {
                        setDeleteConfirmation('')
                        setAcknowledged(false)
                      }}
                    >
                      {dict.common.cancel}
                    </AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleDeleteAccount}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      disabled={isDeleting || !acknowledged || deleteConfirmation !== userEmail}
                    >
                      {isDeleting && <LoadingSpinner size={16} className="mr-2" />}
                      {dict.profile.deleteAccount}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </CollapsibleContent>
        </Collapsible>
      </CardContent>
    </Card>
  )
}
