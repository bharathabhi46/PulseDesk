import clsx from "clsx";
import { humanize } from "../utils/format";

export const Badge = ({ children, className }) => (
  <span className={clsx("inline-flex items-center rounded-md border px-2 py-1 text-xs font-semibold capitalize", className)}>
    {typeof children === "string" ? humanize(children) : children}
  </span>
);
