import { expect, test } from "@playwright/test";
import { newUsername, removeUserStatus, signUpWaiting } from "./api";
import { admin, nanny } from "./logins";

test("remove-user refuses a nanny", async () => {
  const target = await signUpWaiting(newUsername("tgt"), "a-good-password");
  expect(await removeUserStatus(nanny, target)).toBe(403);
});

test("remove-user refuses an admin removing themselves", async () => {
  expect(await removeUserStatus(admin, admin.id)).toBe(400);
});
