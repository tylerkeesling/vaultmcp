import { cva, type VariantProps } from "class-variance-authority";
import * as React from "react";

import { cn } from "@/lib/utils";
import { Slot } from "@radix-ui/react-slot";

export type ButtonState = "default" | "loading";

export type ButtonAlignment = "space-between" | "center" | "left" | "right";

export type ButtonSize = "default" | "sm" | "md" | "lg" | "icon";

const buttonVariants = cva(
  "focus-visible:ring-ring focus-visible:ring-ring inline-flex cursor-pointer items-center justify-between gap-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors duration-200 focus-visible:ring-2 focus-visible:outline-hidden focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default:
          "bg-btn-primary text-primary-foreground shadow-btn-primary-resting hover:shadow-btn-primary-hover hover:bg-btn-primary-hover focus:shadow-btn-primary-focus",
        destructive:
          "bg-btn-destructive text-btn-destructive-foreground shadow-btn-destructive-resting hover:shadow-btn-destructive-hover hover:bg-btn-destructive-hover focus:shadow-btn-destructive-focus fill-black",
        outline:
          "bg-btn-outlined text-btn-outlined-foreground shadow-btn-outlined-resting hover:shadow-btn-outlined-hover hover:bg-btn-outlined-hover focus:shadow-btn-outlined-focus",
        ghost:
          "bg-btn-ghost text-btn-ghost-foreground hover:bg-btn-ghost-hover focus:shadow-btn-ghost-focus",
        link: "text-primary p-0 underline-offset-4 hover:underline",
      },
      size: {
        default: "h-9 rounded-full px-3 py-2",
        sm: "h-8 rounded-full px-3 text-xs",
        md: "h-10 rounded-full px-8",
        lg: "h-10 rounded-full px-8",
        icon: "h-9 w-9",
      },
      state: {
        default: "",
        loading: "cursor-wait opacity-70",
      },
      alignment: {
        "space-between": "justify-between",
        left: "justify-start",
        center: "justify-center",
        right: "justify-end",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
      state: "default",
      alignment: "center",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  size?: ButtonSize;
  state?: ButtonState;
  alignment?: ButtonAlignment;
  startIcon?: React.ReactNode;
  endIcon?: React.ReactNode;
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    { className, variant, size, state, alignment, startIcon, endIcon, children, asChild, ...props },
    ref
  ) => {
    const Component = asChild ? Slot : "button";

    if (asChild) {
      return (
        <Component
          ref={ref}
          className={cn(buttonVariants({ variant, size, alignment, className }))}
          {...props}
        >
          {children}
        </Component>
      );
    }

    return (
      <Component
        ref={ref}
        className={cn(buttonVariants({ variant, size, alignment, className }))}
        {...props}
      >
        {state === "loading" ? (
          <div role="status">
            <svg
              aria-hidden="true"
              className={cn("fill-primary text-primary-muted animate-spin")}
              viewBox="0 0 100 101"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z"
                fill="currentColor"
              />
              <path
                d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z"
                fill="currentFill"
              />
            </svg>
            <span className="sr-only">Loading...</span>
          </div>
        ) : (
          variant !== "link" && startIcon
        )}
        <span className="w-full px-0.5">{children}</span>
        {variant !== "link" && endIcon}
      </Component>
    );
  }
);

Button.displayName = "Button";

export { Button, buttonVariants };
