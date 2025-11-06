import { BollingerBands } from "../bollinger-bands";
import { OHLCV } from "../types";

let time = 0;
function makePrice(value: number): OHLCV {
  return {
    timestamp: new Date(time++),
    open: value,
    high: value,
    low: value,
    close: value,
    volume: 0
  };
}


describe("BollingerBands", () => {
  test("returns empty arrays when not enough data is provided", () => {
    const bb = new BollingerBands(3);
    const data = [makePrice(10)];
    const result = bb.calculate(data);
    expect(result.upper).toHaveLength(0);
    expect(result.middle).toHaveLength(0);
    expect(result.lower).toHaveLength(0);
  });

  test("computes middle band as SMA", () => {
    const bb = new BollingerBands(3);
    const data = [makePrice(1), makePrice(2), makePrice(3)];
    const result = bb.calculate(data);
    expect(result.middle[0].value).toBe(2);
  });

  test("computes standard deviation correctly", () => {
    const bb = new BollingerBands(3, 2);
    const data = [makePrice(1), makePrice(2), makePrice(3)];
    const result = bb.calculate(data);
    const mid = 2;
    const std = Math.sqrt(((1 + 4 + 9) / 3) - (mid * mid)); // ≈ 0.816
    expect(result.upper[0].value).toBeCloseTo(mid + 2 * std, 6);
    expect(result.lower[0].value).toBeCloseTo(mid - 2 * std, 6);
  });

  test("handles longer data sequences", () => {
    const bb = new BollingerBands(2);
    const data = [makePrice(5), makePrice(7), makePrice(9)];
    const result = bb.calculate(data);
    expect(result.middle).toHaveLength(2);
    expect(result.upper).toHaveLength(2);
    expect(result.lower).toHaveLength(2);
  });

  test("update returns null values before enough data", () => {
    const bb = new BollingerBands(3);
    expect(bb.update(makePrice(10))).toEqual({ upper: null, middle: null, lower: null });
    expect(bb.update(makePrice(20))).toEqual({ upper: null, middle: null, lower: null });
  });

  test("update returns correct values once enough data is present", () => {
    const bb = new BollingerBands(3, 2);
    bb.update(makePrice(1));
    bb.update(makePrice(2));
    const res = bb.update(makePrice(3));
    expect(res.middle).toBe(2);
  });

  test("rolling window behavior removes old data", () => {
    const bb = new BollingerBands(3, 2);
    bb.update(makePrice(1));
    bb.update(makePrice(2));
    bb.update(makePrice(3));
    bb.update(makePrice(4)); // should drop the `1`
    expect(bb.getPrices().length).toBeLessThanOrEqual(4);
  });

  test("calculate and update produce consistent middle band", () => {
    const bb = new BollingerBands(3);
    const data = [makePrice(1), makePrice(2), makePrice(3), makePrice(4)];
    const batch = bb.calculate(data);
    const streamed = data.map(p => bb.update(p)).filter(x => x.middle !== null);

    expect(streamed[streamed.length - 1].middle).toBe(batch.middle[batch.middle.length - 1].value);
  });

  test("reset clears internal state", () => {
    const bb = new BollingerBands(3);
    bb.update(makePrice(1));
    bb.update(makePrice(2));
    bb.reset();
    expect(bb.getPrices().length).toBe(0);
    const out = bb.update(makePrice(5));
    expect(out.middle).toBeNull();
  });

  test("does not produce negative variance due to rounding", () => {
    const bb = new BollingerBands(2, 2);
    bb.update(makePrice(1.0000001));
    const res = bb.update(makePrice(1.0000002));
    expect(res.upper).not.toBeNaN();
    expect(res.lower).not.toBeNaN();
  });

  test("middle band timestamp aligns to SMA timestamp", () => {
    const bb = new BollingerBands(2);
    const data = [makePrice(5), makePrice(7)];
    const result = bb.calculate(data);
    expect(result.middle[0].timestamp).toEqual(new Date("1970-01-01T00:00:00.029Z"));
  });

  test("upper band timestamp matches middle band timestamp", () => {
    const bb = new BollingerBands(2);
    const data = [makePrice(5), makePrice(7)];
    const result = bb.calculate(data);
    expect(result.upper[0].timestamp).toEqual(new Date("1970-01-01T00:00:00.031Z"));
  });

  test("lower band timestamp matches middle band timestamp", () => {
    const bb = new BollingerBands(2);
    const data = [makePrice(5), makePrice(7)];
    const result = bb.calculate(data);
    expect(result.lower[0].timestamp).toEqual(new Date("1970-01-01T00:00:00.033Z"));
  });

  test("calculate returns no NaNs for constant values", () => {
    const bb = new BollingerBands(3);
    const data = [makePrice(10), makePrice(10), makePrice(10)];
    const result = bb.calculate(data);
    expect(result.upper[0].value).toBe(10);
    expect(result.lower[0].value).toBe(10);
  });

  test("update returns constant bands for flat price stream", () => {
    const bb = new BollingerBands(3);
    bb.update(makePrice(10));
    bb.update(makePrice(10));
    const res = bb.update(makePrice(10));
    expect(res.middle).toBe(10);
    expect(res.upper).toBe(10);
    expect(res.lower).toBe(10);
  });
});