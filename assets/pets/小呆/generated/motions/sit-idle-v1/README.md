# sit-idle-v1

小呆第一組寫實自然待機關鍵格，已接入 Companion 的自然動作播放器；其他尚未重製的動作仍暫時使用 v1 sprite sheet。

## 內容

- 中立坐姿
- 半眨眼
- 閉眼
- 輕微向畫面左側觀察
- 向畫面左側觀察的半程過渡
- 輕微向畫面右側觀察
- 向畫面右側觀察的半程過渡
- 單耳聆聽反應

八張皆以 `identity-sit-v1.png` 作 edit target，並搭配四張真實生活照鎖定身份。所有檔案為 1161×1354 RGBA PNG，透明四角已檢查。

## 共用生成提示

```text
Use case: identity-preserve
Asset type: one transparent animation keyframe for a photorealistic Windows desktop pet
Input images: Image 1 is the exact edit target and approved identity/composition baseline. Images 2–5 are supporting identity references of the same real cat 小呆.
Primary request: Make only the requested tiny natural movement to Image 1. Preserve 小呆's exact identity and the approved realistic appearance.
Invariants: keep the same full-body seated pose, body silhouette, camera angle, crop, scale, ground alignment, tail position, paw positions, sandy light-orange fur color, markings, face proportions, lighting, fine fur, transparent background and clean alpha edge. No body repositioning. No new props, floor, shadow, halo, text or border.
Avoid: generic orange tabby substitution, cartoon or 3D look, oversized eyes, changed coat pattern, changed anatomy, duplicated whiskers or limbs.
```

每一格只在共用提示後加入一項指定微動作。正式動畫會使用 `motion.json` 的長尾停留時間與權重，而不是固定循環播放。

兩張半程過渡格另使用「只轉動頭部與視線約 4–5 度、眼睛稍微先行、保持身體與腳底完全不動」的限制。播放器會隨機抽樣每格停留時間、避免立即重複同一動作，並以 135ms 交叉淡化降低切格感。
