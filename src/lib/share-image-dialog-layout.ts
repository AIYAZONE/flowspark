export function getSharePreviewHeightClass() {
  return 'h-[min(52vh,560px)] md:h-[min(62vh,720px)]'
}

export function canOpenSharePreviewFullscreen(params: { imageDataUrl: string | null; isGenerating: boolean }) {
  return Boolean(params.imageDataUrl) && !params.isGenerating
}
