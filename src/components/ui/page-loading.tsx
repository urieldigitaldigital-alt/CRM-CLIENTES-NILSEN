import { Spinner } from "@/components/ui/spinner";

export function PageLoading() {
  return (
    <div className="flex min-h-[50vh] items-center justify-center animate-fade-in">
      <Spinner className="size-6 text-muted" />
    </div>
  );
}
