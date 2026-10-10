# Découpe AI — état opérationnel

- Stable : V3.1.0 sur main a00a316 ; tag v3.1.0 sur9105f4b, Cloudflare public V3.1.0.
- Développement : develop depuis8ffac19, candidate V5.2.0 avec filigrane.
- Lot : architecture et workflow, sans changement du moteur ni des fonctionnalités.
- Terminé : audit avant écriture ; 9 tags archive/* poussés et pointes vérifiées. Voir docs/REPOSITORY_AUDIT.md.
- Restant : sources uniques src/, build/validation, documentation compacte, CI develop/main, migration Pages, vérification puis nettoyage des branches sûres.
- Validation : audit Git et API, lecture HTTP Cloudflare V3.1.0 ; tests du lot non encore exécutés.
- Blocage : aucun pour le code. Liaison Git Cloudflare côté dashboard non vérifiable depuis Git ; ne pas modifier la production.
- Prochaine action : déplacer les sources et adapter build/tests ; checkpoint après validation.
