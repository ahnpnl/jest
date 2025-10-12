/**
 * @jest-environment ./custom-env.js
 */

describe("location", () => {
test("window.location.search should use custom implementation", () => {
expect(window.location.search).toBe("");
window.location.search = "?foo=bar";
expect(window.location.search).toBe("?foo=bar");
});
});
