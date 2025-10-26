/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

class DummyLocation {
  hash = '';
  host = '';
  hostname = '';
  href = '';
  toString() {
    return this.href;
  }
  origin = '';
  pathname = '';
  port = '';
  protocol = '';
  search = '';
  /** @param {string | URL} url */
  assign(url) {
    this.href = String(url);
  }
  reload() {}
  /** @param {string | URL} url */
  replace(url) {
    this.href = String(url);
  }
}

module.exports = DummyLocation;
