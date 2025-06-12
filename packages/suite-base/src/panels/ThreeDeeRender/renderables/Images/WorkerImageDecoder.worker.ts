// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import type { RawImage } from "@foxglove/schemas";

import * as Comlink from "@lichtblick/comlink";

import { TransparencyImage } from "./ImageTypes";
import { decodeRawImage, RawImageOptions } from "./decodeImage";
import type { Image as RosImage } from "../../ros";

function decode(
  transparency: TransparencyImage,
  image: RosImage | RawImage,
  options: Partial<RawImageOptions>,
): TransparencyImage {
  const result = new ImageData(image.width, image.height);
  decodeRawImage(image, options, result.data);
  transparency.usesTransparency = false;
  transparency.imageData = result;
  return Comlink.transfer(transparency, [transparency.imageData.data.buffer]);
}

export const service = {
  decode,
};
Comlink.expose(service);
