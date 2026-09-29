import type { ComponentProps } from "react";
import { buttonLook, type ButtonKind, type ButtonSize } from "./button-look";
import { classNames } from "./class-names";
import { Icon, type IconName } from "./Icon";
import type { ShownAs } from "./shown-as";

type Props = ComponentProps<"button"> & {
  /** Primary: one in a view. Secondary: the usual one. Quiet: beside another, or for undoing. */
  kind?: ButtonKind;
  size?: ButtonSize;
  /** Shown before the label, for the eye only. */
  icon?: IconName;
  shownAs?: ShownAs;
};

export function Button({ kind = "secondary", size = "m", icon, shownAs, type = "button", className, children, ...rest }: Props) {
  return (
    <button type={type} data-shown-as={shownAs} className={classNames(buttonLook(kind, size), className)} {...rest}>
      {icon ? <Icon name={icon} size={kind === "secondary" ? 14 : 16} /> : null}
      {children}
    </button>
  );
}
