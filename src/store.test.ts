import { describe, expect, it } from "vitest";
import { emptyState, type State } from "./habits";
import { parseBackup, serializeBackup } from "./store";

const state: State = {
  habits: [
    { id: "a", name: "Read", done: ["2026-10-12", "2026-10-13"] },
    { id: "b", name: "Walk", done: [] },
  ],
};

describe("parseBackup", () => {
  it("round-trips an exported state", () => {
    expect(parseBackup(serializeBackup(state))).toEqual(state);
  });

  it("accepts an empty habit list", () => {
    expect(parseBackup(serializeBackup(emptyState()))).toEqual(emptyState());
  });

  it("rejects text that is not JSON", () => {
    expect(parseBackup("not json")).toBeNull();
  });

  it("rejects JSON without a habits array", () => {
    expect(parseBackup("{}")).toBeNull();
    expect(parseBackup("[]")).toBeNull();
    expect(parseBackup("null")).toBeNull();
    expect(parseBackup('{"habits":{}}')).toBeNull();
  });

  it("rejects a habit with a missing or mistyped field", () => {
    expect(parseBackup('{"habits":[{"id":"a","name":"Read"}]}')).toBeNull();
    expect(parseBackup('{"habits":[{"id":1,"name":"Read","done":[]}]}')).toBeNull();
    expect(parseBackup('{"habits":[{"id":"a","name":null,"done":[]}]}')).toBeNull();
  });

  it("rejects done days that are not YYYY-MM-DD", () => {
    expect(parseBackup('{"habits":[{"id":"a","name":"Read","done":["2026-1-5"]}]}')).toBeNull();
    expect(parseBackup('{"habits":[{"id":"a","name":"Read","done":[20261005]}]}')).toBeNull();
  });

  it("rejects the whole file if any habit is malformed", () => {
    const text = '{"habits":[{"id":"a","name":"Read","done":[]},{"id":"b"}]}';
    expect(parseBackup(text)).toBeNull();
  });

  it("drops unknown fields", () => {
    const text = '{"version":1,"habits":[{"id":"a","name":"Read","done":[],"color":"red"}]}';
    expect(parseBackup(text)).toEqual({ habits: [{ id: "a", name: "Read", done: [] }] });
  });
});
