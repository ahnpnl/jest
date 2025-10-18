/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {multiply, sum} from '../sum';

describe('sum', () => {
  it('should add two numbers correctly', () => {
    expect(sum(1, 2)).toBe(3);
    expect(sum(10, 20)).toBe(30);
  });

  it('should handle negative numbers', () => {
    expect(sum(-1, -2)).toBe(-3);
    expect(sum(-5, 5)).toBe(0);
  });
});

describe('multiply', () => {
  it('should multiply two numbers correctly', () => {
    expect(multiply(2, 3)).toBe(6);
    expect(multiply(10, 5)).toBe(50);
  });

  it('should handle zero', () => {
    expect(multiply(5, 0)).toBe(0);
    expect(multiply(0, 10)).toBe(0);
  });
});
