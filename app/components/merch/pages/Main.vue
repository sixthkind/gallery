<script setup>
import { ref, computed } from 'vue';

const merchRef = ref(null);

// Use shared merch state composable
const { showUpload, selectionMode, currentLayout } = useMerchState();

const refreshMerch = () => {
  if (merchRef.value) {
    merchRef.value.refresh();
  }
};

const hasExpandedGroups = computed(() => {
  return merchRef.value?.expandedGroups?.size > 0;
});

const collapseGroups = () => {
  if (merchRef.value) {
    merchRef.value.collapseAllGroups();
  }
};

</script>

<template>
  <ion-page>
    <ion-content>
      <div class="relative">
        <!-- Left Margin Clickable Area -->
        <div 
          v-if="hasExpandedGroups"
          class="fixed left-0 top-0 bottom-0 cursor-pointer hover:bg-gray-100/30 transition-colors z-10"
          style="width: calc((100vw - min(1280px, 100vw - 2.5rem)) / 2);"
          @click.stop="collapseGroups"
          title="Click to collapse groups"
        ></div>
        
        <!-- Right Margin Clickable Area -->
        <div 
          v-if="hasExpandedGroups"
          class="fixed right-0 top-0 bottom-0 cursor-pointer hover:bg-gray-100/30 transition-colors z-10"
          style="width: calc((100vw - min(1280px, 100vw - 2.5rem)) / 2);"
          @click.stop="collapseGroups"
          title="Click to collapse groups"
        ></div>
        
        <CommonContainer>
          <div v-if="showUpload" class="mt-3">
            <MerchPhotoUpload @uploaded="refreshMerch" />
          </div>
          <MerchPhotoGallery 
            ref="merchRef" 
            :selection-mode="selectionMode"
            :current-layout="currentLayout"
            @update:selection-mode="selectionMode = $event"
          />
        </CommonContainer>
      </div>
    </ion-content>
  </ion-page>
</template>
