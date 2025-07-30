const ModuleFederationPlugin = require('@module-federation/webpack');

module.exports = {
	mode: 'development',
	entry: './src/index.js',
	devServer: {
		port: 3000,
	},
	plugins: [
		new ModuleFederationPlugin({
			name: 'shell_app',
			remotes: {
				'data-lineage-remote': {
					external: 'http://localhost:8008/assets/remoteEntry.js',
					from: 'vite',
					format: 'esm'
				}
			},
			shared: {
				react: {
					singleton: true,
					requiredVersion: '^19.1.0',
					eager: true
				},
				'react-dom': {
					singleton: true,
					requiredVersion: '^19.1.0',
					eager: true
				},
				'react-router': {
					singleton: true,
					requiredVersion: '^7.4.1'
				},
				'@mui/material': {
					singleton: true,
					requiredVersion: '7.0.1'
				},
				'@emotion/react': {
					singleton: true,
					requiredVersion: '^11.14.0'
				},
				'@emotion/styled': {
					singleton: true,
					requiredVersion: '^11.14.0'
				},
				zustand: {
					singleton: true,
					requiredVersion: '5.0.3'
				}
			}
		})
	],
	module: {
		rules: [
			{
				test: /\.(js|jsx|ts|tsx)$/,
				exclude: /node_modules/,
				use: {
					loader: 'babel-loader',
					options: {
						presets: [
							'@babel/preset-env',
							'@babel/preset-react',
							'@babel/preset-typescript'
						]
					}
				}
			}
		]
	},
	resolve: {
		extensions: ['.js', '.jsx', '.ts', '.tsx']
	}
};