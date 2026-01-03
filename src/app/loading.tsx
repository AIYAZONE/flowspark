import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { getDictionary } from "@/i18n/get-dictionary";

export default async function Loading() {
  const dict = await getDictionary();

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm z-50">
      <div className="flex flex-col items-center gap-4">
        <LoadingSpinner size={48} />
        <p className="text-muted-foreground animate-pulse">{dict.common.loading}</p>
      </div>
    </div>
  );
}
