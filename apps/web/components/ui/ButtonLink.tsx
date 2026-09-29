import Link from "next/link";
import type { ComponentProps } from "react";
import { buttonLook, type ButtonKind, type ButtonSize } from "./button-look";
import { classNames } from "./class-names";
import { Icon, type IconName } from "./Icon";

type Props = ComponentProps<typeof Link> & {
  kind?: ButtonKind;
  size?: ButtonSize;
  /** Shown before the label, for the eye only. */
  icon?: IconName;
};

/** What leads to another place and looks like a button. It is a link: it has an address. */
export function ButtonLink({ kind = "secondary", size = "m", icon, className, children, ...rest }: Props) {
  return (
    <Link className={classNames(buttonLook(kind, size), className)} {...rest}>
      {icon ? <Icon name={icon} size={kind === "secondary" ? 14 : 16} /> : null}
      {children}
    </Link>
  );
}
