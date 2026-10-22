export function PhoneFrame({ children, height = 640 }: { children: React.ReactNode; height?: number }) {
  return (
    <div className="mx-auto w-full max-w-[340px] rounded-[44px] border-[10px] border-ink bg-ink shadow-2xl shadow-rose/20">
      <div
        className="relative overflow-y-auto overflow-x-hidden rounded-[34px] bg-white"
        style={{ height, ["--gift-h" as string]: `${height}px` }}
      >
        {children}
      </div>
    </div>
  );
}
