'use client'

import { useEffect, useState } from 'react'

export function useMediaQuery(query: string, options?: { defaultValue?: boolean }) {
	const [matches, setMatches] = useState<boolean>(options?.defaultValue ?? false)

	useEffect(() => {
		if (typeof window === 'undefined') return
		const media = window.matchMedia(query)
		const sync = () => setMatches(media.matches)
		sync()
		if (typeof media.addEventListener === 'function') {
			media.addEventListener('change', sync)
			return () => media.removeEventListener('change', sync)
		}
		media.addListener(sync)
		return () => media.removeListener(sync)
	}, [query])

	return matches
}
