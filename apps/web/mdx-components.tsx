import type { MDXComponents } from "mdx/types";

// Required by @next/mdx with the App Router. The help passes its own components to each body it draws
// (components/shell/help), so nothing is added here for every page.
export function useMDXComponents(components: MDXComponents): MDXComponents {
  return components;
}
