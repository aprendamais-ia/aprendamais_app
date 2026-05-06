/**
 * Lê content/syllabi/*.yaml e popula a tabela `topics` no Supabase.
 *
 * Uso:
 *   pnpm db:seed-topics
 *
 * Pré-requisitos no .env.local:
 *   NEXT_PUBLIC_SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY  (não a anon — precisa de service_role para bypass RLS)
 *
 * Idempotente: usa upsert por (track_id, slug).
 */

import "dotenv/config";
import { config as loadEnv } from "dotenv";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { parse as parseYaml } from "yaml";
import { createClient } from "@supabase/supabase-js";

loadEnv({ path: ".env.local" });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_ROLE) {
  console.error("✖ Faltou NEXT_PUBLIC_SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY no .env.local");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE, {
  auth: { persistSession: false, autoRefreshToken: false },
});

type SyllabusTopic = {
  slug: string;
  name: string;
  keywords?: string[];
  official_reference?: string;
};

type SyllabusModule = {
  slug: string;
  name: string;
  weight?: number;
  questions_in_exam?: number;
  topics?: SyllabusTopic[];
};

type Syllabus = {
  track: string;
  issuer: string;
  version: string;
  modules: SyllabusModule[];
};

async function main() {
  const dir = join(process.cwd(), "content", "syllabi");
  const files = readdirSync(dir).filter((f) => f.endsWith(".yaml"));

  for (const file of files) {
    const raw = readFileSync(join(dir, file), "utf-8");
    const syllabus = parseYaml(raw) as Syllabus;
    console.log(`\n→ ${syllabus.track} (${syllabus.modules.length} módulos)`);

    const { data: track, error: trackErr } = await supabase
      .from("tracks")
      .select("id")
      .eq("slug", syllabus.track)
      .single();

    if (trackErr || !track) {
      console.error(`  ✖ track ${syllabus.track} não encontrada — rode o seed.sql primeiro`);
      continue;
    }

    let modulePos = 0;
    for (const mod of syllabus.modules) {
      const { data: moduleRow, error: modErr } = await supabase
        .from("topics")
        .upsert(
          {
            track_id: track.id,
            parent_id: null,
            slug: mod.slug,
            name: mod.name,
            weight: mod.weight ?? 0,
            position: modulePos++,
            keywords: [],
            official_reference: null,
          },
          { onConflict: "track_id,slug" },
        )
        .select("id")
        .single();

      if (modErr || !moduleRow) {
        console.error(`  ✖ módulo ${mod.slug}:`, modErr?.message);
        continue;
      }

      let topicPos = 0;
      for (const t of mod.topics ?? []) {
        const childSlug = `${mod.slug}.${t.slug}`;
        const { error: topicErr } = await supabase.from("topics").upsert(
          {
            track_id: track.id,
            parent_id: moduleRow.id,
            slug: childSlug,
            name: t.name,
            weight: 0,
            position: topicPos++,
            keywords: t.keywords ?? [],
            official_reference: t.official_reference ?? null,
          },
          { onConflict: "track_id,slug" },
        );
        if (topicErr) {
          console.error(`    ✖ ${childSlug}:`, topicErr.message);
        }
      }
      console.log(`  ✓ ${mod.slug} (${mod.topics?.length ?? 0} subtópicos)`);
    }
  }

  console.log("\n✓ seed concluído");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
