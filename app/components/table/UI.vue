<template>
  <div>
    <div class="flex flex-col sm:flex-row sm:justify-between gap-3 px-3 py-3.5 border-b border-gray-200 dark:border-gray-700">
      <h2 class="text-lg font-semibold">{{ props.type.charAt(0).toUpperCase() + props.type.slice(1) }}&nbsp;({{ filteredRows.length }})</h2>

      <div class="flex flex-col sm:flex-row items-start sm:items-center gap-2">
        <div v-if="isLegacyType" class="flex items-center gap-2">
          <UButton @click="items" :color="props.type === 'items' ? 'primary' : 'gray'" size="sm">items</UButton>
          <UButton @click="tags" :color="props.type === 'tags' ? 'primary' : 'gray'" size="sm">tags</UButton>
          <UButton @click="clients" :color="props.type === 'clients' ? 'primary' : 'gray'" size="sm">clients</UButton>
        </div>

        <div v-if="isLearnType" class="flex items-center gap-2 flex-wrap">
          <UButton @click="courses" :color="props.type === 'courses' ? 'primary' : 'gray'" size="sm">courses</UButton>
          <UButton @click="sections" :color="props.type === 'sections' ? 'primary' : 'gray'" size="sm">sections</UButton>
          <UButton @click="lessons" :color="props.type === 'lessons' ? 'primary' : 'gray'" size="sm">lessons</UButton>
          <UButton @click="modules" :color="props.type === 'modules' ? 'primary' : 'gray'" size="sm">modules</UButton>
          <UButton @click="subscriptionTiers" :color="props.type === 'subscription_tiers' ? 'primary' : 'gray'" size="sm">tiers</UButton>
          <UButton @click="stripeConfig" color="gray" size="sm">stripe</UButton>
        </div>

        <UInput v-model="searchQuery" :placeholder="`Search ${props.type}`" class="w-full sm:w-auto"/>
        <div class="flex items-center gap-2">
          <USelectMenu v-model="selectedColumns" :options="columns" multiple placeholder="Columns" class="w-full sm:w-auto"/>
          <UButton @click="refresh" color="primary" size="sm"><Icon name="lucide:refresh-cw" /></UButton>
          <UButton @click="add" color="primary" size="sm"><Icon name="lucide:plus" /></UButton>
        </div>
      </div>
    </div>

    <UTable
      :rows="filteredRows"
      :columns="selectedColumns"
      :empty-state="{ icon: 'i-heroicons-circle-stack-20-solid', label: 'Nothing found' }"
      :loading="props.loading"
      @select="handleRowClick"
    />
  </div>
</template>

<script setup lang="ts">
  import { tableColumns, tableComputed } from '#imports';

  const props = defineProps(['rows', 'type', 'loading', 'clickable', 'edit']);
  const emit = defineEmits(['refresh']);
  const columns = tableColumns[props.type] || [];
  const clickable = props.clickable || false;
  const { toLearnPath } = useLearnRoutes();
  const { toGalleryPath } = useGalleryRoutes();

  const learnTypes = ['courses', 'sections', 'lessons', 'modules', 'subscription_tiers'];
  const legacyTypes = ['items', 'tags', 'clients'];
  const isLearnType = computed(() => learnTypes.includes(String(props.type)));
  const isLegacyType = computed(() => legacyTypes.includes(String(props.type)));

  const computedRows = computed(() => {
    return props.rows.map((row: Record<string, any>) => ({
      ...row,
      ...(tableComputed[props.type]?.(row) || {})
    }));
  });

  const selectedColumns = ref([...columns]);

  const searchQuery = ref('');
  const filteredRows = computed(() => {
    if (!searchQuery.value) {
      return computedRows.value;
    }

    return computedRows.value.filter((row: any) => {
      return Object.values(row).some((value: any) => {
        return String(value).toLowerCase().includes(searchQuery.value.toLowerCase());
      });
    });
  });

  const handleRowClick = (row: any) => {
    if (!clickable) return;

    if (props.edit) {
      window.location.href = `/edit/${props.type}/${row.id}`;
      return;
    }

    window.location.href = `/${props.type}/${row.id}`;
  };

  const refresh = () => {
    emit('refresh');
  };

  const add = () => {
    window.location.href = `/edit/${props.type}`;
  };

  const items = () => {
    window.location.href = '/';
  };

  const tags = () => {
    window.location.href = toGalleryPath('/tags');
  };

  const clients = () => {
    window.location.href = '/clients';
  };

  const courses = () => {
    window.location.href = toLearnPath('/admin/courses');
  };

  const sections = () => {
    window.location.href = toLearnPath('/admin/sections');
  };

  const lessons = () => {
    window.location.href = toLearnPath('/admin/lessons');
  };

  const modules = () => {
    window.location.href = toLearnPath('/admin/modules');
  };

  const subscriptionTiers = () => {
    window.location.href = toLearnPath('/admin/subscription-tiers');
  };

  const stripeConfig = () => {
    window.location.href = toLearnPath('/admin/stripe-config');
  };
</script>
