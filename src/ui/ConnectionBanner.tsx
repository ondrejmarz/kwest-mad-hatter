/** Presentational offline strip. Online state is supplied by the app layer. */
export function ConnectionBanner({ online, message }: { online: boolean; message: string }) {
  if (online) {
    return null;
  }
  return (
    <div role="status" className="bg-warning/15 px-4 py-1 text-center text-xs text-warning">
      {message}
    </div>
  );
}
