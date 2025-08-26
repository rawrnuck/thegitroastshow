declare module "*.jsx" {
  import { ComponentType } from "react";
  const component: ComponentType<Record<string, unknown>>;
  export default component;
}

declare module "*.js" {
  const content: Record<string, unknown>;
  export default content;
}
