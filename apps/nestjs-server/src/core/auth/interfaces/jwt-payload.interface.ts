export interface JwtPayload {
	sub: string; // User ID
	email: string; // User email
	username: string; // User name
	roles?: string[]; // User roles
	iat?: number; // Issued at
	exp?: number; // Expiration time
}
