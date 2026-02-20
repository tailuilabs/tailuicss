/**
 * TailUI Component Templates
 * * Templates for generating framework-specific components.
 * Each template uses TailUI .ui-* CSS classes.
 */
interface ComponentMeta {
    variants?: string[];
    sizes?: string[];
    props?: string[];
    slots?: string[];
}
declare const COMPONENTS: Record<string, ComponentMeta>;
type TemplateFn = (isTypeScript?: boolean) => string;
type AngularTemplate = {
    ts: () => string;
    html: () => string;
};
interface StackTemplates {
    [component: string]: TemplateFn | AngularTemplate | undefined;
}
declare const TEMPLATES: Record<string, StackTemplates>;
declare function getTemplate(component: string, stack: string, isTypeScript?: boolean): string | AngularTemplate | null;
declare function getAvailableComponents(): string[];
declare function getComponentInfo(component: string): ComponentMeta | null;
declare function hasTemplate(component: string, stack: string): boolean;

export { COMPONENTS, TEMPLATES, getAvailableComponents, getComponentInfo, getTemplate, hasTemplate };
