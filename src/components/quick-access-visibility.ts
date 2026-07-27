export function shouldHideQuickAccess(pathname: string) {
  return pathname === '/system' || pathname === '/chat'
}

