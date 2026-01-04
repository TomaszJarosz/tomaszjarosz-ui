# Memory System

System pamięci dla Claude Code w tomaszjarosz-ui.

## Cel

Memory files pozwalają Claude:
1. **Uczyć się** z poprzednich sesji
2. **Śledzić trendy** (bundle sizes, breaking changes)
3. **Porównywać** z baseline'ami
4. **Pamiętać** publikacje i issues

## Pliki

| Plik | Cel | Agent |
|------|-----|-------|
| `publish-log.md` | Historia publikacji npm | post-publish |
| `patterns.md` | Lessons learned | manual |
| `bundle-sizes.md` | Rozmiary bundli | bundle-size-analyzer |
| `breaking-changes.md` | Breaking changes history | breaking-changes-detector |
| `dependency-audit.md` | Security i deps | dependency-audit |

## Zasady

1. **PRZED** - agent czyta memory file
2. **PO** - agent dodaje wpis z datą
3. Wpisy są chronologiczne
4. Każdy wpis ma datę `## YYYY-MM-DD`
