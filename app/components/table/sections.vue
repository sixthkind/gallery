<template>
  <CommonContainer>
    <TableUI
      class="animated fadeInUp"
      :rows="sections" 
      type="sections"
      :loading="loading"
      :clickable="true"
      :edit="true"
      @refresh="refresh"
    />
  </CommonContainer>
</template>

<script setup>
  import { pb } from '#imports';

  const sections = ref([]);
  const loading = ref(true);

  const fetchSections = async () => {
    try {
      const records = await pb.collection('_learn_sections').getFullList({
        sort: 'course,order',
        expand: 'course'
      });
      sections.value = records;
    } catch (error) {
      console.error('Error fetching sections:', error);
    } finally {
      loading.value = false;
    }
  };

  const refresh = () => {
    loading.value = true;
    fetchSections();
  }

  onMounted(() => {
    fetchSections();
  });
</script>

