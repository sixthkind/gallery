<template>
  <CommonContainer>
    <TableUI 
      :rows="modules"
      type="modules"
      :loading="loading"
      :clickable="true"
      :edit="true"
      @refresh="fetchModules"
    />
  </CommonContainer>
</template>

<script setup>
import { pb } from '~/utils/pb';

const modules = ref([]);
const loading = ref(true);

const fetchModules = async () => {
  try {
    loading.value = true;
    const records = await pb.collection('_learn_modules').getFullList({
      sort: '-created',
      expand: 'courses'
    });
    modules.value = records;
  } catch (error) {
    console.error('Error fetching modules:', error);
  } finally {
    loading.value = false;
  }
};

onMounted(() => {
  fetchModules();
});
</script>

