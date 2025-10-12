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
      error = 'Please enter your email address';
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
        message = 'If this email address is registered in our system, you will receive a password reset link in your email.';
        email = ''; // Clear the email field
      }
    } catch (err) {
      error = 'An unexpected error occurred';
    } finally {
      loading = false;
    }
  }

  async function handlePasswordUpdate() {
    if (!newPassword || !confirmPassword) {
      error = 'Please fill in all fields';
      return;
    }

    if (newPassword !== confirmPassword) {
      error = 'Passwords do not match';
      return;
    }

    if (newPassword.length < 6) {
      error = 'Password must be at least 6 characters long';
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
        message = 'Password updated successfully! You can now log in with your new password.';
        newPassword = '';
        confirmPassword = '';
        // Redirect to admin login after a delay
        setTimeout(() => {
          goto('/admin');
        }, 3000);
      }
    } catch (err) {
      error = 'An unexpected error occurred';
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
      Set New Password
    {:else}
      Reset Password
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
        <label for="newPassword">New Password:</label>
        <div class="password-field">
          <input
            type={showNewPassword ? 'text' : 'password'}
            id="newPassword"
            bind:value={newPassword}
            placeholder="Enter your new password"
            required
          />
          <button
            type="button"
            class="password-toggle"
            on:click={() => showNewPassword = !showNewPassword}
          >
            {showNewPassword ? 'Hide' : 'Show'}
          </button>
        </div>
      </div>
      <div class="form-group">
        <label for="confirmPassword">Confirm New Password:</label>
        <div class="password-field">
          <input
            type={showConfirmPassword ? 'text' : 'password'}
            id="confirmPassword"
            bind:value={confirmPassword}
            placeholder="Confirm your new password"
            required
          />
          <button
            type="button"
            class="password-toggle"
            on:click={() => showConfirmPassword = !showConfirmPassword}
          >
            {showConfirmPassword ? 'Hide' : 'Show'}
          </button>
        </div>
      </div>
      <button type="submit" class="reset-btn" disabled={loading}>
        {loading ? 'Updating...' : 'Update Password'}
      </button>
    </form>
  {:else}
    <!-- Password Reset Request Form -->
    <form on:submit|preventDefault={handleResetRequest}>
      <div class="form-group">
        <label for="email">Email Address:</label>
        <input
          type="email"
          id="email"
          bind:value={email}
          placeholder="Enter your email address"
          required
        />
      </div>
      <button type="submit" class="reset-btn" disabled={loading}>
        {loading ? 'Sending...' : 'Send Reset Email'}
      </button>
    </form>
  {/if}

  <button type="button" class="back-btn" on:click={goBack}>
    Back to Admin
  </button>

  {#if !isResetMode}
    <p class="info">
      Enter your email address and we'll send you a secure link to reset your password.
    </p>
  {/if}
</div>
