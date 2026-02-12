<script setup>
const { toLearnPath } = useLearnRoutes();

const settingsSections = computed(() => [
  {
    title: 'Payments & Billing',
    description: 'Configure payment processing and billing settings',
    icon: 'lucide:credit-card',
    items: [
      {
        title: 'Stripe Configuration',
        description: 'Manage Stripe API keys and payment settings',
        href: toLearnPath('/admin/stripe-config'),
        icon: 'lucide:settings'
      },
      {
        title: 'Subscription Tiers',
        description: 'Manage subscription pricing and tiers',
        href: toLearnPath('/admin/subscription-tiers'),
        icon: 'lucide:layers'
      }
    ]
  },
  {
    title: 'Content Management',
    description: 'Manage courses, modules, and learning content',
    icon: 'lucide:book-open',
    items: [
      {
        title: 'Courses',
        description: 'Create and manage courses',
        href: toLearnPath('/admin/courses'),
        icon: 'lucide:graduation-cap'
      },
      {
        title: 'Sections',
        description: 'Organize course content into sections',
        href: toLearnPath('/admin/sections'),
        icon: 'lucide:list'
      },
      {
        title: 'Lessons',
        description: 'Create and edit lesson content',
        href: toLearnPath('/admin/lessons'),
        icon: 'lucide:file-text'
      },
      {
        title: 'Modules',
        description: 'Create course bundles and modules',
        href: toLearnPath('/admin/modules'),
        icon: 'lucide:package'
      }
    ]
  },
  {
    title: 'System',
    description: 'System settings and configuration',
    icon: 'lucide:server',
    items: [
      {
        title: 'General Settings',
        description: 'Site name, branding, and general configuration',
        href: '#',
        icon: 'lucide:settings-2',
        disabled: true
      },
      {
        title: 'User Management',
        description: 'Manage user accounts and permissions',
        href: '#',
        icon: 'lucide:users',
        disabled: true
      }
    ]
  }
]);
</script>

<template>
  <ion-page>
    <ion-content>
      <div class="max-w-7xl mx-auto p-6">
        <!-- Header -->
        <div class="mb-8">
          <div class="flex items-center gap-3 mb-2">
            <Icon name="lucide:settings" class="text-3xl text-gray-700 dark:text-gray-300" />
            <h1 class="text-3xl font-bold text-gray-900 dark:text-gray-100">Site Settings</h1>
          </div>
          <p class="text-gray-600 dark:text-gray-400">
            Manage your site configuration, payment settings, and administrative options
          </p>
        </div>

        <!-- Settings Sections -->
        <div class="space-y-8">
          <div 
            v-for="section in settingsSections" 
            :key="section.title"
            class="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden"
          >
            <!-- Section Header -->
            <div class="border-b border-gray-200 dark:border-gray-700 p-6">
              <div class="flex items-center gap-3 mb-2">
                <Icon :name="section.icon" class="text-2xl text-blue-600 dark:text-blue-400" />
                <h2 class="text-xl font-semibold text-gray-900 dark:text-gray-100">
                  {{ section.title }}
                </h2>
              </div>
              <p class="text-sm text-gray-600 dark:text-gray-400">{{ section.description }}</p>
            </div>

            <!-- Section Items -->
            <div class="divide-y divide-gray-200 dark:divide-gray-700">
              <NuxtLink
                v-for="item in section.items"
                :key="item.title"
                :to="item.href"
                :class="[
                  'block p-6 transition-colors',
                  item.disabled 
                    ? 'opacity-50 cursor-not-allowed bg-gray-50 dark:bg-gray-900' 
                    : 'hover:bg-gray-50 dark:hover:bg-gray-700/50'
                ]"
                @click.prevent="item.disabled ? null : navigateTo(item.href)"
              >
                <div class="flex items-start justify-between">
                  <div class="flex items-start gap-4 flex-1">
                    <div class="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                      <Icon :name="item.icon" class="text-xl text-blue-600 dark:text-blue-400" />
                    </div>
                    <div class="flex-1">
                      <div class="flex items-center gap-2 mb-1">
                        <h3 class="text-lg font-medium text-gray-900 dark:text-gray-100">
                          {{ item.title }}
                        </h3>
                        <span 
                          v-if="item.disabled" 
                          class="px-2 py-0.5 text-xs font-medium bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded"
                        >
                          Coming Soon
                        </span>
                      </div>
                      <p class="text-sm text-gray-600 dark:text-gray-400">
                        {{ item.description }}
                      </p>
                    </div>
                  </div>
                  <Icon 
                    v-if="!item.disabled"
                    name="lucide:chevron-right" 
                    class="text-gray-400 dark:text-gray-600 flex-shrink-0"
                  />
                </div>
              </NuxtLink>
            </div>
          </div>
        </div>
        
      </div>
    </ion-content>
  </ion-page>
</template>
