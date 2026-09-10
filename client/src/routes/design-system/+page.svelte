<script lang="ts">
	// SparkTask — living design system.
	// Every example below is rendered with the real classes from routes/layout.css.
	// Nothing here is a mockup: change layout.css and this page changes with it.

	const typeScale = [
		{
			name: 'Display',
			cls: 'font-display text-display uppercase',
			spec: '36px / 1.0 · 900',
			sample: 'DEMANDAS'
		},
		{
			name: 'Heading 1',
			cls: 'font-display text-h1 uppercase',
			spec: '24px / 1.05 · 900',
			sample: 'PROJETOS ATIVOS'
		},
		{
			name: 'Heading 2',
			cls: 'font-sans text-h2 uppercase',
			spec: '16px / 1.2 · 700',
			sample: 'CONTROLE SUAS DEMANDAS. ONLINE.'
		},
		{
			name: 'Heading 3',
			cls: 'font-sans text-h3 uppercase',
			spec: '14px / 1.2 · 700',
			sample: 'SPARKTASK EQUIPE'
		},
		{
			name: 'Body',
			cls: 'font-serif text-body',
			spec: '14px / 1.4 · 400',
			sample: 'Uma tarefa cadastrada por um usuário aparece para todo o grupo.'
		},
		{
			name: 'Body Small',
			cls: 'font-serif text-body-sm',
			spec: '12px / 1.4 · 400',
			sample: 'Este site é melhor visualizado em navegadores versão 3.0 ou superior.'
		},
		{
			name: 'Caption',
			cls: 'font-serif text-caption',
			spec: '11px / 1.35 · 400',
			sample: '© 2026 SparkTask. Todos os direitos reservados.'
		},
		{
			name: 'Button',
			cls: 'font-sans text-button uppercase',
			spec: '12px / 1.0 · 700',
			sample: 'CRIAR TAREFA'
		},
		{
			name: 'UI Label',
			cls: 'font-sans text-ui-label uppercase',
			spec: '12px / 1.0 · 700',
			sample: 'FILTROS'
		},
		{
			name: 'Link',
			cls: 'font-serif text-body text-mosaic-link underline',
			spec: '14px / 1.4 · 400',
			sample: 'Ver todas as demandas'
		}
	];

	const tints = [
		{ token: 'tint-olive', hex: '#8e8a25', use: 'Eyebrow de seção' },
		{ token: 'tint-sage', hex: '#b3bd95', use: 'Projeto — linha 1' },
		{ token: 'tint-salmon', hex: '#d77a7a', use: 'Projeto — linha 2' },
		{ token: 'tint-peach', hex: '#e6915d', use: 'Projeto — linha 3' },
		{ token: 'tint-lime', hex: '#c0d4a7', use: 'Projeto — linha 4' },
		{ token: 'tint-sky', hex: '#9ab6c8', use: 'Projeto — linha 5' },
		{ token: 'tint-steel', hex: '#a5b8c0', use: 'Projeto — linha 6' },
		{ token: 'tint-periwinkle', hex: '#8c9ae0', use: 'Projeto — linha 7' }
	];

	const brandColors = [
		{ token: 'dell-red', hex: '#e91d2a', use: 'CTA único + phone callout + destructive' },
		{ token: 'sticker-yellow', hex: '#fcc20f', use: 'Stickers: BUY / NEW!' },
		{ token: 'purple-stripe', hex: '#6a26a4', use: 'Faixa do wordmark, só dentro do sticker' },
		{ token: 'mosaic-link', hex: '#0000ee', use: 'Links + focus ring' },
		{ token: 'frame', hex: '#000000', use: 'Moldura, hairlines, botão primário' },
		{ token: 'canvas', hex: '#ffffff', use: 'Superfície de página e card' }
	];

	const spacing = [
		['xxs', '2px'],
		['xs', '4px'],
		['s', '6px'],
		['sm', '8px'],
		['m', '10px'],
		['md', '12px'],
		['lg', '16px'],
		['xl', '20px'],
		['xxl', '24px'],
		['section-sm', '32px'],
		['section', '40px'],
		['section-lg', '48px']
	];

	const sections = [
		['hero', 'Hero'],
		['tipografia', 'Tipografia'],
		['cores', 'Cores'],
		['componentes', 'Componentes'],
		['layout', 'Layout'],
		['movimento', 'Movimento'],
		['icones', 'Ícones']
	];

	let inputValue = $state('');
</script>

<svelte:head><title>SparkTask — Design System</title></svelte:head>

<!-- Top anchor nav ---------------------------------------------------------- -->
<nav class="sticky top-0 z-50 bg-frame text-canvas">
	<div class="catalog-container flex flex-wrap items-center gap-lg px-lg py-md">
		<span class="font-display text-h3 uppercase">SparkTask DS</span>
		<ul class="flex flex-wrap gap-md">
			{#each sections as [id, label] (id)}
				<li>
					<a
						href="#{id}"
						class="font-sans text-ui-label text-canvas uppercase no-underline hover:underline"
						>{label}</a
					>
				</li>
			{/each}
		</ul>
	</div>
</nav>

<main class="catalog-container py-section">
	<!-- 0) HERO ------------------------------------------------------------- -->
	<section id="hero" class="mb-section-lg">
		<div class="page-frame">
			<div class="page-frame-inner">
				<div class="top-banner flex flex-wrap items-center justify-between gap-md">
					<div>
						<div class="font-sans text-h2 uppercase">MONTE SEU FLUXO DE DEMANDAS. ONLINE.</div>
						<div class="font-serif text-body-sm normal-case">
							O sistema de design do SparkTask, documentado e vivo.
						</div>
					</div>
					<div class="flex items-center gap-md">
						<span class="sticker-buy bevel"
							>USE o <span class="bg-purple-stripe px-xxs text-canvas">DS</span></span
						>
						<span class="phone-callout">v-ALPHA-1996</span>
					</div>
				</div>

				<div class="section-eyebrow section-eyebrow--olive">DESIGN SYSTEM</div>

				<div class="catalog-split p-lg">
					<div class="cta-block-red">
						<p>
							Aqui você encontra cada token, cor, tipo e componente do SparkTask — configurado,
							documentado e pronto para usar. Nada nesta página é mockup.
						</p>
					</div>

					<div class="flex flex-col gap-md">
						<div class="ribbon-card">
							<div class="ribbon-card-title">TOKENS &amp; TIPOGRAFIA</div>
							<div class="ribbon-card-body ribbon-card-body--sage flex items-start gap-md">
								<p class="flex-1">
									Três famílias de fonte, escala de nove níveis, doze passos de espaçamento — tudo
									derivado do DESIGN.md.
								</p>
								<div class="ribbon-photo-notch bevel grid place-items-center bg-canvas p-sm">
									<span class="font-display text-h1">Aa</span>
								</div>
							</div>
						</div>

						<div class="ribbon-card">
							<div class="ribbon-card-title">COMPONENTES</div>
							<div class="ribbon-card-body ribbon-card-body--periwinkle flex items-start gap-md">
								<p class="flex-1">
									Botões, inputs, ribbon cards, stickers e selos — com todos os estados.
								</p>
								<span class="sticker-new bevel self-center">NEW!</span>
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	</section>

	<!-- 1) TYPOGRAPHY -------------------------------------------------------- -->
	<section id="tipografia" class="mb-section-lg">
		<h2 class="section-eyebrow section-eyebrow--salmon mb-section-sm">TIPOGRAFIA</h2>

		<div class="border border-frame">
			{#each typeScale as t (t.name)}
				<div
					class="flex flex-wrap items-baseline gap-md border-b border-frame px-lg py-md last:border-b-0"
				>
					<span class="w-28 shrink-0 font-sans text-ui-label uppercase">{t.name}</span>
					<span class="{t.cls} min-w-0 flex-1">{t.sample}</span>
					<span class="ml-auto shrink-0 font-serif text-caption text-muted-foreground tabular-nums"
						>{t.spec}</span
					>
				</div>
			{/each}
		</div>

		<p class="mt-md font-serif text-body-sm">
			Sans para UI, serifa para corpo — o inverso da convenção moderna, e a assinatura da tipografia
			de meados dos anos 90. Sem ajuste de tracking em nenhum nível.
		</p>
	</section>

	<!-- 2) COLORS & SURFACES -------------------------------------------------- -->
	<section id="cores" class="mb-section-lg">
		<h2 class="section-eyebrow section-eyebrow--olive mb-section-sm">CORES &amp; SUPERFÍCIES</h2>

		<h3 class="mb-md font-sans text-h3 uppercase">Família de tints (uma por projeto)</h3>
		<div class="grid grid-cols-2 gap-md sm:grid-cols-4">
			{#each tints as c (c.token)}
				<div class="border border-frame">
					<div class="h-16" style="background-color: var(--{c.token})"></div>
					<div class="border-t border-frame px-s py-xs">
						<div class="font-sans text-ui-label uppercase">{c.token}</div>
						<div class="font-serif text-caption tabular-nums">{c.hex}</div>
						<div class="font-serif text-caption text-muted-foreground">{c.use}</div>
					</div>
				</div>
			{/each}
		</div>

		<h3 class="mt-xxl mb-md font-sans text-h3 uppercase">Marca &amp; superfícies</h3>
		<div class="grid grid-cols-2 gap-md sm:grid-cols-3">
			{#each brandColors as c (c.token)}
				<div class="border border-frame">
					<div class="h-16" style="background-color: var(--{c.token})"></div>
					<div class="border-t border-frame px-s py-xs">
						<div class="font-sans text-ui-label uppercase">{c.token}</div>
						<div class="font-serif text-caption tabular-nums">{c.hex}</div>
						<div class="font-serif text-caption text-muted-foreground">{c.use}</div>
					</div>
				</div>
			{/each}
		</div>

		<h3 class="mt-xxl mb-md font-sans text-h3 uppercase">Elevação — sem sombra suave</h3>
		<div class="grid gap-md sm:grid-cols-3">
			<div class="p-md">
				<div class="mb-xs font-sans text-ui-label uppercase">0 — Flush</div>
				<p class="font-serif text-body-sm">Sem borda, sem sombra. Corpo de texto, rodapé.</p>
			</div>
			<div class="border border-frame p-md">
				<div class="mb-xs font-sans text-ui-label uppercase">1 — Hairline</div>
				<p class="font-serif text-body-sm">1px solid preto. Cards, divisores de célula.</p>
			</div>
			<div class="bevel border border-frame bg-canvas p-md">
				<div class="mb-xs font-sans text-ui-label uppercase">3 — Bevel</div>
				<p class="font-serif text-body-sm">
					Highlight interno + deslocamento duro. Stickers e selos.
				</p>
			</div>
		</div>
		<p class="mt-md font-serif text-body-sm">
			Não existe sombra atmosférica neste sistema. Toda profundidade é hairline ou bevel de aresta
			dura.
		</p>
	</section>

	<!-- 3) UI COMPONENTS ------------------------------------------------------ -->
	<section id="componentes" class="mb-section-lg">
		<h2 class="section-eyebrow section-eyebrow--salmon mb-section-sm">COMPONENTES</h2>

		<h3 class="mb-md font-sans text-h3 uppercase">Botões — estados lado a lado</h3>
		<div class="border border-frame p-lg">
			<div class="mb-lg">
				<div class="mb-s font-sans text-ui-label uppercase">Primary (fill preto)</div>
				<div class="flex flex-wrap items-center gap-md">
					<span class="w-20 font-serif text-caption">default</span>
					<button class="btn-primary" type="button">CRIAR TAREFA</button>
					<span class="w-20 font-serif text-caption">hover</span>
					<span class="btn bg-canvas text-ink">CRIAR TAREFA</span>
					<span class="w-20 font-serif text-caption">disabled</span>
					<button class="btn-primary" type="button" disabled>CRIAR TAREFA</button>
				</div>
			</div>

			<div>
				<div class="mb-s font-sans text-ui-label uppercase">Secondary (fill branco)</div>
				<div class="flex flex-wrap items-center gap-md">
					<span class="w-20 font-serif text-caption">default</span>
					<button class="btn-secondary" type="button">CANCELAR</button>
					<span class="w-20 font-serif text-caption">hover</span>
					<span class="btn bg-frame text-canvas">CANCELAR</span>
					<span class="w-20 font-serif text-caption">disabled</span>
					<button class="btn-secondary" type="button" disabled>CANCELAR</button>
				</div>
			</div>

			<div class="mt-lg">
				<div class="mb-s font-sans text-ui-label uppercase">Text link</div>
				<a class="btn-link" href="#componentes">Ver todas as demandas do projeto</a>
			</div>

			<p class="mt-lg font-serif text-body-sm">
				Passe o mouse e use Tab nos botões reais acima: hover inverte o preenchimento
				instantaneamente (sem transição) e o foco desenha um contorno azul-Mosaic de 2px.
			</p>
		</div>

		<h3 class="mt-xxl mb-md font-sans text-h3 uppercase">Inputs</h3>
		<div class="grid gap-lg border border-frame p-lg sm:grid-cols-3">
			<div>
				<label class="mb-xs block font-sans text-ui-label uppercase" for="ds-default">Default</label
				>
				<input
					id="ds-default"
					class="text-input"
					placeholder="Nome da demanda"
					bind:value={inputValue}
				/>
			</div>
			<div>
				<label class="mb-xs block font-sans text-ui-label uppercase" for="ds-focus"
					>Focus (clique)</label
				>
				<input id="ds-focus" class="text-input" placeholder="Recebe outline azul" />
			</div>
			<div>
				<label class="mb-xs block font-sans text-ui-label uppercase" for="ds-error">Error</label>
				<input
					id="ds-error"
					class="text-input"
					aria-invalid="true"
					value=""
					placeholder="Campo obrigatório"
				/>
				<p class="mt-xxs font-serif text-caption text-dell-red">
					Informe um título para a demanda.
				</p>
			</div>
		</div>

		<h3 class="mt-xxl mb-md font-sans text-h3 uppercase">Ribbon cards — todos os tints</h3>
		<div class="flex flex-col gap-md">
			{#each tints.slice(1) as t (t.token)}
				<div class="ribbon-card">
					<div class="ribbon-card-title">{t.token.replace('tint-', '').toUpperCase()}</div>
					<div class="ribbon-card-body ribbon-card-body--{t.token.replace('tint-', '')}">
						Uma linha de projeto usa um tint e permanece nele. {t.use}.
					</div>
				</div>
			{/each}
		</div>

		<h3 class="mt-xxl mb-md font-sans text-h3 uppercase">Stickers &amp; selo</h3>
		<div class="flex flex-wrap items-center gap-xxl border border-frame p-lg">
			<span class="sticker-buy bevel"
				>USE o <span class="bg-purple-stripe px-xxs text-canvas">DS</span></span
			>
			<span class="sticker-new bevel">NEW!</span>
			<div class="cert-seal bevel">
				<span class="leading-tight">100%<br />PWA</span>
			</div>
		</div>

		<h3 class="mt-xxl mb-md font-sans text-h3 uppercase">CTA — um por página, no máximo</h3>
		<div class="cta-block-red">
			<p>
				No SparkTask, sua equipe cadastra a demanda, agrupa por projeto e acompanha o andamento —
				todo mundo vendo a mesma lista, em tempo real.
			</p>
		</div>

		<h3 class="mt-xxl mb-md font-sans text-h3 uppercase">Tabela de dados</h3>
		<table class="w-full border-collapse border border-frame">
			<thead>
				<tr>
					<th class="border border-frame px-md py-s text-left font-serif text-caption uppercase"
						>Demanda</th
					>
					<th class="border border-frame px-md py-s text-left font-serif text-caption uppercase"
						>Projeto</th
					>
					<th class="border border-frame px-md py-s text-left font-serif text-caption uppercase"
						>Status</th
					>
				</tr>
			</thead>
			<tbody>
				<tr>
					<td class="border border-frame px-md py-s font-serif text-body-sm"
						>Ajustar filtro por responsável</td
					>
					<td class="border border-frame px-md py-s font-serif text-body-sm">SparkTask Web</td>
					<td class="border border-frame px-md py-s font-serif text-body-sm">Em andamento</td>
				</tr>
				<tr>
					<td class="border border-frame px-md py-s font-serif text-body-sm"
						>Configurar PWA offline</td
					>
					<td class="border border-frame px-md py-s font-serif text-body-sm">SparkTask Mobile</td>
					<td class="border border-frame px-md py-s font-serif text-body-sm">Aberta</td>
				</tr>
			</tbody>
		</table>

		<h3 class="mt-xxl mb-md font-sans text-h3 uppercase">Rodapé</h3>
		<div class="footer-band">
			<a href="#componentes">Copyright</a> (Termos de Uso) · Este site é melhor visualizado em navegadores
			versão 3.0 ou superior.
		</div>
	</section>

	<!-- 4) LAYOUT & SPACING --------------------------------------------------- -->
	<section id="layout" class="mb-section-lg">
		<h2 class="section-eyebrow section-eyebrow--olive mb-section-sm">LAYOUT &amp; ESPAÇAMENTO</h2>

		<h3 class="mb-md font-sans text-h3 uppercase">Escala de espaçamento</h3>
		<div class="border border-frame">
			{#each spacing as [name, value] (name)}
				<div class="flex items-center gap-md border-b border-frame px-lg py-xs last:border-b-0">
					<span class="w-24 shrink-0 font-sans text-ui-label uppercase">{name}</span>
					<span class="h-3 bg-frame" style="width: {value}"></span>
					<span class="ml-auto font-serif text-caption tabular-nums">{value}</span>
				</div>
			{/each}
		</div>

		<h3 class="mt-xxl mb-md font-sans text-h3 uppercase">Padrão 1 — Split 28% / 72%</h3>
		<div class="catalog-split border border-frame p-md">
			<div class="grid place-items-center border border-frame bg-muted p-lg">
				<span class="font-sans text-ui-label uppercase">Rail 28%</span>
			</div>
			<div class="grid place-items-center border border-frame bg-muted p-lg">
				<span class="font-sans text-ui-label uppercase">Conteúdo 72%</span>
			</div>
		</div>
		<p class="mt-s font-serif text-body-sm">
			Colapsa para coluna única em ≤768px. O rail carrega navegação de projetos; a coluna direita, a
			pilha de ribbon cards.
		</p>

		<h3 class="mt-xxl mb-md font-sans text-h3 uppercase">Padrão 2 — Container catálogo (760px)</h3>
		<div class="mx-auto max-w-catalog border border-frame bg-muted p-lg text-center">
			<span class="font-sans text-ui-label uppercase"
				>760px — o alvo de 1996 para monitores 800×600</span
			>
		</div>

		<h3 class="mt-xxl mb-md font-sans text-h3 uppercase">Padrão 3 — Moldura de página</h3>
		<div class="page-frame">
			<div class="page-frame-inner p-lg text-center">
				<span class="font-sans text-ui-label uppercase"
					>8px de moldura preta · 4px em tablet · 2px em mobile</span
				>
			</div>
		</div>
	</section>

	<!-- 5) MOTION & INTERACTION ------------------------------------------------ -->
	<section id="movimento" class="mb-section-lg">
		<h2 class="section-eyebrow section-eyebrow--salmon mb-section-sm">MOVIMENTO</h2>

		<div class="border border-frame p-lg">
			<p class="mb-lg font-serif text-body">
				<strong>Este sistema não tem animação.</strong> O DESIGN.md não documenta nenhuma transição,
				keyframe, hover lift ou reveal de scroll — em 1996 nada disso existia. Não foram inventadas.
				O que existe é feedback de estado <em>duro e instantâneo</em>, a única interação da época:
			</p>

			<div class="grid gap-lg sm:grid-cols-3">
				<div>
					<div class="mb-s font-sans text-ui-label uppercase">Inversão no hover</div>
					<button class="btn-primary" type="button">PASSE O MOUSE</button>
					<p class="mt-xs font-serif text-caption">Troca fill/texto sem transition.</p>
				</div>
				<div>
					<div class="mb-s font-sans text-ui-label uppercase">Deslocamento no active</div>
					<button class="btn-secondary" type="button">CLIQUE E SEGURE</button>
					<p class="mt-xs font-serif text-caption">Move 1px em x e y — botão físico afundando.</p>
				</div>
				<div>
					<div class="mb-s font-sans text-ui-label uppercase">Focus ring</div>
					<button class="btn-secondary" type="button">TAB ATÉ AQUI</button>
					<p class="mt-xs font-serif text-caption">Outline azul-Mosaic 2px, offset 0.</p>
				</div>
			</div>
		</div>
	</section>

	<!-- 6) ICONS --------------------------------------------------------------- -->
	<section id="icones" class="mb-section-lg">
		<h2 class="section-eyebrow section-eyebrow--olive mb-section-sm">ÍCONES</h2>

		<p class="mb-lg font-serif text-body">
			Traço duro de 2px, sem cap arredondado, sem preenchimento — desenhados para parecerem
			recortados à mão. A cor é herdada via <code class="font-sans text-body-sm">currentColor</code
			>.
		</p>

		<div class="icon-label-nav-row flex flex-wrap justify-around border border-frame p-lg">
			{#each [['BUSCAR', 'search'], ['INÍCIO', 'home'], ['PROJETOS', 'folder'], ['EQUIPE', 'team']] as [label, kind] (kind)}
				<div class="icon-label-nav">
					<svg
						width="24"
						height="24"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						stroke-width="2"
						stroke-linecap="butt"
						stroke-linejoin="miter"
						aria-hidden="true"
					>
						{#if kind === 'search'}
							<circle cx="10" cy="10" r="6" /><path d="M15 15 L21 21" />
						{:else if kind === 'home'}
							<path d="M3 11 L12 3 L21 11" /><path d="M6 11 V21 H18 V11" />
						{:else if kind === 'folder'}
							<path d="M3 6 H10 L12 8 H21 V20 H3 Z" />
						{:else}
							<circle cx="8" cy="9" r="3" /><circle cx="16" cy="9" r="3" /><path
								d="M3 20 V17 H13 V20"
							/><path d="M14 17 H21 V20" />
						{/if}
					</svg>
					<span>{label}</span>
				</div>
			{/each}
		</div>

		<h3 class="mt-xxl mb-md font-sans text-h3 uppercase">Tamanhos &amp; herança de cor</h3>
		<div class="flex flex-wrap items-end gap-xxl border border-frame p-lg">
			{#each [16, 24, 32] as size (size)}
				<div class="grid place-items-center gap-xs">
					<svg
						width={size}
						height={size}
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						stroke-width="2"
						stroke-linecap="butt"
						stroke-linejoin="miter"
						aria-hidden="true"
					>
						<path d="M3 6 H10 L12 8 H21 V20 H3 Z" />
					</svg>
					<span class="font-serif text-caption tabular-nums">{size}px</span>
				</div>
			{/each}
			<div class="grid place-items-center gap-xs text-dell-red">
				<svg
					width="24"
					height="24"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					stroke-width="2"
					stroke-linecap="butt"
					stroke-linejoin="miter"
					aria-hidden="true"
				>
					<path d="M3 6 H10 L12 8 H21 V20 H3 Z" />
				</svg>
				<span class="font-serif text-caption">herdada</span>
			</div>
		</div>
	</section>
</main>
