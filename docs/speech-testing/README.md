# Sinhala voice-typing — manual test script

Record each condition below and send the clip through `POST /api/speech/transcribe`
(Postman, with a logged-in session's JWT as a Bearer token, or through the mobile
app once the Voice Typing screen is wired up). Fill in one row per condition.
`words correct / total` is your own count against the reference text you intended
to say.

`confidence`, `qualityHint` and `firstPhraseOffsetMs` come straight from the
response. Use the `confidence` column across all rows to decide where
`app.speech.low-confidence-threshold` (currently `0.60`, a starting guess —
see `SpeechProperties`) should actually sit.

| condition | speaker | pace | reference text | Azure text | words correct / total | confidence | qualityHint | firstPhraseOffsetMs | latencyMs | notes |
|---|---|---|---|---|---|---|---|---|---|---|
| quiet room, phone mic, normal pace | | | | | | | | | | |
| quiet room, phone mic, fast pace | | | | | | | | | | |
| quiet room, headset | | | | | | | | | | |
| fan / A·C on | | | | | | | | | | |
| speaker begins talking immediately after the cue | | | | | | | | | | |
| village or trade words | | | | | | | | | | |
| 30-second clip | | | | | | | | | | |

## What `firstPhraseOffsetMs` tells us

If `firstPhraseOffsetMs` is large on the "begins talking immediately after the
cue" row despite the speaker genuinely starting right away, the lost first 1–2
seconds observed in earlier testing is the recorder or Azure's own speech
detection — not the elder's timing. See `AudioRecordingScreen`'s start-cue
delay (section 7.1 of the implementation prompt) for the mobile-side mitigation
this measurement is meant to validate. No audio padding or other processing
should be added based on these numbers alone — record the measurement here
first.
