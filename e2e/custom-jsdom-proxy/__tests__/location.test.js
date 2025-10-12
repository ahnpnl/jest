/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

describe("location", () => {
	test("window.location.search should use custom implementation", () => {
		expect(window.location.search).toBe("");
		window.location.search = "?foo=bar";
		expect(window.location.search).toBe("?foo=bar");
	});
});
