// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import { CompressedVideo } from "@foxglove/schemas";
import { Mutex } from "async-mutex";
import EventEmitter from "eventemitter3";
import { assert } from "ts-essentials";

import { H264 } from "@lichtblick/den/video";
import * as RosTime from "@lichtblick/rostime";

function createDecoderConfig(videoMsg: CompressedVideo): VideoDecoderConfig | undefined {
  switch (videoMsg.format) {
    case "h264": {
      const spsData = H264.ParseSps(videoMsg.data);
      if (spsData != undefined) {
        return H264.ParseDecoderConfig(spsData);
      }
      break;
    }
    case "h265":
      return {
        codec: "hvc1.1.6.L93.B0",
      };
    case "vp9":
      return {
        codec: "vp09.00.31.08",
      };
    case "av1":
      return {
        codec: "av01.0.05M.08",
      };
  }
}

/**
 * Rewrite video data to optimize decoding performance
 * For H264 format, apply special low-latency decoding optimizations
 *
 * @param videoFrame Compressed video frame
 * @returns Processed video data
 */
function rewriteH264VideoData(videoFrame: CompressedVideo): Uint8Array | undefined {
  const frameData = videoFrame.data;

  // H264 format requires special processing to optimize for low-latency decoding
  if (videoFrame.format === "h264") {
    return H264.RewriteForLowLatencyDecoding(frameData);
  }

  // For other formats, return the original data directly
  return frameData;
}

class SortedMap<T> {
  #entries: [number, T][] = [];

  public get size() {
    return this.#entries.length;
  }

  public clear() {
    return this.#entries.splice(0);
  }

  [Symbol.iterator]() {
    return this.#entries[Symbol.iterator]();
  }

  public at(index: number) {
    return this.#entries[index];
  }

  public set(key: number, value: T) {
    const searchResult = this.binarySearch(key);
    if (searchResult >= 0) {
      const oldValue = this.#entries[searchResult]![1];
      this.#entries[searchResult]![1] = value;
      return oldValue;
    } else {
      const entry = [key, value] as [number, T];
      const insertionPoint = ~searchResult;
      insertionPoint >= this.#entries.length
        ? this.#entries.push(entry)
        : this.#entries.splice(insertionPoint, 0, entry);
    }
  }

  public shift() {
    return this.#entries.shift();
  }

  public pop() {
    return this.#entries.pop();
  }

  public remove(key: number) {
    const index = this.binarySearch(key);
    if (index >= 0) {
      return this.#entries.splice(index, 1)[0];
    }
  }

  public removeAfter(key: number) {
    const searchResult = this.binarySearch(key);
    const startIndex = searchResult >= 0 ? searchResult + 1 : ~searchResult;
    return this.#entries.splice(startIndex);
  }

  public removeBefore(key: number) {
    const searchResult = this.binarySearch(key);
    const endIndex = searchResult >= 0 ? searchResult : ~searchResult;
    return this.#entries.splice(0, endIndex);
  }

  public minEntry() {
    return this.#entries[0];
  }

  public maxEntry() {
    return this.#entries[this.#entries.length - 1];
  }

  public minKey() {
    return this.#entries[0]?.[0];
  }

  public maxKey() {
    return this.#entries[this.#entries.length - 1]?.[0];
  }

  public binarySearch(key: number) {
    const entries = this.#entries;
    if (entries.length === 0) {
      return -1;
    }

    let low = 0;
    let high = entries.length - 1;

    if (key < entries[low]![0]) {
      return ~low;
    }
    if (key > entries[high]![0]) {
      return ~(high + 1);
    }

    while (low <= high) {
      const mid = (low + high) >> 1;
      const midKey = entries[mid]![0];

      if (midKey === key) {
        return mid;
      }

      if (key < midKey) {
        high = mid - 1;
      } else {
        low = mid + 1;
      }
    }

    return ~low;
  }
}

// Maximum queue size constant
const MAX_QUEUE_SIZE = 30; // This value might be a variable B in the original code

class VideoDecoderWorker extends EventEmitter {
  #decoderClass: typeof VideoDecoder;
  #callbacks: VideoDecoderInit;
  #videoDecoder: InstanceType<typeof VideoDecoder>;
  #decoderConfig?: VideoDecoderConfig;
  #optimizeForLatency = true;
  #hardwareAcceleration: HardwareAcceleration = "no-preference";
  #resizeWidth?: number;
  #limitQueueSize = true;
  #mutex = new Mutex();
  #decodedFrames = new SortedMap<VideoFrame>();
  #pendingFrames: { frameInfo: any; frameMsg: CompressedVideo }[] = [];
  #currentFrameMsg;
  #needKeyframe = true;
  #firstMessageTimeNanos;
  #playheadTimeNanos?: number;
  #lastRenderedTimestamp;
  #processedTimestamps = new Set();
  #frameTimestamps: number[] = [];
  #maxQueueSize;
  #needsUpdate = false;

  // Promise during configuration
  #configurationPromise?: Promise<void>;

  public static isSupported() {
    return self.isSecureContext && "VideoDecoder" in globalThis;
  }

  public constructor(decoderClass?: typeof VideoDecoder) {
    super();
    this.#decoderClass = decoderClass ?? VideoDecoder;
    this.#callbacks = {
      output: (frame: VideoFrame) => {
        // Process the decoded frame
        const index = this.#frameTimestamps.indexOf(frame.timestamp);
        if (index >= 0) {
          this.#frameTimestamps.splice(0, index + 1);
        }

        // Initialize the maximum queue size
        if (this.#maxQueueSize == null) {
          this.#maxQueueSize = Math.min(this.#frameTimestamps.length + 1, MAX_QUEUE_SIZE);
        }

        // Store the decoded frame and request an update
        this.#decodedFrames.set(frame.timestamp, frame);
        this.#scheduleUpdate();
      },
      error: (error: Error) => {
        let finalError = error;

        // Enhance error information
        if (finalError.name === "EncodingError" && this.#currentFrameMsg) {
          finalError = new DOMException(
            `${error.message} @ frame timestamp: ${RosTime.toSec(this.#currentFrameMsg.timestamp)}s.`,
            error.name,
          );
        }

        if (this.#configurationPromise != null) {
          finalError = new Error(
            `This codec is unsupported on this platform. (${finalError.message})`,
          );
        }

        this.close();
        this.emit("error", finalError);
      },
    };

    // Create the video decoder
    this.#videoDecoder = new this.#decoderClass(this.#callbacks);
  }

  async #configureDecoder() {
    // If already configuring, wait for completion
    if (this.#configurationPromise) {
      await this.#configurationPromise;
      return;
    }

    // Start the configuration process
    this.#configurationPromise = this.#mutex
      .runExclusive(async () => {
        assert(this.#decoderConfig != null, "Cannot initialize without a decoder config");

        // Apply decoder configuration options
        this.#decoderConfig.optimizeForLatency = this.#optimizeForLatency;
        if (this.#hardwareAcceleration !== "no-preference") {
          this.#decoderConfig.hardwareAcceleration = this.#hardwareAcceleration;
        }

        // If the decoder is closed, create a new one
        if (this.#videoDecoder.state === "closed") {
          this.emit("debug", "VideoDecoder is closed, creating a new one");
          this.#videoDecoder = new this.#decoderClass(this.#callbacks);
        }

        this.emit("debug", `Configuring VideoDecoder with ${JSON.stringify(this.#decoderConfig)}`);

        try {
          this.#videoDecoder.configure(this.#decoderConfig);
        } catch {
          // Fallback attempt: modify hardware acceleration option
          this.emit(
            "warn",
            "Failed to configure VideoDecoder with config. Attempting to adapt for wider support",
          );
          this.#decoderConfig.hardwareAcceleration = "no-preference";
          this.emit(
            "debug",
            `Configuring VideoDecoder with ${JSON.stringify(this.#decoderConfig)}`,
          );
          this.#videoDecoder.configure(this.#decoderConfig);
        }

        // Give the browser some time to process
        await new Promise((resolve) => setTimeout(resolve, 0));
      })
      .finally(() => {
        this.#configurationPromise = undefined;
        if (this.#decoderConfig && this.#videoDecoder.state === "configured") {
          this.emit("configured", this.#decoderConfig);
        }
      });

    await this.#configurationPromise;
  }

  public setPlayheadTimeNanos(timestampNanos: number) {
    this.#playheadTimeNanos = timestampNanos;
    this.#needsUpdate = true;
    this.#scheduleUpdate();
  }

  #getPlayheadTimeMicros() {
    assert(this.#playheadTimeNanos != null, "playheadTimeNanos should be set");
    return this.#convertTimeNanosToMicros(this.#playheadTimeNanos);
  }

  #convertTimeNanosToMicros(timeNanos: bigint) {
    assert(this.#firstMessageTimeNanos != null, "firstMessageTimeNanos should be set");
    return Math.floor(Number((timeNanos - this.#firstMessageTimeNanos) / 1000n));
  }

  #animationFrameRequest: number | undefined = undefined;

  #scheduleUpdate = () => {
    if (this.#animationFrameRequest == null) {
      this.#animationFrameRequest = requestAnimationFrame(this.#update);
    }
  };

  #update = () => {
    this.#animationFrameRequest = undefined;

    // If the decoder needs to be configured, schedule the next update
    if (
      this.#firstMessageTimeNanos != null &&
      !this.#needKeyframe &&
      this.#videoDecoder.state !== "configured"
    ) {
      this.#scheduleUpdate();
    }

    // If there are updates or decoded frames, process the frames
    if (this.#needsUpdate || this.#decodedFrames.size > 0) {
      this.#needsUpdate = false;
      this.#renderCurrentFrame();
    }

    // Process the pending frame queue
    this.#processQueue();
  };

  #renderCurrentFrame() {
    const currentTimeMicros = this.#getPlayheadTimeMicros();
    const index = this.#decodedFrames.binarySearch(currentTimeMicros);
    const nearestIndex = index >= 0 ? index : ~index - 1;
    const nearestFrame = this.#decodedFrames.at(nearestIndex);

    if (nearestFrame == null) {
      this.#handleEmptyFrame();
      return;
    }

    const [timestamp, frame] = nearestFrame;

    // Render a new frame only if the timestamp has changed
    if (timestamp !== this.#lastRenderedTimestamp) {
      // Report delay
      this.emit("delay", Math.floor((currentTimeMicros - timestamp) / 1000));
      this.#lastRenderedTimestamp = timestamp;

      // Resize and send the frame if needed
      if (this.#resizeWidth != null) {
        self
          .createImageBitmap(frame, {
            resizeWidth: this.#resizeWidth,
          })
          .then((bitmap) => {
            this.emit("frame", bitmap);
          })
          .catch((error) => {
            this.emit("error", error);
          })
          .finally(() => {
            frame.close();
          });
      } else {
        this.emit("frame", frame);
      }
    }

    // Remove rendered frames
    const removedFrames = this.#decodedFrames.removeBefore(this.#lastRenderedTimestamp + 1);
    for (const [, oldFrame] of removedFrames) {
      oldFrame.close();
    }
  }

  #handleEmptyFrame() {
    this.#createEmptyFrame().then((emptyFrame) => {
      if (this.#lastRenderedTimestamp == null) {
        this.emit("noFrame", emptyFrame);
      }
    });
  }

  public queueDecode(
    frameMsg: CompressedVideo,
    frameInfo: { isKeyFrame: boolean; mayNeedRewrite: boolean },
  ) {
    // Initialize the first message time
    if (this.#firstMessageTimeNanos == null) {
      this.#firstMessageTimeNanos = RosTime.toNanoSec(frameMsg.timestamp);
      this.#processedTimestamps.clear();
    }

    // If the decoder is closed, recreate it
    if (this.#videoDecoder.state === "closed") {
      this.#videoDecoder = new this.#decoderClass(this.#callbacks);
      this.#needKeyframe = true;
      this.#pendingFrames.length = 0;
    }

    // If a keyframe is needed but not provided, skip
    if (!frameInfo.isKeyFrame && this.#needKeyframe) {
      return;
    }

    // If it's a keyframe and no need to wait, clear the queue
    if (frameInfo.isKeyFrame && !this.#needKeyframe) {
      this.#pendingFrames.length = 0;
    }

    // Handle unconfigured decoder
    if (this.#videoDecoder.state === "unconfigured") {
      // If no config, try to create one from the keyframe
      if (!this.#decoderConfig) {
        this.#decoderConfig = createDecoderConfig(frameMsg);
        if (!this.#decoderConfig) {
          this.emit(
            "error",
            new Error(
              "Keyframe does not contain a SPS NAL unit to configure the decoder. Please ensure that all keyframes contain the SPS.",
            ),
          );
          this.#needKeyframe = true;
          this.#pendingFrames.length = 0;
          return;
        }
      }

      this.#needKeyframe = false;
      this.#pendingFrames.push({
        frameInfo,
        frameMsg,
      });

      // Configure the decoder and process the queue
      this.#configureDecoder()
        .then(() => {
          this.#scheduleUpdate();
        })
        .catch((err) => {
          this.emit("error", err);
        });
    } else {
      // Add the frame to the pending queue
      this.#pendingFrames.push({
        frameInfo,
        frameMsg,
      });
      this.#scheduleUpdate();
    }
  }

  #processQueue() {
    while (this.#pendingFrames.length > 0) {
      const pendingFrame = this.#pendingFrames[0];
      if (!pendingFrame) {
        break;
      }

      const {
        frameInfo: { isKeyFrame, mayNeedRewrite },
        frameMsg,
      } = pendingFrame;

      // If the queue size limit is exceeded, exit
      if (
        this.#limitQueueSize &&
        !isKeyFrame &&
        this.#frameTimestamps.length > (this.#maxQueueSize ?? MAX_QUEUE_SIZE)
      ) {
        break;
      }

      this.#pendingFrames.shift();
      assert(this.#firstMessageTimeNanos != null, "firstMessageTimeNanos should be set");

      // Calculate the timestamp and check for duplicates
      const timestamp = this.#convertTimeNanosToMicros(RosTime.toNanoSec(frameMsg.timestamp));

      if (this.#processedTimestamps.has(timestamp)) {
        this.emit(
          "nonBlockingError",
          "Video frames with duplicate timestamps detected. Playback might be impacted negatively. Video frame timestamps should be unique and chronological.",
        );
      }

      this.#processedTimestamps.add(timestamp);

      // Determine the frame type and data
      const type = isKeyFrame ? "key" : "delta";
      const rewrittenData = mayNeedRewrite ? rewriteH264VideoData(frameMsg) : undefined;

      // Create the encoded video chunk
      const chunk = new EncodedVideoChunk({
        type,
        data: rewrittenData ?? frameMsg.data,
        timestamp,
        // Transfer buffer ownership if possible
        transfer:
          rewrittenData && rewrittenData.buffer instanceof ArrayBuffer
            ? [rewrittenData.buffer]
            : [],
      });

      // Send the chunk for decoding
      try {
        this.#currentFrameMsg = frameMsg;
        this.#frameTimestamps.push(timestamp);
        this.#videoDecoder.decode(chunk);
      } catch (error) {
        this.emit("error", error);
      }
    }
  }

  async #createEmptyFrame(width?: number) {
    const dimensions = {
      width: this.#decoderConfig?.codedWidth ?? 32,
      height: this.#decoderConfig?.codedHeight ?? 32,
    };

    const emptyImageData = new ImageData(dimensions.width, dimensions.height);

    return await createImageBitmap(emptyImageData, {
      resizeWidth: width,
    });
  }

  public setResizeWidth(width: number) {
    this.#resizeWidth = width;
  }

  #resetState() {
    this.#firstMessageTimeNanos = undefined;
    this.#currentFrameMsg = undefined;
    this.#needKeyframe = true;
    this.#playheadTimeNanos = undefined;
    this.#needsUpdate = false;
    this.#lastRenderedTimestamp = undefined;
    this.#maxQueueSize = undefined;
    this.#pendingFrames.length = 0;
    this.#frameTimestamps.length = 0;

    // Clear and close all decoded frames
    for (const [, frame] of this.#decodedFrames.clear()) {
      frame.close();
    }
  }

  public async resetForSeek() {
    await this.#mutex.runExclusive(async () => {
      if (this.#videoDecoder.state === "configured") {
        this.#videoDecoder.reset();
      }
      this.#resetState();
      this.#handleEmptyFrame();
    });
  }

  public async close() {
    await this.#mutex.runExclusive(async () => {
      if (this.#videoDecoder.state !== "closed") {
        this.#videoDecoder.close();
      }
      this.#resetState();
    });
  }
}

// Worker communication setup
const postMessage = self.postMessage;
const transferPostMessage = self.postMessage;
const decoderWorker = new VideoDecoderWorker();

self.onmessage = (event) => {
  const { type } = event.data;
  switch (type) {
    case "setPlayheadTimeNanos":
      decoderWorker.setPlayheadTimeNanos(event.data.timestampNanos);
      break;
    case "queueDecode":
      decoderWorker.queueDecode(event.data.frameMsg, event.data.frameInfo);
      break;
    case "setResizeWidth":
      decoderWorker.setResizeWidth(event.data.width);
      break;
    case "resetForSeek":
      decoderWorker.resetForSeek();
      break;
    case "close":
      decoderWorker.close();
      break;
  }
};

// Event handling
decoderWorker.on("frame", (frame) => {
  transferPostMessage(
    {
      type: "frame",
      frame,
    },
    [frame],
  );
});

decoderWorker.on("noFrame", (emptyFrame) => {
  transferPostMessage(
    {
      type: "noFrame",
      emptyFrame,
    },
    [emptyFrame],
  );
});

decoderWorker.on("configured", (config) => {
  postMessage({
    type: "configured",
    config,
  });
});

decoderWorker.on("delay", (milliSecBehind) => {
  postMessage({
    type: "delay",
    milliSecBehind,
  });
});

decoderWorker.on("debug", (message) => {
  postMessage({
    type: "debug",
    message,
  });
});

decoderWorker.on("warn", (message) => {
  postMessage({
    type: "warn",
    message,
  });
});

decoderWorker.on("error", (error) => {
  postMessage({
    type: "error",
    error,
  });
});

decoderWorker.on("nonBlockingError", (errorMessage) => {
  postMessage({
    type: "nonBlockingError",
    errorMessage,
  });
});
