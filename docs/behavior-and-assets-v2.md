# 自然行為與角色資產 v2 設計

這份規格記錄小呆 Companion 下一階段的行為、動畫與角色一致性方向。核心原則是「有結構的隨機性」：看起來不可預測，但每個選擇都要符合姿勢、情境、個性與前後動作。

## 1. 自然感的目標

- 65–75% 的時間維持坐著、趴著、呼吸、眨眼、耳朵轉動、尾巴小幅擺動等低強度生活狀態。
- 20–30% 是轉頭、換重心、伸懶腰、理毛、坐下／趴下等姿勢轉換與自我整理。
- 3–8% 才是走動、跑動、跳躍或較顯眼的互動。
- 不使用固定週期；停留時間採長尾分布，讓短暫觀察與長時間休息都可能發生。
- 同一行為要有多個變體，並以近期記憶、冷卻時間及重複懲罰避免機械式循環。

上述比例是預設值，不是硬性排程；每隻寵物可以由自己的個性設定調整。

## 2. 階層式半馬可夫行為規劃器

行為分成三層：

1. **生活狀態**：姿勢、精力、睡意、好奇、親密度、注意目標。
2. **行為意圖**：休息、觀察、自我整理、移動、回應使用者。
3. **動畫變體**：從符合目前姿勢的動作中挑選一個具體片段。

候選動作分數可表示為：

```text
score = baseWeight
      × personalityWeight
      × needWeight
      × contextWeight
      × transitionValidity
      × repetitionPenalty
      × cooldownFactor
```

規劃器只在動作自然結束點重新挑選；使用者拖動、點擊或呼叫等事件可在允許中斷的節點插入。固定種子的亂數產生器用於測試，正式執行時使用隨機種子。

### 簡化 pseudo code

```js
function planNext(state, context, recentActions, rng) {
  const candidates = actions
    .filter(action => action.fromPose.includes(state.pose))
    .filter(action => action.conditions(state, context))
    .filter(action => cooldownReady(action));

  for (const action of candidates) {
    action.score = action.baseWeight
      * personality[action.intent]
      * needScore(action, state)
      * contextScore(action, context)
      * repetitionPenalty(action, recentActions);
  }

  const chosen = weightedRandom(candidates, rng);
  const variant = weightedRandom(validVariants(chosen, state), rng);
  state.nextDecisionAt = now + sampleLongTail(variant.dwellTime, rng);
  return variant;
}
```

## 3. 姿勢與轉場圖

第一版姿勢集合：

```text
sit <-> stand <-> walk <-> run
 |       |
 v       v
lie    turn
 |
 v
sleep
```

理毛、眨眼、耳動、轉頭與尾動是附著在相容姿勢上的微動作。動畫不能任意跳接；每個片段都需要宣告起始與結束姿勢，必要時使用短轉場片段。

拖動時依平滑後的游標速度判斷：低速播放走路，高速切換跑步；開始拖動與放開時要經過抬頭／起身／減速／停步的自然轉場，不直接瞬切。

## 4. 動畫與中繼資料

建議每個常用行為有 3–6 個變體，稀有行為有 2–3 個變體。第一個可看版本目標為 15–18 種行為、40–55 個片段、合計約 250–400 個有效畫格。

```text
assets/pets/<寵物>/
├─ source/                         私有／參考生活照
├─ generated/
│  ├─ motions/<action>/<variant>.webp
│  ├─ motions/<action>/motion.json
│  ├─ sprite-sheet.png             v1 相容輸出
│  └─ preview.gif
└─ pet.json                        個性、外觀與預設權重
```

`motion.json` 至少包含：

```json
{
  "id": "sit-look-left-01",
  "fromPose": "sit",
  "toPose": "sit",
  "intent": "observe",
  "weight": 1.0,
  "cooldownMs": 8000,
  "interruptible": true,
  "frameDurationsMs": [500, 240, 680, 300, 900],
  "tags": ["micro", "calm", "left"]
}
```

每格可有不同停留時間；頭部轉動、注視與坐下等動作要增加中間格並採非線性節奏，避免快速轉頭與等速機械感。

## 5. 個性與記憶

小呆、15、牧牧各自擁有獨立設定，至少包含：

- `energy`：高強度行為傾向。
- `curiosity`：觀察、轉頭與靠近傾向。
- `sleepiness`：趴下、睡眠及停留時間。
- `affection`：摸頭、呼叫與跟隨反應。
- `grooming`：理毛頻率。
- `startle`：突然拖動或快速游標的反應強度。

近期記憶保存最近 8–12 個行為、方向與姿勢；相同動作、相同方向或相同變體連續出現時逐級降權，而不是只禁止一次立即重複。

## 6. 小呆的高寫實度與角色一致性

2026-11-02 已核對 `assets/pets/小呆/source/`：60 張 JPG 全部可正常解碼，其中 39 張為 1536×2048 直式、21 張為 2048×1536 橫式，總量約 13.16 MB。這批照片涵蓋坐、趴、理毛、休息及多種距離與角度，可作為第一版角色基準。

60 張生活照先用來建立角色基準，不直接逐格獨立生成動畫。流程如下：

1. 篩選清楚的正面、左右側、背面、坐、趴、站、理毛與行走參考。
2. 建立一致的毛色、臉型、耳型、眼色、鼻色、身形與條紋位置角色表。
3. 先製作正面坐姿、側面站姿、趴姿三張高寫實度風格測試。
4. 確認像小呆後，再製作 12 個核心片段；同一片段的畫格由共享基準姿勢與相鄰格約束產生。
5. 做輪廓對齊、腳底接地、毛紋漂移、亮度與透明邊緣檢查，再擴充完整變體庫。

視覺要求：保留小呆偏淺的砂橘色、自然短毛、真實比例與綠黃色眼睛；避免放大眼睛、圓化臉型、過度描邊與卡通高光。背景、家具與人物只作參考，不進入透明角色成品。

## 7. 照片與發行邊界

- 執行階段不讀取 `source/`。
- Windows 安裝檔與 plugin ZIP 明確排除所有 `assets/pets/*/source/`。
- `source/` 若被提交到公開 GitHub repo，仍然是公開可下載內容；打包排除不等於 GitHub 隱私保護。
- 產生後可散布的動畫只放在該寵物自己的 `generated/`，避免三隻寵物的素材、授權與身份特徵混用。

## 8. 驗證標準

- 以固定種子測試 30 分鐘模擬，不出現非法姿勢跳接。
- 任一 2 分鐘區間不連續重複同一變體；高頻微動作仍需有方向與節奏變化。
- 拖動速度門檻有遲滯區，避免走／跑在臨界值快速切換。
- 每段動畫可逐格設定時間，並驗證總長、透明背景、接地位置與首尾姿勢。
- 發行包自動測試不得含有 `/source/` 生活照。

## 9. 目前完成度與可實際使用門檻（2026-11-03）

目前已完成：坐姿與趴姿寫實待機、每格獨立時間、權重與冷卻、避免立即重複、眨眼／轉頭／耳動／小睡、25–75 秒趴姿停留、可正反播放的寫實坐下／起身過渡，以及各自獨立的四格寫實走路與跑步循環。左右移動由同一組側面素材鏡像；走／跑門檻加入遲滯，避免臨界速度閃換。程式核心已能支援多隻寵物與多組自然動作。

達到可日常試用仍需優先完成：

1. 拖動開始與放開的專用起步／停步影格；目前以短交叉淡化銜接寫實坐姿和移動循環。
2. 統一寫實素材的畫布、腳底基準與角色縮放，減少不同姿勢交叉淡化時的尺寸漂移。
3. Windows 安裝檔實機驗證：透明視窗、置頂、縮放、多螢幕、睡眠喚醒與記憶體占用。
4. 壓縮圖片或改用 WebP／分包載入；新增走跑素材後，自包含 plugin 仍需重新量測並降體積。

達到第一個公開穩定版則再補：站立、轉身、伸懶腰、理毛、互動反應的寫實片段；30 分鐘長時間隨機模擬；程式碼簽章或清楚的 SmartScreen 安裝說明；版本化下載與升級流程。

因此現階段的主要缺口確實是圖像素材，但不是「只要多畫幾張」：每個片段還需要一致的首尾姿勢、透明邊緣、畫布尺寸、腳底接地與動作時間。安裝與效能屬於第二個必做缺口。
