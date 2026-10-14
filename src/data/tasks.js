// Step 2 options, one set per answer of step 1 (answers.purpose).
// Option ids are namespaced by set ("trabalho:apresentacoes") so they are unique across sets.
// `icon` is an icon id, resolved through src/data/icons.js.
//
// The "tecnologia" set (programação e tecnologia) has no card on step 1 yet,
// so it can't be reached until step 1 gets that option.

const set = (name, options) =>
  options.map(([slug, label, icon]) => ({ id: `${name}:${slug}`, label, icon }))

export const taskSets = {
  trabalho: set('trabalho', [
    ['apresentacoes', 'Apresentações e decks', 'ProjectorScreen'],
    ['resumos', 'Resumos de reuniões e documentos', 'VideoConference'],
    ['emails', 'E-mails e comunicação', 'Envelope'],
    ['planilhas', 'Planilhas e análise de dados', 'Table'],
    ['foto-video', 'Edição de foto e vídeo', 'ImageSquare'],
    ['mercado', 'Pesquisa de mercado', 'Briefcase'],
    ['agenda', 'Organizar agenda e tarefas', 'CalendarCheck'],
    ['outro', 'Outro', 'SquaresFour'],
  ]),
  estudos: set('estudos', [
    ['provas', 'Estudar para provas', 'Exam'],
    ['fichamentos', 'Resumos e fichamentos', 'Notebook'],
    ['pesquisa', 'Pesquisa acadêmica', 'BookOpenText'],
    ['trabalhos', 'Escrever trabalhos', 'PencilLine'],
    ['idiomas', 'Aprender idiomas', 'Translate'],
    ['passo-a-passo', 'Explicações passo a passo', 'ListNumbers'],
    ['cronograma', 'Cronograma de estudos', 'CalendarBlank'],
    ['outro', 'Outro', 'SquaresFour'],
  ]),
  pessoal: set('pessoal', [
    ['rotina', 'Organizar rotina e agenda', 'SunHorizon'],
    ['viagens', 'Planejar viagens', 'Airplane'],
    ['financas', 'Finanças pessoais', 'Wallet'],
    ['textos', 'Escrever textos e mensagens', 'ChatText'],
    ['receitas', 'Receitas e alimentação', 'ForkKnife'],
    ['aprender', 'Aprender algo novo', 'Lightbulb'],
    ['ideias', 'Ideias e recomendações', 'Sparkle'],
    ['outro', 'Outro', 'SquaresFour'],
  ]),
  negocio: set('negocio', [
    ['marketing', 'Marketing e redes sociais', 'Megaphone'],
    ['vendas', 'Vendas e atendimento', 'Headset'],
    ['propostas', 'Propostas e orçamentos', 'FileText'],
    ['financas', 'Finanças e fluxo de caixa', 'Coins'],
    ['concorrentes', 'Pesquisa de concorrentes', 'MagnifyingGlass'],
    ['conteudo-anuncios', 'Criar conteúdo e anúncios', 'PenNib'],
    ['automatizar', 'Automatizar rotinas', 'Lightning'],
    ['outro', 'Outro', 'SquaresFour'],
  ]),
  conteudo: set('conteudo', [
    ['roteiros', 'Roteiros e legendas', 'FilmSlate'],
    ['ideias', 'Ideias de conteúdo', 'Lightbulb'],
    ['calendario', 'Calendário de posts', 'CalendarDots'],
    ['foto-video', 'Edição de foto e vídeo', 'ImageSquare'],
    ['design', 'Imagens e design', 'PaintBrush'],
    ['tendencias', 'Pesquisa de tendências', 'TrendUp'],
    ['outro', 'Outro', 'SquaresFour'],
  ]),
  tecnologia: set('tecnologia', [
    ['codigo', 'Escrever e revisar código', 'Code'],
    ['erros', 'Depurar erros', 'Bug'],
    ['conceitos', 'Explicar conceitos', 'ChalkboardTeacher'],
    ['documentacao', 'Documentação', 'FileText'],
    ['automatizacoes', 'Automatizações', 'Lightning'],
    ['dados', 'Análise de dados', 'ChartBar'],
    ['outro', 'Outro', 'SquaresFour'],
  ]),
  outro: set('outro', [
    ['pesquisar', 'Pesquisar e aprender', 'MagnifyingGlass'],
    ['textos', 'Escrever e criar textos', 'PencilLine'],
    ['resumir', 'Resumir conteúdos', 'ListBullets'],
    ['tarefas', 'Organizar tarefas', 'ListChecks'],
    ['dados', 'Analisar dados', 'ChartBar'],
    ['ideias', 'Gerar ideias', 'Lightbulb'],
    ['traduzir', 'Traduzir', 'Translate'],
    ['outro', 'Outro', 'SquaresFour'],
  ]),
}

// Set shown when step 1 was skipped or its answer has no set.
export const DEFAULT_TASK_SET = 'outro'

export const getTaskSet = (purposeId) => taskSets[purposeId] ?? taskSets[DEFAULT_TASK_SET]

const allTasks = Object.values(taskSets).flat()
export const getTask = (id) => allTasks.find((task) => task.id === id) ?? null
