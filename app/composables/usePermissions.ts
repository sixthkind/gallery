import { computed } from "vue";
import { pb } from "#imports";
import { authUtils } from "~/utils/auth";

export const usePermissions = () => {
  const isAuthenticated = computed(() => pb.authStore.isValid);
  const isSuperuser = computed(() => authUtils.isSuperuser());

  const canEditUserRecord = (recordId?: string | null) => {
    if (isSuperuser.value) return true;
    if (!isAuthenticated.value) return false;
    if (!recordId) return false;
    return String(pb.authStore.record?.id || "") === String(recordId);
  };

  return {
    isAuthenticated,
    isSuperuser,
    canEditUserRecord
  };
};
