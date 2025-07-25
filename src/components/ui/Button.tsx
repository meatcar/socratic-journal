import { Button as AriaButton, type ButtonProps } from "react-aria-components";

const variantClasses = {
  primary: "bg-blue-500 text-white hover:bg-blue-600",
  secondary: "bg-gray-200 text-gray-800 hover:bg-gray-300",
  danger: "bg-red-500 text-white hover:bg-red-600",
};

export function Button({
  className,
  ...props
}: ButtonProps & { variant?: keyof typeof variantClasses }) {
  return (
    <AriaButton
      className={(values) =>
        `px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
          variantClasses[props.variant ?? "primary"]
        } ${typeof className === "function" ? className(values) : className}`
      }
      {...props}
    />
  );
}
