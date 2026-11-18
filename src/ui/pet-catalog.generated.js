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
        "width": 1280,
        "height": 1354
      },
      "identityBase": "../../concepts/identity-sit-v1.png",
      "neutralFrame": "frames/frame-000-neutral.webp",
      "idleGapMs": [
        800,
        3200
      ],
      "transitionMs": 220,
      "interruptible": true,
      "runtimeNotes": {
        "breathing": "Apply a subtle 0.4–0.8% vertical chest/body scale in the renderer; do not generate a separate high-amplitude breathing frame.",
        "transition": "Cross-fade or interpolate over 90–160 ms where a direct head-pose change is visually abrupt."
      },
      "neutralFrameUrl": "../../assets/pets/%E5%B0%8F%E5%91%86/generated/motions/sit-idle-v1/frames/frame-000-neutral.webp",
      "variants": [
        {
          "id": "slow-blink",
          "weight": 5,
          "cooldownMs": 4500,
          "frames": [
            {
              "file": "frames/frame-000-neutral.webp",
              "durationMs": [
                900,
                2600
              ],
              "url": "../../assets/pets/%E5%B0%8F%E5%91%86/generated/motions/sit-idle-v1/frames/frame-000-neutral.webp"
            },
            {
              "file": "frames/frame-010-half-blink.webp",
              "durationMs": 230,
              "url": "../../assets/pets/%E5%B0%8F%E5%91%86/generated/motions/sit-idle-v1/frames/frame-010-half-blink.webp"
            },
            {
              "file": "frames/frame-020-eyes-closed.webp",
              "durationMs": [
                150,
                220
              ],
              "url": "../../assets/pets/%E5%B0%8F%E5%91%86/generated/motions/sit-idle-v1/frames/frame-020-eyes-closed.webp"
            },
            {
              "file": "frames/frame-010-half-blink.webp",
              "durationMs": 250,
              "url": "../../assets/pets/%E5%B0%8F%E5%91%86/generated/motions/sit-idle-v1/frames/frame-010-half-blink.webp"
            },
            {
              "file": "frames/frame-000-neutral.webp",
              "durationMs": [
                800,
                2200
              ],
              "url": "../../assets/pets/%E5%B0%8F%E5%91%86/generated/motions/sit-idle-v1/frames/frame-000-neutral.webp"
            }
          ]
        },
        {
          "id": "look-viewer-left",
          "weight": 2.4,
          "cooldownMs": 7000,
          "frames": [
            {
              "file": "frames/frame-000-neutral.webp",
              "durationMs": [
                700,
                1800
              ],
              "url": "../../assets/pets/%E5%B0%8F%E5%91%86/generated/motions/sit-idle-v1/frames/frame-000-neutral.webp"
            },
            {
              "file": "frames/frame-025-look-viewer-left-half.webp",
              "durationMs": [
                180,
                270
              ],
              "url": "../../assets/pets/%E5%B0%8F%E5%91%86/generated/motions/sit-idle-v1/frames/frame-025-look-viewer-left-half.webp"
            },
            {
              "file": "frames/frame-030-look-viewer-left.webp",
              "durationMs": [
                900,
                2200
              ],
              "url": "../../assets/pets/%E5%B0%8F%E5%91%86/generated/motions/sit-idle-v1/frames/frame-030-look-viewer-left.webp"
            },
            {
              "file": "frames/frame-025-look-viewer-left-half.webp",
              "durationMs": [
                210,
                320
              ],
              "url": "../../assets/pets/%E5%B0%8F%E5%91%86/generated/motions/sit-idle-v1/frames/frame-025-look-viewer-left-half.webp"
            },
            {
              "file": "frames/frame-000-neutral.webp",
              "durationMs": [
                900,
                2400
              ],
              "url": "../../assets/pets/%E5%B0%8F%E5%91%86/generated/motions/sit-idle-v1/frames/frame-000-neutral.webp"
            }
          ]
        },
        {
          "id": "look-viewer-right",
          "weight": 2.4,
          "cooldownMs": 7000,
          "frames": [
            {
              "file": "frames/frame-000-neutral.webp",
              "durationMs": [
                700,
                1800
              ],
              "url": "../../assets/pets/%E5%B0%8F%E5%91%86/generated/motions/sit-idle-v1/frames/frame-000-neutral.webp"
            },
            {
              "file": "frames/frame-035-look-viewer-right-half.webp",
              "durationMs": [
                180,
                270
              ],
              "url": "../../assets/pets/%E5%B0%8F%E5%91%86/generated/motions/sit-idle-v1/frames/frame-035-look-viewer-right-half.webp"
            },
            {
              "file": "frames/frame-040-look-viewer-right.webp",
              "durationMs": [
                900,
                2200
              ],
              "url": "../../assets/pets/%E5%B0%8F%E5%91%86/generated/motions/sit-idle-v1/frames/frame-040-look-viewer-right.webp"
            },
            {
              "file": "frames/frame-035-look-viewer-right-half.webp",
              "durationMs": [
                210,
                320
              ],
              "url": "../../assets/pets/%E5%B0%8F%E5%91%86/generated/motions/sit-idle-v1/frames/frame-035-look-viewer-right-half.webp"
            },
            {
              "file": "frames/frame-000-neutral.webp",
              "durationMs": [
                900,
                2400
              ],
              "url": "../../assets/pets/%E5%B0%8F%E5%91%86/generated/motions/sit-idle-v1/frames/frame-000-neutral.webp"
            }
          ]
        },
        {
          "id": "ear-listen",
          "weight": 1.7,
          "cooldownMs": 6500,
          "frames": [
            {
              "file": "frames/frame-000-neutral.webp",
              "durationMs": [
                600,
                1600
              ],
              "url": "../../assets/pets/%E5%B0%8F%E5%91%86/generated/motions/sit-idle-v1/frames/frame-000-neutral.webp"
            },
            {
              "file": "frames/frame-050-ear-listen.webp",
              "durationMs": [
                420,
                760
              ],
              "url": "../../assets/pets/%E5%B0%8F%E5%91%86/generated/motions/sit-idle-v1/frames/frame-050-ear-listen.webp"
            },
            {
              "file": "frames/frame-000-neutral.webp",
              "durationMs": [
                1000,
                2600
              ],
              "url": "../../assets/pets/%E5%B0%8F%E5%91%86/generated/motions/sit-idle-v1/frames/frame-000-neutral.webp"
            }
          ]
        }
      ]
    },
    "naturalMotions": [
      {
        "schemaVersion": 1,
        "id": "sit-idle-v1",
        "petId": "xiaodai",
        "intent": "idle",
        "fromPose": "sit",
        "toPose": "sit",
        "canvas": {
          "width": 1280,
          "height": 1354
        },
        "identityBase": "../../concepts/identity-sit-v1.png",
        "neutralFrame": "frames/frame-000-neutral.webp",
        "idleGapMs": [
          800,
          3200
        ],
        "transitionMs": 220,
        "interruptible": true,
        "runtimeNotes": {
          "breathing": "Apply a subtle 0.4–0.8% vertical chest/body scale in the renderer; do not generate a separate high-amplitude breathing frame.",
          "transition": "Cross-fade or interpolate over 90–160 ms where a direct head-pose change is visually abrupt."
        },
        "neutralFrameUrl": "../../assets/pets/%E5%B0%8F%E5%91%86/generated/motions/sit-idle-v1/frames/frame-000-neutral.webp",
        "variants": [
          {
            "id": "slow-blink",
            "weight": 5,
            "cooldownMs": 4500,
            "frames": [
              {
                "file": "frames/frame-000-neutral.webp",
                "durationMs": [
                  900,
                  2600
                ],
                "url": "../../assets/pets/%E5%B0%8F%E5%91%86/generated/motions/sit-idle-v1/frames/frame-000-neutral.webp"
              },
              {
                "file": "frames/frame-010-half-blink.webp",
                "durationMs": 230,
                "url": "../../assets/pets/%E5%B0%8F%E5%91%86/generated/motions/sit-idle-v1/frames/frame-010-half-blink.webp"
              },
              {
                "file": "frames/frame-020-eyes-closed.webp",
                "durationMs": [
                  150,
                  220
                ],
                "url": "../../assets/pets/%E5%B0%8F%E5%91%86/generated/motions/sit-idle-v1/frames/frame-020-eyes-closed.webp"
              },
              {
                "file": "frames/frame-010-half-blink.webp",
                "durationMs": 250,
                "url": "../../assets/pets/%E5%B0%8F%E5%91%86/generated/motions/sit-idle-v1/frames/frame-010-half-blink.webp"
              },
              {
                "file": "frames/frame-000-neutral.webp",
                "durationMs": [
                  800,
                  2200
                ],
                "url": "../../assets/pets/%E5%B0%8F%E5%91%86/generated/motions/sit-idle-v1/frames/frame-000-neutral.webp"
              }
            ]
          },
          {
            "id": "look-viewer-left",
            "weight": 2.4,
            "cooldownMs": 7000,
            "frames": [
              {
                "file": "frames/frame-000-neutral.webp",
                "durationMs": [
                  700,
                  1800
                ],
                "url": "../../assets/pets/%E5%B0%8F%E5%91%86/generated/motions/sit-idle-v1/frames/frame-000-neutral.webp"
              },
              {
                "file": "frames/frame-025-look-viewer-left-half.webp",
                "durationMs": [
                  180,
                  270
                ],
                "url": "../../assets/pets/%E5%B0%8F%E5%91%86/generated/motions/sit-idle-v1/frames/frame-025-look-viewer-left-half.webp"
              },
              {
                "file": "frames/frame-030-look-viewer-left.webp",
                "durationMs": [
                  900,
                  2200
                ],
                "url": "../../assets/pets/%E5%B0%8F%E5%91%86/generated/motions/sit-idle-v1/frames/frame-030-look-viewer-left.webp"
              },
              {
                "file": "frames/frame-025-look-viewer-left-half.webp",
                "durationMs": [
                  210,
                  320
                ],
                "url": "../../assets/pets/%E5%B0%8F%E5%91%86/generated/motions/sit-idle-v1/frames/frame-025-look-viewer-left-half.webp"
              },
              {
                "file": "frames/frame-000-neutral.webp",
                "durationMs": [
                  900,
                  2400
                ],
                "url": "../../assets/pets/%E5%B0%8F%E5%91%86/generated/motions/sit-idle-v1/frames/frame-000-neutral.webp"
              }
            ]
          },
          {
            "id": "look-viewer-right",
            "weight": 2.4,
            "cooldownMs": 7000,
            "frames": [
              {
                "file": "frames/frame-000-neutral.webp",
                "durationMs": [
                  700,
                  1800
                ],
                "url": "../../assets/pets/%E5%B0%8F%E5%91%86/generated/motions/sit-idle-v1/frames/frame-000-neutral.webp"
              },
              {
                "file": "frames/frame-035-look-viewer-right-half.webp",
                "durationMs": [
                  180,
                  270
                ],
                "url": "../../assets/pets/%E5%B0%8F%E5%91%86/generated/motions/sit-idle-v1/frames/frame-035-look-viewer-right-half.webp"
              },
              {
                "file": "frames/frame-040-look-viewer-right.webp",
                "durationMs": [
                  900,
                  2200
                ],
                "url": "../../assets/pets/%E5%B0%8F%E5%91%86/generated/motions/sit-idle-v1/frames/frame-040-look-viewer-right.webp"
              },
              {
                "file": "frames/frame-035-look-viewer-right-half.webp",
                "durationMs": [
                  210,
                  320
                ],
                "url": "../../assets/pets/%E5%B0%8F%E5%91%86/generated/motions/sit-idle-v1/frames/frame-035-look-viewer-right-half.webp"
              },
              {
                "file": "frames/frame-000-neutral.webp",
                "durationMs": [
                  900,
                  2400
                ],
                "url": "../../assets/pets/%E5%B0%8F%E5%91%86/generated/motions/sit-idle-v1/frames/frame-000-neutral.webp"
              }
            ]
          },
          {
            "id": "ear-listen",
            "weight": 1.7,
            "cooldownMs": 6500,
            "frames": [
              {
                "file": "frames/frame-000-neutral.webp",
                "durationMs": [
                  600,
                  1600
                ],
                "url": "../../assets/pets/%E5%B0%8F%E5%91%86/generated/motions/sit-idle-v1/frames/frame-000-neutral.webp"
              },
              {
                "file": "frames/frame-050-ear-listen.webp",
                "durationMs": [
                  420,
                  760
                ],
                "url": "../../assets/pets/%E5%B0%8F%E5%91%86/generated/motions/sit-idle-v1/frames/frame-050-ear-listen.webp"
              },
              {
                "file": "frames/frame-000-neutral.webp",
                "durationMs": [
                  1000,
                  2600
                ],
                "url": "../../assets/pets/%E5%B0%8F%E5%91%86/generated/motions/sit-idle-v1/frames/frame-000-neutral.webp"
              }
            ]
          }
        ]
      },
      {
        "schemaVersion": 1,
        "id": "lie-idle-v1",
        "petId": "xiaodai",
        "intent": "idle",
        "fromPose": "lie",
        "toPose": "lie",
        "canvas": {
          "width": 1280,
          "height": 1354
        },
        "identityBase": "../../concepts/identity-lie-v1.png",
        "neutralFrame": "frames/frame-000-neutral.webp",
        "idleGapMs": [
          1200,
          4200
        ],
        "transitionMs": 220,
        "interruptible": true,
        "neutralFrameUrl": "../../assets/pets/%E5%B0%8F%E5%91%86/generated/motions/lie-idle-v1/frames/frame-000-neutral.webp",
        "variants": [
          {
            "id": "lie-slow-blink",
            "weight": 5,
            "cooldownMs": 5000,
            "frames": [
              {
                "file": "frames/frame-000-neutral.webp",
                "durationMs": [
                  1100,
                  3200
                ],
                "url": "../../assets/pets/%E5%B0%8F%E5%91%86/generated/motions/lie-idle-v1/frames/frame-000-neutral.webp"
              },
              {
                "file": "frames/frame-010-half-blink.webp",
                "durationMs": [
                  240,
                  340
                ],
                "url": "../../assets/pets/%E5%B0%8F%E5%91%86/generated/motions/lie-idle-v1/frames/frame-010-half-blink.webp"
              },
              {
                "file": "frames/frame-020-eyes-closed.webp",
                "durationMs": [
                  180,
                  320
                ],
                "url": "../../assets/pets/%E5%B0%8F%E5%91%86/generated/motions/lie-idle-v1/frames/frame-020-eyes-closed.webp"
              },
              {
                "file": "frames/frame-010-half-blink.webp",
                "durationMs": [
                  260,
                  360
                ],
                "url": "../../assets/pets/%E5%B0%8F%E5%91%86/generated/motions/lie-idle-v1/frames/frame-010-half-blink.webp"
              },
              {
                "file": "frames/frame-000-neutral.webp",
                "durationMs": [
                  1000,
                  3000
                ],
                "url": "../../assets/pets/%E5%B0%8F%E5%91%86/generated/motions/lie-idle-v1/frames/frame-000-neutral.webp"
              }
            ]
          },
          {
            "id": "lie-ear-listen",
            "weight": 2.2,
            "cooldownMs": 7000,
            "frames": [
              {
                "file": "frames/frame-000-neutral.webp",
                "durationMs": [
                  900,
                  2400
                ],
                "url": "../../assets/pets/%E5%B0%8F%E5%91%86/generated/motions/lie-idle-v1/frames/frame-000-neutral.webp"
              },
              {
                "file": "frames/frame-050-ear-listen.webp",
                "durationMs": [
                  550,
                  1100
                ],
                "url": "../../assets/pets/%E5%B0%8F%E5%91%86/generated/motions/lie-idle-v1/frames/frame-050-ear-listen.webp"
              },
              {
                "file": "frames/frame-000-neutral.webp",
                "durationMs": [
                  1200,
                  3200
                ],
                "url": "../../assets/pets/%E5%B0%8F%E5%91%86/generated/motions/lie-idle-v1/frames/frame-000-neutral.webp"
              }
            ]
          },
          {
            "id": "lower-head-and-nap",
            "weight": 0.9,
            "cooldownMs": 24000,
            "frames": [
              {
                "file": "frames/frame-000-neutral.webp",
                "durationMs": [
                  1200,
                  2800
                ],
                "url": "../../assets/pets/%E5%B0%8F%E5%91%86/generated/motions/lie-idle-v1/frames/frame-000-neutral.webp"
              },
              {
                "file": "frames/frame-030-head-lowered.webp",
                "durationMs": [
                  420,
                  680
                ],
                "url": "../../assets/pets/%E5%B0%8F%E5%91%86/generated/motions/lie-idle-v1/frames/frame-030-head-lowered.webp"
              },
              {
                "file": "frames/frame-040-head-resting.webp",
                "durationMs": [
                  5000,
                  16000
                ],
                "url": "../../assets/pets/%E5%B0%8F%E5%91%86/generated/motions/lie-idle-v1/frames/frame-040-head-resting.webp"
              },
              {
                "file": "frames/frame-030-head-lowered.webp",
                "durationMs": [
                  480,
                  760
                ],
                "url": "../../assets/pets/%E5%B0%8F%E5%91%86/generated/motions/lie-idle-v1/frames/frame-030-head-lowered.webp"
              },
              {
                "file": "frames/frame-000-neutral.webp",
                "durationMs": [
                  1800,
                  4200
                ],
                "url": "../../assets/pets/%E5%B0%8F%E5%91%86/generated/motions/lie-idle-v1/frames/frame-000-neutral.webp"
              }
            ]
          }
        ]
      },
      {
        "schemaVersion": 1,
        "id": "sit-to-lie-v1",
        "petId": "xiaodai",
        "intent": "transition",
        "fromPose": "sit",
        "toPose": "lie",
        "canvas": {
          "width": 1280,
          "height": 1354
        },
        "identityBase": "../../concepts/identity-sit-v1.png",
        "neutralFrame": "../sit-idle-v1/frames/frame-000-neutral.webp",
        "transitionMs": 140,
        "interruptible": false,
        "runtimeNotes": {
          "reverse": "The same sequence is played in reverse for lie-to-sit so identity and timing stay consistent.",
          "grounding": "Keep every frame bottom-aligned; use a short cross-fade because the source aspect ratios differ."
        },
        "neutralFrameUrl": "../../assets/pets/%E5%B0%8F%E5%91%86/generated/motions/sit-idle-v1/frames/frame-000-neutral.webp",
        "variants": [
          {
            "id": "sit-to-lie",
            "weight": 1,
            "frames": [
              {
                "file": "../sit-idle-v1/frames/frame-000-neutral.webp",
                "durationMs": 720,
                "url": "../../assets/pets/%E5%B0%8F%E5%91%86/generated/motions/sit-idle-v1/frames/frame-000-neutral.webp"
              },
              {
                "file": "frames/frame-010-lean-forward.webp",
                "durationMs": 300,
                "url": "../../assets/pets/%E5%B0%8F%E5%91%86/generated/motions/sit-to-lie-v1/frames/frame-010-lean-forward.webp"
              },
              {
                "file": "frames/frame-015-lowering.webp",
                "durationMs": 260,
                "url": "../../assets/pets/%E5%B0%8F%E5%91%86/generated/motions/sit-to-lie-v1/frames/frame-015-lowering.webp"
              },
              {
                "file": "frames/frame-020-chest-lowered.webp",
                "durationMs": 760,
                "url": "../../assets/pets/%E5%B0%8F%E5%91%86/generated/motions/sit-to-lie-v1/frames/frame-020-chest-lowered.webp"
              },
              {
                "file": "../lie-idle-v1/frames/frame-000-neutral.webp",
                "durationMs": 1440,
                "url": "../../assets/pets/%E5%B0%8F%E5%91%86/generated/motions/lie-idle-v1/frames/frame-000-neutral.webp"
              }
            ]
          }
        ]
      },
      {
        "schemaVersion": 1,
        "id": "stand-settle-v1",
        "petId": "xiaodai",
        "intent": "settle",
        "fromPose": "stand",
        "toPose": "stand",
        "canvas": {
          "width": 1280,
          "height": 1354
        },
        "neutralFrame": "frames/frame-000-standing.webp",
        "displayScale": 1.45,
        "transitionMs": 180,
        "neutralFrameUrl": "../../assets/pets/%E5%B0%8F%E5%91%86/generated/motions/stand-settle-v1/frames/frame-000-standing.webp",
        "variants": [
          {
            "id": "quiet",
            "weight": 3,
            "frames": [
              {
                "file": "frames/frame-000-standing.webp",
                "durationMs": [
                  360,
                  460
                ],
                "url": "../../assets/pets/%E5%B0%8F%E5%91%86/generated/motions/stand-settle-v1/frames/frame-000-standing.webp"
              },
              {
                "file": "frames/frame-010-look-half.webp",
                "durationMs": [
                  320,
                  410
                ],
                "url": "../../assets/pets/%E5%B0%8F%E5%91%86/generated/motions/stand-settle-v1/frames/frame-010-look-half.webp"
              },
              {
                "file": "frames/frame-020-look-front.webp",
                "durationMs": [
                  320,
                  410
                ],
                "url": "../../assets/pets/%E5%B0%8F%E5%91%86/generated/motions/stand-settle-v1/frames/frame-020-look-front.webp"
              }
            ]
          },
          {
            "id": "tail-relax",
            "weight": 4,
            "frames": [
              {
                "file": "frames/frame-000-standing.webp",
                "durationMs": [
                  360,
                  460
                ],
                "url": "../../assets/pets/%E5%B0%8F%E5%91%86/generated/motions/stand-settle-v1/frames/frame-000-standing.webp"
              },
              {
                "file": "frames/frame-010-look-half.webp",
                "durationMs": [
                  320,
                  410
                ],
                "url": "../../assets/pets/%E5%B0%8F%E5%91%86/generated/motions/stand-settle-v1/frames/frame-010-look-half.webp"
              },
              {
                "file": "frames/frame-020-look-front.webp",
                "durationMs": [
                  320,
                  410
                ],
                "url": "../../assets/pets/%E5%B0%8F%E5%91%86/generated/motions/stand-settle-v1/frames/frame-020-look-front.webp"
              },
              {
                "file": "frames/frame-030-tail-relax.webp",
                "durationMs": [
                  320,
                  420
                ],
                "url": "../../assets/pets/%E5%B0%8F%E5%91%86/generated/motions/stand-settle-v1/frames/frame-030-tail-relax.webp"
              }
            ]
          },
          {
            "id": "tail-and-ear",
            "weight": 2,
            "frames": [
              {
                "file": "frames/frame-000-standing.webp",
                "durationMs": [
                  360,
                  460
                ],
                "url": "../../assets/pets/%E5%B0%8F%E5%91%86/generated/motions/stand-settle-v1/frames/frame-000-standing.webp"
              },
              {
                "file": "frames/frame-010-look-half.webp",
                "durationMs": [
                  320,
                  410
                ],
                "url": "../../assets/pets/%E5%B0%8F%E5%91%86/generated/motions/stand-settle-v1/frames/frame-010-look-half.webp"
              },
              {
                "file": "frames/frame-020-look-front.webp",
                "durationMs": [
                  320,
                  410
                ],
                "url": "../../assets/pets/%E5%B0%8F%E5%91%86/generated/motions/stand-settle-v1/frames/frame-020-look-front.webp"
              },
              {
                "file": "frames/frame-030-tail-relax.webp",
                "durationMs": [
                  320,
                  420
                ],
                "url": "../../assets/pets/%E5%B0%8F%E5%91%86/generated/motions/stand-settle-v1/frames/frame-030-tail-relax.webp"
              },
              {
                "file": "frames/frame-040-ear-relax.webp",
                "durationMs": [
                  280,
                  350
                ],
                "url": "../../assets/pets/%E5%B0%8F%E5%91%86/generated/motions/stand-settle-v1/frames/frame-040-ear-relax.webp"
              }
            ]
          }
        ]
      },
      {
        "schemaVersion": 1,
        "id": "turn-v1",
        "petId": "xiaodai",
        "intent": "turn",
        "canvas": {
          "width": 1280,
          "height": 1354
        },
        "transitionMs": 55,
        "neutralFrame": "frames/frame-020-front.webp",
        "neutralFrameUrl": "../../assets/pets/%E5%B0%8F%E5%91%86/generated/motions/turn-v1/frames/frame-020-front.webp",
        "variants": [
          {
            "id": "side-to-front",
            "frames": [
              {
                "file": "../stand-settle-v1/frames/frame-020-look-front.webp",
                "durationMs": 110,
                "displayScale": 1.45,
                "anchorX": 0.12,
                "url": "../../assets/pets/%E5%B0%8F%E5%91%86/generated/motions/stand-settle-v1/frames/frame-020-look-front.webp"
              },
              {
                "file": "../sit-stand-v1/frames/frame-020-rising-turn.webp",
                "durationMs": 110,
                "displayScale": 1,
                "anchorX": 0.16,
                "url": "../../assets/pets/%E5%B0%8F%E5%91%86/generated/motions/sit-stand-v1/frames/frame-020-rising-turn.webp"
              },
              {
                "file": "frames/frame-010-quarter.webp",
                "durationMs": 110,
                "displayScale": 1,
                "anchorX": 0.3,
                "url": "../../assets/pets/%E5%B0%8F%E5%91%86/generated/motions/turn-v1/frames/frame-010-quarter.webp"
              },
              {
                "file": "frames/frame-020-front.webp",
                "durationMs": 130,
                "displayScale": 1,
                "anchorX": 0.49,
                "url": "../../assets/pets/%E5%B0%8F%E5%91%86/generated/motions/turn-v1/frames/frame-020-front.webp"
              }
            ]
          }
        ]
      },
      {
        "schemaVersion": 1,
        "id": "sit-stand-v1",
        "petId": "xiaodai",
        "intent": "posture",
        "canvas": {
          "width": 1280,
          "height": 1354
        },
        "transitionMs": 65,
        "neutralFrame": "frames/frame-010-rising.webp",
        "neutralFrameUrl": "../../assets/pets/%E5%B0%8F%E5%91%86/generated/motions/sit-stand-v1/frames/frame-010-rising.webp",
        "variants": [
          {
            "id": "rise-to-stand",
            "frames": [
              {
                "file": "frames/frame-010-rising.webp",
                "durationMs": 160,
                "displayScale": 1,
                "anchorX": 0.79,
                "url": "../../assets/pets/%E5%B0%8F%E5%91%86/generated/motions/sit-stand-v1/frames/frame-010-rising.webp"
              },
              {
                "file": "frames/frame-015-halfway.webp",
                "durationMs": 140,
                "displayScale": 1,
                "anchorX": 0.7,
                "url": "../../assets/pets/%E5%B0%8F%E5%91%86/generated/motions/sit-stand-v1/frames/frame-015-halfway.webp"
              },
              {
                "file": "../turn-v1/frames/frame-020-front.webp",
                "durationMs": 150,
                "displayScale": 1,
                "anchorX": 0.49,
                "url": "../../assets/pets/%E5%B0%8F%E5%91%86/generated/motions/turn-v1/frames/frame-020-front.webp"
              },
              {
                "file": "../turn-v1/frames/frame-010-quarter.webp",
                "durationMs": 150,
                "displayScale": 1,
                "anchorX": 0.3,
                "url": "../../assets/pets/%E5%B0%8F%E5%91%86/generated/motions/turn-v1/frames/frame-010-quarter.webp"
              },
              {
                "file": "frames/frame-020-rising-turn.webp",
                "durationMs": 150,
                "displayScale": 1,
                "anchorX": 0.16,
                "url": "../../assets/pets/%E5%B0%8F%E5%91%86/generated/motions/sit-stand-v1/frames/frame-020-rising-turn.webp"
              },
              {
                "file": "../stand-settle-v1/frames/frame-020-look-front.webp",
                "durationMs": 150,
                "displayScale": 1.45,
                "anchorX": 0.12,
                "url": "../../assets/pets/%E5%B0%8F%E5%91%86/generated/motions/stand-settle-v1/frames/frame-020-look-front.webp"
              }
            ]
          }
        ]
      },
      {
        "schemaVersion": 1,
        "id": "start-step-v1",
        "petId": "xiaodai",
        "intent": "startStep",
        "canvas": {
          "width": 1280,
          "height": 1354
        },
        "transitionMs": 55,
        "neutralFrame": "frames/frame-010-lift.webp",
        "displayScale": 1.45,
        "neutralFrameUrl": "../../assets/pets/%E5%B0%8F%E5%91%86/generated/motions/start-step-v1/frames/frame-010-lift.webp",
        "variants": [
          {
            "id": "first-step",
            "frames": [
              {
                "file": "frames/frame-010-lift.webp",
                "durationMs": 160,
                "anchorX": 0.12,
                "url": "../../assets/pets/%E5%B0%8F%E5%91%86/generated/motions/start-step-v1/frames/frame-010-lift.webp"
              }
            ]
          }
        ]
      },
      {
        "schemaVersion": 1,
        "id": "walk-cycle-v1",
        "petId": "xiaodai",
        "intent": "locomotion",
        "gait": "walk",
        "fromPose": "stand",
        "toPose": "stand",
        "facing": "left",
        "canvas": {
          "width": 1280,
          "height": 1354
        },
        "identityBase": "../../concepts/identity-stand-profile-v1.png",
        "neutralFrame": "frames/frame-000-contact.webp",
        "displayScale": 1.45,
        "transitionMs": 76,
        "gaitSwitchFrames": [
          0,
          4
        ],
        "gaitEntryFrame": 0,
        "gaitEntryFrames": [
          0,
          4
        ],
        "interruptible": true,
        "runtimeNotes": {
          "direction": "Source frames face left; mirror the rendered canvas for rightward travel.",
          "speed": "Scale the cycle with smoothed drag velocity; do not exceed the configured playback-rate cap."
        },
        "neutralFrameUrl": "../../assets/pets/%E5%B0%8F%E5%91%86/generated/motions/walk-cycle-v1/frames/frame-000-contact.webp",
        "variants": [
          {
            "id": "natural-walk",
            "weight": 1,
            "frames": [
              {
                "file": "frames/frame-000-contact.webp",
                "durationMs": 120,
                "url": "../../assets/pets/%E5%B0%8F%E5%91%86/generated/motions/walk-cycle-v1/frames/frame-000-contact.webp"
              },
              {
                "file": "frames/frame-005-transfer.webp",
                "durationMs": 60,
                "url": "../../assets/pets/%E5%B0%8F%E5%91%86/generated/motions/walk-cycle-v1/frames/frame-005-transfer.webp"
              },
              {
                "file": "frames/frame-010-down.webp",
                "durationMs": 75,
                "url": "../../assets/pets/%E5%B0%8F%E5%91%86/generated/motions/walk-cycle-v1/frames/frame-010-down.webp"
              },
              {
                "file": "frames/frame-015-passing.webp",
                "durationMs": 75,
                "url": "../../assets/pets/%E5%B0%8F%E5%91%86/generated/motions/walk-cycle-v1/frames/frame-015-passing.webp"
              },
              {
                "file": "frames/frame-020-opposite-contact.webp",
                "durationMs": 120,
                "url": "../../assets/pets/%E5%B0%8F%E5%91%86/generated/motions/walk-cycle-v1/frames/frame-020-opposite-contact.webp"
              },
              {
                "file": "frames/frame-025-lift.webp",
                "durationMs": 60,
                "url": "../../assets/pets/%E5%B0%8F%E5%91%86/generated/motions/walk-cycle-v1/frames/frame-025-lift.webp"
              },
              {
                "file": "frames/frame-030-up.webp",
                "durationMs": 75,
                "url": "../../assets/pets/%E5%B0%8F%E5%91%86/generated/motions/walk-cycle-v1/frames/frame-030-up.webp"
              },
              {
                "file": "frames/frame-035-reach.webp",
                "durationMs": 75,
                "url": "../../assets/pets/%E5%B0%8F%E5%91%86/generated/motions/walk-cycle-v1/frames/frame-035-reach.webp"
              }
            ]
          }
        ]
      },
      {
        "schemaVersion": 1,
        "id": "run-cycle-v1",
        "petId": "xiaodai",
        "intent": "locomotion",
        "gait": "run",
        "fromPose": "stand",
        "toPose": "stand",
        "facing": "left",
        "canvas": {
          "width": 1280,
          "height": 1354
        },
        "identityBase": "../../concepts/identity-stand-profile-v1.png",
        "neutralFrame": "frames/frame-000-extension.webp",
        "displayScale": 1.45,
        "transitionMs": 68,
        "gaitSwitchFrames": [
          2
        ],
        "gaitEntryFrame": 2,
        "interruptible": true,
        "runtimeNotes": {
          "direction": "Source frames face left; mirror the rendered canvas for rightward travel.",
          "gaitSwitch": "Enter at runThreshold and exit below runExitThreshold to prevent flicker near the boundary."
        },
        "neutralFrameUrl": "../../assets/pets/%E5%B0%8F%E5%91%86/generated/motions/run-cycle-v1/frames/frame-000-extension.webp",
        "variants": [
          {
            "id": "natural-run",
            "weight": 1,
            "frames": [
              {
                "file": "frames/frame-000-extension.webp",
                "durationMs": 70,
                "url": "../../assets/pets/%E5%B0%8F%E5%91%86/generated/motions/run-cycle-v1/frames/frame-000-extension.webp"
              },
              {
                "file": "frames/frame-005-descent.webp",
                "durationMs": 40,
                "url": "../../assets/pets/%E5%B0%8F%E5%91%86/generated/motions/run-cycle-v1/frames/frame-005-descent.webp"
              },
              {
                "file": "frames/frame-010-front-landing.webp",
                "durationMs": 45,
                "url": "../../assets/pets/%E5%B0%8F%E5%91%86/generated/motions/run-cycle-v1/frames/frame-010-front-landing.webp"
              },
              {
                "file": "frames/frame-015-gathering.webp",
                "durationMs": 45,
                "url": "../../assets/pets/%E5%B0%8F%E5%91%86/generated/motions/run-cycle-v1/frames/frame-015-gathering.webp"
              },
              {
                "file": "frames/frame-020-gathered.webp",
                "durationMs": 55,
                "url": "../../assets/pets/%E5%B0%8F%E5%91%86/generated/motions/run-cycle-v1/frames/frame-020-gathered.webp"
              },
              {
                "file": "frames/frame-025-pushing.webp",
                "durationMs": 50,
                "url": "../../assets/pets/%E5%B0%8F%E5%91%86/generated/motions/run-cycle-v1/frames/frame-025-pushing.webp"
              },
              {
                "file": "frames/frame-030-propulsion.webp",
                "durationMs": 55,
                "url": "../../assets/pets/%E5%B0%8F%E5%91%86/generated/motions/run-cycle-v1/frames/frame-030-propulsion.webp"
              },
              {
                "file": "frames/frame-035-takeoff.webp",
                "durationMs": 40,
                "url": "../../assets/pets/%E5%B0%8F%E5%91%86/generated/motions/run-cycle-v1/frames/frame-035-takeoff.webp"
              }
            ]
          }
        ]
      }
    ]
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
    "naturalMotion": null,
    "naturalMotions": []
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
    "naturalMotion": null,
    "naturalMotions": []
  }
];
