/**
 * Seed de demonstração: 5 questões OAB + 1 lição publicada.
 *
 * Cobre tópicos com peso alto (Civil, Ética, Penal) para o lesson player ter
 * algo jogável end-to-end. Idempotente.
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

  console.log("\n✓ seed demo concluído");
}

main().catch((e) => { console.error(e); process.exit(1); });
