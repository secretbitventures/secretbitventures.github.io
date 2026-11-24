# secretbitventures.com

Jekyll site, built into a small Caddy container for Railway.

```bash
bundle install
bundle exec jekyll serve
```

- `index.html`, `about.html`, `terms.md`: page content
- `_includes/expertise.html`: the hexagon expertise diagram
- `_includes/fig-*.svg`: work diagrams
- `assets/js/rail.js`: the auto-scrolling work carousel
- `assets/js/sheets.js`: the homepage visual-cryptography band
- `assets/css/site.css`: all styles (plain CSS, no build step)
- `services.html`, `contact.html`: redirects that keep old URLs working

## Deploying on Railway

Railway detects the `Dockerfile`; there is no `railway.json` because Railway
stops reading those files on 2026-12-01.

1. Create a service from this repo.
2. Settings > Deploy > turn on **Serverless**, then redeploy. The container makes
   no outbound requests of its own, so it sleeps after 5 to 10 idle minutes.
3. Settings > Networking: add `secretbitventures.com` and `www.secretbitventures.com`,
   then create the CNAME/ALIAS and TXT records Railway shows.
4. Once the domain is verified, turn off GitHub Pages and delete `CNAME`.

Test the container locally:

```bash
docker build -t sbv . && docker run --rm -p 8080:8080 sbv
```
