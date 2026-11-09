npm run build

> client@0.0.1 build
> vite build

vite v8.2.2 building ssr environment for production...
transforming (45) src\routes\(app)\tasks\+page.svelte15:06:44 [vite-plugin-svelte] src/routes/login/+page.svelte:9:76 This reference only captures the initial value of `data`. Did you mean to reference it inside a closure instead?
https://svelte.dev/e/state_referenced_locally
 7:   let { data }: PageProps = $props();
 8:
 9:   const { form, errors, constraints, enhance, delayed, message } = superForm(data.form, {
                                                                                     ^
10:     validators: zod4Client(loginSchema)
11:   });
15:06:44 [vite-plugin-svelte] src/routes/signup/[token]/+page.svelte:9:76 This reference only captures the initial value of `data`. Did you mean to reference it inside a closure instead?
https://svelte.dev/e/state_referenced_locally
 7:   let { data }: PageProps = $props();
 8:
 9:   const { form, errors, constraints, enhance, delayed, message } = superForm(data.form, {
                                                                                     ^
10:     validators: zod4Client(signupSchema)
11:   });
transforming (425) src\lib\components\projects\project-image-field.svelte15:06:45 [vite-plugin-svelte] src/lib/components/projects/edit-project-sheet.svelte:15:31 This reference only captures the initial value of `project`. Did you mean to reference it inside a derived instead?
https://svelte.dev/e/state_referenced_locally
13:
14:   let submitting = $state(false);
15:   let form = $state(toFormState(project));
                                           ^
16:   let imageUrl = $state<string | null>(project.image ?? null);
17:   let pendingFile = $state<File | null>(null);
15:06:45 [vite-plugin-svelte] src/lib/components/projects/edit-project-sheet.svelte:16:38 This reference only captures the initial value of `project`. Did you mean to reference it inside a derived instead?
https://svelte.dev/e/state_referenced_locally
14:   let submitting = $state(false);
15:   let form = $state(toFormState(project));
16:   let imageUrl = $state<string | null>(project.image ?? null);
                                                  ^
17:   let pendingFile = $state<File | null>(null);
18:   let cleared = $state(false);
15:06:45 [vite-plugin-svelte] src/lib/components/tasks/task-owner-select.svelte:33:20 This reference only captures the initial value of `ownerId`. Did you mean to reference it inside a derived instead?
https://svelte.dev/e/state_referenced_locally
31:   let open = $state(false);
32:   let saving = $state(false);
33:   let value = $state(ownerId ?? '');
                                ^
34:
35:   $effect(() => {
15:06:45 [vite-plugin-svelte] src/lib/components/tasks/task-details-dialog.svelte:69:31 This reference only captures the initial value of `task`. Did you mean to reference it inside a derived instead?
https://svelte.dev/e/state_referenced_locally
67:   let executionsOpen = $state(false);
68:   let copyingImageId = $state<string | null>(null);
69:   let form = $state(toFormState(task));
                                        ^
70:   let viewDescription = $state(task.description ?? '');
71:   let descriptionEl = $state<HTMLTextAreaElement | null>(null);
15:06:45 [vite-plugin-svelte] src/lib/components/tasks/task-details-dialog.svelte:70:30 This reference only captures the initial value of `task`. Did you mean to reference it inside a derived instead?
https://svelte.dev/e/state_referenced_locally
68:   let copyingImageId = $state<string | null>(null);
69:   let form = $state(toFormState(task));
70:   let viewDescription = $state(task.description ?? '');
                                       ^
71:   let descriptionEl = $state<HTMLTextAreaElement | null>(null);
72:
transforming (4585) node_modules\svelte-sonner\dist\icons\SuccessIcon.svelte15:06:48 [vite-plugin-svelte] src/lib/components/tasks/markdown-task-list-item.svelte:17:15 This reference only captures the initial value of `task`. Did you mean to reference it inside a closure instead?
https://svelte.dev/e/state_referenced_locally
15:
16:   const todos = getContext<MarkdownTodoContext | undefined>(MARKDOWN_TODO_CONTEXT);
17:   const index = task && todos ? todos.claimIndex() : -1;
                        ^
18:
19:   function handleChange(event: Event) {
15:06:48 [vite-plugin-svelte] src/lib/components/tasks/markdown-task-list-item.svelte:39:2 Using `<slot>` to render parent content is deprecated. Use `{@render ...}` tags instead
https://svelte.dev/e/slot_element_deprecated
37:   {/if}
38:   <span class="task-list-content">
39:     <slot />
                ^
40:   </span>
41: </li>
15:06:48 [vite-plugin-svelte] src/lib/components/tasks/markdown-table.svelte:3:2 Using `<slot>` to render parent content is deprecated. Use `{@render ...}` tags instead
https://svelte.dev/e/slot_element_deprecated
1: <div class="table-wrap">
2:   <table>
3:     <slot />
               ^
4:   </table>
5: </div>