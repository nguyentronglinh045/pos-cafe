# Đối chứng bộ đo, không phải nghiệm thu UI ứng dụng

Scope: **selftest**. Measurement status: **PASS**. Product acceptance: **NOT_ASSESSED**.

Pixel difference is a count of differing pixels, not a percentage of design accuracy.

| case | measurement | control expectation | diff pixels / all | max geometry px | tokens | responsive | font |
| --- | --- | --- | --- | --- | --- | --- | --- |
| minimum | PASS | PASS | 0/181760 | 0 | 22/22 | true | true |
| phone | PASS | PASS | 0/329160 | 0 | 22/22 | true | true |
| tablet | PASS | PASS | 0/786432 | 0 | 22/22 | true | true |
| desktop | PASS | PASS | 0/1296000 | 0 | 22/22 | true | true |
| long-vietnamese | PASS | PASS | 0/181760 | 0 | 22/22 | true | true |
| detect-shift | FAIL | FAIL | 11663/786432 | 6 | 22/22 | true | true |
| detect-palette | FAIL | FAIL | 34126/786432 | 0 | 21/22 | true | true |
| detect-occlusion | FAIL | FAIL | 0/181760 | 0 | 22/22 | false | true |
| detect-small-target | FAIL | FAIL | 30352/181760 | 506 | 22/22 | false | true |
| detect-font | FAIL | FAIL | 7053/181760 | 16.25 | 22/22 | true | false |
| detect-overflow | FAIL | FAIL | 55567/181760 | 450 | 22/22 | false | true |

All required app audit, business, permission and owner-acceptance gates remain NOT_ASSESSED by this runner.

Source manifest SHA-256: `9b6790ca85ca91338087239138c5dc389e45b86b8fb2ece0779703816b4a5209`
Reference input SHA-256: `9cf839d41f8f7a4e67973f91a7402fb3d3b1a106227afecf0a3a75dab4e313d0`

## Images and details

### minimum
[reference](minimum-reference.png) · [actual](minimum-actual.png) · [diff](minimum-diff.png) · [overlay](minimum-overlay.png)

### phone
[reference](phone-reference.png) · [actual](phone-actual.png) · [diff](phone-diff.png) · [overlay](phone-overlay.png)

### tablet
[reference](tablet-reference.png) · [actual](tablet-actual.png) · [diff](tablet-diff.png) · [overlay](tablet-overlay.png)

### desktop
[reference](desktop-reference.png) · [actual](desktop-actual.png) · [diff](desktop-diff.png) · [overlay](desktop-overlay.png)

### long-vietnamese
[reference](long-vietnamese-reference.png) · [actual](long-vietnamese-actual.png) · [diff](long-vietnamese-diff.png) · [overlay](long-vietnamese-overlay.png)

### detect-shift
[reference](detect-shift-reference.png) · [actual](detect-shift-actual.png) · [diff](detect-shift-diff.png) · [overlay](detect-shift-overlay.png)

### detect-palette
[reference](detect-palette-reference.png) · [actual](detect-palette-actual.png) · [diff](detect-palette-diff.png) · [overlay](detect-palette-overlay.png)

### detect-occlusion
[reference](detect-occlusion-reference.png) · [actual](detect-occlusion-actual.png) · [diff](detect-occlusion-diff.png) · [overlay](detect-occlusion-overlay.png)

### detect-small-target
[reference](detect-small-target-reference.png) · [actual](detect-small-target-actual.png) · [diff](detect-small-target-diff.png) · [overlay](detect-small-target-overlay.png)

### detect-font
[reference](detect-font-reference.png) · [actual](detect-font-actual.png) · [diff](detect-font-diff.png) · [overlay](detect-font-overlay.png)

### detect-overflow
[reference](detect-overflow-reference.png) · [actual](detect-overflow-actual.png) · [diff](detect-overflow-diff.png) · [overlay](detect-overflow-overlay.png)
