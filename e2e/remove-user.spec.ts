import { expect, test } from "@playwright/test";
import { newUsername, removeUserStatus, signUpWaiting } from "./api";
import { nanny } from "./logins";

test("remove-user refuses a nanny", async () => {
  const target = await signUpWaiting(newUsername("tgt"), "a-good-password");
  expect(await removeUserStatus(nanny, target)).toBe(403);
});
