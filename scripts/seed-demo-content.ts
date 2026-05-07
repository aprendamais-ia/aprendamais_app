/**
 * Seed de conteúdo:
 *   1) 5 questões OAB hardcoded + 1 lição publicada (demo end-to-end do lesson player)
 *   2) Auto-discovery de tracks adicionais em content/seed/<track-slug>/*.json
 *      (cada arquivo = array de DemoQuestion). Sem lessons — só questões
 *      publicadas.
 *
 * Idempotente em ambos os caminhos.
 *
 * Pré-requisitos:
 *   - tracks seeded (supabase/seed.sql)
 *   - topics seeded (pnpm db:seed-topics)
 *
 * Uso:
 *   pnpm db:seed-demo
 */

import "dotenv/config";
import { config as loadEnv } from "dotenv";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { createClient } from "@supabase/supabase-js";

loadEnv({ path: ".env.local" });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!SUPABASE_URL || !SERVICE_ROLE) {
  console.error("✖ NEXT_PUBLIC_SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY ausentes");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE, {
  auth: { persistSession: false, autoRefreshToken: false },
});

type Choice = { key: "A" | "B" | "C" | "D"; text: string; correct: boolean };
type DemoQuestion = {
  topic_slug: string; // <module>.<topic>
  difficulty: 1 | 2 | 3 | 4 | 5;
  stem: string;
  choices: Choice[];
  explanation: string;
  source_citation: string;
};

const QUESTIONS: DemoQuestion[] = [
  {
    topic_slug: "etica.estatuto-oab",
    difficulty: 1,
    stem:
      "Sobre a inscrição na OAB, é correto afirmar que o exercício da advocacia exige:",
    choices: [
      { key: "A", text: "Diploma de bacharel em Direito apenas.", correct: false },
      { key: "B", text: "Aprovação no Exame de Ordem e inscrição na OAB.", correct: true },
      { key: "C", text: "Apenas aprovação no Exame de Ordem.", correct: false },
      { key: "D", text: "Apenas a inscrição em qualquer seccional.", correct: false },
    ],
    explanation:
      "O art. 8º, IV do EOAB exige aprovação em Exame de Ordem **e** inscrição nos quadros da OAB. O diploma sozinho não habilita; o exame sozinho também não.",
    source_citation: "Lei 8.906/94, art. 8º, IV (Estatuto da Advocacia)",
  },
  {
    topic_slug: "etica.codigo-etica",
    difficulty: 2,
    stem:
      "Quanto ao sigilo profissional, o advogado:",
    choices: [
      { key: "A", text: "Pode revelar fatos do cliente para se defender em ação contra ele.", correct: true },
      { key: "B", text: "Deve revelar tudo se intimado por juiz.", correct: false },
      { key: "C", text: "Pode revelar com autorização verbal do cliente.", correct: false },
      { key: "D", text: "Nunca pode revelar, sob nenhuma hipótese.", correct: false },
    ],
    explanation:
      "O sigilo é dever fundamental, mas cede em **autodefesa** do advogado. Intimação judicial não basta; depoimento de testemunha sobre fato sigiloso pode ser recusado. A autorização do cliente, se houver, deve ser expressa.",
    source_citation: "Código de Ética e Disciplina da OAB, art. 25-27",
  },
  {
    topic_slug: "direito-civil.lindb",
    difficulty: 1,
    stem:
      "Salvo disposição contrária, a lei começa a vigorar em todo o país:",
    choices: [
      { key: "A", text: "45 dias depois de oficialmente publicada.", correct: true },
      { key: "B", text: "30 dias depois de oficialmente publicada.", correct: false },
      { key: "C", text: "Na data da publicação.", correct: false },
      { key: "D", text: "90 dias depois de oficialmente publicada.", correct: false },
    ],
    explanation:
      "A LINDB estabelece o período de *vacatio legis* padrão de 45 dias, contados da publicação oficial, salvo se a própria lei dispuser diferente. É o mesmo prazo para o território brasileiro; em Estados estrangeiros, 3 meses.",
    source_citation: "Decreto-Lei 4.657/42 (LINDB), art. 1º",
  },
  {
    topic_slug: "direito-civil.responsabilidade-civil",
    difficulty: 3,
    stem:
      "João, dirigindo na contramão, atinge o veículo de Maria. A responsabilidade de João é:",
    choices: [
      { key: "A", text: "Subjetiva, pois exige prova de culpa.", correct: true },
      { key: "B", text: "Objetiva, por se tratar de acidente automobilístico.", correct: false },
      { key: "C", text: "Inexistente, pois não há contrato entre as partes.", correct: false },
      { key: "D", text: "Solidária com Maria, por ambos serem motoristas.", correct: false },
    ],
    explanation:
      "A responsabilidade civil em acidente automobilístico entre particulares é **subjetiva** (art. 186 c/c 927, *caput* do CC) — exige conduta, dano, nexo causal **e culpa**. Dirigir na contramão evidencia a culpa, mas a natureza do regime continua subjetiva. Responsabilidade objetiva (art. 927, parágrafo único) só em atividade de risco.",
    source_citation: "Código Civil, arts. 186 e 927",
  },
  {
    topic_slug: "direito-penal.teoria-do-crime",
    difficulty: 4,
    stem:
      "Sobre a tentativa no Direito Penal, é correto afirmar:",
    choices: [
      { key: "A", text: "Aplica-se a pena do crime consumado, integralmente.", correct: false },
      { key: "B", text: "É punida com a pena do crime consumado, reduzida de 1 a 2 terços.", correct: true },
      { key: "C", text: "Não há punição para tentativa em crimes culposos por convergência.", correct: false },
      { key: "D", text: "A redução é fixa em 50%, independentemente do iter percorrido.", correct: false },
    ],
    explanation:
      "Art. 14, II do CP: a tentativa é punida com a pena do crime consumado **diminuída de 1 a 2 terços**. A redução leva em conta o *iter criminis* percorrido — quanto mais perto da consumação, menor a redução. Tentativa só existe em crime doloso (alternativa C confunde fundamento — em crime culposo não cabe tentativa, mas não por 'convergência').",
    source_citation: "Código Penal, art. 14, II e parágrafo único",
  },
];

const DEMO_LESSON = {
  track_slug: "oab",
  level: 1,
  position: 0,
  title: "Bora começar — fundamentos",
  intro:
    "Cinco questões pra esquentar, cobrindo Ética, Civil e Penal — três das matérias mais pesadas da OAB. Mandou bem aqui, tu já tem 30% da base.",
  outro:
    "Aquece, hein? Tu acabou de praticar três disciplinas que somam **24 questões** na prova oficial — quase um terço dela. Continua nesse ritmo.",
};

async function main() {
  console.log("→ buscando track 'oab'...");
  const { data: track, error: tErr } = await supabase
    .from("tracks").select("id").eq("slug", "oab").single();
  if (tErr || !track) {
    console.error("✖ track 'oab' não encontrada — rode supabase/seed.sql primeiro");
    process.exit(1);
  }

  console.log("→ buscando topics dos slugs...");
  const slugs = Array.from(new Set(QUESTIONS.map((q) => q.topic_slug)));
  const { data: topics, error: topErr } = await supabase
    .from("topics").select("id, slug").eq("track_id", track.id).in("slug", slugs);
  if (topErr || !topics || topics.length < slugs.length) {
    const found = new Set(topics?.map((t) => t.slug) ?? []);
    const missing = slugs.filter((s) => !found.has(s));
    console.error("✖ topics ausentes:", missing.join(", "));
    console.error("  rode `pnpm db:seed-topics` primeiro");
    process.exit(1);
  }
  const topicIdBySlug = new Map(topics.map((t) => [t.slug, t.id]));

  console.log("→ inserindo questões...");
  const questionIds: string[] = [];
  for (const q of QUESTIONS) {
    // Idempotência: usa stem como discriminador (concatenado com topic+difficulty).
    // Como não temos unique constraint útil em questions, fazemos delete + insert
    // se o stem já existe na mesma topic+difficulty (apenas para o seed demo).
    const topicId = topicIdBySlug.get(q.topic_slug)!;
    const { data: existing } = await supabase
      .from("questions").select("id").eq("topic_id", topicId).eq("stem", q.stem).maybeSingle();

    let id: string;
    if (existing) {
      const { error: upErr } = await supabase
        .from("questions").update({
          difficulty: q.difficulty,
          choices: q.choices,
          explanation: q.explanation,
          source_citation: q.source_citation,
          status: "published",
          generated_by: "human",
        }).eq("id", existing.id);
      if (upErr) throw upErr;
      id = existing.id;
    } else {
      const { data: inserted, error: insErr } = await supabase
        .from("questions").insert({
          topic_id: topicId,
          difficulty: q.difficulty,
          stem: q.stem,
          choices: q.choices,
          explanation: q.explanation,
          source_citation: q.source_citation,
          status: "published",
          generated_by: "human",
        }).select("id").single();
      if (insErr || !inserted) throw insErr;
      id = inserted.id;
    }
    questionIds.push(id);
    console.log(`  ✓ ${q.topic_slug} (dif ${q.difficulty})`);
  }

  console.log("→ inserindo/atualizando lição...");
  const lessonTopicId = topicIdBySlug.get(QUESTIONS[1].topic_slug)!; // ético-codigo (mais "intro")
  const { data: existingLesson } = await supabase
    .from("lessons").select("id").eq("title", DEMO_LESSON.title).maybeSingle();

  if (existingLesson) {
    const { error: lUpErr } = await supabase
      .from("lessons").update({
        topic_id: lessonTopicId,
        level: DEMO_LESSON.level,
        position: DEMO_LESSON.position,
        intro: DEMO_LESSON.intro,
        outro: DEMO_LESSON.outro,
        question_ids: questionIds,
        published: true,
      }).eq("id", existingLesson.id);
    if (lUpErr) throw lUpErr;
    console.log(`  ✓ lição atualizada: ${existingLesson.id}`);
  } else {
    const { data: lessonRow, error: lErr } = await supabase
      .from("lessons").insert({
        topic_id: lessonTopicId,
        level: DEMO_LESSON.level,
        position: DEMO_LESSON.position,
        title: DEMO_LESSON.title,
        intro: DEMO_LESSON.intro,
        outro: DEMO_LESSON.outro,
        question_ids: questionIds,
        published: true,
      }).select("id").single();
    if (lErr || !lessonRow) throw lErr;
    console.log(`  ✓ lição criada: ${lessonRow.id}`);
  }

  await seedJsonTracks();
  await seedNovaCpaLessons();

  console.log("\n✓ seed demo concluído");
}

type LessonDef = {
  topicSlug: string;
  level: number;
  position: number;
  title: string;
  intro: string;
  outro: string;
  questionStems: string[];
};

const NOVA_CPA_TRACK_SLUG = "nova-cpa";

// Trilha completa da Nova CPA: 8 fases distribuindo os 40 questões.
// Cada questão aparece em exatamente uma fase. Ordenação por (level, position).
const NOVA_CPA_LESSONS: LessonDef[] = [
  {
    topicSlug: "sistema-financeiro.orgaos-reguladores",
    level: 1,
    position: 0,
    title: "Bora começar — fundamentos da Nova CPA",
    intro:
      "Cinco questões cobrindo os quatro módulos da prova — SFN, produtos, cliente e inovação. Boa pra ver de onde tu começa.",
    outro:
      "Boa! Tu varreu **as quatro grandes áreas** da Nova CPA num lance só. Próximas fases aprofundam módulo por módulo.",
    questionStems: [
      "Qual das alternativas a seguir descreve corretamente uma atribuição do Conselho Monetário Nacional (CMN)?",
      "Os principais instrumentos clássicos de política monetária utilizados pelo Banco Central do Brasil são:",
      "O Tesouro Selic (LFT) é um título público federal que se caracteriza por:",
      "A reserva de emergência é um pilar do planejamento financeiro pessoal. Qual a recomendação clássica em termos de montante e tipo de aplicação?",
      "A sigla ESG, aplicada a investimentos, refere-se a critérios:",
    ],
  },
  {
    topicSlug: "sistema-financeiro.orgaos-reguladores",
    level: 1,
    position: 1,
    title: "Sistema Financeiro Nacional",
    intro:
      "Quem manda em quem: CMN, BC, CVM, FGC, Copom. As bases do SFN num só lugar.",
    outro:
      "Cravou. Esse é o módulo que abre quase todas as questões da prova — sabendo isso, o resto encaixa.",
    questionStems: [
      "Uma corretora de valores deseja distribuir um Fundo de Investimento em Direitos Creditórios (FIDC) e, simultaneamente, oferecer planos de previdência aberta (VGBL) aos seus clientes. Quanto à supervisão, a empresa estará submetida:",
      "O Fundo Garantidor de Créditos (FGC) garante o ressarcimento de até R$ 250.000,00 por CPF e por instituição (limite global de R$ 1 milhão a cada 4 anos) em qual conjunto de produtos?",
      "O Comitê de Política Monetária (Copom) decide elevar a meta da taxa Selic em 100 bps. Em um cenário de regime de metas funcionando, qual o efeito esperado, no horizonte relevante de transmissão da política monetária?",
      "Sobre a Taxa DI (CDI), é correto afirmar que:",
      "Um investidor aplica R$ 10.000,00 em um título prefixado pelo prazo de 2 anos a uma taxa nominal de 10% ao ano (capitalização composta). Sabendo que a inflação acumulada nos dois anos foi de 12%, qual a taxa real aproximada do investimento, segundo a fórmula de Fisher?",
      "Segundo a Resolução CVM nº 30, considera-se INVESTIDOR PROFISSIONAL a pessoa natural que:",
    ],
  },
  {
    topicSlug: "produtos-mercado.renda-fixa-publica",
    level: 2,
    position: 0,
    title: "Renda Fixa e Renda Variável",
    intro:
      "Tesouro Direto, CDB, LCI, ações: como funcionam, como tributam, quem garante.",
    outro:
      "Dois mundos cobertos. RF + RV aparecem em quase metade da prova — tu tá puxando esse pedaço.",
    questionStems: [
      "Um investidor adquire um Tesouro IPCA+ 2035 a uma taxa real contratada de 6% ao ano. Decorrido um ano, decide vender o título no mercado secundário e a taxa de mercado para esse vencimento está em 5% a.a. Em relação à rentabilidade efetiva nesse 1 ano, é correto afirmar que o investidor:",
      "Sobre a Letra de Crédito Imobiliário (LCI) emitida por banco brasileiro a uma pessoa física, é correto afirmar que:",
      "Um investidor pessoa física resgata, após 200 dias de aplicação, R$ 5.000,00 brutos de rendimentos em um CDB. Qual a alíquota de IR aplicável e o imposto retido na fonte?",
      "Em relação à tributação de proventos pagos por empresas brasileiras a acionistas pessoas físicas (legislação vigente), é correto afirmar que:",
      "Um investidor pessoa física vende, em determinado mês, R$ 18.000,00 em ações no mercado à vista (operação normal, não day trade), apurando ganho líquido de R$ 2.000,00. Qual o tratamento tributário aplicável?",
    ],
  },
  {
    topicSlug: "produtos-mercado.coe",
    level: 2,
    position: 1,
    title: "Estruturados, Fundos e FIIs",
    intro:
      "COE, fundos abertos (CVM 175) e FIIs. Capital protegido, come-cotas e isenção de FII.",
    outro:
      "Boa. Fundos é um tópico denso e tu já desbravou. A base maior tá feita.",
    questionStems: [
      "O Certificado de Operações Estruturadas (COE) com cláusula de 'valor nominal protegido':",
      "Um investidor compra um COE de R$ 50.000,00, prazo de 3 anos, com 'capital nominal protegido', referenciado ao Ibovespa, com participação de 80% na alta. Caso o Ibovespa suba 50% no período, e desconsiderando tributação, o investidor receberá no vencimento:",
      "Em um fundo de investimento regulado pela Resolução CVM nº 175, o profissional responsável pela tomada das decisões de investimento da carteira é o(a):",
      "O 'come-cotas', mecanismo tributário aplicável a fundos abertos de renda fixa de longo prazo, consiste em:",
      "Para que os rendimentos mensais distribuídos por um Fundo de Investimento Imobiliário (FII) sejam ISENTOS de IR para a pessoa física, são exigidos cumulativamente quais requisitos?",
    ],
  },
  {
    topicSlug: "produtos-mercado.previdencia",
    level: 2,
    position: 2,
    title: "Previdência, Crédito e Bancos",
    intro:
      "PGBL × VGBL, regime regressivo, PIX, consignado. Produtos do dia a dia do cliente.",
    outro:
      "Esses são os produtos que aparecem em qualquer atendimento real. Sabendo isso, tu já tá consultor.",
    questionStems: [
      "Sobre as principais categorias de Fundos Imobiliários (FIIs), é correto afirmar que:",
      "Um cliente em fase de acumulação para a aposentadoria possui alta renda tributável, contribui regularmente para o INSS e faz declaração de IR no MODELO COMPLETO. Qual modalidade de previdência é mais indicada do ponto de vista tributário?",
      "No regime de tributação regressivo definitivo aplicável a planos de previdência (PGBL/VGBL), a alíquota MÍNIMA de IR aplicável a recursos resgatados é:",
      "Sobre o Pix, sistema de pagamentos instantâneos do Banco Central do Brasil, é correto afirmar que:",
      "Comparando duas modalidades de crédito ao consumidor — (i) crédito pessoal sem garantia e (ii) crédito consignado em folha — e mantidas as demais condições constantes, espera-se que:",
    ],
  },
  {
    topicSlug: "relacionamento-cliente.suitability-perfil-investidor",
    level: 3,
    position: 0,
    title: "Cliente, Suitability e Ética",
    intro:
      "Perfil de investidor, suitability, código de ética da Anbima. O que rege a relação com o cliente.",
    outro:
      "Esses 30% da prova são pegadinha pura. Tu pegou os fundamentos.",
    questionStems: [
      "A 'fase de acumulação de capital' no ciclo de vida do investidor caracteriza-se tipicamente por:",
      "A análise de suitability tem como objetivo principal:",
      "Um cliente classificado como 'conservador' no API insiste em aplicar parte significativa do patrimônio em ações de alta volatilidade. Diante disso, o profissional certificado deve:",
      "O Código de Conduta Ética da ANBIMA estabelece princípios que devem orientar pessoas candidatas e profissionais certificados. Entre os 'nove princípios éticos' está:",
      "Um gerente de relacionamento recebe uma campanha interna que paga comissão extra por aplicações em determinado fundo. Diante disso, a conduta ética e regulatoriamente adequada é:",
    ],
  },
  {
    topicSlug: "relacionamento-cliente.pldft-kyc-lgpd",
    level: 3,
    position: 1,
    title: "PLDFT, LGPD e Crimes de Mercado",
    intro:
      "Lavagem de dinheiro, LGPD, insider trading, churning, front running. As cascas de banana da prova.",
    outro:
      "Esse é o módulo onde mais gente tropeça. Tu já passou.",
    questionStems: [
      "Em relação à Política de Prevenção à Lavagem de Dinheiro e ao Financiamento do Terrorismo (PLDFT), é INCORRETO afirmar que:",
      "A Lei Geral de Proteção de Dados (LGPD — Lei 13.709/2018) aplicada ao mercado financeiro:",
      "Um profissional certificado identifica que um cliente realizou diversos depósitos em espécie fracionados, em curto intervalo, sem justificativa econômica aparente. Qual a conduta adequada?",
      "A prática conhecida como 'insider trading', tipificada como crime contra o mercado de capitais, consiste em:",
      "A prática conhecida como 'churning', listada entre os ilícitos de mercado pela Resolução CVM nº 62, consiste em:",
      "A prática de 'front running', tipificada como ilícito de mercado, caracteriza-se por:",
    ],
  },
  {
    topicSlug: "inovacao-mercado.defi-blockchain",
    level: 4,
    position: 0,
    title: "Inovação no Mercado",
    intro:
      "DeFi, smart contracts, DREX, Open Finance. O que tá entrando na prova porque tá entrando no mercado.",
    outro:
      "Trilha completa. Tu varreu os 4 módulos da Nova CPA. Agora é repetir até automatizar.",
    questionStems: [
      "Sobre os 'smart contracts' no contexto das finanças descentralizadas (DeFi), é correto afirmar que:",
      "O DREX é:",
      "O Open Finance no Brasil tem como principal objetivo:",
    ],
  },
];

async function seedNovaCpaLessons() {
  const { data: track } = await supabase
    .from("tracks").select("id").eq("slug", NOVA_CPA_TRACK_SLUG).single();
  if (!track) {
    console.error(`\n✖ track '${NOVA_CPA_TRACK_SLUG}' não encontrada — pulando lições`);
    return;
  }

  // Pre-carrega questões por stem (1 query)
  const allStems = NOVA_CPA_LESSONS.flatMap((l) => l.questionStems);
  const { data: questions } = await supabase
    .from("questions").select("id, stem").in("stem", allStems);
  const byStem = new Map((questions ?? []).map((q) => [q.stem as string, q.id as string]));

  // Pre-carrega tópicos do track (1 query)
  const topicSlugs = Array.from(new Set(NOVA_CPA_LESSONS.map((l) => l.topicSlug)));
  const { data: topics } = await supabase
    .from("topics").select("id, slug").eq("track_id", track.id).in("slug", topicSlugs);
  const topicIdBySlug = new Map((topics ?? []).map((t) => [t.slug as string, t.id as string]));

  let created = 0;
  let updated = 0;
  for (const lesson of NOVA_CPA_LESSONS) {
    const topicId = topicIdBySlug.get(lesson.topicSlug);
    if (!topicId) {
      console.error(`  ✖ topic '${lesson.topicSlug}' não encontrado — pulando '${lesson.title}'`);
      continue;
    }

    const orderedIds = lesson.questionStems
      .map((s) => byStem.get(s))
      .filter((id): id is string => Boolean(id));

    if (orderedIds.length !== lesson.questionStems.length) {
      const missing = lesson.questionStems.filter((s) => !byStem.has(s));
      console.error(`  ✖ '${lesson.title}': ${missing.length} questões ausentes — pulando`);
      missing.forEach((s) => console.error(`      ↳ ${s.slice(0, 70)}…`));
      continue;
    }

    const { data: existing } = await supabase
      .from("lessons").select("id").eq("title", lesson.title).maybeSingle();

    if (existing) {
      const { error } = await supabase.from("lessons").update({
        topic_id: topicId,
        level: lesson.level,
        position: lesson.position,
        intro: lesson.intro,
        outro: lesson.outro,
        question_ids: orderedIds,
        published: true,
      }).eq("id", existing.id);
      if (error) throw error;
      updated++;
    } else {
      const { error } = await supabase.from("lessons").insert({
        topic_id: topicId,
        level: lesson.level,
        position: lesson.position,
        title: lesson.title,
        intro: lesson.intro,
        outro: lesson.outro,
        question_ids: orderedIds,
        published: true,
      });
      if (error) throw error;
      created++;
    }
  }
  console.log(`\n✓ trilha nova-cpa: ${created} fases criadas, ${updated} atualizadas`);
}

async function seedJsonTracks() {
  const seedDir = join(process.cwd(), "content", "seed");
  let trackDirs: string[];
  try {
    trackDirs = readdirSync(seedDir, { withFileTypes: true })
      .filter((e) => e.isDirectory())
      .map((e) => e.name);
  } catch {
    return;
  }
  if (trackDirs.length === 0) return;

  for (const trackSlug of trackDirs) {
    await seedTrackFromJson(trackSlug);
  }
}

async function seedTrackFromJson(trackSlug: string) {
  const dir = join(process.cwd(), "content", "seed", trackSlug);
  const files = readdirSync(dir).filter((f) => f.endsWith(".json")).sort();
  if (files.length === 0) return;

  const all: DemoQuestion[] = [];
  for (const f of files) {
    const arr = JSON.parse(readFileSync(join(dir, f), "utf-8")) as DemoQuestion[];
    all.push(...arr);
  }

  console.log(`\n→ track '${trackSlug}': ${all.length} questões em ${files.length} arquivo(s)`);

  const { data: track, error: tErr } = await supabase
    .from("tracks").select("id").eq("slug", trackSlug).single();
  if (tErr || !track) {
    console.error(`  ✖ track '${trackSlug}' não encontrada — pulando (rode supabase/seed.sql)`);
    return;
  }

  const slugs = Array.from(new Set(all.map((q) => q.topic_slug)));
  const { data: topics } = await supabase
    .from("topics").select("id, slug").eq("track_id", track.id).in("slug", slugs);
  const topicIdBySlug = new Map((topics ?? []).map((t) => [t.slug, t.id]));
  const missing = slugs.filter((s) => !topicIdBySlug.has(s));
  if (missing.length) {
    console.error(`  ✖ topics ausentes em '${trackSlug}':`, missing.join(", "));
    console.error("    rode `pnpm db:seed-topics` antes");
    return;
  }

  let inserted = 0;
  let updated = 0;
  for (const q of all) {
    const topicId = topicIdBySlug.get(q.topic_slug)!;
    const { data: existing } = await supabase
      .from("questions").select("id").eq("topic_id", topicId).eq("stem", q.stem).maybeSingle();

    if (existing) {
      const { error } = await supabase.from("questions").update({
        difficulty: q.difficulty,
        choices: q.choices,
        explanation: q.explanation,
        source_citation: q.source_citation,
        status: "published",
        generated_by: "claude",
      }).eq("id", existing.id);
      if (error) throw error;
      updated++;
    } else {
      const { error } = await supabase.from("questions").insert({
        topic_id: topicId,
        difficulty: q.difficulty,
        stem: q.stem,
        choices: q.choices,
        explanation: q.explanation,
        source_citation: q.source_citation,
        status: "published",
        generated_by: "claude",
      });
      if (error) throw error;
      inserted++;
    }
  }
  console.log(`  ✓ ${inserted} inseridas, ${updated} atualizadas`);
}

main().catch((e) => { console.error(e); process.exit(1); });
