/* eslint-disable @next/next/no-img-element */
"use client";

import { useCallback, useMemo, useState } from "react";
import { clsx } from "clsx";
import { DEFAULT_MODEL, MODELS, type ModelKey } from "@/lib/models";

type GenResponse = { images?: string[]; error?: unknown };

export default function HomePage() {
  const [prompt, setPrompt] = useState("a neon banana spaceship flying over a cyberpunk city, ultra-detailed");
  const [negativePrompt, setNegativePrompt] = useState("");
  const [model, setModel] = useState<ModelKey>(DEFAULT_MODEL);
  const [width, setWidth] = useState<number | "">("");
  const [height, setHeight] = useState<number | "">("");
  const [numOutputs, setNumOutputs] = useState(1);
  const [steps, setSteps] = useState<number | "">("");
  const [guidance, setGuidance] = useState<number | "">("");
  const [seed, setSeed] = useState<number | "">("");

  const [images, setImages] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selected = MODELS[model];
  const help = useMemo(
    () => `Using ${selected.label} ? ${selected.strengths}`,
    [selected]
  );

  const onSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setLoading(true);
      setError(null);
      setImages([]);
      try {
        const res = await fetch("/api/generate", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            prompt,
            negativePrompt,
            model,
            width: width === "" ? undefined : Number(width),
            height: height === "" ? undefined : Number(height),
            num_outputs: numOutputs,
            steps: steps === "" ? undefined : Number(steps),
            guidance: guidance === "" ? undefined : Number(guidance),
            seed: seed === "" ? undefined : Number(seed)
          })
        });
        const json = (await res.json()) as GenResponse;
        if (!res.ok) {
          const msg =
            (json as any)?.error?.message ||
            (typeof json.error === "string" ? json.error : "Generation failed");
          throw new Error(msg);
        }
        setImages(json.images ?? []);
      } catch (err: any) {
        setError(err?.message ?? "Something went wrong");
      } finally {
        setLoading(false);
      }
    },
    [prompt, negativePrompt, model, width, height, numOutputs, steps, guidance, seed]
  );

  return (
    <main className="card">
      <div className="row" style={{ alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <div className="badge">
            <span>Gen Studio</span>
            <span style={{ color: "var(--text)" }}>?</span>
            <span>Web Image Generator</span>
          </div>
          <h1 className="heading">Create images with top models</h1>
          <div className="subtle">{help}</div>
        </div>
        <a
          className="button secondary"
          href="https://replicate.com"
          target="_blank"
          rel="noreferrer"
        >
          Explore models
        </a>
      </div>

      <form onSubmit={onSubmit} style={{ marginTop: 16 }}>
        <div className="row">
          <input
            className="input"
            style={{ flex: 1, minWidth: 260 }}
            placeholder="Describe what to generate..."
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
          />
        </div>
        <div className="row" style={{ marginTop: 10 }}>
          <select
            className="select"
            value={model}
            onChange={(e) => setModel(e.target.value as ModelKey)}
          >
            {Object.values(MODELS).map((m) => (
              <option key={m.key} value={m.key}>
                {m.label}
              </option>
            ))}
          </select>

          <input
            className="input"
            style={{ width: 180 }}
            placeholder="Negative prompt (optional)"
            value={negativePrompt}
            onChange={(e) => setNegativePrompt(e.target.value)}
          />

          <select
            className="select"
            value={numOutputs}
            onChange={(e) => setNumOutputs(Number(e.target.value))}
          >
            {[1, 2, 3, 4].map((n) => (
              <option key={n} value={n}>
                {n} output{n > 1 ? "s" : ""}
              </option>
            ))}
          </select>
        </div>

        <div className="row" style={{ marginTop: 10 }}>
          <input
            className="input"
            style={{ width: 120 }}
            type="number"
            placeholder={`Width (${(selected.defaultInputs as any).width})`}
            value={width}
            onChange={(e) => setWidth(e.target.value === "" ? "" : Number(e.target.value))}
          />
          <input
            className="input"
            style={{ width: 120 }}
            type="number"
            placeholder={`Height (${(selected.defaultInputs as any).height})`}
            value={height}
            onChange={(e) => setHeight(e.target.value === "" ? "" : Number(e.target.value))}
          />
          <input
            className="input"
            style={{ width: 120 }}
            type="number"
            placeholder="Steps (auto)"
            value={steps}
            onChange={(e) => setSteps(e.target.value === "" ? "" : Number(e.target.value))}
          />
          <input
            className="input"
            style={{ width: 140 }}
            type="number"
            placeholder="Guidance (auto)"
            step="0.5"
            value={guidance}
            onChange={(e) => setGuidance(e.target.value === "" ? "" : Number(e.target.value))}
          />
          <input
            className="input"
            style={{ width: 140 }}
            type="number"
            placeholder="Seed (optional)"
            value={seed}
            onChange={(e) => setSeed(e.target.value === "" ? "" : Number(e.target.value))}
          />
        </div>

        {error ? <div className="error">{String(error)}</div> : null}

        <div className="row" style={{ marginTop: 12 }}>
          <button className="button" type="submit" disabled={loading || !prompt.trim()}>
            {loading ? "Generating?" : "Generate"}
          </button>
          <button
            className={clsx("button", "secondary")}
            type="button"
            disabled={loading || images.length === 0}
            onClick={() => setImages([])}
          >
            Clear results
          </button>
        </div>
      </form>

      <div style={{ marginTop: 18 }}>
        {images.length > 0 ? (
          <div className="grid">
            {images.map((url, i) => (
              <div className="thumb" key={`${url}-${i}`}>
                <a href={url} target="_blank" rel="noreferrer">
                  <img src={url} alt={`Generated ${i + 1}`} />
                </a>
              </div>
            ))}
          </div>
        ) : (
          <div className="subtle">Your results will appear here.</div>
        )}
      </div>
    </main>
  );
}

