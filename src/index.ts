#!/usr/bin/env node
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

const BASE = "https://api.unsplash.com";
const RATE_LIMIT_MS = 200;
let last = 0;

function getKey(): string {
  const k = process.env.UNSPLASH_ACCESS_KEY;
  if (!k) throw new Error("UNSPLASH_ACCESS_KEY required. Free at https://unsplash.com/developers");
  return k;
}

async function uFetch(path: string): Promise<any> {
  const now = Date.now(); if (now - last < RATE_LIMIT_MS) await new Promise((r) => setTimeout(r, RATE_LIMIT_MS - (now - last)));
  last = Date.now();
  const res = await fetch(`${BASE}${path}`, { headers: { Authorization: `Client-ID ${getKey()}` } });
  if (!res.ok) throw new Error(`Unsplash ${res.status}`);
  return res.json();
}

function mapPhoto(p: any) {
  return { id: p.id, description: p.description || p.alt_description, width: p.width, height: p.height,
    color: p.color, photographer: p.user?.name, url: p.urls?.regular, thumb: p.urls?.thumb,
    downloadUrl: p.links?.download, htmlUrl: p.links?.html, likes: p.likes };
}

const server = new McpServer({ name: "mcp-unsplash", version: "1.0.0" });

server.tool("search_photos", "Search for photos.", {
  query: z.string(), perPage: z.number().min(1).max(30).default(10),
  orientation: z.enum(["landscape", "portrait", "squarish"]).optional(),
  color: z.string().optional().describe("Filter by color (e.g. 'blue', 'green', 'black_and_white')"),
}, async ({ query, perPage, orientation, color }) => {
  const p = new URLSearchParams({ query, per_page: String(perPage) });
  if (orientation) p.set("orientation", orientation);
  if (color) p.set("color", color);
  const d = await uFetch(`/search/photos?${p}`);
  return { content: [{ type: "text" as const, text: JSON.stringify({ total: d.total, photos: d.results?.map(mapPhoto) }, null, 2) }] };
});

server.tool("get_photo", "Get photo details.", {
  photoId: z.string(),
}, async ({ photoId }) => {
  const d = await uFetch(`/photos/${photoId}`);
  return { content: [{ type: "text" as const, text: JSON.stringify(mapPhoto(d), null, 2) }] };
});

server.tool("random_photo", "Get a random photo.", {
  query: z.string().optional(), orientation: z.enum(["landscape", "portrait", "squarish"]).optional(),
}, async ({ query, orientation }) => {
  const p = new URLSearchParams();
  if (query) p.set("query", query);
  if (orientation) p.set("orientation", orientation);
  const d = await uFetch(`/photos/random?${p}`);
  return { content: [{ type: "text" as const, text: JSON.stringify(mapPhoto(d), null, 2) }] };
});

server.tool("list_collections", "Search photo collections.", {
  query: z.string(), perPage: z.number().min(1).max(30).default(10),
}, async ({ query, perPage }) => {
  const d = await uFetch(`/search/collections?query=${encodeURIComponent(query)}&per_page=${perPage}`);
  const collections = d.results?.map((c: any) => ({
    id: c.id, title: c.title, description: c.description?.slice(0, 200),
    totalPhotos: c.total_photos, coverPhoto: c.cover_photo?.urls?.small,
  }));
  return { content: [{ type: "text" as const, text: JSON.stringify(collections, null, 2) }] };
});

server.tool("search_users", "Search for photographers.", {
  query: z.string(), perPage: z.number().min(1).max(30).default(10),
}, async ({ query, perPage }) => {
  const d = await uFetch(`/search/users?query=${encodeURIComponent(query)}&per_page=${perPage}`);
  const users = d.results?.map((u: any) => ({
    username: u.username, name: u.name, bio: u.bio?.slice(0, 200),
    totalPhotos: u.total_photos, profileUrl: u.links?.html,
  }));
  return { content: [{ type: "text" as const, text: JSON.stringify(users, null, 2) }] };
});

async function main() { const t = new StdioServerTransport(); await server.connect(t); }
main().catch((e) => { console.error("Fatal:", e); process.exit(1); });
