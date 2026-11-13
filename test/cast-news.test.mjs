// Tower records follow who is alive and hunting (P2a Task 3; spec §12.1).
import { test } from "node:test";
import assert from "node:assert/strict";
import * as C from "../src/core/index.js";

const person = (s, id) => C.castPerson(s, id);

test("a living holder keeps their record", () => {
  const s = C.newLife("cn1");
  assert.equal(C.recordHolder(s, "silentHolder", "th").name, person(s, "poramet").name);
});

test("a retired holder's record goes to the strongest living cast hunter of that country", () => {
  const s = C.newLife("cn2");
  person(s, "poramet").retired = true;
  const l = person(s, "lalin"); l.hunter = { rank: 5, cls: "healer" }; l.rank = 5;
  assert.equal(C.recordHolder(s, "silentHolder", "th").name, l.name);
});

test("with no cast hunter fit for it, the roster name is used", () => {
  const s = C.newLife("cn3");
  person(s, "poramet").diedWorldM = 0;
  const h = C.recordHolder(s, "silentHolder", "th");
  assert.notEqual(h.name, person(s, "poramet").name);
  assert.equal(h.personId, null);
});

test("a dead person never sets a record", () => {
  const s = C.newLife("cn4");
  person(s, "seojin").diedWorldM = 0;
  assert.notEqual(C.recordHolder(s, "drownedHolder", "kr").name, person(s, "seojin").name);
});
