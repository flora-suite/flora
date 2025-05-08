// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import { ImageRenderable, ImageUserData } from "./ImageRenderable";
import { IRenderer } from "../../IRenderer";
import { AnyImage } from "./ImageTypes";
import { CompressedVideo } from "@foxglove/schemas";
import { Label } from "@lichtblick/three-text";
import Logger from "@lichtblick/log";
import { WorkerImageVideoDecoder } from "./WorkerImageVideoDecoder";
import { HUDItem } from "@lichtblick/suite-base/panels/ThreeDeeRender/HUDItemManager";
import { toNanoSec } from "@lichtblick/rostime";
import { H264, H265, getFrameInfo } from "@lichtblick/den/video";
import * as _ from "lodash-es";

const log = Logger.getLogger(__filename);
const ERROR_KEY = "VIDEO_DELAY_ERR_KEY";
const hudGroup = "VIDEO";
const waitingFrameNoticeConfig: HUDItem = {
  id: "WAITING_FOR_KEYFRAME",
  group: hudGroup,
  displayType: "notice",
  getMessage: () => "Waiting for keyframe\u2026",
};
export class ImageVideoRenderable extends ImageRenderable {
  #isVideoTopic: boolean;

  #showWaiting: boolean = true;
  #waitingLabel?: Label;

  #decoder?: WorkerImageVideoDecoder;

  public constructor(
    topicName: string,
    renderer: IRenderer,
    userData: ImageUserData,
    {
      isVideoTopic = false,
      isImageMode = false,
    }: { isVideoTopic?: boolean; isImageMode?: boolean },
  ) {
    super(topicName, renderer, userData, {
      isImageMode,
    });
    this.#isVideoTopic = isVideoTopic;
  }

  public handleSeek() {
    this.#decoder?.resetForSeek();
    if (this.#waitingLabel != null) {
      this.renderer.labelPool.release(this.#waitingLabel);
    }
    this.#showWaiting = true;
    this.#waitingLabel = undefined;
    this.renderer.hud.removeGroup(hudGroup);
    this.showingErrorImage = false;
  }

  public override dispose() {
    this.#decoder?.close();
    this.#decoder = undefined;
    if (this.#waitingLabel != null) {
      this.renderer.labelPool.release(this.#waitingLabel);
    }
    this.#waitingLabel = undefined;
    this.#showWaiting = false;
    this.renderer.hud.removeGroup(hudGroup);
    super.dispose();
  }

  public override setImage(frame: AnyImage) {
    if (!this.#isVideoTopic) {
      super.setImage(frame);
      this.#showWaiting = false;
      return;
    }
    const videoFrame = frame as CompressedVideo;
    this.userData.image = videoFrame;

    this.renderer.labelPool.acquire();
    if (videoFrame.timestamp === null) {
      this.handleDecodeError(new Error("Received video frame with no timestamp"));
      return;
    }
    if (videoFrame.data.byteLength === 0) {
      this.handleDecodeError(new Error("Empty video frame"));
      return;
    }
    switch (videoFrame.format) {
      case "h264":
        if (!H264.IsAnnexB(videoFrame.data)) {
          this.handleDecodeError(
            new Error(
              "H.264 video frame data is not in Annex B format. Only Annex B is supported.",
            ),
          );
          return;
        }
        break;
      case "h265":
        if (!H265.IsAnnexB(videoFrame.data)) {
          this.handleDecodeError(
            new Error(
              "H.265 video frame data is not in Annex B format. Only Annex B is supported.",
            ),
          );
          return;
        }
    }
    const frameInfo = getFrameInfo(videoFrame);
    if (this.#showWaiting && frameInfo.isKeyFrame) {
      this.#showWaiting = false;
    }
    const decoder = this.#getDecoder();
    decoder.queueDecode(videoFrame, frameInfo);
    decoder.setPlayheadTimeNanos(toNanoSec(videoFrame.timestamp));
  }

  public override update() {
    super.update();
    if (this.#isVideoTopic) {
      if (this.isImageMode) {
        this.renderer.hud.displayIfTrue(this.#showWaiting, waitingFrameNoticeConfig);
      }
    }
    if (this.#showWaiting && this.#waitingLabel == undefined) {
      this.#setWaitingLabel();
    }
    if (this.#waitingLabel == undefined) {
      return;
    }
    this.#waitingLabel.visible = this.#showWaiting;
    if (this.userData.cameraModel == undefined) {
      this.#waitingLabel.visible = false;
    }
  }

  #getDecoder() {
    if (this.#decoder) {
      return this.#decoder;
    }
    this.#decoder = new WorkerImageVideoDecoder();
    if (this.resizeWidth != null) {
      this.#decoder.setResizeWidth(this.resizeWidth);
    }
    this.#decoder.on("error", (errMsg: string) => {
      this.handleDecodeError(errMsg);
    });
    this.#decoder.on("nonBlockingError", (errMsg: string) => {
      this.addError("NONBLOCKING_VIDEO_ERROR_KEY", errMsg);
    });
    this.#decoder.on("warn", (errMsg: string) => {
      log.warn(errMsg);
    });
    this.#decoder.on("debug", (errMsg: string) => {
      log.debug(errMsg);
    });
    // this.#decoder.on("configured", (config) => {
    //   this.renderer
    //     .checkVideoCodecHardwareSupport?.(config.codec)
    //     .catch((errMsg: string) => log.warn(errMsg));
    // });
    this.#decoder.on("noFrame", (errorImage: ImageData) => {
      if (!this.showingErrorImage) {
        this.handleDecodedImage({
          usesTransparency: false,
          imageData: errorImage,
        });
        this.onDecode?.();
        this.renderer.queueAnimationFrame();
      }
    });
    this.#decoder.on(
      "frame",
      (data: (ImageData | VideoFrame) & { width?: number; height?: number }) => {
        if (data instanceof VideoFrame) {
          data.width = data.displayWidth;
          data.height = data.displayHeight;
        }
        this.handleDecodedImage({
          usesTransparency: false,
          imageData: data as unknown as ImageData,
        });
        this.onDecode?.();
        this.renderer.queueAnimationFrame();
      },
    );
    this.#decoder.on(
      "delay",
      _.throttle((milliSecBehind: number) => {
        this.removeError(ERROR_KEY);
        if (milliSecBehind > 0) {
          this.addError(ERROR_KEY, `Video decoding is behind by ${milliSecBehind}ms`);
          performance.mark("VIDEO_FRAME_DELAYED", {
            detail: milliSecBehind,
          });
        }
      }),
      1e3,
    );
    return this.#decoder;
  }

  #setWaitingLabel() {
    this.#waitingLabel = this.renderer.labelPool.acquire();
    this.#waitingLabel.setAnchorPoint(0.5, 0.5);
    this.#waitingLabel.setText("Waiting for keyframe");
    this.#waitingLabel.setColor(1, 1, 1);
    this.#waitingLabel.setBackgroundColor(0.05, 0.05, 0.05);
    this.#waitingLabel.setLineHeight(20);
    this.#waitingLabel.setBillboard(true);
    this.#waitingLabel.setSizeAttenuation(false);
    this.#waitingLabel.quaternion.set(0, 0, 0, 1);
    this.#waitingLabel.position.set(0, 0, 1);
    this.#waitingLabel.visible = true;
    this.add(this.#waitingLabel);
  }
}
