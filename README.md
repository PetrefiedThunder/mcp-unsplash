# mcp-unsplash

Search high-quality photos, collections, and photographers via Unsplash.

## Tools

| Tool | Description |
|------|-------------|
| `search_photos` | Search for photos. |
| `get_photo` | Get photo details. |
| `random_photo` | Get a random photo. |
| `list_collections` | Search photo collections. |
| `search_users` | Search for photographers. |

## Configuration

| Variable | Required | Description |
|----------|----------|-------------|
| `UNSPLASH_ACCESS_KEY` | Yes | Unsplash access key (free at unsplash.com/developers) |

## Installation

```bash
git clone https://github.com/PetrefiedThunder/mcp-unsplash.git
cd mcp-unsplash
npm install
npm run build
```

## Usage with Claude Desktop

Add to your `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "unsplash": {
      "command": "node",
      "args": ["/path/to/mcp-unsplash/dist/index.js"],
      "env": {
        "UNSPLASH_ACCESS_KEY": "your-unsplash-access-key"
      }
    }
  }
}
```

## Usage with npx

```bash
npx mcp-unsplash
```

## License

MIT
