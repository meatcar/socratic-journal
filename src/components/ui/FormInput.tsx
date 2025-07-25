import {
  TextField,
  Label,
  TextArea,
  FieldError,
  type TextFieldProps,
  type TextAreaProps,
} from "react-aria-components";

export function FormInput({
  label,
  error,
  ...props
}: TextFieldProps &
  TextAreaProps & {
    label?: string;
    error?: string;
  }) {
  return (
    <TextField className="w-full">
      {label && (
        <Label className="block text-sm font-medium text-gray-700 mb-1">
          {label}
        </Label>
      )}
      <TextArea
        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all resize-none"
        {...props}
      />
      {error && (
        <FieldError className="text-red-500 text-sm mt-1">{error}</FieldError>
      )}
    </TextField>
  );
}
