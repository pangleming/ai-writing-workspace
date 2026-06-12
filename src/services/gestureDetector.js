export class GestureDetector {
  constructor(onResult) {
    this.onResult = onResult
    this.hands = null
    this.running = false

    // 手掌运动检测状态
    this.prevPalmY = null
    this.smoothedVelocity = 0
  }

  async init() {
    const { Hands } = await import('@mediapipe/hands')

    this.hands = new Hands({
      locateFile: (file) =>
        `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`
    })

    this.hands.setOptions({
      maxNumHands: 1,
      modelComplexity: 1,
      minDetectionConfidence: 0.7,
      minTrackingConfidence: 0.5
    })

    this.hands.onResults((results) => {
      const gesture = this.classifyGesture(results)
      this.onResult(gesture, results)
    })

    return this.hands
  }

  classifyGesture(results) {
    if (
      !results.multiHandLandmarks ||
      results.multiHandLandmarks.length === 0
    ) {
      this.prevPalmY = null
      this.smoothedVelocity = 0
      return 'No Hand Detected'
    }

    const landmarks = results.multiHandLandmarks[0]

    const isRight =
      results.multiHandedness?.[0]?.label === 'Right'

    const tips = [4, 8, 12, 16, 20]
    const fingers = []

    // 大拇指
    if (isRight) {
      fingers.push(landmarks[4].x < landmarks[3].x ? 1 : 0)
    } else {
      fingers.push(landmarks[4].x > landmarks[3].x ? 1 : 0)
    }

    // 其余四指
    for (let i = 1; i < 5; i++) {
      fingers.push(
        landmarks[tips[i]].y < landmarks[tips[i] - 2].y ? 1 : 0
      )
    }

    const total = fingers.reduce((a, b) => a + b, 0)

    // ══════════════════════════════════════════
    // ✋ 张开手掌（五指全开）→ 静止：召唤/关闭 AI
    //   + 运动检测：☝️ 单指 / ✌️ 剪刀手 已占用上下滚动
    //   此处仅做 Open Palm 的召唤功能
    // ══════════════════════════════════════════
    if (total === 5) {
      // 重置运动状态（手掌张开时不做运动检测，直接返回 Open Palm）
      this.prevPalmY = null
      this.smoothedVelocity = 0
      return 'Open Palm'
    }

    // 非张开手掌时重置运动状态
    this.prevPalmY = null
    this.smoothedVelocity = 0

    // ══════════════════════════════════════════
    // ☝️ 一根手指（食指）→ 向上滚动
    // ══════════════════════════════════════════
    if (
      fingers[0] === 0 &&
      fingers[1] === 1 &&
      fingers[2] === 0 &&
      fingers[3] === 0 &&
      fingers[4] === 0
    ) {
      return 'Index Finger'
    }

    // ══════════════════════════════════════════
    // ✌️ 两根手指（剪刀手）→ 向下滚动
    // ══════════════════════════════════════════
    if (
      fingers[0] === 0 &&
      fingers[1] === 1 &&
      fingers[2] === 1 &&
      fingers[3] === 0 &&
      fingers[4] === 0
    ) {
      return 'Scissor'
    }

    // ══════════════════════════════════════════
    // ✊ 握拳（四指全收）→ 调出/关闭语音识别
    //   拇指在握拳时包裹在手指外侧，x 坐标比较不可靠，
    //   因此只检测四指是否全部收拢，不依赖拇指状态
    // ══════════════════════════════════════════
    if (
      fingers[1] === 0 &&
      fingers[2] === 0 &&
      fingers[3] === 0 &&
      fingers[4] === 0
    ) {
      return 'Fist'
    }

    return `${total} Finger(s)`
  }

  async start(videoElement) {
    if (!this.hands) {
      await this.init()
    }

    this.running = true
    this.processFrame(videoElement)
  }

  async processFrame(videoElement) {
    if (!this.running) return

    await this.hands.send({ image: videoElement })

    if (this.running) {
      requestAnimationFrame(() => this.processFrame(videoElement))
    }
  }

  stop() {
    this.running = false
  }
}