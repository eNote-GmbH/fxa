export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const appModule = await import('./app/_nestapp/app');
    await appModule.app.initialize();
  }
}
