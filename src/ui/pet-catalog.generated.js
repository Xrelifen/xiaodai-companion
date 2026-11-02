globalThis.XIAODAI_PET_CATALOG = [
  {
    "id": "xiaodai",
    "name": "小呆",
    "folder": "小呆",
    "accentColor": "#df8c43",
    "placeholderEmoji": "🐈",
    "spriteSheet": "generated/sprite-sheet.png",
    "previewGif": "generated/preview.gif",
    "frame": {
      "width": 192,
      "height": 208,
      "columns": 8,
      "rows": 11
    },
    "animationProfile": "natural-v2",
    "spriteUrl": "../../assets/pets/%E5%B0%8F%E5%91%86/generated/sprite-sheet.png",
    "naturalMotion": {
      "schemaVersion": 1,
      "id": "sit-idle-v1",
      "petId": "xiaodai",
      "intent": "idle",
      "fromPose": "sit",
      "toPose": "sit",
      "canvas": {
        "width": 1161,
        "height": 1354
      },
      "identityBase": "../../concepts/identity-sit-v1.png",
      "neutralFrame": "frames/frame-000-neutral.png",
      "idleGapMs": [
        800,
        3200
      ],
      "transitionMs": 135,
      "interruptible": true,
      "runtimeNotes": {
        "breathing": "Apply a subtle 0.4–0.8% vertical chest/body scale in the renderer; do not generate a separate high-amplitude breathing frame.",
        "transition": "Cross-fade or interpolate over 90–160 ms where a direct head-pose change is visually abrupt."
      },
      "neutralFrameUrl": "../../assets/pets/%E5%B0%8F%E5%91%86/generated/motions/sit-idle-v1/frames/frame-000-neutral.png",
      "variants": [
        {
          "id": "slow-blink",
          "weight": 5,
          "cooldownMs": 4500,
          "frames": [
            {
              "file": "frames/frame-000-neutral.png",
              "durationMs": [
                900,
                2600
              ],
              "url": "../../assets/pets/%E5%B0%8F%E5%91%86/generated/motions/sit-idle-v1/frames/frame-000-neutral.png"
            },
            {
              "file": "frames/frame-010-half-blink.png",
              "durationMs": 170,
              "url": "../../assets/pets/%E5%B0%8F%E5%91%86/generated/motions/sit-idle-v1/frames/frame-010-half-blink.png"
            },
            {
              "file": "frames/frame-020-eyes-closed.png",
              "durationMs": [
                110,
                180
              ],
              "url": "../../assets/pets/%E5%B0%8F%E5%91%86/generated/motions/sit-idle-v1/frames/frame-020-eyes-closed.png"
            },
            {
              "file": "frames/frame-010-half-blink.png",
              "durationMs": 190,
              "url": "../../assets/pets/%E5%B0%8F%E5%91%86/generated/motions/sit-idle-v1/frames/frame-010-half-blink.png"
            },
            {
              "file": "frames/frame-000-neutral.png",
              "durationMs": [
                800,
                2200
              ],
              "url": "../../assets/pets/%E5%B0%8F%E5%91%86/generated/motions/sit-idle-v1/frames/frame-000-neutral.png"
            }
          ]
        },
        {
          "id": "look-viewer-left",
          "weight": 2.4,
          "cooldownMs": 7000,
          "frames": [
            {
              "file": "frames/frame-000-neutral.png",
              "durationMs": [
                700,
                1800
              ],
              "url": "../../assets/pets/%E5%B0%8F%E5%91%86/generated/motions/sit-idle-v1/frames/frame-000-neutral.png"
            },
            {
              "file": "frames/frame-025-look-viewer-left-half.png",
              "durationMs": [
                180,
                270
              ],
              "url": "../../assets/pets/%E5%B0%8F%E5%91%86/generated/motions/sit-idle-v1/frames/frame-025-look-viewer-left-half.png"
            },
            {
              "file": "frames/frame-030-look-viewer-left.png",
              "durationMs": [
                900,
                2200
              ],
              "url": "../../assets/pets/%E5%B0%8F%E5%91%86/generated/motions/sit-idle-v1/frames/frame-030-look-viewer-left.png"
            },
            {
              "file": "frames/frame-025-look-viewer-left-half.png",
              "durationMs": [
                210,
                320
              ],
              "url": "../../assets/pets/%E5%B0%8F%E5%91%86/generated/motions/sit-idle-v1/frames/frame-025-look-viewer-left-half.png"
            },
            {
              "file": "frames/frame-000-neutral.png",
              "durationMs": [
                900,
                2400
              ],
              "url": "../../assets/pets/%E5%B0%8F%E5%91%86/generated/motions/sit-idle-v1/frames/frame-000-neutral.png"
            }
          ]
        },
        {
          "id": "look-viewer-right",
          "weight": 2.4,
          "cooldownMs": 7000,
          "frames": [
            {
              "file": "frames/frame-000-neutral.png",
              "durationMs": [
                700,
                1800
              ],
              "url": "../../assets/pets/%E5%B0%8F%E5%91%86/generated/motions/sit-idle-v1/frames/frame-000-neutral.png"
            },
            {
              "file": "frames/frame-035-look-viewer-right-half.png",
              "durationMs": [
                180,
                270
              ],
              "url": "../../assets/pets/%E5%B0%8F%E5%91%86/generated/motions/sit-idle-v1/frames/frame-035-look-viewer-right-half.png"
            },
            {
              "file": "frames/frame-040-look-viewer-right.png",
              "durationMs": [
                900,
                2200
              ],
              "url": "../../assets/pets/%E5%B0%8F%E5%91%86/generated/motions/sit-idle-v1/frames/frame-040-look-viewer-right.png"
            },
            {
              "file": "frames/frame-035-look-viewer-right-half.png",
              "durationMs": [
                210,
                320
              ],
              "url": "../../assets/pets/%E5%B0%8F%E5%91%86/generated/motions/sit-idle-v1/frames/frame-035-look-viewer-right-half.png"
            },
            {
              "file": "frames/frame-000-neutral.png",
              "durationMs": [
                900,
                2400
              ],
              "url": "../../assets/pets/%E5%B0%8F%E5%91%86/generated/motions/sit-idle-v1/frames/frame-000-neutral.png"
            }
          ]
        },
        {
          "id": "ear-listen",
          "weight": 1.7,
          "cooldownMs": 6500,
          "frames": [
            {
              "file": "frames/frame-000-neutral.png",
              "durationMs": [
                600,
                1600
              ],
              "url": "../../assets/pets/%E5%B0%8F%E5%91%86/generated/motions/sit-idle-v1/frames/frame-000-neutral.png"
            },
            {
              "file": "frames/frame-050-ear-listen.png",
              "durationMs": [
                420,
                760
              ],
              "url": "../../assets/pets/%E5%B0%8F%E5%91%86/generated/motions/sit-idle-v1/frames/frame-050-ear-listen.png"
            },
            {
              "file": "frames/frame-000-neutral.png",
              "durationMs": [
                1000,
                2600
              ],
              "url": "../../assets/pets/%E5%B0%8F%E5%91%86/generated/motions/sit-idle-v1/frames/frame-000-neutral.png"
            }
          ]
        }
      ]
    }
  },
  {
    "id": "fifteen",
    "name": "15",
    "folder": "15",
    "accentColor": "#7f96b4",
    "placeholderEmoji": "🐾",
    "spriteSheet": "generated/sprite-sheet.png",
    "previewGif": "generated/preview.gif",
    "frame": {
      "width": 192,
      "height": 208,
      "columns": 8,
      "rows": 11
    },
    "animationProfile": "natural-v2",
    "spriteUrl": null,
    "naturalMotion": null
  },
  {
    "id": "mumu",
    "name": "牧牧",
    "folder": "牧牧",
    "accentColor": "#7e9a72",
    "placeholderEmoji": "🐾",
    "spriteSheet": "generated/sprite-sheet.png",
    "previewGif": "generated/preview.gif",
    "frame": {
      "width": 192,
      "height": 208,
      "columns": 8,
      "rows": 11
    },
    "animationProfile": "natural-v2",
    "spriteUrl": null,
    "naturalMotion": null
  }
];
