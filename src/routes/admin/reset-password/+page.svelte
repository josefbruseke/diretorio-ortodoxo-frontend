<script lang="ts">
  import { onMount } from 'svelte';
  import { supabase } from '$lib/supabaseClient.js';
  import { goto } from '$app/navigation';

  let email = '';
  let newPassword = '';
  let confirmPassword = '';
  let loading = false;
  let message = '';
  let error = '';
  let isResetMode = false; // true when user clicks reset link from email
  let showNewPassword = false;
  let showConfirmPassword = false;

  onMount(() => {
    // Check if this is a password reset callback
    const urlParams = new URLSearchParams(window.location.hash.substring(1));
    const accessToken = urlParams.get('access_token');
    const refreshToken = urlParams.get('refresh_token');

    if (accessToken && refreshToken) {
      isResetMode = true;
      // Set the session for password reset
      supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken
      });
    }
  });

  async function handleResetRequest() {
    if (!email) {
      error = 'Por favor, insira seu endereço de e-mail';
      return;
    }

    loading = true;
    error = '';
    message = '';

    try {
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/admin/reset-password`
      });

      if (resetError) {
        error = resetError.message;
      } else {
        message = 'Se este endereço de e-mail estiver registrado em nosso sistema, você receberá um link de redefinição de senha em seu e-mail.';
        email = ''; // Clear the email field
      }
    } catch (err) {
      error = 'Ocorreu um erro inesperado';
    } finally {
      loading = false;
    }
  }

  async function handlePasswordUpdate() {
    if (!newPassword || !confirmPassword) {
      error = 'Por favor, preencha todos os campos';
      return;
    }

    if (newPassword !== confirmPassword) {
      error = 'As senhas não coincidem';
      return;
    }

    if (newPassword.length < 6) {
      error = 'A senha deve ter pelo menos 6 caracteres';
      return;
    }

    loading = true;
    error = '';
    message = '';

    try {
      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (updateError) {
        error = updateError.message;
      } else {
        message = 'Senha atualizada com sucesso! Agora você pode fazer login com sua nova senha.';
        newPassword = '';
        confirmPassword = '';
        // Redirect to admin login after a delay
        setTimeout(() => {
          goto('/admin');
        }, 3000);
      }
    } catch (err) {
      error = 'Ocorreu um erro inesperado';
    } finally {
      loading = false;
    }
  }

  function goBack() {
    goto('/admin');
  }
</script>

<style>
  .reset-container {
    max-width: 400px;
    margin: 2rem auto;
    padding: 2rem;
    background-color: #fff;
    border-radius: 8px;
    box-shadow: 0 2px 15px rgba(0, 0, 0, 0.1);
  }

  .reset-container h2 {
    text-align: center;
    margin-bottom: 2rem;
    color: #333;
  }

  .form-group {
    margin-bottom: 1rem;
  }

  .form-group label {
    display: block;
    margin-bottom: 0.5rem;
    font-weight: 600;
    color: #555;
  }

  .form-group input {
    width: 100%;
    padding: 0.75rem;
    border: 1px solid #ddd;
    border-radius: 5px;
    font-size: 1rem;
  }

  .form-group input:focus {
    outline: none;
    border-color: #CF4A46;
  }

  .password-field {
    position: relative;
  }

  .password-toggle {
    position: absolute;
    right: 10px;
    top: 50%;
    transform: translateY(-50%);
    background: none;
    border: none;
    cursor: pointer;
    color: #666;
    font-size: 0.9rem;
    padding: 0;
  }

  .password-toggle:hover {
    color: #CF4A46;
  }

  .reset-btn {
    width: 100%;
    padding: 0.75rem;
    background-color: #CF4A46;
    color: white;
    border: none;
    border-radius: 5px;
    font-size: 1rem;
    cursor: pointer;
    transition: background-color 0.3s ease;
    margin-bottom: 1rem;
  }

  .reset-btn:hover {
    background-color: #b83c38;
  }

  .reset-btn:disabled {
    background-color: #ccc;
    cursor: not-allowed;
  }

  .back-btn {
    width: 100%;
    padding: 0.75rem;
    background-color: #6c757d;
    color: white;
    border: none;
    border-radius: 5px;
    font-size: 1rem;
    cursor: pointer;
    transition: background-color 0.3s ease;
  }

  .back-btn:hover {
    background-color: #5a6268;
  }

  .message {
    padding: 0.75rem;
    border-radius: 5px;
    margin-bottom: 1rem;
    background-color: #d4edda;
    color: #155724;
    border: 1px solid #c3e6cb;
  }

  .error {
    padding: 0.75rem;
    border-radius: 5px;
    margin-bottom: 1rem;
    background-color: #f8d7da;
    color: #721c24;
    border: 1px solid #f5c6cb;
  }

  .info {
    text-align: center;
    margin-top: 1rem;
    color: #666;
    font-size: 0.9rem;
  }
</style>

<div class="reset-container">
  <h2>
    {#if isResetMode}
      Definir Nova Senha
    {:else}
      Redefinir Senha
    {/if}
  </h2>

  {#if message}
    <div class="message">{message}</div>
  {/if}

  {#if error}
    <div class="error">{error}</div>
  {/if}

  {#if isResetMode}
    <!-- Password Update Form (when user clicks email link) -->
    <form on:submit|preventDefault={handlePasswordUpdate}>
      <div class="form-group">
        <label for="newPassword">Nova Senha:</label>
        <div class="password-field">
          <input
            type={showNewPassword ? 'text' : 'password'}
            id="newPassword"
            bind:value={newPassword}
            placeholder="Digite sua nova senha"
            required
          />
          <button
            type="button"
            class="password-toggle"
            on:click={() => showNewPassword = !showNewPassword}
          >
            {showNewPassword ? 'Ocultar' : 'Mostrar'}
          </button>
        </div>
      </div>
      <div class="form-group">
        <label for="confirmPassword">Confirmar Nova Senha:</label>
        <div class="password-field">
          <input
            type={showConfirmPassword ? 'text' : 'password'}
            id="confirmPassword"
            bind:value={confirmPassword}
            placeholder="Confirme sua nova senha"
            required
          />
          <button
            type="button"
            class="password-toggle"
            on:click={() => showConfirmPassword = !showConfirmPassword}
          >
            {showConfirmPassword ? 'Ocultar' : 'Mostrar'}
          </button>
        </div>
      </div>
      <button type="submit" class="reset-btn" disabled={loading}>
        {loading ? 'Atualizando...' : 'Atualizar Senha'}
      </button>
    </form>
  {:else}
    <!-- Password Reset Request Form -->
    <form on:submit|preventDefault={handleResetRequest}>
      <div class="form-group">
        <label for="email">Endereço de E-mail:</label>
        <input
          type="email"
          id="email"
          bind:value={email}
          placeholder="Digite seu endereço de e-mail"
          required
        />
      </div>
      <button type="submit" class="reset-btn" disabled={loading}>
        {loading ? 'Enviando...' : 'Enviar E-mail de Redefinição'}
      </button>
    </form>
  {/if}

  <button type="button" class="back-btn" on:click={goBack}>
    Voltar ao Admin
  </button>

  {#if !isResetMode}
    <p class="info">
      Digite seu endereço de e-mail e enviaremos um link seguro para redefinir sua senha.
    </p>
  {/if}
</div>
