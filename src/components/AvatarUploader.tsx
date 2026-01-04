'use client'

import { useEffect, useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { UploadCloud, Camera } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

interface UploaderDict {
  profile: {
    avatar: string
    uploadOrChange: string
    uploadHint: string
    uploadErrorSize: string
    uploadErrorType: string
  }
  common: {
    error: string
  }
}

export function AvatarUploader({
  userId,
  currentUrl,
  dict,
  onChange,
  onChangeUrl,
}: {
  userId: string,
  currentUrl?: string,
  dict: UploaderDict,
  onChange: (file: File | null) => void,
  onChangeUrl: (url: string | null) => void,
}) {
  const [avatarUrl, setAvatarUrl] = useState(currentUrl || '')
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const supabase = createClient()

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setError(null)
    const MAX_SIZE = 2 * 1024 * 1024
    const allowedTypes = ['image/png', 'image/jpeg', 'image/webp']
    if (file.size > MAX_SIZE) {
      setError(dict.profile.uploadErrorSize)
      return
    }
    if (!allowedTypes.includes(file.type)) {
      setError(dict.profile.uploadErrorType)
      return
    }
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl)
      setPreviewUrl(null)
    }
    const localUrl = URL.createObjectURL(file)
    setPreviewUrl(localUrl)
    onChange(file)
    // upload immediately to storage and return public URL to parent
    const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg'
    const path = `${userId}/${Date.now()}.${ext}`
    const { error: uploadError } = await supabase.storage.from('avatars').upload(path, file, {
      upsert: true,
      contentType: file.type || `image/${ext}`
    })
    if (uploadError) {
      setError(uploadError.message)
      return
    }
    const { data } = supabase.storage.from('avatars').getPublicUrl(path)
    const url = data.publicUrl
    setAvatarUrl(url)
    onChangeUrl(url)
  }

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl)
    }
  }, [previewUrl])

  return (
    <div className="grid gap-3">
      <div className="grid gap-2">
        <div className="flex items-center gap-6">
          <input
            ref={fileInputRef}
            id="avatar_file"
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="hidden"
          />
          <div
            className="relative h-20 w-20 min-w-[5rem] rounded-full overflow-hidden ring-2 ring-border bg-muted cursor-pointer group flex-shrink-0"
            onClick={() => fileInputRef.current?.click()}
            aria-label="Upload avatar"
          >
            {(previewUrl || avatarUrl || currentUrl) ? (
              <img
                src={previewUrl || avatarUrl || currentUrl || undefined}
                alt="avatar"
                className="h-full w-full object-cover transition-opacity group-hover:opacity-75"
                onError={() => {
                  setPreviewUrl(null)
                  setAvatarUrl('')
                  onChangeUrl(null)
                }}
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center text-muted-foreground bg-secondary/50">
                <Camera className="h-8 w-8" />
              </div>
            )}
            <div className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity">
              <Camera className="h-6 w-6 text-white" />
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <Button type="button" variant="outline" size="sm" onClick={() => fileInputRef.current?.click()} className="w-fit gap-2">
              <UploadCloud className="h-4 w-4" />
              {dict.profile.uploadOrChange}
            </Button>
            <p className="text-xs text-muted-foreground">
              {dict.profile.uploadHint}
            </p>
          </div>
        </div>
      </div>
      {error && (
        <div className="text-xs text-red-600">{dict.common.error}: {error}</div>
      )}
    </div>
  )
}
