# lie-idle-v1

小呆的第二組寫實自然待機格，用於趴著休息時的長時間生活狀態。

## 內容

- 中立趴姿
- 半眨眼與閉眼
- 低頭休息的中間格
- 將頭靠近前掌小睡的端點格
- 單耳聆聽反應

六張均為 1536×1024 RGBA PNG，四角 alpha 為 0。生成時以 `identity-lie-v1.png` 或上一個過渡格作 edit target，並搭配四張真實生活照鎖定身份。

## 共用生成提示

```text
Use case: identity-preserve
Asset type: one transparent animation keyframe for a photorealistic Windows desktop pet
Input images: Image 1 is the exact approved lying-pose edit target. Images 2–5 are supporting identity and anatomy references of the same real cat 小呆.
Primary request: Make only the requested natural movement to Image 1. Preserve 小呆's exact identity and realistic appearance.
Invariants: keep the same full-body lying pose, torso silhouette, camera angle, crop, canvas scale, ground alignment, tail position, paw positions, sandy light-orange fur color, markings, lighting and fine fur. Genuine transparent background with clean alpha edge. No floor, shadow, halo, text or border.
Avoid: generic orange tabby substitution, cartoon or 3D look, oversized eyes, changed coat pattern, changed anatomy, duplicated whiskers or limbs.
```

`motion.json` 使用不同權重、冷卻時間與長尾停留時間；低頭小睡是低頻長動作，不會像固定 GIF 一樣一直循環。
