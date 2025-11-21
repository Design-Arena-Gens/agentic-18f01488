import { NextRequest } from "next/server";
import Replicate from "replicate";
import { z } from "zod";
import { MODELS } from "@/lib/models";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const InputSchema = z.object({
  prompt: z.string().min(3, "Prompt is too short"),
  negativePrompt: z.string().optional().default(""),
  model: z.string(),
  width: z.number().int().positive().optional(),
  height: z.number().int().positive().optional(),
  num_outputs: z.number().int().min(1).max(4).optional(),
  steps: z.number().int().min(1).max(50).optional(),
  guidance: z.number().min(0).max(20).optional(),
  seed: z.number().int().optional()
});

export async function POST(req: NextRequest) {
  try {
    if (!process.env.REPLICATE_API_TOKEN) {
      return new Response(
        JSON.stringify({
          error:
            "Server missing REPLICATE_API_TOKEN. Set it in project environment variables."
        }),
        { status: 500 }
      );
    }

    const body = await req.json();
    const parsed = InputSchema.safeParse(body);
    if (!parsed.success) {
      return new Response(JSON.stringify({ error: parsed.error.flatten() }), {
        status: 400
      });
    }

    const {
      prompt,
      negativePrompt,
      model,
      width,
      height,
      num_outputs,
      steps,
      guidance,
      seed
    } = parsed.data;

    const selected = Object.values(MODELS).find((m) => m.key === model);
    if (!selected) {
      return new Response(
        JSON.stringify({ error: `Unknown model: ${model}` }),
        { status: 400 }
      );
    }

    const replicate = new Replicate({
      auth: process.env.REPLICATE_API_TOKEN!
    });

    const baseInputs = selected.defaultInputs;
    const inputs = {
      ...baseInputs,
      prompt,
      negative_prompt: negativePrompt || undefined,
      width: width ?? (baseInputs as any).width,
      height: height ?? (baseInputs as any).height,
      num_outputs: num_outputs ?? (baseInputs as any).num_outputs,
      steps,
      guidance,
      seed
    };

    // Filter out undefined values for cleaner payload
    const cleanInputs = Object.fromEntries(
      Object.entries(inputs).filter(([, v]) => v !== undefined && v !== null)
    );

    const output = (await replicate.run(selected.replicateModel, {
      input: cleanInputs
    })) as unknown;

    // Replicate model outputs vary: often array of URLs, or object with images
    let images: string[] = [];
    if (Array.isArray(output)) {
      images = output as string[];
    } else if (output && typeof output === "object") {
      const maybeImages = (output as any).images || (output as any).output;
      if (Array.isArray(maybeImages)) {
        images = maybeImages;
      }
    }

    if (images.length === 0) {
      return new Response(
        JSON.stringify({ error: "Model returned no images", raw: output }),
        { status: 502 }
      );
    }

    return new Response(JSON.stringify({ images }), {
      headers: { "content-type": "application/json" }
    });
  } catch (err: any) {
    console.error(err);
    const message =
      typeof err?.message === "string" ? err.message : "Unexpected server error";
    return new Response(JSON.stringify({ error: message }), { status: 500 });
  }
}

