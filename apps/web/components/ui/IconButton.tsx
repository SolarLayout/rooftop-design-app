import type { ComponentProps } from "react";
import { iconButtonLook, type ButtonKind, type IconButtonSize } from "./button-look";
import { classNames } from "./class-names";
import { Icon, type IconName, type IconSize } from "./Icon";
import type { ShownAs } from "./shown-as";

type Props = Omit<ComponentProps<"button">, "children" | "aria-label"> & {
  /** What the button does, in words. It is the name of the button: the icon alone says nothing to a screen reader. */
  label: string;
  icon: IconName;
  iconSize?: IconSize;
  kind?: ButtonKind;
  size?: IconButtonSize;
  shape?: "square" | "round";
  shownAs?: ShownAs;
};

export function IconButton({
  label,
  icon,
  iconSize = 16,
  kind = "secondary",
  size = "s",
  shape = "square",
  shownAs,
  type = "button",
  className,
  ...rest
}: Props) {
  return (
    <button
      type={type}
      aria-label={label}
      data-shown-as={shownAs}
      className={classNames(iconButtonLook(kind, size, shape), className)}
      {...rest}
    >
      <Icon name={icon} size={iconSize} />
    </button>
  );
}
