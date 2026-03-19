<template>
  <router-link :to="`/users/${ownerId}`" class="owner-card">
    <div class="owner-avatar">
      {{ ownerInitials }}
    </div>
    <div class="owner-info">
      <div class="owner-name">{{ ownerName || 'Владелец' }}</div>
      <div class="owner-label">Владелец бизнеса</div>
    </div>
  </router-link>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  ownerId: {
    type: String,
    required: true
  },
  ownerName: {
    type: String,
    default: ''
  },
  ownerPhone: {
    type: String,
    default: ''
  }
});

const ownerInitials = computed(() => {
  if (props.ownerName && props.ownerName.trim() !== '') {
    return props.ownerName
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  }
  if (props.ownerPhone) {
    return props.ownerPhone.slice(-2).toUpperCase();
  }
  return '??';
});
</script>

<style scoped>
.owner-card {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem 1rem;
  background: #f8f9fa;
  border-radius: 8px;
  text-decoration: none;
  color: inherit;
  transition: all 0.2s;
  border: 1px solid #e0e0e0;
}

.owner-card:hover {
  background: #e9ecef;
  border-color: #667eea;
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(102, 126, 234, 0.15);
}

.owner-avatar {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  font-size: 1rem;
  flex-shrink: 0;
}

.owner-info {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  flex: 1;
  min-width: 0;
}

.owner-name {
  font-weight: 600;
  color: #333;
  font-size: 0.95rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.owner-label {
  font-size: 0.85rem;
  color: #666;
}
</style>
