import { ref } from "vue";

// Shared state singleton for merch actions
const showUpload = ref(false);
const selectionMode = ref(false);
const currentLayout = ref("grid");
const selectedPhotos = ref<string[]>([]);

const cycleLayout = () => {
  const layouts = ["masonry", "grid", "tile"];
  const currentIndex = layouts.indexOf(currentLayout.value);
  const nextIndex = (currentIndex + 1) % layouts.length;
  currentLayout.value = layouts[nextIndex];
};

const toggleUpload = () => {
  showUpload.value = !showUpload.value;
};

const toggleSelection = () => {
  selectionMode.value = !selectionMode.value;
};

export const useMerchState = () => {
  return {
    showUpload,
    selectionMode,
    currentLayout,
    selectedPhotos,
    cycleLayout,
    toggleUpload,
    toggleSelection
  };
};
