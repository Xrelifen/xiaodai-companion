# 小呆角色校準稿

這個資料夾保存小呆的角色校準圖。`identity-sit-v1.png` 已獲確認並作為第一組寫實待機動作的身份與構圖基準；站姿和趴姿仍需在對應動作製作前個別校準。

## v1 檔案

- `identity-sit-v1.png`：近正面三分之四坐姿。
- `identity-stand-profile-v1.png`：左向側面站姿。
- `identity-lie-v1.png`：三分之四趴姿。

三張均為 32-bit RGBA PNG，四角 alpha 為 0。

## 共用生成規格

```text
Use case: photorealistic-natural
Asset type: transparent-background character style proof for a Windows desktop companion
Primary request: Reconstruct the exact same real cat named 小呆 from the reference photographs. Preserve his identity rather than making a generic orange tabby.
Input images: all supplied images are identity and anatomy references for the cat only; ignore every person, room, object, fabric, and background.
Subject identity: adult short-haired light sandy-orange tabby; realistic medium build with relatively long legs and a gently rounded torso; narrow natural feline face, tall upright ears with pink inner ears, yellow-green eyes, pale cream muzzle/chin/chest/underside and lighter paws, pink nose, subtle darker orange forehead M and cheek stripes, soft body striping, ringed tail, natural whiskers.
Style/medium: highly realistic animal photography/cinematic VFX cutout, fine individual fur, true feline anatomy and proportions, not an illustration and not a 3D cartoon.
Lighting/mood: soft neutral diffuse daylight, natural color, no dramatic rim lighting.
Constraints: genuine transparent background with clean alpha edges; entire cat visible; consistent neutral scale; no collar or accessory; no furniture, floor, person, prop, text, border or watermark; pose must look physically stable and usable as a desktop pet asset.
Avoid: cartoon, anime, painterly look, plastic fur, oversized eyes, kitten proportions, round mascot face, exaggerated fluff, dark saturated red-orange coat, pure white socks, duplicated limbs, distorted paws, cropped ears or tail.
```

各檔另加相應的坐姿、站姿或趴姿構圖要求。每次使用 5 張生活照作身份與解剖參考，透過內建圖片生成工具產生。

## v1 初步檢查

- 坐姿最接近可用基準，但仍需確認眼睛是否偏大、臉是否過於對稱。
- 側面站姿有抬腿與淡色光暈，不適合作為正式動畫首格，需重做穩定四足站姿。
- 趴姿的身形與臉頰略圓，應依生活照再收窄並移除光暈。
