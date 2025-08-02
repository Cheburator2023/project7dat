# Module Federation Setup Guide

This guide explains how to integrate this Vite-based remote application with a webpack-based shell application.

## Current Configuration

This application is configured as a **remote** in a Module Federation setup with the following exposed modules:

- `./App` - Main application component
- `./MfeBridge` - Authentication bridge component for shell integration

## Remote Configuration (Vite)

The remote is configured in `vite.config.mts` with:

```typescript
federation({
  name: "data-lineage-remote",
  filename: "remoteEntry.js",
  exposes: {
    "./App": "./src/App.tsx",
    "./MfeBridge": "./src/common/mfe/MfeBridge.tsx",
  },
  shared: {
    react: { singleton: true, requiredVersion: "^19.1.0" },
    "react-dom": { singleton: true, requiredVersion: "^19.1.0" },
    "react-router": { singleton: true, requiredVersion: "^7.4.1" },
    "@mui/material": { singleton: true, requiredVersion: "7.0.1" },
    "@emotion/react": { singleton: true, requiredVersion: "^11.14.0" },
    "@emotion/styled": { singleton: true, requiredVersion: "^11.14.0" },
    zustand: { singleton: true, requiredVersion: "5.0.3" },
  },
})
```

## Shell Configuration (Webpack)

To consume this remote in a webpack-based shell app, use the configuration in `webpack-shell-example.js`:

### Key Points for Webpack Shell:

1. **Remote URL**: `http://localhost:8008/assets/remoteEntry.js`
2. **Format**: Must specify `from: 'vite'` and `format: 'esm'`
3. **Shared Dependencies**: Must match exactly with the remote configuration
4. **Eager Loading**: Set `eager: true` for React and ReactDOM to avoid loading issues

### Example Usage in Shell App:

```typescript
import React, { Suspense } from 'react';

// Lazy load the remote component
const DataLineageApp = React.lazy(() => import('data-lineage-remote/App'));
const MfeBridge = React.lazy(() => import('data-lineage-remote/MfeBridge'));

function ShellApp() {
  return (
    <div>
      <h1>Shell Application</h1>
      <Suspense fallback={<div>Loading Data Lineage...</div>}>
        <MfeBridge>
          <DataLineageApp />
        </MfeBridge>
      </Suspense>
    </div>
  );
}
```

## Authentication Integration

The `MfeBridge` component handles authentication between the shell and remote:

### Shell App Setup:

```typescript
// Set auth data before loading remote
window.__SHELL_AUTH__ = {
  accessToken: 'your-token',
  userInfo: {
    sub: 'user-id',
    preferred_username: 'username',
    email: 'user@example.com',
    given_name: 'First',
    family_name: 'Last',
    realm_access: { roles: ['user'] },
    groups: ['group1']
  }
};

// Listen for auth changes
window.addEventListener('shell-auth-change', (event) => {
  if (event.detail.type === 'AUTH_UPDATE') {
    // Handle auth update
  }
});
```

## Development Setup

### Important: Vite Federation Dev Mode Limitation

⚠️ **Critical Note**: The `@originjs/vite-plugin-federation` plugin has a limitation in development mode. Only the **host** side supports dev mode, while the **remote** side requires building the `remoteEntry.js` file.

### For Development:

1. **Build the remote first** (this app):
   ```bash
   npm run build --filter=react-client
   ```
   This generates the `remoteEntry.js` file in the `dist` folder.

2. **Serve the built remote**:
   ```bash
   # Option 1: Use a static server
   npx serve -s apps/react-client/dist -p 8008
   
   # Option 2: Use Vite preview
   cd apps/react-client && npm run preview
   ```
   Remote will be available at `http://localhost:8008`

3. **Configure your shell app** using the webpack configuration example with:
   - Remote URL: `http://localhost:8008/assets/remoteEntry.js` (production build)
   - Or: `http://localhost:8008/remoteEntry.js` (depending on your static server setup)

4. **Start your shell app** and import the remote components

### For Hot Reloading During Development:

To get hot reloading while developing the remote:

1. **Use build watch mode**:
   ```bash
   npm run build --filter=react-client --watch
   ```

2. **Serve the dist folder** with a static server that supports live reload

3. **Restart your shell app** when remote changes are significant

## Troubleshooting

### Common Issues:

1. **"Module not found" errors**:
   - Ensure the remote is running on port 8008
   - Check that `remoteEntry.js` is accessible at `http://localhost:8008/assets/remoteEntry.js`

2. **React version conflicts**:
   - Ensure both shell and remote use the same React version
   - Set `singleton: true` and `eager: true` for React dependencies

3. **Shared dependency mismatches**:
   - Verify that shared dependencies in shell match those in remote
   - Check version compatibility

4. **ESM/CommonJS issues**:
   - Use `format: 'esm'` and `from: 'vite'` in webpack remote configuration
   - Ensure shell app supports ES modules

5. **Authentication not working**:
   - Verify `window.__SHELL_AUTH__` is set before loading remote
   - Check that MfeBridge is wrapping the remote component

### Build Issues:

- The remote is built with `target: 'esnext'` and `minify: false` for better webpack compatibility
- CSS code splitting is disabled to prevent style loading issues
- Manual chunks are disabled to let federation handle chunking

## Type Definitions

Use the type definitions in `webpack-federation.d.ts` in your shell app for proper TypeScript support.

## Production Deployment

1. Build the remote: `npm run build`
2. Serve the built files from a static server
3. Update the remote URL in shell configuration to point to production URL
4. Ensure CORS is properly configured for cross-origin requests