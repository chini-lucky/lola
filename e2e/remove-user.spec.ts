import { expect, test } from "@playwright/test";
import { loggedIn, newUsername, removeUserStatus, signUpWaiting } from "./api";
import { admin, nanny } from "./logins";

test("remove-user refuses a nanny", async () => {
  const target = await signUpWaiting(newUsername("tgt"), "a-good-password");
  expect(await removeUserStatus(nanny, target)).toBe(403);
});

test("remove-user refuses an admin removing themselves", async () => {
  expect(await removeUserStatus(admin, admin.id)).toBe(400);
});

test("a removed person can no longer log in", async () => {
  const username = newUsername("gone");
  const target = await signUpWaiting(username, "a-good-password");
  expect(await removeUserStatus(admin, target)).toBe(200);
  await expect(loggedIn(username, "a-good-password")).rejects.toThrow("Invalid login credentials");
});
