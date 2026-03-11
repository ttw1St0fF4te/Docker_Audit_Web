<script setup>
import { computed, onMounted } from 'vue'
import { useHealthStore } from './stores/health'

const healthStore = useHealthStore()

const cards = computed(() => {
  const databases = healthStore.payload?.databases || {}

  return [
    {
      key: 'service',
      title: 'Backend API',
      status: healthStore.payload?.status || healthStore.status,
      message: healthStore.payload?.service || 'docker-audit-api',
      details: healthStore.error || 'Endpoint /api/health отвечает и доступен из Vue.',
    },
    {
      key: 'postgres',
      title: 'PostgreSQL',
      status: databases.postgres?.status || 'UNKNOWN',
      message: databases.postgres?.message || 'Ожидание ответа от backend.',
      details: databases.postgres?.details || 'Проверка соединения через JdbcTemplate.',
    },
    {
      key: 'clickhouse',
      title: 'ClickHouse',
      status: databases.clickhouse?.status || 'UNKNOWN',
      message: databases.clickhouse?.message || 'Ожидание ответа от backend.',
      details: databases.clickhouse?.details || 'Проверка соединения через отдельный datasource.',
    },
  ]
})

onMounted(() => {
  healthStore.fetchHealth()
})
</script>

<template>
  <main class="page-shell">
    <section class="hero-panel">
      <p class="eyebrow">Coursework 3</p>
      <h1>Панель запуска backend, frontend и двух баз данных</h1>
      <p class="lead">
        Vue обращается к Spring Boot по пути <strong>/api/health</strong>, а backend проверяет
        соединение с PostgreSQL и ClickHouse в одном ответе.
      </p>

      <div class="hero-actions">
        <button class="primary-button" :disabled="healthStore.loading" @click="healthStore.fetchHealth">
          {{ healthStore.loading ? 'Проверка...' : 'Обновить состояние' }}
        </button>
        <span class="timestamp">
          {{ healthStore.lastUpdated ? `Обновлено: ${healthStore.lastUpdated}` : 'Еще не обновлялось' }}
        </span>
      </div>
    </section>

    <section class="status-grid">
      <article v-for="card in cards" :key="card.key" class="status-card" :data-status="card.status">
        <div class="card-head">
          <h2>{{ card.title }}</h2>
          <span class="pill">{{ card.status }}</span>
        </div>
        <p class="card-message">{{ card.message }}</p>
        <p class="card-details">{{ card.details }}</p>
      </article>
    </section>

    <section class="notes-panel">
      <div>
        <h3>Что уже настроено</h3>
        <ul>
          <li>Spring Boot отдает health endpoint по адресу /api/health.</li>
          <li>PostgreSQL подключен как основной datasource и получает миграции через Liquibase.</li>
          <li>ClickHouse подключен отдельным datasource для аналитических запросов.</li>
          <li>Vite проксирует /api на backend, поэтому связка работает и локально, и в Docker.</li>
        </ul>
      </div>
      <div>
        <h3>Что проверять после запуска</h3>
        <ul>
          <li>Открыть http://localhost:5173/ и дождаться статусов UP в карточках.</li>
          <li>Выполнить curl http://localhost:8080/api/health и проверить JSON-ответ.</li>
          <li>Подключиться к PostgreSQL и ClickHouse через DBeaver по localhost.</li>
        </ul>
      </div>
    </section>
  </main>
</template>
