export default function SiteHeader({
  children,
  className,
  ...props
}: React.HTMLAttributes<HTMLElement>) {
  return (
    <header
      className={`py-8 h-[112px] overflow-hidden ${className && className}`}
    >
      {children}
    </header>
  );
}
