import { ButtonHTMLAttributes } from "react";

export default function CustomButton({
  children,
  className,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      className={`bg-neutral-400 hover:border-2 text-black text-md h-8 px-4 rounded-xl ${className ?? ""}`}
      {...props}
    >
      {children}
    </button>
  );
}
