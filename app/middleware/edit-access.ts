import { pb } from "#imports";
import { authUtils } from "~/utils/auth";

const firstParam = (value: unknown) => {
  if (Array.isArray(value)) return String(value[0] || "");
  return String(value || "");
};

export default defineNuxtRouteMiddleware((to) => {
  const type = firstParam(to.params.type).trim().toLowerCase();
  const targetId = firstParam(to.params.id).trim();
  const currentUserId = String(pb.authStore.record?.id || "");

  if (authUtils.isSuperuser()) {
    return;
  }

  if (type !== "users") {
    return navigateTo("/");
  }

  if (!pb.authStore.isValid) {
    return navigateTo("/");
  }

  if (!targetId || targetId !== currentUserId) {
    return navigateTo("/");
  }
});
