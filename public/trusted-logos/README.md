# Trusted Logos

1. Put your source grid image at `public/trusted-logos/source-grid.png`.
2. Run:

```bash
python3 scripts/extract_trusted_logos.py
```

3. This generates transparent files used by the landing page marquee:

- `logo-01.png`
- `logo-02.png`
- ...
- `logo-16.png`

If background cleanup is too aggressive or too weak, adjust tolerance:

```bash
python3 scripts/extract_trusted_logos.py --tolerance 24
python3 scripts/extract_trusted_logos.py --tolerance 34
```
