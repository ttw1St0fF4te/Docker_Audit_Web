<template>
  <section class="auth-shell recovery-shell">
    <article class="auth-card">
      <p class="eyebrow">Восстановление доступа</p>
      <h1>Выберите сценарий</h1>
      <p class="lead">Откройте подходящую форму для сброса пароля или смены email.</p>

      <div class="recovery-links">
        <RouterLink class="recovery-link-card" to="/recovery/password-reset">
          <strong>Забыли пароль?</strong>
          <span>Отправить временный пароль на email</span>
        </RouterLink>

        <RouterLink class="recovery-link-card" to="/recovery/email-code/request">
          <strong>Хотите сменить email? Есть доступ к старой почте</strong>
          <span>Сначала запрос кода, затем подтверждение</span>
        </RouterLink>

        <RouterLink class="recovery-link-card" to="/recovery/email-identity">
          <strong>Хотите сменить email? Нет доступа к старой почте</strong>
          <span>Подтверждение личности по данным аккаунта</span>
        </RouterLink>
      </div>
    </article>
  </section>
</template>
