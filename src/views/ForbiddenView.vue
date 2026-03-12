<template>
  <main class="forbidden-shell">
    <section class="workspace-panel workspace-panel--error">
      <p class="eyebrow">403</p>
      <h1>Для этой страницы нужна другая роль</h1>
      <p class="lead">
        Текущая сессия авторизована, но роль пользователя не подходит для запрошенного раздела.
      </p>
      <RouterLink class="primary-button" to="/login">Вернуться ко входу</RouterLink>
    </section>
  </main>
</template>